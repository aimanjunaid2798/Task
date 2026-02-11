"""In-memory session store for conversation context. Production: use Redis."""

from typing import Any

_sessions: dict[str, dict[str, Any]] = {}


def get_session(session_id: str) -> dict[str, Any]:
    if session_id not in _sessions:
        _sessions[session_id] = {
            "appointment_draft": {},
            "step": "greeting",
        }
    return _sessions[session_id]


def update_session(session_id: str, updates: dict[str, Any]) -> None:
    sess = get_session(session_id)
    sess.update(updates)


def clear_appointment_draft(session_id: str) -> None:
    sess = get_session(session_id)
    sess["appointment_draft"] = {}
    sess["step"] = "greeting"
