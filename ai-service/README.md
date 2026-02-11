# AI Microservice

## Structure & Responsibilities

| Directory | Responsibility |
|-----------|----------------|
| **chains/** | LangChain orchestration; connects prompts, LLM, tools |
| **prompts/** | Text templates only; no business logic |
| **memory/** | Session/conversation state (in-memory; production: Redis) |
| **services/** | Appointment logic: availability, validation, booking |
| **schemas/** | Pydantic request/response models |
| **utils/** | Logging, helpers |

## Appointment Flow

1. **Detect intent** – LLM classifies: greet, book, cancel, other
2. **Collect details** – Prompt guides collection of date, time, service
3. **Validate** – `services/appointment` validates date/time
4. **Availability** – `check_availability()` returns free slots
5. **Create** – `create_appointment()` persists (in-memory for demo)
6. **Confirm** – LLM sends confirmation message

## LangChain Usage

- **Prompts**: System prompt defines persona; no slot logic in text
- **Memory**: Session store tracks draft; Redis in production
- **Tools**: Appointment service called from chain (stub in eval mode)

## Env Vars

```
OPENAI_API_KEY=       # Required for real LLM; omit for stub mode
OPENAI_MODEL=gpt-4o-mini
JWT_SECRET=           # Must match backend
```
