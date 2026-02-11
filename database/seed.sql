-- Sample data for development and evaluation
-- Run after schema.sql

INSERT INTO users (id, email, password_hash, full_name) VALUES
    ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'demo@example.com', '$2b$10$placeholder_hash_use_real_hash_in_prod', 'Demo User'),
    ('b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', 'jane@example.com', '$2b$10$placeholder_hash', 'Jane Smith');

-- Chat sessions for demo user
INSERT INTO chat_sessions (id, user_id, metadata) VALUES
    ('c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', '{"source": "web"}');

-- Sample appointments
INSERT INTO appointments (user_id, session_id, service, appointment_date, appointment_time, status, notes) VALUES
    ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', 'Haircut', '2025-02-10', '10:00:00', 'confirmed', 'First visit'),
    ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', NULL, 'Consultation', '2025-02-15', '14:30:00', 'pending', NULL);
