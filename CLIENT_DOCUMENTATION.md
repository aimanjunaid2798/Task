# Appointment Booking Chatbot — Client Documentation

**Document purpose:** Is document mein system kya karta hai, kaise kaam karta hai, aur data kahan store hota hai — sab client ko samjhaney ke liye likha gaya hai.

---

## 1. System Overview (System Kya Hai?)

Yeh ek **appointment booking chatbot** hai. User website par login karke chat karta hai; bot step-by-step **service**, **date**, aur **time** poochta hai, phir appointment book karke database mein save karta hai.

**Main features:**
- User sign up / sign in (email + password)
- Chat interface jahan user bot se baat karta hai
- Bot ek waqt mein ek cheez poochta hai: pehle service, phir date, phir time
- Bot date aur time ke **suggested options** deta hai — user sirf select karke type karta hai
- Jab teeno mil jate hain, appointment **Supabase (database)** mein save hoti hai
- Appointment confirm hote hi frontend par **“Appointment booked”** toast dikhta hai

---

## 2. Architecture (System Kaise Banta Hai?)

System **4 parts** se mil kar banta hai:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  FRONTEND   │────▶│   BACKEND   │────▶│ AI SERVICE  │────▶│  SUPABASE   │
│  (Next.js)  │◀────│  (Node.js)  │◀────│  (Python)   │◀────│ (PostgreSQL)│
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      Browser           Port 3001           Port 8000           Database
```

| Part | Technology | Role |
|------|------------|------|
| **Frontend** | Next.js (React) | Login/Sign up UI, chat window, toast |
| **Backend** | Node.js + Express | Auth (register/login), JWT, chat ko AI service tak proxy, chat/messages DB mein save |
| **AI Service** | Python + FastAPI | Conversational flow: service → date → time, extract karke appointment book, Supabase mein insert |
| **Database** | Supabase (PostgreSQL) | Users, chat_sessions, chat_messages, appointments — sab yahan store |

---

## 3. User Flow (User Ke Saath Kya Kya Hota Hai?)

### Step 1: Auth
- User **Sign up** (email, password) ya **Sign in** karta hai.
- Backend password hash karke **Supabase** ke `users` table mein save / verify karta hai.
- Login ke baad **JWT token** milta hai; yeh token frontend har chat request ke sath bhejta hai.

### Step 2: Chat / Booking
1. User chat open karta hai, message likhta hai (e.g. “I want to book”).
2. **Bot pehle service poochta hai** — options: Haircut, Consultation, Massage, Dental Checkup. User koi ek type karta hai.
3. **Phir date** — bot suggested dates deta hai: today, tomorrow, aur next 4 days (YYYY-MM-DD). User koi ek type karta hai.
4. **Phir time** — bot suggested times deta hai: 09:00, 09:30, 10:00, … 16:30. User koi ek type karta hai.
5. Jab **service + date + time** teeno mil jate hain, AI service **Supabase** ke `appointments` table mein row insert karta hai.
6. User ko confirmation message aata hai aur frontend par **“Appointment booked”** toast dikhta hai.

**Important:** Backend har chat message + reply ko bhi **Supabase** mein save karta hai (`chat_sessions` + `chat_messages`), taake conversation history rahe.

---

## 4. Data Storage (Data Kahan Store Hota Hai?)

Sab data **Supabase (PostgreSQL)** mein store hota hai.

| Table | Kya store hota hai | Kab banta hai |
|-------|--------------------|----------------|
| **users** | id, email, password_hash, full_name | Sign up par |
| **chat_sessions** | user_id, metadata (e.g. client session id) | Pehli chat message par (backend) |
| **chat_messages** | session_id, role (user/assistant), content | Har user message + bot reply ke baad (backend) |
| **appointments** | user_id, service, appointment_date, appointment_time, status, notes | Jab user ne service + date + time de diya (AI service) |

**Flow in short:**
- **Backend** → users (auth), chat_sessions, chat_messages.
- **AI service** → appointments (sirf jab booking complete hoti hai).

---

## 5. AI Conversation Logic (Bot Kaise Sochta Hai?)

- Bot **ek question ek waqt** poochta hai: pehle service, phir date, phir time.
- User jo type karta hai, us se **service / date / time extract** hota hai (e.g. “tomorrow” → date, “14:00” → time).
- **Suggested options** isliye diye jate hain taake user sahi format mein type kare (date YYYY-MM-DD, time HH:MM) — database mein correct form mein save hota hai.
- Jab **teeno (service, date, time)** mil jate hain, AI service **Supabase** mein `appointments` insert karta hai aur **appointment_booked: true** response bhejta hai; frontend isi par toast dikhata hai.

---

## 6. Security & Config (Brief)

- Passwords **hashed** (bcrypt) store hote hain.
- Chat requests **JWT** se protect hain; backend AI service ko bhi JWT forward karta hai.
- Supabase connection **SSL** use karta hai (certificate verify relaxed for Supabase host).
- **Backend** aur **AI service** dono ke liye DB connection **explicit** (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME) use hota hai — same Supabase project.

---

## 7. Summary Table (Ek Nazar Mein)

| Kya hota hai | Kahan / Kaise |
|--------------|----------------|
| User sign up / login | Frontend → Backend → Supabase `users` |
| Chat message bhejna | Frontend → Backend → AI service → reply |
| Chat history save | Backend → Supabase `chat_sessions` + `chat_messages` |
| Service / date / time collect karna | AI service (conversational flow + suggested options) |
| Appointment save | AI service → Supabase `appointments` |
| “Appointment booked” toast | AI response `appointment_booked: true` → Frontend |

---

**Document version:** 1.0  
**Last updated:** February 2026  
Agar client ko kisi specific part (e.g. only flow, only database) ka slide/deck chahiye ho to is document ke sections ko copy-paste karke use kiya ja sakta hai.
