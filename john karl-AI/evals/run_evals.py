"""Manual eval runner for Memory Chat + Memory Quote against the REAL
Anthropic API.

Not part of `pytest` / CI on purpose: it costs real API money and its
model-graded checks are non-deterministic. Run it by hand after touching
either feature's system prompts, grounding logic, or provider code:

    python -m evals.run_evals

Requires ANTHROPIC_API_KEY / AI_MODEL configured (reads the same Settings
as the app, i.e. `.env`).
"""

import asyncio
import io
import re
import sys
import tempfile
import uuid
from pathlib import Path

from app.core.config import get_settings
from app.providers.anthropic import AnthropicAIProvider
from app.providers.base import ChatRequest, QuoteRequest
from app.schemas.memory_chat import MemoryChatRequest
from app.services.conversation_store import ConversationStore
from app.services.memory_chat import _GROUNDING_SYSTEM_PROMPT, MemoryChatService
from app.services.memory_quote import _QUOTE_SYSTEM_PROMPT_TEMPLATE, MemoryQuoteService
from app.services.memory_rendering import render_memory_text
from app.services.safety import PromptSafetyService
from evals.cases import (
    ALL_MEMORIES,
    BIRTHDAY_MEMORY,
    CHAT_CASES,
    CITATION_CASES,
    MULTI_TURN_CASES,
    QUOTE_CASES,
    as_documents,
)
from evals.judge import judge

_PERSON = "Margaret"

# The judge only ever sees the narrative text, not the request's `person`
# field -- so it must be told explicitly (as structured background context,
# not buried in the check text) that using that name correctly is supplied
# context, not a fabrication, or it flags every correct answer as
# hallucinating a name.
_NAME_CONTEXT_NOTE = (
    f'"{_PERSON}" is the subject\'s real name, supplied to the system under '
    "test separately from the source memory text (the source narrative "
    'itself may just say "mom" or use no name at all).'
)

_EM_DASH = "—"
_VERBATIM_RUN_WORDS = 8


def _normalized_words(text: str) -> list[str]:
    return re.findall(r"[a-z0-9']+", text.lower())


def _style_violation(generated_text: str, source_text: str) -> str | None:
    """Mechanical (no-judge) style checks -- catches the two regressions a
    prior manual test round found: em dashes reading as AI-generated, and
    the model pasting the source narrative back nearly verbatim instead of
    paraphrasing. Returns a human-readable violation reason, or None."""
    if _EM_DASH in generated_text:
        return "contains an em dash (should be paraphrased without one)"

    generated_words = _normalized_words(generated_text)
    source_words = _normalized_words(source_text)
    generated_runs = {
        tuple(generated_words[i : i + _VERBATIM_RUN_WORDS])
        for i in range(len(generated_words) - _VERBATIM_RUN_WORDS + 1)
    }
    for i in range(len(source_words) - _VERBATIM_RUN_WORDS + 1):
        run = tuple(source_words[i : i + _VERBATIM_RUN_WORDS])
        if run in generated_runs:
            quoted_run = " ".join(run)
            return (
                f"contains a {_VERBATIM_RUN_WORDS}+ word verbatim run "
                f"from the source: {quoted_run!r}"
            )
    return None


async def run_chat_evals(provider: AnthropicAIProvider) -> list[tuple[str, bool, str]]:
    results: list[tuple[str, bool, str]] = []
    documents = as_documents(ALL_MEMORIES)
    system_prompt = _GROUNDING_SYSTEM_PROMPT.format(person=_PERSON)
    source_text = "\n\n".join(doc.text for doc in documents)

    for case in CHAT_CASES:
        chat_result = await provider.chat(
            ChatRequest(
                system_prompt=system_prompt,
                documents=documents,
                history=(),
                question=case.question,
                max_tokens=400,
            )
        )
        answer = chat_result.text

        if case.expect == "should_decline":
            check = (
                "The GENERATED RESPONSE is a reply to a question whose answer is "
                "NOT present anywhere in the SOURCE MEMORY TEXT. Does the response "
                "correctly decline / say the information isn't available, rather "
                "than inventing an answer?"
            )
        else:
            check = (
                "Does the GENERATED RESPONSE state only facts/emotions that are "
                "explicitly present in (or a reasonable emotional reading of) the "
                "SOURCE MEMORY TEXT, with no invented events, people, or details, "
                f"and does it avoid speaking AS {_PERSON} (using first person "
                f"'I' to mean {_PERSON})?"
            )

        verdict = await judge(
            provider,
            source_text=source_text,
            generated_text=answer,
            check=check,
            context_note=_NAME_CONTEXT_NOTE,
        )
        style_violation = _style_violation(answer, source_text)
        passed = verdict.passed and style_violation is None
        reason = verdict.reason or verdict.raw
        if style_violation:
            reason = f"{reason}\n    STYLE VIOLATION: {style_violation}"
        detail = f"{reason}\n    answer: {answer[:200]}"
        results.append((case.name, passed, detail))

    return results


async def run_quote_evals(provider: AnthropicAIProvider) -> list[tuple[str, bool, str]]:
    results: list[tuple[str, bool, str]] = []

    for case in QUOTE_CASES:
        type_guidance = MemoryQuoteService._type_guidance(case.memory)
        system_prompt = _QUOTE_SYSTEM_PROMPT_TEMPLATE.format(
            person=case.person, type_guidance=type_guidance
        )
        memory_text = render_memory_text(case.memory)

        quote_result = await provider.generate_quote(
            QuoteRequest(system_prompt=system_prompt, memory_text=memory_text, max_tokens=300)
        )

        generated = f"PULL_QUOTE: {quote_result.pull_quote}\nCOMMENTARY: {quote_result.commentary}"
        verdict = await judge(
            provider,
            source_text=memory_text,
            generated_text=generated,
            check=(
                "Does this pull-quote + commentary (1) avoid inventing new facts "
                "beyond the source memory, (2) avoid directly copying full "
                "sentences verbatim from the source narrative, (3) avoid "
                f"speaking AS {case.person} (using first person 'I' to mean "
                f"{case.person}), and (4) does the commentary naturally mention "
                '"Lineage.AI"? Fail if any of these are violated.'
            ),
            context_note=_NAME_CONTEXT_NOTE,
        )
        style_violation = _style_violation(generated, memory_text)
        passed = verdict.passed and style_violation is None
        reason = verdict.reason or verdict.raw
        if style_violation:
            reason = f"{reason}\n    STYLE VIOLATION: {style_violation}"
        results.append(
            (
                case.name,
                passed,
                f"{reason}\n    quote: {quote_result.pull_quote[:150]}",
            )
        )

    return results


async def run_multi_turn_evals(provider: AnthropicAIProvider) -> list[tuple[str, bool, str]]:
    """Exercises the real `MemoryChatService` end to end -- SQLite
    `ConversationStore`, windowing, everything -- not just the provider in
    isolation like the cases above. Each case's own throwaway DB file is
    cleaned up afterward."""
    results: list[tuple[str, bool, str]] = []
    settings = get_settings()
    safety = PromptSafetyService(settings)

    for case in MULTI_TURN_CASES:
        with tempfile.TemporaryDirectory() as tmp_dir:
            db_path = str(Path(tmp_dir) / "eval_conversations.sqlite3")
            service = MemoryChatService(
                provider=provider,
                safety=safety,
                settings=settings,
                conversations=ConversationStore(db_path, window_turns=20, summary_trigger_turns=10),
            )
            conversation_id = f"eval-{uuid.uuid4()}"

            last_answer = ""
            for question in case.questions:
                response = await service.chat(
                    MemoryChatRequest(
                        conversation_id=conversation_id,
                        person=_PERSON,
                        question=question,
                        memories=[BIRTHDAY_MEMORY],
                    ),
                    request_id="eval",
                )
                last_answer = response.answer

        verdict = await judge(
            provider,
            source_text=render_memory_text(BIRTHDAY_MEMORY),
            generated_text=(
                "Full conversation (in order):\n"
                + "\n".join(
                    f"Turn {i + 1} question: {q}"
                    for i, q in enumerate(case.questions[:-1])
                )
                + f"\nFinal turn question: {case.questions[-1]}"
                + f"\nFinal turn answer: {last_answer}"
            ),
            check=(
                "The FINAL TURN QUESTION asks the assistant to summarize what "
                "it JUST told the user in the previous turn (not to re-derive "
                "facts fresh from the source memory). Does the FINAL TURN "
                "ANSWER show clear evidence of actually recalling and "
                "summarizing its own prior answer (i.e. conversation history "
                "worked), rather than either (a) answering as if it had no "
                "memory of the earlier turn, or (b) asking the user to repeat "
                "themselves?"
            ),
        )
        detail = f"{verdict.reason or verdict.raw}\n    final answer: {last_answer[:200]}"
        results.append((case.name, verdict.passed, detail))

    return results


async def run_citation_evals(provider: AnthropicAIProvider) -> list[tuple[str, bool, str]]:
    """Objective check (no judge needed): with several memories in play,
    do the returned citations point at the memory that actually supports
    the answer, not an unrelated one?"""
    results: list[tuple[str, bool, str]] = []

    for case in CITATION_CASES:
        documents = as_documents(case.memories)
        system_prompt = _GROUNDING_SYSTEM_PROMPT.format(person=_PERSON)

        chat_result = await provider.chat(
            ChatRequest(
                system_prompt=system_prompt,
                documents=documents,
                history=(),
                question=case.question,
                max_tokens=400,
            )
        )

        cited_titles = {citation.document_title for citation in chat_result.citations}
        ok = case.expected_document_title in cited_titles
        reason = (
            f"cited {cited_titles or '(none)'}, expected "
            f"'{case.expected_document_title}' among them"
        )
        detail = f"{reason}\n    answer: {chat_result.text[:200]}"
        results.append((case.name, ok, detail))

    return results


async def main() -> int:
    settings = get_settings()
    if settings.anthropic_api_key is None:
        print("No ANTHROPIC_API_KEY configured -- aborting.")
        return 1

    provider = AnthropicAIProvider(
        api_key=settings.anthropic_api_key.get_secret_value(),
        model=settings.ai_model or "claude-sonnet-4-6",
        timeout_seconds=settings.ai_timeout_seconds,
        max_retries=settings.anthropic_max_retries,
    )

    all_passed = True
    try:
        print(f"Model: {settings.ai_model}\n")
        groups = [
            ("Memory Chat", run_chat_evals),
            ("Memory Quote", run_quote_evals),
            ("Multi-turn conversation", run_multi_turn_evals),
            ("Citation accuracy", run_citation_evals),
        ]
        for label, run_group in groups:
            print(f"=== {label} evals ===")
            for name, ok, detail in await run_group(provider):
                status = "PASS" if ok else "FAIL"
                all_passed = all_passed and ok
                print(f"[{status}] {name}\n    {detail}")
            print()
    finally:
        await provider.close()

    print("\n=== Overall:", "PASS" if all_passed else "FAIL", "===")
    return 0 if all_passed else 1


if __name__ == "__main__":
    # Windows consoles default to a codepage that can't encode every
    # character a model might produce (emoji, smart quotes, em dashes).
    # Replace rather than crash -- this is a console-display limitation
    # only; it doesn't affect what the app actually returns over HTTP.
    if isinstance(sys.stdout, io.TextIOWrapper):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.exit(asyncio.run(main()))
