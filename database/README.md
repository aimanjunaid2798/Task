# Database Schema

## Design Decisions

### Normalization
- **users**: Core identity table; auth providers can be added later via separate `auth_providers` table
- **chat_sessions**: One per user session; isolates conversation history for privacy/analytics
- **appointments**: References both user and chat_session for audit trail; denormalized `user_email` for display (trade-off: avoids joins on read-heavy paths)

### UUID Primary Keys
- Globally unique, no sequential leakage in URLs
- Better for distributed systems and Supabase Realtime subscriptions
- `gen_random_uuid()` used for PostgreSQL 13+ compatibility

### Indexing Strategy
- Foreign keys indexed for join performance
- `chat_sessions(user_id, created_at)` for user session history queries
- `appointments(user_id, appointment_date)` for user calendar views
- `appointments(appointment_date, status)` for availability checks

### Supabase Compatibility
- Uses standard PostgreSQL; no Supabase-specific extensions required
- Row Level Security (RLS) policies can be added for multi-tenant isolation
- Compatible with Supabase Auth (`auth.users`) if you switch to their auth
