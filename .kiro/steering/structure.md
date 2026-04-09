# Project Structure

## Root

```
/
├── backend/       # Express.js REST API
└── frontend/      # Next.js App Router frontend
```

## Backend (`backend/`)

```
backend/
├── server.js                  # Entry point — mounts all routes
├── database_schema.sql        # Source of truth for DB schema
├── src/
│   ├── config/
│   │   ├── db.js              # MySQL connection pool
│   │   ├── passport.js        # Google OAuth strategy
│   │   └── stripe.js          # Stripe client
│   ├── middleware/
│   │   ├── authMiddleware.js  # verifyToken (cookie + Bearer)
│   │   ├── roleMiddleware.js  # authorizeRoles(...roles)
│   │   ├── planAccess.middleware.js  # plan-gated feature guards
│   │   ├── validateRequest.js # Joi schema validation
│   │   ├── upload.js          # Multer config per resource type
│   │   ├── rateLimiter.js
│   │   └── errorHandler.js
│   ├── modules/               # Feature modules (controller + routes co-located)
│   │   ├── auth/
│   │   ├── user/
│   │   ├── admin/
│   │   ├── artwork/
│   │   ├── practice/
│   │   ├── course/
│   │   ├── order/             # Artwork purchases + Stripe webhook
│   │   ├── payment/           # Subscription payments + webhook
│   │   ├── subscription/
│   │   ├── social/            # Likes & comments
│   │   ├── notification/
│   │   └── search/
│   ├── services/
│   │   ├── emailService.js
│   │   ├── plan.service.js    # Plan limits logic
│   │   └── stripe.service.js
│   └── utils/
│       ├── apiResponse.js     # successResponse / errorResponse helpers
│       ├── generateToken.js
│       ├── cookieHelper.js
│       ├── validators.js
│       └── planLimits.js
└── uploads/                   # Served statically at /uploads
    ├── artworks/
    ├── courses/
    ├── practice/
    └── profiles/
```

## Frontend (`frontend/src/`)

```
src/
├── app/                       # Next.js App Router pages
│   ├── layout.tsx             # Root layout — wraps AppProvider, Navbar, Footer
│   ├── page.tsx               # Landing page
│   ├── (admin)/admin/         # Admin dashboard (route group)
│   ├── (guide)/guide/         # Guide dashboard (route group)
│   ├── (learner)/learner/     # Learner dashboard (route group)
│   ├── artworks/[id]/
│   ├── courses/[id]/
│   ├── guides/[id]/
│   ├── explore/
│   ├── search/
│   ├── pricing/
│   ├── profile/
│   ├── checkout/              # success / cancel
│   └── payment/               # success / cancel
├── components/
│   ├── features/              # Domain-specific components (ArtworkCard, AuthModal, etc.)
│   ├── layout/                # Navbar, Footer, Sidebar, DashboardContainer
│   └── ui/                    # Generic reusable components (FormField, SectionHeading)
├── providers/
│   └── AppProvider.tsx        # Global context: auth state, modal, toast
├── services/                  # API layer — one folder per domain
│   ├── axios.ts               # Shared Axios instance (baseURL, interceptors)
│   ├── auth/index.ts
│   ├── artwork/index.ts
│   ├── course/index.ts
│   └── ...                    # Pattern: services/{domain}/index.ts
├── hooks/                     # Custom React hooks
├── types/                     # Shared TypeScript interfaces
├── constants/                 # App-wide constants
├── validations/               # Form validation schemas
└── styles/
    └── globals.css
```

## Key Conventions

### Backend
- Each module has exactly two files: `{name}.controller.js` and `{name}.routes.js`
- Route middleware order: `verifyToken` → `authorizeRoles` → `planAccess` → `upload` → controller
- All responses use `successResponse` / `errorResponse` from `utils/apiResponse.js`, or plain `res.json` with `{ message, data }` shape
- Raw SQL only — no ORM. Always use parameterized queries: `db.query(sql, [params])`
- Stripe webhooks must be registered before `express.json()` middleware in `server.js`

### Frontend
- All API calls go through the shared Axios instance (`src/services/axios.ts`)
- Global auth state, modal control, and toast notifications live in `AppProvider` — access via `useApp()`
- Token stored in `localStorage` under key `artory_token`; user object under `artory_user`
- Role-based dashboard routes use Next.js route groups: `(admin)`, `(guide)`, `(learner)`
- Tailwind custom tokens should be used over arbitrary values (e.g. `text-orange`, `bg-cream`, `font-display`)
