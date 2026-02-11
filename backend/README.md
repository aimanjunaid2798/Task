# Backend API

## Structure & Responsibilities

| Directory | Responsibility |
|-----------|----------------|
| **routes/** | Route definitions; validation setup; delegates to controllers |
| **controllers/** | Thin HTTP layer; parses request, calls service, sends response |
| **services/** | Business logic; no HTTP; reusable across controllers |
| **middlewares/** | Composable pipeline: auth, rate limit, logging, error handling |
| **utils/** | Shared helpers: logger, db pool, error classes |
| **config/** | Env-based configuration; single source of truth |

## Security

- **JWT auth**: Long-lived access token for login; short-lived chatbot token (1h) for AI calls
- **Rate limiting**: Per-IP limits to prevent abuse
- **Validation**: express-validator on all inputs
- **Error handling**: No stack traces in production responses

## Endpoints

- `POST /api/auth/register` - Sign up
- `POST /api/auth/login` - Sign in
- `POST /api/chatbot/token` - Get chatbot token (requires auth)
- `POST /api/chatbot/chat` - Send chat message (proxies to AI service, requires auth)

## Env Vars

```
DATABASE_URL=
JWT_SECRET=
JWT_EXPIRES_IN=7d
CHATBOT_TOKEN_EXPIRES_IN=1h
AI_SERVICE_URL=http://localhost:8000
PORT=3001
```
