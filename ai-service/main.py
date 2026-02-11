"""
AI Microservice entry point.
FastAPI app with chat endpoint; JWT validation; orchestrates LangChain.
"""
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt, JWTError

from chains.chat import get_chat_chain
from db import close_pool
from schemas.chat import ChatRequest, ChatResponse

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-in-production")


async def get_user(authorization: str | None = Header(None)) -> dict:
    """Validate JWT and return payload. Composable dependency."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization")
    token = authorization[7:]
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await close_pool()


app = FastAPI(title="Appointment Chatbot AI", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest, user: dict = Depends(get_user)):
    """Main chat endpoint. Requires Authorization: Bearer <chatbot_token>."""
    try:
        messages = [{"role": m.role, "content": m.content} for m in body.messages]
        user_id = user.get("sub", "default")

        chain = get_chat_chain()
        result = await chain.ainvoke({
            "messages": messages,
            "session_id": body.session_id,
            "user_id": user_id,
        })
        return ChatResponse(
            reply=result["reply"],
            appointment_state=result.get("appointment_state"),
            appointment_booked=result.get("appointment_booked", False),
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok"}
