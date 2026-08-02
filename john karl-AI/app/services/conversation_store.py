import asyncio
import sqlite3
from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class NewTurn:
    """A turn to append -- its `turn_index` is assigned by the store."""

    role: str
    content: str


@dataclass(frozen=True, slots=True)
class StoredTurn:
    turn_index: int
    role: str
    content: str


@dataclass(frozen=True, slots=True)
class ConversationContext:
    summary: str | None
    turns: tuple[StoredTurn, ...]


class ConversationStore:
    """SQLite-backed conversation history for Memory Chat.

    Owns the full turn history per `conversation_id` in this service's own
    database (per the Phase 1 decision — conversation state lives in
    `john karl-AI`, not the backend). Callers only ever see a bounded window
    of recent turns plus a rolling summary of everything older, so a single
    conversation can grow indefinitely without growing the per-request
    prompt without bound.
    """

    def __init__(self, db_path: str, *, window_turns: int, summary_trigger_turns: int) -> None:
        self._db_path = db_path
        self._window_turns = window_turns
        self._summary_trigger_turns = summary_trigger_turns
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self._db_path)
        conn.execute("PRAGMA journal_mode=WAL;")
        return conn

    def _init_db(self) -> None:
        conn = self._connect()
        try:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS conversation_turns (
                    conversation_id TEXT NOT NULL,
                    turn_index INTEGER NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    PRIMARY KEY (conversation_id, turn_index)
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS conversation_summaries (
                    conversation_id TEXT PRIMARY KEY,
                    summary TEXT NOT NULL,
                    summarized_through_turn INTEGER NOT NULL
                )
                """
            )
            conn.commit()
        finally:
            conn.close()

    async def get_context(self, conversation_id: str) -> ConversationContext:
        return await asyncio.to_thread(self._get_context_sync, conversation_id)

    def _get_context_sync(self, conversation_id: str) -> ConversationContext:
        conn = self._connect()
        try:
            rows = conn.execute(
                "SELECT turn_index, role, content FROM conversation_turns "
                "WHERE conversation_id = ? ORDER BY turn_index DESC LIMIT ?",
                (conversation_id, self._window_turns),
            ).fetchall()
            summary_row = conn.execute(
                "SELECT summary FROM conversation_summaries WHERE conversation_id = ?",
                (conversation_id,),
            ).fetchone()
        finally:
            conn.close()

        turns = tuple(
            StoredTurn(turn_index=turn_index, role=role, content=content)
            for turn_index, role, content in reversed(rows)
        )
        return ConversationContext(summary=summary_row[0] if summary_row else None, turns=turns)

    async def append_turns(self, conversation_id: str, turns: list[NewTurn]) -> None:
        await asyncio.to_thread(self._append_turns_sync, conversation_id, turns)

    def _append_turns_sync(self, conversation_id: str, turns: list[NewTurn]) -> None:
        conn = self._connect()
        try:
            next_index_row = conn.execute(
                "SELECT COALESCE(MAX(turn_index), -1) + 1 FROM conversation_turns "
                "WHERE conversation_id = ?",
                (conversation_id,),
            ).fetchone()
            next_index = next_index_row[0]
            conn.executemany(
                "INSERT INTO conversation_turns (conversation_id, turn_index, role, content) "
                "VALUES (?, ?, ?, ?)",
                [
                    (conversation_id, next_index + offset, turn.role, turn.content)
                    for offset, turn in enumerate(turns)
                ],
            )
            conn.commit()
        finally:
            conn.close()

    async def get_turns_before_window(self, conversation_id: str) -> tuple[StoredTurn, ...]:
        """Turns older than the current window and not yet folded into the summary.

        Only returns a non-empty batch once enough unsummarized turns have
        accumulated (`summary_trigger_turns`), so summarization happens
        periodically rather than on every single request.
        """
        return await asyncio.to_thread(self._get_turns_before_window_sync, conversation_id)

    def _get_turns_before_window_sync(self, conversation_id: str) -> tuple[StoredTurn, ...]:
        conn = self._connect()
        try:
            summary_row = conn.execute(
                "SELECT summarized_through_turn FROM conversation_summaries "
                "WHERE conversation_id = ?",
                (conversation_id,),
            ).fetchone()
            summarized_through = summary_row[0] if summary_row else -1

            total_row = conn.execute(
                "SELECT COALESCE(MAX(turn_index), -1) FROM conversation_turns "
                "WHERE conversation_id = ?",
                (conversation_id,),
            ).fetchone()
            total_turns = total_row[0] + 1
            window_boundary = total_turns - self._window_turns

            if window_boundary <= summarized_through + 1:
                return ()

            pending_count = window_boundary - (summarized_through + 1)
            if pending_count < self._summary_trigger_turns:
                return ()

            rows = conn.execute(
                "SELECT turn_index, role, content FROM conversation_turns "
                "WHERE conversation_id = ? AND turn_index > ? AND turn_index < ? "
                "ORDER BY turn_index ASC",
                (conversation_id, summarized_through, window_boundary),
            ).fetchall()
        finally:
            conn.close()

        return tuple(
            StoredTurn(turn_index=turn_index, role=role, content=content)
            for turn_index, role, content in rows
        )

    async def save_summary(
        self, conversation_id: str, summary: str, summarized_through_turn: int
    ) -> None:
        await asyncio.to_thread(
            self._save_summary_sync, conversation_id, summary, summarized_through_turn
        )

    def _save_summary_sync(
        self, conversation_id: str, summary: str, summarized_through_turn: int
    ) -> None:
        conn = self._connect()
        try:
            conn.execute(
                """
                INSERT INTO conversation_summaries
                    (conversation_id, summary, summarized_through_turn)
                VALUES (?, ?, ?)
                ON CONFLICT(conversation_id) DO UPDATE SET
                    summary = excluded.summary,
                    summarized_through_turn = excluded.summarized_through_turn
                """,
                (conversation_id, summary, summarized_through_turn),
            )
            conn.commit()
        finally:
            conn.close()
