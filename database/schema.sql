-- Appointment Booking Chatbot - PostgreSQL Schema
-- Supabase-compatible, production-ready

-- Enable UUID extension (Supabase has this by default)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- USERS
-- =============================================================================
-- Normalized user entity; auth can plug into Supabase Auth or custom JWT
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    full_name VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- =============================================================================
-- CHAT SESSIONS
-- =============================================================================
-- One session per user interaction; enables multi-session history and analytics
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_user_created ON chat_sessions(user_id, created_at DESC);

-- =============================================================================
-- MESSAGES (optional - for conversation persistence)
-- =============================================================================
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_session_created ON chat_messages(session_id, created_at);

-- =============================================================================
-- APPOINTMENTS
-- =============================================================================
-- Core booking entity; stores date, time, service, status
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
    service VARCHAR(255) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_user_date ON appointments(user_id, appointment_date);
CREATE INDEX idx_appointments_date_status ON appointments(appointment_date, status);

-- =============================================================================
-- TRIGGERS (updated_at)
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
CREATE TRIGGER chat_sessions_updated_at BEFORE UPDATE ON chat_sessions
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
CREATE TRIGGER appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
