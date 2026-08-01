from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class ProviderRequest:
    prompt: str
    system_prompt: str | None
    temperature: float
    max_tokens: int


@dataclass(frozen=True, slots=True)
class ProviderResult:
    output: str
    model: str
    input_tokens: int | None = None
    output_tokens: int | None = None


class AIProvider(ABC):
    name: str

    @abstractmethod
    async def generate(self, request: ProviderRequest) -> ProviderResult:
        raise NotImplementedError

    @abstractmethod
    async def healthcheck(self) -> bool:
        raise NotImplementedError

    async def close(self) -> None:
        return None
