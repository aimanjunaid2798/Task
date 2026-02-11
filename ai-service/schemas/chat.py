"""Pydantic schemas for chat API - request/response shapes."""

from typing import Any

from pydantic import BaseModel, Field


class Message(BaseModel):
    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str


class ChatRequest(BaseModel):
    messages: list[Message]
    session_id: str


class ChatResponse(BaseModel):
    reply: str
    appointment_state: dict[str, Any] | None = None
    appointment_booked: bool = False
