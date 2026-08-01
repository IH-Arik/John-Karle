from app.providers.base import AIProvider, ProviderRequest, ProviderResult


class MockAIProvider(AIProvider):
    name = "mock"

    def __init__(self, model: str) -> None:
        self._model = model

    async def generate(self, request: ProviderRequest) -> ProviderResult:
        normalized_prompt = " ".join(request.prompt.split())
        output = f"Mock response: {normalized_prompt}"[: request.max_tokens * 4]
        return ProviderResult(
            output=output,
            model=self._model,
            input_tokens=max(1, len(request.prompt) // 4),
            output_tokens=max(1, len(output) // 4),
        )

    async def healthcheck(self) -> bool:
        return True
