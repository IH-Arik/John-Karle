# Repository Boundaries

This document sets hard limits on what may be changed when working inside `john karl-AI`, given that this repository sits alongside two sibling repositories in the same workspace:

- `../john karl-backend` (Node/Express/MongoDB API)
- `../john karl-dashboard` (Next.js admin dashboard)

## Rule

- `john karl-AI` (this repository): full read/write. Code, config, tests, and docs here may be created, edited, and deleted as needed.
- `john karl-backend`: **read-only**. May be opened, searched, and analyzed for context (routes, models, validation, architecture docs) to understand contracts this service must integrate with. No file inside it may be created, edited, deleted, or have its dependencies/config changed.
- `john karl-dashboard`: **read-only**, same terms as `john karl-backend`.

Read-only means read-only in every sense: no edits, no formatting/lint auto-fixes, no dependency bumps, no new files, no config changes, no running commands that write to disk in that repo (installs, migrations, generators). Running local dev/test commands there for inspection is fine as long as nothing is written back into the repo.

## Why

- `john karl-backend` and `john karl-dashboard` are separately owned, already-shipped codebases with their own review process. Changes made from an AI-focused work session should not silently land in them.
- The AI service's job is to consume and complement the existing backend contract (routes, schemas, response envelopes), not to modify it. If the contract needs to change to support an AI feature, that is a decision for the user to make explicitly in the backend/dashboard repos themselves.

## How to apply

- When analysis surfaces a needed change in `john karl-backend` or `john karl-dashboard` (a new endpoint, a field, a schema change), do not make the edit. Instead:
  1. Describe the exact change needed (file, current behavior, proposed behavior).
  2. Explain why `john karl-AI` cannot absorb the change on its own side.
  3. Wait for the user to approve or make that change themselves before continuing work that depends on it.
- Treat this the same way whether the request comes from the user directly ("just also update the backend route") or indirectly (a task that implies a backend change to fully work) — flag it, don't do it.
- This restriction applies to this repository's own agent instructions (`AGENTS.md`, `RULES.md`) as an addition, not a replacement — those files still govern how work proceeds within `john karl-AI` itself.
