"""
PostgreSQL connection for AI service (Supabase).
Uses explicit host/port/user/password/database when set (no URL parsing).
"""
import os
import ssl
from contextlib import asynccontextmanager

import asyncpg

# Explicit params – no URL parsing (avoids issues with : or @ in password)
DB_HOST = os.getenv("DB_HOST")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")

_pool: asyncpg.Pool | None = None


def _has_db_config() -> bool:
    return bool(DB_HOST and DB_USER and DB_NAME)


async def get_pool() -> asyncpg.Pool | None:
    global _pool
    if not _has_db_config():
        return None
    if _pool is None:
        use_ssl = "supabase.co" in (DB_HOST or "")
        ssl_ctx = None
        if use_ssl:
            ssl_ctx = ssl.create_default_context()
            ssl_ctx.check_hostname = False
            ssl_ctx.verify_mode = ssl.CERT_NONE
        _pool = await asyncpg.create_pool(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            min_size=1,
            max_size=5,
            command_timeout=10,
            ssl=ssl_ctx if use_ssl else False,
        )
    return _pool


@asynccontextmanager
async def acquire():
    """Yield a connection from the pool. No-op if no DATABASE_URL."""
    pool = await get_pool()
    if pool is None:
        yield None
        return
    async with pool.acquire() as conn:
        yield conn


async def close_pool():
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
