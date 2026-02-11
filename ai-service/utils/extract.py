"""Extract service, date, time from user message for appointment booking."""
import re
from datetime import date, datetime, time

SERVICES = ["Haircut", "Consultation", "Massage", "Dental Checkup"]


def extract_service(text: str) -> str | None:
    """Match one of the allowed services (case-insensitive)."""
    if not text or not text.strip():
        return None
    t = text.strip().lower()
    for s in SERVICES:
        if s.lower() in t:
            return s
    return None


def extract_date(text: str) -> date | None:
    """Parse date: today, tomorrow, or YYYY-MM-DD."""
    if not text or not text.strip():
        return None
    t = text.strip().lower()
    today = date.today()
    if t in ("today", "tod"):
        return today
    if t in ("tomorrow", "tmr", "tom"):
        from datetime import timedelta
        return today + timedelta(days=1)
    # YYYY-MM-DD or DD/MM/YYYY or similar
    m = re.search(r"(\d{4})-(\d{1,2})-(\d{1,2})", text)
    if m:
        try:
            return date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
        except ValueError:
            pass
    m = re.search(r"(\d{1,2})/(\d{1,2})/(\d{4})", text)
    if m:
        try:
            return date(int(m.group(3)), int(m.group(2)), int(m.group(1)))
        except ValueError:
            pass
    return None


def extract_time(text: str) -> time | None:
    """Parse time: 9am, 3pm, 14:00, 2:30pm, etc."""
    if not text or not text.strip():
        return None
    t = text.strip().lower()
    # 14:00 or 14:30 or 9:00
    m = re.search(r"\b(\d{1,2}):(\d{2})\s*(am|pm)?\b", t, re.I)
    if m:
        h, mi = int(m.group(1)), int(m.group(2))
        if m.group(3) and m.group(3).lower() == "pm" and h < 12:
            h += 12
        if m.group(3) and m.group(3).lower() == "am" and h == 12:
            h = 0
        try:
            return time(h, min(mi, 59))
        except ValueError:
            pass
    # 9am, 3pm, 10am
    m = re.search(r"\b(\d{1,2})\s*(am|pm)\b", t, re.I)
    if m:
        h = int(m.group(1))
        if m.group(2).lower() == "pm" and h < 12:
            h += 12
        if m.group(2).lower() == "am" and h == 12:
            h = 0
        try:
            return time(h, 0)
        except ValueError:
            pass
    return None
