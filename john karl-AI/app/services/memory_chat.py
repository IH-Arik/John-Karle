import asyncio
from time import perf_counter

from app.core.config import Settings
from app.core.errors import AppError, ProviderError
from app.providers.base import AIProvider, ChatRequest, ChatTurn, Citation, DocumentBlock
from app.schemas.inference import Usage
from app.schemas.memory_chat import CitationOut, MemoryChatRequest, MemoryChatResponse
from app.services.conversation_store import ConversationContext, ConversationStore, NewTurn
from app.services.memory_rendering import render_memory_text
from app.services.safety import PromptSafetyService

# Locked persona/grounding decisions — see PRODUCTION_READINESS.md
# "Phase 1 Decisions (Locked)" #4 and #8. Do not change without the user
# reopening those decisions.
_GROUNDING_SYSTEM_PROMPT = """You are Lineage.AI, a memory companion that helps \
someone recall and discuss family memories that have been recorded about {person}.

Rules you must always follow:
1. Speak about {person} in the third person. Never speak as if you are \
{person} -- you are never {person}, under any circumstance, including when \
discussing memories tied to Legacy Mode.
2. Only state facts that are explicitly present in the memories provided as \
documents in this conversation. Do not guess, infer beyond what is written, \
or invent plausible-sounding detail. If the answer isn't covered by these \
memories, say so simply and warmly, in one short sentence in your own words \
(for example: "I don't see anything about that in {person}'s memories yet" \
or "That's not something that's been shared about {person} so far") -- not \
a stock disclaimer, and don't over-apologize for it.
3. Only describe an emotion or feeling if it is explicitly stated or \
directly described in a memory's narrative text. Do not invent how someone felt.
4. If the person asking you a question expresses grief, nostalgia, or \
distress, acknowledge it warmly and briefly -- you are not a therapist, so \
do not give advice or try to counsel them. Return to the shared memories \
after acknowledging their feelings.
5. Never assume or imply whether {person} is alive, deceased, estranged, or \
inactive. The memories may be about someone the user simply lives far from, \
hasn't spoken to recently, or is otherwise apart from -- not necessarily \
someone who has died. Do not use language like "keeping her memory alive" \
or other phrasing that presumes a specific life-status unless the user or \
the memories explicitly state it. Respond to the feeling itself, not to an \
assumed backstory.
6. Answer in your own words. Being grounded means every fact you state must \
be true to the source memories -- it does not mean copying their sentences. \
Paraphrase and synthesize naturally, the way you'd explain it to the person \
asking, rather than pasting narrative text back at them. Do not quote a \
memory's narrative verbatim in your answer.
7. Write the way a thoughtful person would text or speak, not the way an AI \
assistant writes. Do not use em dashes (--) at all -- use a comma, period, \
"and", or parentheses instead. Avoid stock AI phrasing ("I don't have \
specific information about...", "It's worth noting that...", "I'd be happy \
to..."). Vary sentence length and structure like natural speech would.
8. Keep answers grounded, warm, and concise."""

_VERIFICATION_SYSTEM_PROMPT = """You are a strict fact-checker for a \
family-memory chat assistant. You will be shown source memories (as \
documents) and a drafted answer. Rewrite the answer so it contains ONLY \
facts explicitly supported by the source memories. Remove or soften any \
claim that is not directly supported -- if removing a claim would leave \
nothing, say plainly that the information isn't available rather than \
inventing a replacement. If the drafted answer already only uses supported \
facts, return it unchanged. Return only the corrected answer text, with no \
preamble, quotes, or explanation."""

_SUMMARY_SYSTEM_PROMPT = """Summarize the following conversation turns \
concisely, in a few sentences. Preserve any facts, names, and open \
questions that later turns might still need to reference. Return only the \
summary text, with no preamble."""


class MemoryChatService:
    def __init__(
        self,
        *,
        provider: AIProvider,
        safety: PromptSafetyService,
        settings: Settings,
        conversations: ConversationStore,
    ) -> None:
        self._provider = provider
        self._safety = safety
        self._settings = settings
        self._conversations = conversations

    async def chat(self, payload: MemoryChatRequest, *, request_id: str) -> MemoryChatResponse:
        self._validate_input_size(payload)

        context = await self._conversations.get_context(payload.conversation_id)
        documents = tuple(
            DocumentBlock(title=memory.title, text=render_memory_text(memory))
            for memory in payload.memories
        )
        system_prompt = _GROUNDING_SYSTEM_PROMPT.format(person=payload.person)
        history = self._build_history(context)

        started = perf_counter()
        draft_text, citations, usage = await self._draft_answer(
            system_prompt=system_prompt,
            documents=documents,
            history=history,
            question=payload.question,
        )
        final_text = await self._verify_grounding(
            documents=documents,
            question=payload.question,
            draft_answer=draft_text,
        )

        await self._conversations.append_turns(
            payload.conversation_id,
            [
                NewTurn(role="user", content=payload.question),
                NewTurn(role="assistant", content=final_text),
            ],
        )
        await self._maybe_refresh_summary(payload.conversation_id)

        return MemoryChatResponse(
            request_id=request_id,
            answer=final_text,
            citations=[
                CitationOut(memory_title=citation.document_title, cited_text=citation.cited_text)
                for citation in citations
            ],
            usage=usage,
            latency_ms=round((perf_counter() - started) * 1000, 2),
        )

    def _validate_input_size(self, payload: MemoryChatRequest) -> None:
        self._safety.validate(payload.question, None)
        combined_length = len(payload.question) + sum(
            len(memory.narrative) + len(memory.title) for memory in payload.memories
        )
        if combined_length > self._settings.ai_max_input_chars:
            raise AppError(
                code="INPUT_TOO_LARGE",
                message="The provided memories exceed the configured size limit.",
                status_code=413,
            )

    @staticmethod
    def _build_history(context: ConversationContext) -> tuple[ChatTurn, ...]:
        turns: list[ChatTurn] = []
        if context.summary:
            summary_note = (
                f"[Summary of earlier conversation, for context only: {context.summary}]"
            )
            turns.append(ChatTurn(role="user", content=summary_note))
            turns.append(ChatTurn(role="assistant", content="Understood, I have that context."))
        turns.extend(ChatTurn(role=turn.role, content=turn.content) for turn in context.turns)
        return tuple(turns)

    async def _draft_answer(
        self,
        *,
        system_prompt: str,
        documents: tuple[DocumentBlock, ...],
        history: tuple[ChatTurn, ...],
        question: str,
    ) -> tuple[str, tuple[Citation, ...], Usage]:
        try:
            async with asyncio.timeout(self._settings.ai_timeout_seconds):
                result = await self._provider.chat(
                    ChatRequest(
                        system_prompt=system_prompt,
                        documents=documents,
                        history=history,
                        question=question,
                        max_tokens=self._settings.ai_default_max_tokens,
                    )
                )
        except TimeoutError as error:
            raise AppError(
                code="AI_TIMEOUT",
                message="The AI provider timed out.",
                status_code=504,
            ) from error
        except AppError:
            raise
        except Exception as error:
            raise ProviderError() from error

        usage = Usage(input_tokens=result.input_tokens, output_tokens=result.output_tokens)
        return result.text, result.citations, usage

    async def _verify_grounding(
        self,
        *,
        documents: tuple[DocumentBlock, ...],
        question: str,
        draft_answer: str,
    ) -> str:
        """Second grounding pass: a cheap safety net, not the primary path.

        If this check itself fails (timeout, provider error), fall back to
        the drafted answer rather than failing the whole request -- an
        unavailable verifier should degrade gracefully, not block the chat.
        """
        verification_question = (
            f"Question that was asked: {question}\n\nDrafted answer to check:\n{draft_answer}"
        )
        try:
            async with asyncio.timeout(self._settings.ai_timeout_seconds):
                result = await self._provider.chat(
                    ChatRequest(
                        system_prompt=_VERIFICATION_SYSTEM_PROMPT,
                        documents=documents,
                        history=(),
                        question=verification_question,
                        max_tokens=self._settings.ai_default_max_tokens,
                    )
                )
        except Exception:
            return draft_answer

        corrected = result.text.strip()
        return corrected or draft_answer

    async def _maybe_refresh_summary(self, conversation_id: str) -> None:
        older_turns = await self._conversations.get_turns_before_window(conversation_id)
        if not older_turns:
            return

        history_text = "\n".join(f"{turn.role}: {turn.content}" for turn in older_turns)
        try:
            async with asyncio.timeout(self._settings.ai_timeout_seconds):
                summary_result = await self._provider.chat(
                    ChatRequest(
                        system_prompt=_SUMMARY_SYSTEM_PROMPT,
                        documents=(),
                        history=(),
                        question=history_text,
                        max_tokens=self._settings.ai_default_max_tokens,
                    )
                )
        except Exception:
            # Summary refresh is best-effort. If it fails, the un-summarized
            # turns simply stay pending and are retried on a later request.
            return

        summary_text = summary_result.text.strip()
        if not summary_text:
            return
        await self._conversations.save_summary(
            conversation_id, summary_text, older_turns[-1].turn_index
        )
