# Artory — Creative Community Platform

Artory connects artists (guides) with learners through artwork sharing, course enrollment, practice feedback, and art purchases.

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js (CommonJS) |
| Framework | Express.js v5 |
| Database | MySQL via `mysql2` (raw SQL, no ORM) |
| Auth | JWT (HttpOnly cookie + Bearer header), Google OAuth 2.0 |
| File Storage | Cloudinary via `multer-storage-cloudinary` |
| Payments | Stripe (artwork purchases + subscription webhooks) |
| Email | Nodemailer (SMTP) |
| Validation | Joi schemas |
| Password | bcryptjs |
| Rate Limiting | express-rate-limit |

### Frontend
| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v3 |
| HTTP Client | Axios (centralized instance) |
| Animations | Framer Motion |
| Icons | lucide-react |
| Payments | @stripe/stripe-js |

---

## Project Structure

```
artory/
├── backend/                    # Express.js REST API
│   ├── server.js               # Entry point — mounts all routes
│   ├── database_schema.sql     # Source of truth for DB schema
│   └── src/
│       ├── config/             # DB, Cloudinary, Passport, Stripe
│       ├── middleware/         # Auth, roles, plan access, upload, rate limit
│       ├── modules/            # Feature modules (controller + routes)
│       │   ├── auth/
│       │   ├── user/
│       │   ├── admin/
│       │   ├── artwork/
│       │   ├── practice/
│       │   ├── course/
│       │   ├── order/          # Artwork purchases + Stripe webhook
│       │   ├── payment/        # Subscription payments
│       │   ├── subscription/
│       │   ├── social/         # Likes & comments
│       │   ├── notification/
│       │   └── search/
│       ├── services/           # emailService, plan.service, stripe.service
│       └── utils/              # apiResponse, generateToken, planLimits, validators
│
└── frontend/                   # Next.js App Router frontend
    └── src/
        ├── app/                # Pages (App Router)
        │   ├── (admin)/admin/
        │   ├── (guide)/guide/
        │   ├── (learner)/learner/
        │   ├── artworks/
        │   ├── courses/
        │   ├── explore/
        │   ├── pricing/
        │   └── payment/
        ├── components/
        │   ├── features/       # Domain components (ArtworkCard, EnrollmentModal…)
        │   ├── layout/         # Navbar, Footer, DashboardContainer
        │   └── ui/             # Generic reusable components
        ├── providers/
        │   └── AppProvider.tsx # Global auth state, modal, toast
        ├── services/           # API layer — one folder per domain
        │   ├── axios.ts        # Shared Axios instance
        │   ├── auth/
        │   ├── artwork/
        │   ├── course/
        │   ├── practice/
        │   ├── payment/
        │   └── social.api.ts
        ├── hooks/
        ├── types/
        ├── constants/
        └── styles/
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8+
- Cloudinary account
- Stripe account
- Google OAuth credentials (optional)

### 1. Clone & install

```bash
git clone https://github.com/your-username/artory.git
cd artory

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Database setup

```bash
# Create the database and import schema
mysql -u root -p < backend/database_schema.sql
```

### 3. Backend environment

Create `backend/.env`:

```env
PORT=5000

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=art_platform

# JWT
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_EXPIRES_IN=7d

# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=you@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=Artory <you@gmail.com>

# URLs
CLIENT_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_TRIAL=price_...
STRIPE_PRICE_PREMIUM=price_...
```

### 4. Frontend environment

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 5. Run

```bash
# Backend (from /backend)
npm run dev       # development with nodemon
npm start         # production

# Frontend (from /frontend)
npm run dev       # Next.js dev server
npm run build     # production build
npm start         # serve production build
```

---

## API Reference

Base URL: `http://localhost:5000/api`

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Register (role: learner \| guide) |
| POST | `/auth/login` | — | Login, returns JWT + sets cookie |
| POST | `/auth/logout` | — | Clear auth cookie |
| GET | `/auth/me` | ✓ | Get current user |
| POST | `/auth/forgot-password` | — | Send reset email |
| POST | `/auth/reset-password/:token` | — | Reset password |
| GET | `/auth/google` | — | Google OAuth redirect |
| GET | `/auth/google/callback` | — | Google OAuth callback |

### Artworks

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/artworks` | — | List all artworks |
| GET | `/artworks/:id` | — | Artwork detail |
| POST | `/artworks` | guide | Upload artwork (multipart) |
| PUT | `/artworks/:id` | guide/admin | Update artwork |
| DELETE | `/artworks/:id` | guide/admin | Delete artwork |

### Courses

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/courses` | — | List all courses |
| GET | `/courses/:id` | — | Course detail |
| POST | `/courses` | guide | Create course (multipart) |
| PUT | `/courses/:id` | guide/admin | Update course |
| DELETE | `/courses/:id` | guide/admin | Delete course |
| POST | `/courses/:id/enroll` | learner | Submit enrollment request |
| GET | `/courses/enrollments` | guide/learner | List enrollments |
| PUT | `/courses/enrollments/:id` | guide | Approve / reject enrollment |

### Practice Works

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/practice` | learner | My practice works |
| GET | `/practice/:id` | learner | Practice detail |
| POST | `/practice` | learner | Upload practice (multipart) |
| PUT | `/practice/:id` | learner | Update practice |
| DELETE | `/practice/:id` | learner | Delete practice |

### Social

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/social/like/:artworkId` | ✓ | Toggle like |
| GET | `/social/like-status/:artworkId` | ✓ | Get like status + count |
| POST | `/social/comment/:artworkId` | ✓ | Add comment |
| GET | `/social/comments/:artworkId` | — | Get comments |

### Payments & Subscriptions

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/payments/create-artwork-checkout` | ✓ | Stripe checkout for artwork |
| POST | `/payments/create-course-checkout` | ✓ | Stripe checkout for course |
| POST | `/payments/create-plan-checkout` | ✓ | Stripe checkout for subscription |
| POST | `/payments/webhook` | — | Stripe webhook (raw body) |
| GET | `/subscriptions/plans` | — | List subscription plans |
| GET | `/subscriptions/me` | ✓ | My subscription info |
| POST | `/subscriptions/activate-free` | ✓ | Activate free plan |
| POST | `/subscriptions/cancel` | ✓ | Cancel subscription |

### Search & Notifications

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/search?q=` | — | Search artworks, courses, guides |
| GET | `/notifications` | ✓ | My notifications |
| PUT | `/notifications/:id/read` | ✓ | Mark as read |

---

## User Roles

| Role | Capabilities |
|---|---|
| **learner** | Browse gallery, enroll in courses, upload practice works, purchase art |
| **guide** | Upload & sell artworks, create & manage courses, approve enrollments |
| **admin** | Full platform management — users, content, subscriptions |

---

## Subscription Plans

| Plan | Guide | Learner |
|---|---|---|
| **Free** | 1 course, unlimited artwork uploads (no selling) | 1 course join, unlimited practice uploads |
| **Trial** | 3 courses, 10 artworks (with selling), 20 practice uploads | 5 course joins |
| **Premium** | Unlimited everything + selling | Unlimited everything |

> Existing users at the time of plan system launch are **grandfathered** — they have unlimited access regardless of plan.

---

## Authentication Flow

- JWT stored in **HttpOnly cookie** (browser) and **localStorage** (`artory_token`) as fallback
- Token attached via `Authorization: Bearer <token>` header by Axios interceptor
- On 401 response — token cleared, user redirected to home
- Google OAuth redirects to `/auth/success?token=...` on the frontend

---

## Key Conventions

### Backend
- Each module: `{name}.controller.js` + `{name}.routes.js`
- Middleware order: `verifyToken` → `authorizeRoles` → `planAccess` → `upload` → controller
- All responses: `{ message, data }` shape or `successResponse` / `errorResponse` helpers
- Raw SQL only — always parameterized: `db.query(sql, [params])`
- Stripe webhooks registered **before** `express.json()` in `server.js`

### Frontend
- All API calls through shared Axios instance (`src/services/axios.ts`)
- Global state (auth, modal, toast) via `AppProvider` — access with `useApp()`
- Role-based routes use Next.js route groups: `(admin)`, `(guide)`, `(learner)`
- Tailwind custom tokens: `text-orange`, `bg-cream`, `font-display`
- File uploads use 60s timeout (Cloudinary can be slow)

---

## Environment Notes

- Never commit `.env` or `.env.local`
- Stripe webhook secret must match your Stripe dashboard endpoint
- Stripe Price IDs must be `price_...` not `prod_...`
- Gmail SMTP requires an **App Password** (not your account password)
- Cloudinary free tier is sufficient for development
