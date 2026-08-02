from app.schemas.memory import MemoryItem


def render_memory_text(memory: MemoryItem) -> str:
    """Render one memory as plain text for use as model input (as a Memory
    Chat document, or as the source material for quote generation)."""
    tag_text = ", ".join(memory.tags) if memory.tags else "none"
    location_line = f"Location: {memory.location}\n" if memory.location else ""
    return (
        f"Title: {memory.title}\n"
        f"Date: {memory.date}\n"
        f"{location_line}"
        f"Tags: {tag_text}\n"
        f"Narrative: {memory.narrative}"
    )
