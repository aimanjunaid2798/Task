"""Simple interaction logger - logs conversations for audit/debugging."""

import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("chatbot")


def log_interaction(session_id: str, role: str, content: str, metadata: dict | None = None) -> None:
    logger.info(
        "interaction",
        extra={
            "session_id": session_id,
            "role": role,
            "content_preview": content[:100] if len(content) > 100 else content,
            "timestamp": datetime.utcnow().isoformat(),
            **(metadata or {}),
        },
    )
