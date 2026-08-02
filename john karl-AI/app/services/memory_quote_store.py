import asyncio
import sqlite3
from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class StoredQuote:
    pull_quote: str
    commentary: str


class MemoryQuoteStore:
    """Persists the generated pull-quote + commentary per memory.

    Owned by `john karl-AI` (per the Phase 2 "storage location" decision in
    PRODUCTION_READINESS.md), keyed by the backend-supplied `memory_id`. This
    is what makes generation "once, at save time, cached" rather than
    regenerated on every detail-screen view: the backend calls the
    generation endpoint on save/edit, and the (cheap, no-model-call) fetch
    endpoint everywhere else.
    """

    def __init__(self, db_path: str) -> None:
        self._db_path = db_path
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
                CREATE TABLE IF NOT EXISTS memory_quotes (
                    memory_id TEXT PRIMARY KEY,
                    pull_quote TEXT NOT NULL,
                    commentary TEXT NOT NULL
                )
                """
            )
            conn.commit()
        finally:
            conn.close()

    async def get(self, memory_id: str) -> StoredQuote | None:
        return await asyncio.to_thread(self._get_sync, memory_id)

    def _get_sync(self, memory_id: str) -> StoredQuote | None:
        conn = self._connect()
        try:
            row = conn.execute(
                "SELECT pull_quote, commentary FROM memory_quotes WHERE memory_id = ?",
                (memory_id,),
            ).fetchone()
        finally:
            conn.close()
        if row is None:
            return None
        return StoredQuote(pull_quote=row[0], commentary=row[1])

    async def save(self, memory_id: str, quote: StoredQuote) -> None:
        await asyncio.to_thread(self._save_sync, memory_id, quote)

    def _save_sync(self, memory_id: str, quote: StoredQuote) -> None:
        conn = self._connect()
        try:
            conn.execute(
                """
                INSERT INTO memory_quotes (memory_id, pull_quote, commentary)
                VALUES (?, ?, ?)
                ON CONFLICT(memory_id) DO UPDATE SET
                    pull_quote = excluded.pull_quote,
                    commentary = excluded.commentary
                """,
                (memory_id, quote.pull_quote, quote.commentary),
            )
            conn.commit()
        finally:
            conn.close()
