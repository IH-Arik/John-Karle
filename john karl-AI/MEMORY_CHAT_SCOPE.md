# Memory Chat — Feature Scope

This document records the AI feature that `john karl-AI` is being built to support, as scoped from the product screens in `john karl-backend`/`john karl-dashboard`'s "Add a Memory" and "Legacy Mode" flows, and the "Ask about [person]" chat screen. It is a product/scope reference, not an implementation plan.

**Product name (confirmed):** the chatbot/AI persona is named **Lineage.AI**. Any user-facing AI text (chat, generated summaries/quotes) is written from Lineage.AI as the product identity, not a generic "the AI."

Read [`REPO_BOUNDARIES.md`](REPO_BOUNDARIES.md) first: the backend fields described below are analyzed read-only from `john karl-backend`; nothing here authorizes editing that repository.

## 1. Where the data comes from

Every memory is created in the backend's Memory Vault module (`MemoryVault` model) through a 4-step flow: **Type → Story → Tags → Save**. Once saved, a memory record has these fields (see `john karl-backend/src/modules/memory-vault/memory-vault.model.ts`):

| Field | Meaning | Notes |
| --- | --- | --- |
| `type` | `photo` \| `video` \| `journal` \| `voice` | Only the text implications matter for the basic scope; see §4. |
| `whoseMemoryIsThis` | Who the memory is about | Chosen from the user's existing family member list (e.g. Margaret, Robert) or "Mine" — **not** free-typed text. Stored as a plain string, not an ID reference to the family member record. |
| `title` | Short label for the memory | e.g. "Mom's 60th Birthday Surprise" |
| `narrative` | The actual story, up to 5000 characters | This is the primary source of meaning — see §2. |
| `date` | When the event happened | |
| `tags` | User-chosen or custom labels | e.g. `#Family`, `#Birthday` |
| `files[]` | S3-hosted photo/video/voice attachments | Out of scope for now — see §4. |
| `location` | Where the event happened (e.g. "Lake Geneva, WI") | **Approved backend addition**, not yet built: a plain string field, required only for `photo` and `video` memory types. Geocoding (Mapbox or similar) may be layered on top later, but the field starts as free text. |

Access is scoped the same way the backend already scopes it: a user can read their own memories, and an accepted family member's memories, per `areAcceptedFamilyMembers`. Any AI feature built on top of this data must preserve that same boundary — a user must never be able to surface, via chat, a memory they could not already read through the app.

## 2. Core task: understanding a memory, not just storing it

The basic (non-advanced) scope is: given one memory's `type`, `whoseMemoryIsThis`, `title`, `narrative`, `date`, and `tags`, produce a semantic understanding of it — not just index the raw text.

Worked example:

> **Whose memory is this?:** Mom
> **Title:** Mom's 60th Birthday Surprise
> **Narrative:** "Ajke amr mom er 60th birthday chilo. Ami ar amr bhai mile surprise party plan korsilam, kintu mom prothome bujhtei parenai. Bikal bela jokhon shobai 'Happy Birthday' bole uthlo, mom kandte kandte hasa shuru korlo. Uni bollen eta uni jibone kokhono vabenai je amra eto boro surprise dibo. Rate amra shobai mile cake kete, purono photo album dekhe onek golpo korlam."
> **Date:** 2026-07-15
> **Tags:** #Family, #Birthday, #Celebration

From this, the understanding step must extract:

- **Occasion**: a birthday surprise party (confirmed by narrative language, not only the `#Birthday` tag).
- **Subject**: "mom" in the narrative corresponds to `whoseMemoryIsThis` — this is the anchor identity for the memory.
- **People mentioned but not in a structured field**: "amar bhai" (the user's sibling) appears only in free text — the understanding step must recognize this, since no field captures it.
- **Emotional tone**: "kandte kandte hasa" (crying while laughing) — a happy, emotional moment. This matters if a later chat question asks how the person felt.
- **Sub-events**: cutting the cake, looking through an old photo album, storytelling — smaller moments inside the larger event that a chat answer may need to reference individually.
- **Date and tags**: used for "when" questions and broad categorization/filtering.

The output of this step is what later powers the chat feature (§3) — it should not require re-reading and re-interpreting the raw narrative from scratch on every question.

## 3. AI-generated summary/quote (confirmed feature — decisions locked)

Confirmed from the memory detail screen: Lineage.AI generates a short, polished piece of text from each memory — a stylized pull-quote (e.g. *"The water was as still as a prayer that afternoon, and for a moment, the world felt like it had finally stopped turning just for us."*) plus a short reflective paragraph underneath it, shown above the raw preserved files.

This is generated **from the basis of everything on the memory** — `type`, `whoseMemoryIsThis`, `title`, `narrative`, `date`, `tags`, and `location` once available — not just a truncation of the raw `narrative`. It is a distinct, model-produced artifact layered on top of the user's original story, grounded in the understanding step from §2.

**All previously-open questions are now decided** (full detail and rationale in `PRODUCTION_READINESS.md` → "Phase 2 Decisions (Locked)"):

- **Timing**: generated once, at save time, and cached — not regenerated on every view.
- **Regeneration**: triggered automatically whenever the source memory is edited (title/narrative/tags/date/location change).
- **Storage**: lives in `john karl-AI`'s own database, the same way Memory Chat's conversation history does — not as a field on the backend's `MemoryVault` record.
- **Data contract**: asynchronous. Memory save in `john karl-backend` never blocks on or depends on this generation — it's a best-effort background call, consistent with how the backend already treats other secondary side effects (email, notifications).
- **Grounding vs. poetic license**: Lineage.AI may use evocative, poetic language to express the mood/feeling already present in the narrative (metaphor, imagery), but must never invent new factual content — new events, people, or specific details not stated or clearly implied in the source. When uncertain, it favors atmospheric/emotional elaboration over inventing facts.
- **Product-name reference**: generated commentary may reference "Lineage.AI" by name (as seen in the mockup's "...what Lineage.AI helps us keep..." line) — this is intentional, not a mockup artifact.
- **Type-based variation**: the generated text style differs by memory `type` (e.g. photo/video framing leans visual/scenic; journal/voice framing leans on the written/spoken content itself).
- **Language**: English only, same as Memory Chat (§4).

## 4. Chat feature

After a memory is saved, clicking into it opens a story detail view — that view itself is dashboard/mobile UI, out of `john karl-AI`'s field of work, mentioned here only for context.

From that context (or from a person's aggregated memories), the user can open a chat and ask questions "about" that person — e.g. "Ask about Margaret...". The AI must answer using the understanding built in §2, grounded in the actual saved memories, not fabricated detail.

**Persona (decided):** Lineage.AI always answers **about** the person, in third person ("Margaret's birthday was...") — it never role-plays **as** the person, in any mode, including Legacy Mode (memories of someone inactive or deceased). This was chosen specifically to avoid the emotional risk of an AI impersonating a real, possibly-deceased family member.

**Emotion handling (decided alongside persona):** a feeling is only ever attributed to someone if it's explicit in that memory's `narrative` — the AI does not infer or invent emotional content. If the *user* expresses grief or nostalgia in the chat, Lineage.AI acknowledges it warmly and briefly, without giving advice or acting as a therapist, then returns to the memory content.

Full request contract (what the backend sends to `john karl-AI` for a chat turn), the retrieval approach, conversation-history handling, and the grounding technique used to keep answers honest are all specified in `PRODUCTION_READINESS.md` — see its "Phase 1 Decisions (Locked)" table for the complete, decided build spec.

## 5. Explicitly deferred (not in basic scope)

- **Media understanding**: photo/video/voice `files[]` content (what's in the picture, what's said in a voice note, what happens in a video) is ignored for now. The basic scope only reasons over the text fields. This is a known follow-up, not a gap to silently drop.
- **Legacy Mode data-transfer integration**: how AI-related data (if any) is included when a trusted contact receives a data handover is not part of this scope; see the "Data Transfer" screen mismatch already noted in prior analysis (its categories don't match the backend's actual `accessScope` fields).

## 6. Known data-model caveat

`whoseMemoryIsThis` is a plain string, not a foreign key to a family member record, even though the UI now populates it from a bounded family-member list rather than free typing. Two family members sharing a name, or a family member later renaming themselves, are not reconciled automatically (the backend's own architecture notes call this out as a general "denormalization drift" risk for family data). Any grouping of "all of Margaret's memories" for chat purposes relies on this string matching consistently — good enough for the basic scope, but a real limitation to keep in mind, not something to solve by editing the backend without the user's decision.
