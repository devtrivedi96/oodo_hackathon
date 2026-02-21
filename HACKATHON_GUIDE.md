# FleetFlow Hackathon Guide

## 1. Project Summary
FleetFlow is a fleet and logistics management platform with:
- Role-based access (`Manager`, `Dispatcher`, `Safety Officer`, `Analyst`)
- OTP-based registration and verification
- Trip dispatching and completion workflows
- Maintenance and expense tracking dashboards

## 2. Tech Stack
- Frontend: React + TypeScript + Vite + TailwindCSS
- Backend: Node.js + Express
- Database: MySQL
- Auth: JWT + email OTP verification

## 3. How to Run
### Frontend
```bash
npm install
npm run dev
```

### Backend
```bash
cd backend
npm install
node server.js
```

## 4. Required Database Fields (users table)
The OTP auth flow expects these columns:
- `full_name` (or `name` in legacy schema)
- `password_hash` (or `password` in legacy schema)
- `otp`
- `otp_expiry`
- `is_verified`

Migration for OTP fields on existing DB:
```sql
ALTER TABLE users
  ADD COLUMN otp VARCHAR(6) NULL,
  ADD COLUMN otp_expiry DATETIME NULL,
  ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
```

## 5. Key Flow
1. User registers.
2. Backend stores user + generated OTP.
3. OTP is sent via Brevo email API.
4. Frontend navigates to `/verify-otp`.
5. User verifies OTP, then can log in.

## 6. Code Quality Notes
- Strict TypeScript checks enabled (`npm run typecheck`).
- ESLint pass expected (`npm run lint`).
- API and UI layers use typed contracts from `src/lib/db.ts`.
- Expense and dashboard screens sanitize numeric values before computation.
