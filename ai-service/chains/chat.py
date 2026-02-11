"""
Chat chain - conversational appointment flow.
Asks one question at a time: service → date → time, then books and saves to Supabase.
Suggests dates and times so user can pick; selection is stored in correct form.
"""
from datetime import date, datetime, timedelta

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

    # Otherwise ask for the next missing piece (one question at a time)
    if not draft.get("service"):
        greeting = "Hi! I can help you book an appointment. " if not draft and len(messages) <= 1 else ""
        reply = f"{greeting}Which service would you like? We offer: {SERVICES_LIST}."
        sess["step"] = "service"
    elif not draft.get("date"):
        reply = f"Pick a date — just type one: {_date_prompt()}."
        sess["step"] = "date"
    elif not draft.get("time"):
        reply = f"Pick a time — just type one: {_time_prompt()} (24h)."
        sess["step"] = "time"
    else:
        reply = "I have everything. One moment while I confirm your booking..."
        # Should not reach here if _try_book_from_draft ran; re-run book
        reply, appointment_booked = await _try_book_from_draft(session_id, user_id, draft)
        if not appointment_booked:
            reply = "Something went wrong. Please try again with date and time."

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
