# Frontend

## Structure and Responsibilities

| Directory | Responsibility |
|-----------|----------------|
| **app/** | Next.js App Router pages and layout |
| **components/** | Presentational UI; receive props, emit events; no API calls |
| **hooks/** | State and side effects; call services |
| **services/** | API communication; no React |
| **lib/** | Auth helpers (token storage), API client base |
| **types/** | Shared TypeScript types |

## Architecture Rules

- **UI components** never call APIs directly; they receive handlers via props
- **API logic** lives in services; hooks orchestrate and expose state
- **Auth/session** logic in lib (getToken, setToken, clearToken)
- **Chat state** managed by useChat hook; could be lifted to Context if needed across trees

## Env Vars

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Chat is proxied through the backend; no direct AI service URL needed.
