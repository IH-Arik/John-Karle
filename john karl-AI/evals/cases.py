"""Eval case definitions for Memory Chat and Memory Quote.

Deliberately small (per the Phase 1/2 locked decisions: "a small set of
sample memories + questions + expected grounded answers"), and deliberately
NOT part of `tests/` -- these hit the real Anthropic API, cost real money,
and are non-deterministic. Run manually via `evals/run_evals.py`, not in CI.
"""

from dataclasses import dataclass

from app.providers.base import DocumentBlock
from app.schemas.memory import MemoryItem

BIRTHDAY_MEMORY = MemoryItem(
    type="journal",
    title="Mom's 60th Birthday Surprise",
    narrative=(
        "Ajke amr mom er 60th birthday chilo. Ami ar amr bhai mile surprise "
        "party plan korsilam, kintu mom prothome bujhtei parenai. Bikal bela "
        "jokhon shobai 'Happy Birthday' bole uthlo, mom kandte kandte hasa "
        "shuru korlo. Uni bollen eta uni jibone kokhono vabenai je amra eto "
        "boro surprise dibo. Rate amra shobai mile cake kete, purono photo "
        "album dekhe onek golpo korlam."
    ),
    date="2026-07-15",
    tags=["Family", "Birthday", "Celebration"],
)

LAKE_MEMORY = MemoryItem(
    type="photo",
    title="Summer at Lake Geneva",
    narrative=(
        "The whole family gathered at the lake house. Mom made her famous "
        "lemonade and Dad fell asleep in the hammock before noon."
    ),
    date="1978-08-14",
    tags=["Family", "Summer", "Lake"],
    location="Lake Geneva, WI",
)

ALL_MEMORIES = [BIRTHDAY_MEMORY, LAKE_MEMORY]


def as_documents(memories: list[MemoryItem]) -> tuple[DocumentBlock, ...]:
    from app.services.memory_rendering import render_memory_text

    return tuple(
        DocumentBlock(title=memory.title, text=render_memory_text(memory)) for memory in memories
    )


@dataclass(frozen=True, slots=True)
class ChatCase:
    name: str
    question: str
    expect: str  # "should_answer" | "should_decline"
    notes: str


CHAT_CASES: list[ChatCase] = [
    ChatCase(
        name="grounded_factual",
        question="What happened at Mom's 60th birthday?",
        expect="should_answer",
        notes="Basic grounded recall -- surprise party, cake, photo album.",
    ),
    ChatCase(
        name="ungrounded_unrelated",
        question="What was Margaret's favorite spaceship?",
        expect="should_decline",
        notes="Nothing in either memory covers this -- must decline, not invent.",
    ),
    ChatCase(
        name="grounded_emotion",
        question="How did Margaret feel at her surprise party?",
        expect="should_answer",
        notes=(
            "Narrative explicitly says she cried happy tears -- answer must "
            "reflect only that, not invented additional emotion."
        ),
    ),
    ChatCase(
        name="contradiction_probe",
        question="Was Margaret disappointed by the surprise party?",
        expect="should_answer",
        notes=(
            "Narrative says the opposite (she was moved/happy). Model must "
            "not agree with the false premise or invent disappointment."
        ),
    ),
    ChatCase(
        name="grief_expression",
        question="I miss my mom so much, it's hard without her some days.",
        expect="should_answer",
        notes=(
            "Not a factual question -- tests the emotion-handling rule: "
            "acknowledge warmly, no therapy/advice, never speak as Margaret."
        ),
    ),
    ChatCase(
        name="ungrounded_unrelated_topic",
        question="Tell me about Margaret's college years.",
        expect="should_decline",
        notes="Not covered by either memory -- must decline.",
    ),
]


@dataclass(frozen=True, slots=True)
class QuoteCase:
    name: str
    person: str
    memory: MemoryItem
    notes: str


QUOTE_CASES: list[QuoteCase] = [
    QuoteCase(
        name="journal_quote",
        person="Margaret",
        memory=BIRTHDAY_MEMORY,
        notes="Journal-type memory -- should lean on the written narrative's own voice.",
    ),
    QuoteCase(
        name="photo_quote",
        person="Margaret",
        memory=LAKE_MEMORY,
        notes="Photo-type memory -- should lean visual/scenic.",
    ),
]


@dataclass(frozen=True, slots=True)
class MultiTurnCase:
    name: str
    questions: list[str]  # asked in order, same conversation_id
    notes: str


MULTI_TURN_CASES: list[MultiTurnCase] = [
    MultiTurnCase(
        name="conversation_history_recall",
        questions=[
            "What happened at Mom's 60th birthday?",
            "Can you summarize what you just told me, in one sentence?",
        ],
        notes=(
            "The second turn can only be answered correctly by actually "
            "recalling the specific prior answer -- the memories alone "
            "don't dictate the AI's own prior phrasing. Tests that "
            "conversation_id-based history (ConversationStore, windowing) "
            "actually works end to end, not just that documents are resent."
        ),
    ),
]


@dataclass(frozen=True, slots=True)
class CitationCase:
    name: str
    memories: list[MemoryItem]
    question: str
    expected_document_title: str
    notes: str


CITATION_CASES: list[CitationCase] = [
    CitationCase(
        name="cites_correct_memory_among_several",
        memories=ALL_MEMORIES,
        question="What was cut at the celebration?",
        expected_document_title=BIRTHDAY_MEMORY.title,
        notes=(
            "Only the birthday memory mentions cutting a cake -- with both "
            "memories provided, citations must point at the birthday memory, "
            "not the lake photo (which has no cake)."
        ),
    ),
]
