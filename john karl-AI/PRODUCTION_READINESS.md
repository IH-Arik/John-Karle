# Production Readiness — Memory Chat

This tracks what must be decided or built before the Memory Chat feature (`MEMORY_CHAT_SCOPE.md`) can carry real user data and real conversations, beyond the basic understanding step already scoped. Nothing here is implemented yet; each item is a gap, not a status.

## Phase 1 Decisions (Locked)

Everything below is decided and ready to implement against. Each item's full reasoning stays in its numbered section further down — this table is the quick-reference summary. Do not re-litigate a locked decision without the user explicitly reopening it.

| # | Question | Decision |
| --- | --- | --- |
| 1 | Who calls whom (§1) | **`john karl-backend` calls `john karl-AI`.** Backend owns the data and access control; it gathers the relevant memories and calls the AI service, not the other way around. |
| 1 | Service-to-service auth (§1) | **Shared-secret header**, reusing the AI service's existing `INTERNAL_API_KEY` mechanism (already implemented in `john karl-AI` per its own `docs/ARCHITECTURE.md`: `X-API-Key` header, compared via `secrets.compare_digest`). Backend stores the same secret (e.g. `AI_SERVICE_API_KEY`) and sends it as `X-API-Key` on every call. Never exposed to the browser/app client — server-to-server only, over HTTPS/internal network. |
| 1 | Request shape (§1) | `{ "conversation_id": "...", "person": "Margaret", "question": "...", "memories": [ { type, title, narrative, date, tags, location? } ] }` — refined during implementation: no `conversation_history` field, since `john karl-AI` owns and looks up history itself by `conversation_id` (per decision #3). See "Phase 1 Implementation Status" below for the exact as-built contract. |
| 2 | Retrieval strategy for Phase 1 (§2) | **No relevance filtering yet.** Backend queries all memories matching `whoseMemoryIsThis == <person>` and sends all of them — the known string-matching caveat (`MEMORY_CHAT_SCOPE.md` §6) still applies, but semantic/tag-based narrowing is deferred until memory counts actually get large. |
| 3 | Conversation history storage (§3) | Full history persists in **`john karl-AI`'s own database**, not the backend. Sent to Claude per-request via **windowing (last 15–20 turns) + a rolling summary of everything older**, built and refreshed manually — not the API's beta Compaction feature, to avoid the beta dependency and the requirement to always resend the full history with compaction blocks intact. |
| 4 | Persona (§4) | **Third person only.** Lineage.AI speaks *about* the referenced person ("Margaret's birthday was...") and must never speak *as* them, in any mode, including Legacy Mode. |
| 4 | Emotion handling (§4) | Two distinct rules: (a) only attribute a feeling if it's explicit in the source `narrative` — never invent how someone felt; (b) if the *user* expresses grief/distress in chat, acknowledge it warmly and briefly, without giving advice or acting as a therapist, then return to the memory content. Never respond as if Lineage.AI is the person being discussed. **Amended after live eval found a real bug**: also never assume or imply the referenced person's life status (alive/deceased/estranged/inactive) — see "Eval Suite Status" below. |
| 6 | Language scope for Phase 1 (§6) | **English only.** Bangla/mixed-language handling is deferred — not tested or guaranteed in Phase 1, revisit before wider rollout. |
| 7 | Cost/reliability minimum for Phase 1 (§7) | Use what `john karl-AI` already has (mock/Anthropic provider swap, `INTERNAL_API_KEY`, request timeouts) and ship with that. Per-tenant quotas, shared rate limiting, and metrics/cost accounting are explicitly deferred until real user traffic exists — not required to start. |
| 8 | Grounding technique (§8) | All four layers, used together: (1) explicit system-prompt instruction to only state what's in the provided memories and say "I don't know" otherwise; (2) structural separation of memory data from the question in the prompt (e.g. `<memories>...</memories>` / `<question>...</question>`); (3) the Messages API **Citations** feature (`citations: {enabled: true}` on each memory sent as a `document` block) so every claim in the answer can be traced to a specific memory span; (4) a second, cheaper verification pass on the drafted answer before it's returned, checking it against the source memories and flagging/removing unsupported claims. |
| — | REPO_BOUNDARIES discipline | Only the three rows marked **Approved** in the tracker below may be assumed present in `john karl-backend`. Nothing else — no search, filter, privacy, contributors, etc. — may be relied on in Phase 1 code without a new, explicit approval first. |
| — | Eval/test set | **Built** — see "Eval Suite Status" below (`evals/`). Ran live against the real Anthropic API; found and fixed one real bug (assumed life-status in grief responses). |

## Phase 1 Implementation Status: BUILT

The Memory Chat feature is implemented in `john karl-AI` end to end, following the locked decisions above. Verified: `pytest` (18/18 passing, including 6 memory-chat-specific tests), `ruff check .` (clean), `mypy app tests` (clean, strict mode).

**What was built (all inside `john karl-AI` — nothing in `john karl-backend` was touched, per `REPO_BOUNDARIES.md`):**

- `app/providers/base.py` — new `ChatRequest`/`ChatResult`/`DocumentBlock`/`ChatTurn`/`Citation` types, and a `chat()` method on `AIProvider` (not abstract, so existing single-turn test doubles are unaffected).
- `app/providers/mock.py` — deterministic `chat()`: answers only when a document shares a keyword with the question, otherwise declines. Used by every automated test.
- `app/providers/anthropic.py` — real `chat()`: sends each memory as a `document` content block with `citations: {enabled: true}`, sends conversation history as prior turns, parses citations back off the response.
- `app/schemas/memory_chat.py` — `MemoryChatRequest` / `MemoryChatResponse` / `MemoryItem` / `CitationOut`.
- `app/services/conversation_store.py` — SQLite-backed history, keyed by `conversation_id`: windowed reads (last `MEMORY_CHAT_WINDOW_TURNS`, default 20) plus a rolling summary refreshed once `MEMORY_CHAT_SUMMARY_TRIGGER_TURNS` (default 10) turns have aged out of the window.
- `app/services/memory_chat.py` — `MemoryChatService`: builds the third-person/grounding system prompt, assembles history + documents, calls the provider, runs the second-pass grounding verification, persists the new turns, triggers summary refresh.
- `app/api/v1/endpoints/memory_chat.py` + router wiring — new endpoint, protected by the existing `require_internal_api_key` dependency (same mechanism as `/ai/generate`).
- `app/core/config.py` / `.env.example` — new settings: `MEMORY_CHAT_DB_PATH`, `MEMORY_CHAT_WINDOW_TURNS`, `MEMORY_CHAT_SUMMARY_TRIGGER_TURNS`.
- `tests/test_memory_chat.py` — grounded-answer, decline-when-ungrounded, validation, auth, and multi-turn persistence tests.

**As-built API contract** (this is what `john karl-backend` needs to call once it's ready to integrate):

```
POST /api/v1/ai/memory-chat
X-API-Key: <shared secret, matches john karl-AI's INTERNAL_API_KEY>
Content-Type: application/json

{
  "conversation_id": "string, 1-200 chars — backend decides/owns this ID; same ID = same chat thread",
  "person": "string, 1-120 chars — e.g. \"Margaret\"",
  "question": "string, 1-2000 chars",
  "memories": [
    {
      "type": "photo" | "video" | "journal" | "voice",
      "title": "string, 1-160 chars",
      "narrative": "string, 1-5000 chars",
      "date": "string, 1-40 chars",
      "tags": ["string", "..."],
      "location": "string or omitted"
    }
  ]
}
```

Response (200):

```json
{
  "success": true,
  "request_id": "...",
  "answer": "...",
  "citations": [{ "memory_title": "...", "cited_text": "..." }],
  "usage": { "input_tokens": 123, "output_tokens": 45 },
  "latency_ms": 812.3
}
```

**What `john karl-backend` still needs to do — DONE.** Built directly in `john karl-backend` per the user's explicit one-time authorization to cross the `REPO_BOUNDARIES.md` line for this integration ("Hae, backend-e directly edit koro"). See "Backend Integration Status: BUILT" below for the full as-built detail. Summary of the original 4 items:

1. ~~Add an `AI_SERVICE_API_KEY` (or similar) config value matching this service's `INTERNAL_API_KEY`, and an `AI_SERVICE_URL` pointing at this service.~~ Done.
2. ~~Add an outbound HTTP call to `POST {AI_SERVICE_URL}/api/v1/ai/memory-chat` with the `X-API-Key` header, from whatever route/controller handles the chat UI's "Ask about Margaret" request.~~ Done — new `memory-chat` module.
3. ~~Decide how `conversation_id` is generated/stored on the backend side.~~ Done — `${userId}:${person.toLowerCase()}`, one thread per user+person pair.
4. ~~Fetch the memories to send, scoped to what the requesting user is allowed to read.~~ Done — matches by `whoseMemoryIsThis`, scoped by default to the requesting user's own memories; pass `familyMemberUserId` to search an accepted family member's memories instead (same `areAcceptedFamilyMembers` check `memory-vault` uses, 403 if not accepted).

## Phase 2 Decisions (Locked)

Decisions for the AI-generated summary/quote feature (`MEMORY_CHAT_SCOPE.md` §3). **Not yet implemented** — this is the spec to build against next, mirroring how Phase 1's table worked.

| Question | Decision |
| --- | --- |
| Generation timing | Generated **once, at save time**, and cached. Not regenerated on every detail-screen view. |
| Regeneration trigger | Automatically regenerated whenever the source memory is edited (title, narrative, tags, date, or location changes). |
| Storage location | `john karl-AI`'s own database — the same pattern as Memory Chat's conversation history (§3 of Phase 1), not a field added to the backend's `MemoryVault` record. |
| Data contract (sync vs. async) | **Asynchronous / best-effort.** Memory creation in `john karl-backend` must not block on, or fail because of, this generation — consistent with how the backend already treats other secondary side effects (email, notifications) per its own architecture notes. Backend saves the memory and responds to the user immediately; the quote/commentary is requested from `john karl-AI` in the background and appears once ready. |
| Grounding vs. poetic license | Evocative, poetic language expressing the mood/feeling **already present** in the narrative is allowed (metaphor, imagery). Inventing new factual content — events, people, specific details not stated or clearly implied in the source — is not, ever. When uncertain, favor atmospheric elaboration over factual invention. |
| "Lineage.AI" self-reference | Intentional: generated commentary may name-check "Lineage.AI" (as in the mockup's "...what Lineage.AI helps us keep..."), it is not a mockup artifact to be dropped. |
| Type-based variation | Generated style differs by memory `type` — photo/video framing leans visual/scenic, journal/voice framing leans on the written/spoken content itself. |
| Language | English only, same scope restriction as Memory Chat. |

## Phase 2 Implementation Status: BUILT

Implemented in `john karl-AI`, following the locked decisions above. Verified: `pytest` (25/25 passing across the whole suite), `ruff check .` (clean), `mypy app tests` (clean, strict mode).

**What was built (all inside `john karl-AI` — nothing in `john karl-backend` was touched):**

- `app/schemas/memory.py` — `MemoryItem` moved here so both Memory Chat and Memory Quote share one definition (previously duplicated).
- `app/services/memory_rendering.py` — shared `render_memory_text()`, used by both features.
- `app/providers/base.py` — new `QuoteRequest`/`QuoteResult` types and a `generate_quote()` method on `AIProvider` (not abstract, same reasoning as `chat()`).
- `app/providers/mock.py` — deterministic `generate_quote()` for tests; always includes "Lineage.AI" in the commentary, per the locked self-reference decision.
- `app/providers/anthropic.py` — real `generate_quote()`. **Note:** uses a plain delimited text format (`PULL_QUOTE:` / `COMMENTARY:` markers, parsed defensively), not the Messages API's `output_config.format` JSON-schema structured outputs — that feature isn't supported on every model this project might be configured with (e.g. `claude-sonnet-4-6`, this project's actual default), so the portable text format was used instead.
- `app/services/memory_quote_store.py` — SQLite-backed cache, keyed by a backend-supplied `memory_id`. This is what actually implements "generated once, cached, not regenerated on every view" — a naive stateless implementation would not have.
- `app/services/memory_quote.py` — `MemoryQuoteService`: builds the persona/grounding/type-variation system prompt, calls the provider, saves the result to the store, and separately exposes a cache-only read path.
- `app/api/v1/endpoints/memory_quote.py` + router wiring — **two** endpoints, both behind the existing `require_internal_api_key` dependency:
  - `POST /api/v1/ai/memory-quote` — always calls the model and overwrites the cache. This is what the backend calls on memory save/edit (asynchronously — see the locked data-contract decision).
  - `GET /api/v1/ai/memory-quote/{memory_id}` — cache-only, no model call, 404 if nothing has been generated yet. This is what the backend/detail screen should call on every view.
- `app/core/config.py` / `.env.example` — new setting: `MEMORY_QUOTE_DB_PATH`.
- `tests/test_memory_quote.py` — generation (journal + photo types), validation, auth, 404-before-generation, and cache-hit-after-generation tests.

**As-built API contract:**

```
POST /api/v1/ai/memory-quote
X-API-Key: <shared secret>
Content-Type: application/json

{
  "memory_id": "string, 1-200 chars -- backend's stable ID for this memory (e.g. the MongoDB _id)",
  "person": "string, 1-120 chars",
  "memory": {
    "type": "photo" | "video" | "journal" | "voice",
    "title": "string, 1-160 chars",
    "narrative": "string, 1-5000 chars",
    "date": "string, 1-40 chars",
    "tags": ["string", "..."],
    "location": "string or omitted"
  }
}
```

Response (200): `{ "success": true, "request_id": "...", "pull_quote": "...", "commentary": "...", "usage": {...}, "latency_ms": ... }`

```
GET /api/v1/ai/memory-quote/{memory_id}
X-API-Key: <shared secret>
```

Response (200): `{ "success": true, "memory_id": "...", "pull_quote": "...", "commentary": "..." }`
Response (404) if nothing generated yet: standard error envelope, `error.code == "MEMORY_QUOTE_NOT_FOUND"`.

**What `john karl-backend` still needs to do — DONE.** See "Backend Integration Status: BUILT" below. Summary:

1. ~~Reuse the same `AI_SERVICE_API_KEY`/`AI_SERVICE_URL` config from Memory Chat (§1).~~ Done — one shared client config for both features.
2. ~~Call `POST {AI_SERVICE_URL}/api/v1/ai/memory-quote` in the background whenever a memory is created or edited.~~ Done — fire-and-forget, matching the backend's existing `.catch(() => undefined)` pattern for non-critical side effects.
3. ~~When rendering the memory detail screen, call `GET {AI_SERVICE_URL}/api/v1/ai/memory-quote/{memory_id}`.~~ Done — new `GET /api/v1/memory-vault/{memoryId}/quote` endpoint proxies this, cache-only, returning `null` fields (not an error) before generation completes.

## Backend Integration Status: BUILT

Implemented directly in `john karl-backend` (not `john karl-AI`), per the user's explicit, task-scoped authorization to cross the `REPO_BOUNDARIES.md` line for this work. Verified: `pnpm typecheck` (clean), `pnpm lint` (clean), `pnpm test` (158/158 passing, including new coverage).

**What was built:**

- `src/config/env.config.ts` / `.env.example` — `AI_SERVICE_URL` (default `http://localhost:8000`) and `AI_SERVICE_API_KEY` (must match this service's `INTERNAL_API_KEY`).
- `src/utils/ai-service.client.ts` — new HTTP client: `requestMemoryChat`, `requestMemoryQuoteGeneration`, `triggerMemoryQuoteGeneration` (fire-and-forget wrapper, logs on failure, never throws), `fetchCachedMemoryQuote` (returns `null` on 404 or when the AI service isn't configured).
- `MemoryVault` model/validation/types/presenter — added an optional `location` field (string, ≤200 chars), required only for `photo`/`video` types (enforced in the service layer, `LOCATION_REQUIRED` 400 error), on both create and update.
- `memory-vault.service.ts` — `createMemory` and `updateMemory` now call `triggerMemoryQuoteGeneration` after the audit log write, matching the async/best-effort data contract decided in Phase 2. New `getMemoryQuote(user, params)` reuses the existing `findReadableMemoryOrThrow` (owner + accepted-family-member read access) then proxies to the AI service's cache-only GET.
- `GET /api/v1/memory-vault/{memoryId}/quote` — new route/controller, same auth/permission model as the existing memory-vault routes. Returns `{ pullQuote, commentary }`, both `null` if not yet generated.
- New `src/modules/memory-chat/` module (validation, service, controller, routes, swagger), mounted at `POST /api/v1/memory-chat`:
  - Request: `{ person, question, familyMemberUserId? }` (`person`/`question` required, auth via the existing JWT middleware — no separate API key needed from the client's perspective, since the backend holds the AI-service secret).
  - Service builds `conversation_id` as `${userId}:${person.toLowerCase()}` — always keyed on the *asking* user, confirmed with the user as an explicit design decision: if two family members both ask about the same person, each gets their own separate conversation thread, they don't share history with each other. Memory retrieval, separately, queries `MemoryVaultModel` for `{ userId: <resolved>, whoseMemoryIsThis: input.person }`, where `<resolved>` defaults to the caller's own id but resolves to `familyMemberUserId` (after an `areAcceptedFamilyMembers` check, 403 if not accepted) when provided — same permission rule `memory-vault`'s `resolveReadableUserId` already uses. Maps results to the AI service's payload shape, and maps the response's snake_case `citations` to camelCase (`memoryTitle`, `citedText`) for the client.
- Swagger: `location` added to `PublicMemoryVaultItem` and the create/update request bodies; new `MemoryQuote`, `MemoryChatCitation`, `MemoryChatResponse` schemas; new path docs for the quote-fetch and memory-chat endpoints (including the `familyMemberUserId` field and its 403 response).
- Tests: `tests/memory-vault.service.test.ts` (location-required rejection, successful photo creation triggering quote generation, cached-quote fetch, null-quote-before-generation) and `tests/memory-vault.routes.test.ts` (auth-required + happy-path for the quote route) extended; new `tests/memory-chat.service.test.ts` (retrieval scoping to own vs. accepted family member's memories, 403 rejection for non-family members, conversation-id shape, citation mapping) and `tests/memory-chat.routes.test.ts` (auth, validation, happy path) added.

## Phase 4 Decisions (Locked)

Decisions for the Voice Legacy feature (talking to a cloned voice of a family member, in first person, grounded in their memories plus persona/personality). **Not yet implemented** — this is the spec to build against next. This phase was discussed and negotiated carefully because it directly reverses Phase 1's persona rule (§4) — that reversal is intentional and scoped, not an oversight; see the "Persona rule exception" row below.

| # | Question | Decision |
| --- | --- | --- |
| 1 | Consent model | **The person whose voice is used must give their own, specific, explicit consent — never inferred, never bundled with any other permission.** Rejected during discussion: (a) any family member enabling any other family member's voice without that person's consent — this is the same mechanism used in real-world voice-cloning fraud/impersonation scams, regardless of "family" framing; (b) treating acceptance of a family invite as implied consent to voice use — that consent covers viewing shared memory content, not biometric/synthetic-voice use, and conflating the two is a scope-creep of an unrelated consent action; (c) bundling voice access automatically into existing Legacy Mode activation (`legacyAccessEnabled` + trusted contact + waiting period) alongside other `accessScope` fields (`documents`, `paymentInfo`, etc.) — even though that mechanism already has real safeguards (owner opt-in with reauth, named trusted contacts, cancellable waiting period), the owner enabling it was never given a chance to specifically decide about voice. |
| 1 | Consent mechanism (final) | **Two separate, explicit toggles**, both default off, both requiring the voice-owner's own account action (mirroring `legacyAccessEnabled`'s password-reauth pattern): **Instant** — voice usable immediately/while the person is active. **Legacy-linked** — voice usable only once the existing Legacy Mode mechanism (owner opt-in + accepted trusted contact + waiting period) actually triggers for that owner. Neither toggle is implied by the other; neither is implied by any other `accessScope` field. |
| 1 | Voice sample source | **Dedicated recording**, captured specifically when a toggle is turned on — not reused from existing `voice`-type memory uploads. Two reasons: (a) stronger, unambiguous consent signal — the owner knows exactly what the recording is for, vs. a casual voice memory recorded for an unrelated purpose; (b) better clone quality — ElevenLabs cloning needs clean audio of sufficient length, which existing casual memories aren't guaranteed to have. The dedicated-recording step doubles as the kind of consent statement ElevenLabs' own Professional Voice Cloning flow already expects. |
| 1 | Revocation | Turning a toggle off does **not** delete the cloned voice model from ElevenLabs — but access is fully revoked (soft-disable): nobody can use it while the toggle is off. Avoids re-cloning cost/friction if the owner re-enables later, while still making "off" mean "unusable" from every other user's perspective. |
| 2 | Who can access | **All accepted family members** (not a per-contact scope like `TrustedContactAccessScope`) — same access-population decision as Memory Chat's family-member extension. |
| 3 | Content generation | **Both**: (a) existing memory-grounded facts (same "never invent beyond the source" rule as Phase 1/2), and (b) persona/personality-based free-form conversational responses, in first person. This is a deliberate widening beyond Phase 1/2's strict grounding-only rule — see the persona exception below. |
| 4 | Persona rule exception (vs. Phase 1 §4) | Phase 1 locked "Lineage.AI never speaks in first person as the referenced person, in any mode." Phase 4 **intentionally, narrowly reverses this** — but only under all of: (a) the referenced person gave their own explicit voice-consent (per the consent model above), and (b) the family member using it **explicitly invokes voice mode** (e.g. "talk to me in dada's voice") — the **default** interaction stays Phase 1's normal third-person Lineage.AI chat; first-person voice mode is opt-in per-conversation, not the baseline. This exception must never be read as loosening Phase 1's rule for ordinary (non-voice, non-consented) chat — that rule stands unchanged everywhere else. |
| 5 | Language scope | English only, same as Phase 1/2. |
| 6 | Voice-cloning provider | **ElevenLabs** — industry-standard voice cloning from a short clean sample, straightforward API, and its own Professional Voice Cloning flow already expects a spoken consent statement (dovetails with the dedicated-recording decision above). |
| 6 | Architecture | New module inside **`john karl-AI`** (not a separate service) — reuses the existing provider-swap pattern (mock/real) already established for the Anthropic provider. |
| 7 | Cost controls | **Deferred to implementation time** — ElevenLabs synthesis is billed per character, so rate/turn limits are needed, but the exact numbers weren't decided during scoping (same "decide when building" approach Phase 1 took for its own reliability/cost minimum). |
| 8 | Data freshness / sync | Not yet discussed — carries the same open question as Phase 1 §9 (live vs. cached retrieval); revisit during implementation. |

## Eval Suite Status: BUILT

Fulfills the "Eval/test set" requirement from both Phase 1 §8 and Phase 2. Lives in `evals/` (not `tests/` — it calls the real Anthropic API, costs real money, and is graded by an LLM judge, so it's run manually, never in CI):

```bash
python -m evals.run_evals
```

**Coverage:** 6 Memory Chat cases (grounded recall, clean decline on out-of-scope questions ×2, emotion accuracy, a false-premise/contradiction probe, and a grief-expression case) + 2 Memory Quote cases (journal and photo memory types) + 1 multi-turn conversation case (exercises the real `MemoryChatService`/`ConversationStore`, not just the provider) + 1 multi-memory citation-accuracy case (objective check, no judge needed). 10 cases total. Full detail in `evals/README.md`.

**Two real things this suite confirmed/found:**
1. **A real bug, found and fixed:** the `grief_expression` case originally failed — asked "I miss my mom so much, it's hard without her," Lineage.AI responded with language implying the referenced person is deceased ("...keeping her memory alive...") even though nothing in the source memory or the question said so. This is exactly the failure mode the Phase 1 persona decision was meant to guard against, and it only surfaced against the real model — the Mock-provider test suite could never catch it. **Fixed**: added an explicit rule to `_GROUNDING_SYSTEM_PROMPT` (`app/services/memory_chat.py`) never to assume or imply a person's life status (alive/deceased/estranged/inactive) beyond what's explicitly stated.
2. **Two previously-untested code paths confirmed working**, added after the first pass: conversation history (SQLite `ConversationStore` + windowing) correctly recalls prior turns end to end against the real API, and citations correctly attribute to the right memory when several are provided in the same request.

Current status: **10/10 passing** against `claude-sonnet-4-6`.

The LLM judge itself needed two rounds of fixes before it stopped producing false positives (supplied-context names being flagged as "invented," and ordinary second-person address to the user being conflated with a third-person-persona violation) — see `evals/README.md` → "Known limitations of the judge itself" before trusting a lone FAIL from a future run without reading the actual answer text.

## Backend Change Approval Tracker

Per `REPO_BOUNDARIES.md`, `john karl-backend` is read-only from inside `john karl-AI` until the user explicitly approves a specific change. This table is the running record of that approval — update it as items are confirmed or built, don't re-litigate an already-approved row.

**Backend integration — explicitly approved by the user** (direct question, direct answer: edit `john karl-backend` directly): AI_SERVICE_API_KEY/AI_SERVICE_URL config, the memory-chat route/controller/service, the memory-quote generation hook + fetch route, and the `location` field addition. This is a one-time, task-scoped authorization for this integration work — it does not blanket-repeal the read-only default in `REPO_BOUNDARIES.md` for unrelated future changes. **All items below under this authorization are now built** — see "Backend Integration Status: BUILT" above.

| Change | Status | Detail |
| --- | --- | --- |
| `location` field on `MemoryVault` | **Built** | Plain string; required only for `photo` and `video` types. Mapbox/geocoding is an explicit follow-up, not part of this approval. |
| AI-generated quote + commentary storage path | **Built** | Storage/regeneration path for the Lineage.AI-produced pull-quote and reflective paragraph, separate from the user's raw `narrative`. See `MEMORY_CHAT_SCOPE.md` §3 and "Phase 2 Decisions (Locked)" above — generated at save time, cached, regenerated on edit, stored in `john karl-AI`'s own DB, async from the backend's perspective. |
| Product naming: chatbot is "Lineage.AI" | **Confirmed** (naming, not a schema change) | Affects system prompt and any user-facing text; no backend schema impact by itself. |
| Search across title/narrative/tags | **Pending** — not yet confirmed by user | |
| Type filter (Photos/Videos/Notes) on list endpoint | **Pending** — not yet confirmed by user | |
| Tag filter on list endpoint | **Pending** — not yet confirmed by user | |
| File duration (for voice/video) | **Pending** — not yet confirmed by user | |
| Privacy setting per memory ("Family Only" etc.) | **Pending** — not yet confirmed by user | |
| Contributors (multi-person co-authorship) on a memory | **Pending** — not yet confirmed by user | Current model has a single `userId` owner; family members can only read. |
| AI grounding score/label ("High Grounding") storage | **Pending** — not yet confirmed by user | |
| Face embeddings storage for identity recognition (Phase 3, §5b) | **Not started** — explicitly deferred, no work to begin | User has confirmed this is future scope only; do not start any implementation until they say otherwise. |

Do not start build work on a "Pending" row without the user confirming it the same way the "Approved" rows were confirmed.

## 1. Backend ↔ AI data contract — DECIDED

`john karl-AI` and `john karl-backend` are currently disconnected — no HTTP client, env var, or module in either repo calls the other. Resolved:

- **Caller**: `john karl-backend` calls `john karl-AI`. The backend already owns memory data and access control (family-membership checks), so it gathers the relevant memories and calls the AI service — the AI service never queries the backend itself.
- **Auth**: reuse `john karl-AI`'s existing `INTERNAL_API_KEY` mechanism (`X-API-Key` header, `secrets.compare_digest` comparison — already built, per the AI service's own `docs/ARCHITECTURE.md`). Backend needs a matching env var (e.g. `AI_SERVICE_API_KEY`) and must send it on every call. Server-to-server only, over HTTPS/internal network — never sent to a browser/mobile client.
- **Request shape**:
  ```json
  {
    "person": "Margaret",
    "question": "Mom-এর birthday-তে কী হয়েছিল?",
    "memories": [
      { "type": "journal", "title": "...", "narrative": "...", "date": "2026-07-15", "tags": ["Family", "Birthday"] }
    ],
    "conversation_history": []
  }
  ```
  `memories` is populated per §2 below; `conversation_history` per §3.

This is a backend-affecting decision, already approved in scope (see Phase 1 Decisions table above). Adding the `AI_SERVICE_API_KEY` env var and the outbound call itself is expected implementation work for this contract, not a new schema change requiring separate sign-off — but any *additional* backend endpoint/field beyond what's already approved still needs its own approval per `REPO_BOUNDARIES.md`.

## 2. Retrieval strategy — DECIDED for Phase 1

A user may eventually have hundreds of memories, at which point none of them can be dumped into every prompt (cost and context-window limits) — but that's not Phase 1's problem. For now:

- **No relevance filtering.** Backend queries all memories matching `whoseMemoryIsThis == <person>` and sends the full set for that person.
- Disambiguation when `whoseMemoryIsThis` string matches collide (two family members with the same display name) is a known, accepted limitation for Phase 1 — see `MEMORY_CHAT_SCOPE.md` §6. Not solved now.
- **Revisit when memory counts get large**: tag filtering, recency weighting, keyword/semantic search, or a vector index — deferred until real usage shows it's needed, not built preemptively.

## 3. Conversation state — DECIDED

Multi-turn chat history is stored in **`john karl-AI`'s own database** (not the backend). To keep per-request cost and context size bounded without taking on the beta Compaction API's requirement to always resend full history with compaction blocks intact:

- Each request to Claude includes the **last 15–20 turns verbatim**, plus
- A **rolling summary of everything older**, refreshed periodically (e.g. every 20–30 turns) via a small separate Claude call that summarizes the conversation so far.

This is a manual, from-scratch implementation — no beta dependency, works with any model version.

## 4. Persona and ethical boundary — DECIDED

**Lineage.AI speaks in third person only** — about the referenced person ("Margaret's birthday was..."), never as them, in any mode including Legacy Mode. Role-play/first-person impersonation of a real (possibly deceased or inactive) family member is ruled out entirely, removing the consent/opt-in question that would otherwise apply.

**Emotion handling, decided alongside this:**

- Only attribute a feeling to someone if it's explicitly present in the source `narrative` — never infer or invent emotional content beyond what's written (this is also enforced by the grounding rules in §8).
- If the *user* expresses grief, nostalgia, or distress in the chat itself, Lineage.AI should acknowledge it warmly and briefly — without giving advice, without acting as a therapist — and then return to the memory content being discussed.
- Never respond in a way that could be read as Lineage.AI speaking as the deceased/inactive person, even indirectly.

## 5. Multimodal understanding (future — "Phase 3", not started)

Photo/video/voice content itself (not just their metadata) is out of the current basic scope by agreement. **Explicitly not being worked on now** — this section documents the shape of the work for when it is picked up, it is not an active task.

When it is picked up, it splits into two halves with very different difficulty:

### 5a. Scene understanding — background, behavior, expression (low complexity)

Given a photo (or an extracted video frame), Claude's ordinary vision capability can describe:

- **Background/setting** — where the scene appears to be (lake, kitchen, park, indoors vs outdoors)
- **Behavior/activity** — what the people in the frame are doing (walking, cutting a cake, laughing, cooking)
- **Expression/emotion** — visible emotional tone on people's faces (happy, surprised, sad)

This needs no new infrastructure — just sending the image as a vision content block to Claude with an appropriate prompt. No embeddings, no reference photos, no specialized model.

### 5b. Identity — "who is in this photo" (high complexity, separate system required)

This is **not** something Claude's vision capability does. Claude is a general vision-language model, not a biometric face-recognition/matching engine, and Anthropic's usage policies treat facial recognition/biometric identification as a sensitive category requiring deliberate handling — not something to enable implicitly.

Reliable identity detection needs a **separate face-recognition system**, built and approved independently of the AI chat feature:

- A face detection + recognition component outside Claude (e.g. AWS Rekognition, Azure Face API, or an open-source library such as `face_recognition`/dlib or a FaceNet-style embedding model).
- A reference photo per family member, used to compute a face embedding (a numeric vector) for that person.
- For each new memory photo (or video frame), detect faces and compare their embeddings against the stored reference embeddings to find matches above a similarity threshold.
- New storage: face embeddings per family member — this is biometric data, needs its own retention/encryption/consent handling, and is a distinct legal category (e.g. GDPR special-category data) from the rest of the app's data. Explicit per-person consent is needed before building a face profile from their photos.
- Claude's role in this half is narrow: given the identities the recognition system already resolved (e.g. "Margaret, Robert"), plus the narrative/context fields, produce the natural-language description for chat. Claude does not do the matching itself.

### Video adds a prerequisite step

The Claude API has no native "video" content type — vision input is images (and PDFs) only. Before either 5a or 5b can run on a video memory, the video must be **decomposed into frames** server-side (a separate extraction pipeline, not part of the AI service), and each sampled frame processed as an image.

### Summary table

| Aspect | How it's done | Complexity |
| --- | --- | --- |
| Background | Claude vision, direct | Low — no new infra |
| Behavior | Claude vision, direct | Low — no new infra |
| Expression | Claude vision, direct | Low — no new infra |
| Identity (who) | Separate face-recognition system | High — new backend, storage, consent flow |
| Video input | Frame-extraction pipeline (prerequisite for all of the above on video) | Medium — needed before 5a/5b apply to video |

## 6. Language support — DECIDED for Phase 1 (English only)

Users write in mixed Bangla/English ("Banglish"), as seen throughout this project's own product discussions — but **Phase 1 targets English only**. Bangla/mixed-language handling is explicitly deferred: not tested, not guaranteed to work well, and must be revisited (system prompt design, possibly model choice) before any wider rollout to Bangla-speaking users.

## 7. Reliability and cost controls — DECIDED minimum for Phase 1

`john karl-AI`'s own `docs/ARCHITECTURE.md` already lists these as undefined before real workloads: provider rate/concurrency limits, per-tenant authentication and quotas, shared rate limiting across replicas, retry/circuit-breaker behavior, streaming responses, and metrics/tracing/token-cost accounting.

**For Phase 1, ship with what already exists** — the mock/Anthropic provider swap, `INTERNAL_API_KEY`, and request timeouts already built into `john karl-AI` — and treat everything above as explicitly deferred until real user traffic exists. Do not build quotas/shared rate limiting/cost dashboards preemptively for Phase 1.

## 8. Grounding and hallucination risk — DECIDED technique

This feature answers questions about real people's real personal/family history. A model inventing a detail that never happened in the source narrative is not a cosmetic bug here — it can be genuinely upsetting to a grieving or vulnerable user. **Four layers, used together, from the start:**

1. **System-prompt instruction**: explicitly tell the model to only state facts present in the provided memories, and to say plainly that it doesn't know rather than infer or guess.
2. **Structural separation**: keep memory data and the user's question in clearly delimited sections of the prompt (e.g. `<memories>...</memories>` / `<question>...</question>`) so the model can distinguish "ground truth" from "thing to answer."
3. **Citations feature**: send each memory's `narrative` as a `document` content block with `citations: {enabled: true}`. The response then carries citation references tying each claim back to a specific span of a specific memory — this is mechanically checkable, not just a prompt instruction the model might ignore.
4. **Second-pass verification**: before returning an answer, run a smaller/cheaper follow-up check — "does this answer only contain information present in the following memories? flag anything that isn't" — and strip or correct unsupported claims it finds.

Also required: an evaluation set (sample memories + questions + expected grounded answers, **including questions with no answer in the memories**, to verify the "I don't know" path) before Phase 1 is considered done — per the existing `TASKS.md` line "Add evaluation datasets and quality regression tests."

## 9. Data freshness

When a memory is edited or deleted in the backend, there is currently no defined mechanism for the AI side's understanding of that memory to be invalidated or refreshed. Decide whether retrieval is always-live (reads current backend state per request) or cached (and if cached, how it's invalidated).

## Priority order

**Update: §1, §2, §3, §4, §6, §7, and §8 are all decided (see Phase 1 Decisions table at the top) — Phase 1 implementation is unblocked.** What's left open:

1. **§9 Data freshness** — not yet decided. When a memory is edited/deleted in the backend, is the AI side's view always-live (reads current backend state per request) or cached? Since Phase 1's retrieval strategy (§2) already re-queries all of a person's memories per request rather than caching them, this is likely a non-issue for Phase 1 by construction — but confirm that assumption explicitly before considering data freshness closed.
2. **§5 Multimodal (Phase 3)** — explicitly deferred, not started, no action needed now.

Everything else in this document is now a build spec, not an open question.
