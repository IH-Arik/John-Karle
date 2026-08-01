.PHONY: install dev run lint format typecheck test check

install:
	python -m pip install -e ".[dev]"

dev:
	python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

run:
	python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

lint:
	python -m ruff check .

format:
	python -m ruff format .

typecheck:
	python -m mypy app tests

test:
	python -m pytest

check: lint typecheck test
