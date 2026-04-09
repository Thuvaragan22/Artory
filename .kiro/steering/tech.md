# Tech Stack

## Backend

- **Runtime**: Node.js (CommonJS modules)
- **Framework**: Express.js v5
- **Database**: MySQL via `mysql2` (promise-based queries)
- **Auth**: JWT (access tokens via HttpOnly cookie + Bearer header fallback), `passport` + `passport-google-oauth20`
- **Validation**: Joi schemas via `validateRequest` middleware
- **File uploads**: Multer (stored in `backend/uploads/`)
- **Payments**: Stripe (artwork purchases + subscription webhooks)
- **Email**: Nodemailer
- **Password hashing**: bcryptjs
- **Rate limiting**: express-rate-limit

## Frontend

- **Framework**: Next.js 16 (App Router) with React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS v3 with custom design tokens (cream/sand/orange palette, Playfair Display + DM Sans fonts)
- **HTTP client**: Axios (centralized instance at `src/services/axios.ts`)
- **Animations**: Framer Motion
- **Icons**: lucide-react
- **Payments**: @stripe/stripe-js

## Common Commands

### Backend
```bash
cd backend
npm run dev      # development with nodemon
npm start        # production
```

### Frontend
```bash
cd frontend
npm run dev      # Next.js dev server
npm run build    # production build
npm start        # serve production build
npm run lint     # ESLint
```

## Environment

- Backend env: `backend/.env`
- Frontend env: `frontend/.env.local` (prefix public vars with `NEXT_PUBLIC_`)
- Key backend vars: `PORT`, `DB_*`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `CLIENT_URL`
- Key frontend vars: `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:5000`)

## Database

- MySQL schema source of truth: `backend/database_schema.sql`
- No ORM — raw SQL queries via `db.query(sql, params)`
- Migrations are manual scripts (e.g. `migrate_subscription.js`)
