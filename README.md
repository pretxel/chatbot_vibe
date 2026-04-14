# Vibe Streamer

A full-stack streaming chat app built with **Next.js 16** (frontend) and **FastAPI** (backend), with pluggable LLM providers and real-time SSE streaming. Ships Tailwind v4 and supports Google Gemini, Anthropic Claude, and a mock provider out of the box.

## Architecture

```
Browser
  │  POST /api/chat  (SSE — text/event-stream)
  ▼
FastAPI backend
  ├── mock provider     (no API key required)
  ├── gemini provider   (Google AI Studio)
  └── claude provider   (Anthropic)
       │  streaming response
       ▼
  LLM API
```

The frontend connects **directly** to the FastAPI backend via SSE — there is no Next.js API proxy.

## Tech Stack


| Layer         | Technology                                                          |
| ------------- | ------------------------------------------------------------------- |
| Frontend      | Next.js 16, React 19, TypeScript                                    |
| UI            | Tailwind CSS v4, Radix UI                                           |
| Backend       | FastAPI, Python 3.11+, uvicorn                                      |
| Streaming     | Server-Sent Events (SSE)                                            |
| LLM providers | Google Gemini 2.5 Flash, Anthropic Claude (claude-sonnet-4-6), Mock |
| Infra         | Docker Compose                                                      |


## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (recommended)
- Or locally: Node.js 22+, pnpm 10+, Python 3.11+
- An API key for your chosen LLM provider (not needed for `mock`)

## Quick Start (Docker)

```bash
# 1. Clone
git clone <repo-url>
cd vibe_streamer

# 2. Configure
cp .env.example .env
# Edit .env and set your API key + LLM_PROVIDER

# 3. Run
docker compose up --build

# App → http://localhost:3000
# API  → http://localhost:8000
```

## Environment Variables


| Variable            | Required    | Default                 | Description                                    |
| ------------------- | ----------- | ----------------------- | ---------------------------------------------- |
| `LLM_PROVIDER`      | No          | `gemini`                | Provider to use: `mock`, `gemini`, or `claude` |
| `GOOGLE_API_KEY`    | If `gemini` | —                       | Google AI Studio API key                       |
| `ANTHROPIC_API_KEY` | If `claude` | —                       | Anthropic API key                              |
| `ANTHROPIC_MODEL`   | No          | `claude-sonnet-4-6`     | Override the Anthropic model                   |
| `ALLOWED_ORIGINS`   | No          | `http://localhost:3000` | Comma-separated CORS origins                   |


## Local Development (without Docker)

**Backend**

```bash
cd backend
pip install -r requirements.txt
export LLM_PROVIDER=mock   # or gemini / claude
uvicorn app.main:app --reload --port 8000
```

**Frontend**

```bash
cd frontend
pnpm install
pnpm dev
```

## Running Tests

**Backend**

```bash
cd backend
pip install -r requirements.txt
python -m pytest tests/ -v
```

**Frontend**

```bash
cd frontend
pnpm install
pnpm test
```

## Demo

[screen-capture.webm](https://github.com/user-attachments/assets/0b31acef-b348-4653-83aa-097c2c2c66b7)