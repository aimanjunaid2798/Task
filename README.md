# Appointment Booking Chatbot

A production-quality, four-layer chatbot system for appointment booking.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Backend API   │────▶│  AI Microservice│     │   PostgreSQL    │
│   (Next.js)     │     │   (Express)     │     │   (Python/LC)   │────▶│   (Supabase)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
        │                        │                        │
        │  JWT + chatbot token   │  JWT validation        │
        └────────────────────────┴────────────────────────┘
```

## Quick Start

### 1. Database

```bash
# Create DB, then run:
psql -f database/schema.sql
psql -f database/seed.sql
```

### 2. Backend (port 3001)

```bash
cd backend
npm install
# Set DATABASE_URL, JWT_SECRET
npm run dev
```

### 3. AI Service (port 8000)

```bash
cd ai-service
pip install -r requirements.txt
# Set OPENAI_API_KEY, JWT_SECRET (must match backend)
uvicorn main:app --reload --port 8000
```

### 4. Frontend (port 3000)

```bash
cd frontend
npm install
# Set NEXT_PUBLIC_API_URL, NEXT_PUBLIC_AI_SERVICE_URL
npm run dev
```

## Env Summary

| Layer | Key Vars |
|-------|----------|
| Backend | DATABASE_URL, JWT_SECRET |
| AI Service | OPENAI_API_KEY, JWT_SECRET |
| Frontend | NEXT_PUBLIC_API_URL, NEXT_PUBLIC_AI_SERVICE_URL |
