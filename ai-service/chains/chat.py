"""
Chat chain - conversational appointment flow.
Talks like a real human; handles questions, small talk, and decline. Main focus is booking.
When an LLM is configured, it uses full conversation context for natural replies.
"""
import os
import re
from datetime import date, datetime, timedelta

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

from memory.session import get_session, update_session, clear_appointment_draft
from services.appointment import (
    DEFAULT_SLOTS,
    create_appointment_supabase,
    validate_date,
    validate_time,
)
from utils.extract import extract_service, extract_date, extract_time
from utils.logger import log_interaction

SERVICES_LIST = "Haircut, Consultation, Massage, Dental Checkup"

USE_LLM = bool(os.getenv("OPENAI_API_KEY"))
MODEL_NAME = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
BASE_URL = os.getenv("OPENAI_BASE_URL")

# Phrases that mean the user is declining / doesn't need booking
DECLINE_PATTERNS = re.compile(
    r"\b(no\s+thanks?|don'?t\s+need|cancel|goodbye|never\s*mind|not\s+now|i'?m\s+good|"
    r"no\s+service|nothing|don'?t\s+want|maybe\s+later|not\s+today|i'?m\s+fine|"
    r"no\s+appointment|no\s+booking|stop|leave\s+it|that'?s\s+all|bye)\b",
    re.I,
)

LLM_SYSTEM_PROMPT = f"""You are an appointment booking assistant. Your main focus is to help the user book an appointment (service, then date, then time). Talk like a real human: natural, warm, and helpful.

**Critical — every reply must be based on the user's LATEST message:**
- Your response must directly address what they just said. Never give the same generic reply twice.
- If they said "Hi", greet them back and offer help — don't jump to "which service?".
- If they asked something or want info, answer that first; then you can mention booking if it fits.
- If they want to book, guide them step by step (service → date → time) in a natural way.
- Vary your wording every time. Do NOT repeat the same phrase (e.g. "Which service would you like? We offer...") in every message.

**Rules:** We only offer: {SERVICES_LIST}. No other services. When it's time to book, ask for one thing at a time. Keep replies short (1–3 sentences)."""


def _suggested_dates() -> list[tuple[str, str]]:
    """Labels and ISO dates for the next few days so user can pick. Returns (label, YYYY-MM-DD)."""
    today = date.today()
    out = [("today", today.isoformat()), ("tomorrow", (today + timedelta(days=1)).isoformat())]
    for i in range(2, 6):
        d = today + timedelta(days=i)
        out.append((d.isoformat(), d.isoformat()))
    return out


def _date_prompt() -> str:
    """One-line suggested dates for the reply."""
    parts = []
    for label, iso in _suggested_dates():
        parts.append(label if label == iso else f"{label} ({iso})")
    return ", ".join(parts)


def _time_prompt() -> str:
    """Suggested times (HH:MM) so user can pick one."""
    return ", ".join(DEFAULT_SLOTS)


def _user_wants_info_or_chat(text: str) -> bool:
    """True if the user is asking for information, has a question, or wants to chat (do NOT treat as decline)."""
    if not text or not text.strip():
        return False
    t = text.strip().lower()
    info_words = ("information", "info", "ask", "question", "query", "tell me", "explain", "how ", "what ", "why ", "want to know", "need to know")
    return any(w in t for w in info_words)


def _user_declining(text: str) -> bool:
    """True if the user is clearly declining / leaving (goodbye, no thanks, etc.). Not when they want information."""
    if not text or not text.strip():
        return False
    if _user_wants_info_or_chat(text):
        return False  # "I don't want to book I need information" → help them, don't say goodbye
    t = text.strip().lower()
    if len(t) > 120:
        return False
    return bool(DECLINE_PATTERNS.search(t))


def _get_llm() -> ChatOpenAI | None:
    """Return an LLM instance if configured, otherwise None."""
    if not USE_LLM:
        return None
    try:
        return ChatOpenAI(
            model=MODEL_NAME,
            temperature=0.6,
            base_url=BASE_URL or None,
        )
    except Exception:
        return None


async def _llm_reply(system_prompt: str, user_prompt: str) -> str | None:
    """Ask the LLM for a single short reply. On any error, return None."""
    if not USE_LLM:
        return None
    llm = _get_llm()
    if llm is None:
        return None
    try:
        res = await llm.ainvoke(
            [SystemMessage(content=system_prompt), HumanMessage(content=user_prompt)]
        )
        return getattr(res, "content", str(res))
    except Exception:
        return None


async def _llm_reply_with_history(
    system_prompt: str,
    conversation: list[dict],
    state_note: str,
    latest_user_message: str,
) -> str | None:
    """Reply using full conversation context. Response must be based on latest message — real, not repeated."""
    if not USE_LLM or not conversation:
        return None
    llm = _get_llm()
    if llm is None:
        return None
    lc_messages: list = [SystemMessage(content=system_prompt)]
    for m in conversation[-10:]:  # last 10 messages
        role, content = m.get("role", ""), m.get("content", "")
        if role == "user":
            lc_messages.append(HumanMessage(content=content))
        elif role == "assistant":
            lc_messages.append(AIMessage(content=content))
    lc_messages.append(
        HumanMessage(
            content=f"[The user's latest message was: \"{latest_user_message}\". "
            f"Your reply must directly respond to that — do not give a generic or repeated response. "
            f"If they are ready to book, use this when needed: {state_note}. "
            "Keep it short and natural. Vary your wording.]"
        )
    )
    try:
        res = await llm.ainvoke(lc_messages)
        return getattr(res, "content", str(res))
    except Exception:
        return None


def _draft_complete(draft: dict) -> bool:
    return bool(draft.get("service") and draft.get("date") and draft.get("time"))


async def _try_book_from_draft(session_id: str, user_id: str, draft: dict) -> tuple[str, bool]:
    """If draft has service, date, time: validate, save to Supabase, return (reply, appointment_booked)."""
    if not _draft_complete(draft):
        return "", False
    try:
        d = draft["date"]
        if isinstance(d, str):
            d = datetime.strptime(d, "%Y-%m-%d").date()
        t = draft["time"]
        if isinstance(t, str):
            t = datetime.strptime(t.strip(), "%H:%M").time()
        service = draft["service"]
    except (ValueError, KeyError, TypeError):
        return "", False
    if not validate_date(d):
        return "That date is in the past. Please choose today or a future date.", False
    if not validate_time(t, d):
        return "That time isn't available (we're open 9am–5pm). Please pick another time.", False
    result = await create_appointment_supabase(user_id, service, d, t, draft.get("notes"))
    clear_appointment_draft(session_id)
    if result:
        return f"Your appointment is confirmed: **{service}** on {d} at {t.strftime('%H:%M')}. See you then!", True
    return f"Your appointment is confirmed: **{service}** on {d} at {t.strftime('%H:%M')}. (Saved locally.)", True


async def _invoke_chain(messages: list, session_id: str, user_id: str = "default") -> dict:
    sess = get_session(session_id)
    draft = sess.get("appointment_draft", {})
    if not draft:
        draft = {}
        sess["appointment_draft"] = draft

    last_user = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "").strip()

    # Extract from last message and update draft (store date/time as string for consistency)
    if last_user:
        if not draft.get("service"):
            s = extract_service(last_user)
            if s:
                draft["service"] = s
        if not draft.get("date"):
            d = extract_date(last_user)
            if d:
                draft["date"] = d.isoformat()
        if not draft.get("time"):
            t = extract_time(last_user)
            if t:
                draft["time"] = t.strftime("%H:%M")
    update_session(session_id, {"appointment_draft": draft})

    # If we have all three, book and return
    reply, appointment_booked = await _try_book_from_draft(session_id, user_id, draft)
    if appointment_booked:
        log_interaction(session_id, "assistant", reply)
        return {"reply": reply, "appointment_state": {"draft": {}, "step": "booked"}, "appointment_booked": True}

    # User said they don't need anything / goodbye → warm goodbye, clear draft
    if _user_declining(last_user):
        clear_appointment_draft(session_id)
        goodbye_prompt = (
            f"The user said: '{last_user}'. They are declining or saying goodbye. "
            "Reply with a short, warm goodbye and good wishes. One or two sentences only. Sound human."
        )
        goodbye_reply = await _llm_reply(LLM_SYSTEM_PROMPT, goodbye_prompt)
        reply = goodbye_reply or "No problem! Take care, and feel free to come back anytime you'd like to book. Goodbye!"
        log_interaction(session_id, "assistant", reply)
        return {"reply": reply, "appointment_state": {"draft": {}, "step": "goodbye"}, "appointment_booked": False}

    # Build state note for conversational reply
    have = []
    if draft.get("service"):
        have.append(f"service={draft['service']}")
    if draft.get("date"):
        have.append(f"date={draft['date']}")
    if draft.get("time"):
        have.append(f"time={draft['time']}")
    still_need = []
    if not draft.get("service"):
        still_need.append("service")
    if not draft.get("date"):
        still_need.append("date")
    if not draft.get("time"):
        still_need.append("time")
    state_note = f"Have: {', '.join(have) or 'nothing'}. Still need: {', '.join(still_need)}. Available services: {SERVICES_LIST}. Date options: {_date_prompt()}. Time options: {_time_prompt()} (9am–5pm)."

    # Conversational reply using full history so it feels human
    conv = [{"role": m["role"], "content": m["content"]} for m in messages]
    llm_text = await _llm_reply_with_history(LLM_SYSTEM_PROMPT, conv, state_note, last_user or "")

    # Default reply: don't repeat "which service?" when user is greeting or asking for info
    if not draft.get("service"):
        sess["step"] = "service"
        if _user_wants_info_or_chat(last_user) or (len(messages) <= 1 and last_user and len(last_user.split()) <= 3):
            default_reply = "Sure! What would you like to know? I can help with information or book an appointment for you."
        else:
            default_reply = f"Which service would you like? We offer: {SERVICES_LIST}."
    elif not draft.get("date"):
        sess["step"] = "date"
        default_reply = f"Pick a date — e.g. {_date_prompt()}."
    elif not draft.get("time"):
        sess["step"] = "time"
        default_reply = f"Pick a time — e.g. {_time_prompt()} (9am–5pm)."
    else:
        default_reply = "One moment while I confirm your booking..."
        reply, appointment_booked = await _try_book_from_draft(session_id, user_id, draft)
        if appointment_booked:
            log_interaction(session_id, "assistant", reply)
            return {"reply": reply, "appointment_state": {"draft": {}, "step": "booked"}, "appointment_booked": True}
        default_reply = "Something went wrong. Please try again with date and time."

    reply = llm_text or default_reply

    log_interaction(session_id, "assistant", reply)
    return {"reply": reply, "appointment_state": {"draft": draft, "step": sess.get("step", "unknown")}, "appointment_booked": appointment_booked}


class ChatChain:
    async def ainvoke(self, inputs: dict) -> dict:
        return await _invoke_chain(
            inputs["messages"],
            inputs["session_id"],
            inputs.get("user_id", "default"),
        )


def get_chat_chain() -> ChatChain:
    return ChatChain()
