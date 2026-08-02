"""LLM-as-judge helper for qualitative checks the eval runner can't do with
plain keyword matching (grounding, persona, no-invented-facts).

Uses the same real `AIProvider.generate()` path as the rest of the app --
a separate, cheap classification call, not the thing being evaluated.
"""

from dataclasses import dataclass

from app.providers.base import AIProvider, ProviderRequest

_JUDGE_SYSTEM_PROMPT = """You are a strict evaluator for an AI memory-companion \
product. You will be shown source memory text, optional background context, \
and a generated response. Judge ONLY the specific question asked of you.

Background context is information legitimately known to the system under \
test (e.g. the subject's real name), supplied to it separately from the \
source memory text. Correctly using background context is NEVER a \
fabrication, even when that same detail is absent from the source text --  \
only flag details that go beyond both the source text AND the background \
context combined.

"Speaking in the third person about someone" means never using first-person \
"I"/"me" as if the model were that person. It does NOT mean the response may \
never address the user directly as "you" -- second-person address to the \
user asking the question is normal and not a violation on its own.

Respond with exactly one word on the first line -- PASS or FAIL -- then a \
one-sentence reason on the second line. Do not hedge; pick one."""


@dataclass(frozen=True, slots=True)
class JudgeVerdict:
    passed: bool
    reason: str
    raw: str


async def judge(
    provider: AIProvider,
    *,
    source_text: str,
    generated_text: str,
    check: str,
    context_note: str = "",
    max_tokens: int = 200,
) -> JudgeVerdict:
    context_section = (
        f"BACKGROUND CONTEXT (using this correctly is not a fabrication):\n{context_note}\n\n"
        if context_note
        else ""
    )
    prompt = (
        f"SOURCE MEMORY TEXT:\n{source_text}\n\n"
        f"{context_section}"
        f"GENERATED RESPONSE:\n{generated_text}\n\n"
        f"QUESTION TO JUDGE: {check}"
    )
    result = await provider.generate(
        ProviderRequest(
            prompt=prompt,
            system_prompt=_JUDGE_SYSTEM_PROMPT,
            temperature=0.0,
            max_tokens=max_tokens,
        )
    )
    output = result.output.strip()
    first_line = output.splitlines()[0].strip().upper() if output else ""
    passed = first_line.startswith("PASS")
    reason = output.splitlines()[1].strip() if len(output.splitlines()) > 1 else ""
    return JudgeVerdict(passed=passed, reason=reason, raw=output)
