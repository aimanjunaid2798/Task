"""
Appointment business logic - availability check and booking.
Persists to Supabase when DATABASE_URL is set; otherwise in-memory for demo.
"""
from datetime import date, time
from typing import Any

from db import acquire

# Simulated availability slots (in production: query DB)
DEFAULT_SLOTS = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
]

# In-memory bookings for demo when no DB
_bookings: list[dict[str, Any]] = []


def check_availability(apt_date: date, service: str) -> list[str]:
    """Return available time slots for a given date and service."""
    booked = {
        b["time"].strftime("%H:%M")
        for b in _bookings
        if b["date"] == apt_date and b["service"] == service
    }
    return [s for s in DEFAULT_SLOTS if s not in booked]


def create_appointment(
    user_id: str,
    session_id: str,
    service: str,
    apt_date: date,
    apt_time: time,
    notes: str | None = None,
) -> dict[str, Any]:
    """Create appointment in memory (used when no DB or for tests). Returns created appointment dict."""
    apt = {
        "id": f"apt-{len(_bookings) + 1}",
        "user_id": user_id,
        "session_id": session_id,
        "service": service,
        "date": apt_date,
        "time": apt_time,
        "notes": notes,
        "status": "confirmed",
    }
    _bookings.append(apt)
    return apt


async def create_appointment_supabase(
    user_id: str,
    service: str,
    apt_date: date,
    apt_time: time,
    notes: str | None = None,
) -> dict[str, Any] | None:
    """
    Insert appointment into Supabase (appointments table).
    session_id is left NULL (AI service does not have chat_sessions UUID).
    Returns created row as dict or None if no DB.
    """
    async with acquire() as conn:
        if conn is None:
            return None
        row = await conn.fetchrow(
            """
            INSERT INTO appointments (user_id, session_id, service, appointment_date, appointment_time, status, notes)
            VALUES ($1::uuid, NULL, $2, $3, $4, 'confirmed', $5)
            RETURNING id, user_id, service, appointment_date, appointment_time, status, notes
            """,
            user_id,
            service,
            apt_date,
            apt_time,
            notes or "",
        )
        if row is None:
            return None
        return dict(row)


def validate_date(d: date) -> bool:
    """Ensure date is today or in the future."""
    return d >= date.today()


def validate_time(t: time, d: date) -> bool:
    """Basic time validation (business hours 9-17)."""
    if d == date.today():
        from datetime import datetime
        now = datetime.now().time()
        return t > now and 9 <= t.hour < 17
    return 9 <= t.hour < 17
