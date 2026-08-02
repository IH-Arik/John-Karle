# Evals — Memory Chat & Memory Quote

Manual quality evals against the **real** Anthropic API. Deliberately separate
from `tests/` and never run by `pytest`/CI:

- They cost real API money.
- Their pass/fail comes from an LLM judge, which is not perfectly
  deterministic (see "Known limitations" below).

Run after touching either feature's system prompts, grounding logic, or
provider code (`app/services/memory_chat.py`, `app/services/memory_quote.py`,
`app/providers/anthropic.py`):

```bash
python -m evals.run_evals
```

Requires `ANTHROPIC_API_KEY` / `AI_MODEL` configured the same way the app
reads them (`.env`).

## What it checks

- `evals/cases.py` — a small, fixed set of sample memories + questions,
  each with an expected behavior (`should_answer` / `should_decline`), plus
  multi-turn conversation scripts and multi-memory citation scenarios.
- `evals/judge.py` — a second, cheap Claude call that grades each generated
  response against the grounding/persona rules, since "did it invent a fact"
  can't be checked with a keyword match.
- `evals/run_evals.py` — runs every case through the real system and prints
  a PASS/FAIL summary per case plus an overall verdict. Four groups:
  - Memory Chat cases — call `AnthropicAIProvider.chat()` directly.
  - Memory Quote cases — call `AnthropicAIProvider.generate_quote()` directly.
  - Multi-turn — calls the real `MemoryChatService` (SQLite `ConversationStore`
    included, in a throwaway temp DB), not just the provider in isolation.
  - Citation accuracy — objective check (no judge needed): with several
    memories in context, do citations point at the one that actually
    supports the answer?

Current case coverage:

| Case | What it catches |
| --- | --- |
| `grounded_factual` | Basic grounded recall works at all |
| `ungrounded_unrelated` | Declines cleanly when the answer isn't in the memories |
| `grounded_emotion` | Only reports emotions explicitly stated in the narrative |
| `contradiction_probe` | Doesn't agree with a false premise in the question |
| `grief_expression` | Acknowledges the user's grief without giving therapy advice, and — the one real bug this suite caught — without assuming the referenced person is deceased |
| `ungrounded_unrelated_topic` | Second decline case, different topic |
| `journal_quote` | Quote generation for a written memory: no invented facts, no verbatim copying, third person, "Lineage.AI" self-reference |
| `photo_quote` | Same, for a visual memory type |
| `conversation_history_recall` | Second turn asks the assistant to summarize what it *just said* -- only answerable correctly if `ConversationStore`/windowing is actually working, not derivable by re-reading the memories alone |
| `cites_correct_memory_among_several` | With two memories in context, citations must point at the one that actually contains the answer (cake → birthday memory, not the lake photo) |

## A real bug this suite found (and fixed)

The `grief_expression` case originally failed: asked about missing "mom,"
Lineage.AI responded with "...keeping her memory alive..." — implying the
referenced person is deceased, when nothing in the source memory or the
user's message said so. Fixed by adding an explicit rule to
`_GROUNDING_SYSTEM_PROMPT` in `app/services/memory_chat.py`: never assume or
imply a person's life status (alive/deceased/estranged/inactive) beyond what
the memories or the user state. Re-running the suite confirmed the fix.

This is exactly the class of failure a Mock-provider-only test suite cannot
catch — it only showed up against the real model.

## Known limitations of the judge itself

Early runs surfaced judge false-positives, not product bugs:

- **Supplied-context names.** The judge only sees the raw narrative text
  (which may say "mom," not "Margaret"), not the `person` field the real
  request also carries — so it initially flagged correct use of the
  person's name as a "fabricated" detail. Fixed by giving `judge()` an
  explicit `context_note` parameter, rendered as a clearly separated
  "BACKGROUND CONTEXT" section, plus a general rule in the judge's own
  system prompt that using supplied context correctly is never a
  fabrication.
- **Second-person address.** The judge briefly conflated "speaks about the
  subject in the third person" with "must never say `you`" — flagging
  ordinary second-person address to the user asking the question. Fixed by
  clarifying the check wording to "avoids speaking AS {person} (first-person
  `I` as {person})", which is what the persona rule actually requires.
- **Translation-idiom nuance.** One run flagged a Bangla-to-English
  translation of an idiom ("kandte kandte hasa shuru korlo") as inventing
  simultaneity ("crying and laughing at the same time") vs. a strict
  sequential reading. This is a genuinely ambiguous translation call, not a
  clear hallucination -- treat single borderline judge FAILs on
  translation-adjacent phrasing as a prompt to read the actual answer
  yourself, not as an automatic confirmed bug.

If a future run reports a FAIL, read the judge's reason and the actual
answer text before treating it as a confirmed regression -- the judge is a
strong signal, not a perfect oracle.

## Current status

Full suite (10 cases) passes 10/10 against `claude-sonnet-4-6`, including
the multi-turn and citation-accuracy cases added after the first pass --
both confirmed real, previously-untested code paths (conversation history
persistence, correct citation among multiple documents) work correctly
end to end.
