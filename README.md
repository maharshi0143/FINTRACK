# FinTrack — Personal Finance Manager

Track expenses, manage budgets, and get AI-powered financial insights.

---

## Tech Stack

**Frontend** — React 19, Vite 8, Tailwind CSS v4, Framer Motion, Recharts, React Router v7, react-hook-form, Socket.IO Client

**Backend** — Express 5, PostgreSQL (NeonDB), Socket.IO, JWT, Groq AI (Llama 3.3 70B), Google OAuth

**Infrastructure** — Docker, Nginx, Vercel (frontend), Railway (backend), NeonDB (database)

---

## Features

- **Transaction Management** — Create, edit, delete with filtering, search, and sorting
- **Budget Tracking** — Set monthly limits per category with real-time progress
- **Analytics Dashboard** — Income/expense summaries, monthly trends, category breakdowns, top expenses
- **AI Assistant** — Natural-language queries about your finances via Groq AI
- **Google Sign-In** — OAuth 2.0 authentication
- **Real-Time Updates** — Socket.IO for live notifications and auto-refresh
- **Password Reset** — Token-based reset flow (no email service required)
- **Responsive Design** — Mobile-first layout with collapsible sidebar

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 4000) |
| `NODE_ENV` | No | `development` or `production` |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string |
| `JWT_SECRET` | **Yes** | Access token signing key |
| `JWT_REFRESH_SECRET` | **Yes** | Refresh token signing key |
| `JWT_EXPIRES_IN` | No | Token expiry (default: `15m`) |
| `GOOGLE_CLIENT_ID` | **Yes** | Google OAuth client ID |
| `GROQ_API_KEY` | **Yes** | Groq AI API key |
| `CLIENT_URL` | No | Frontend URL for CORS (default: `http://localhost:5173`) |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No | API base URL (default: `http://localhost:4000/api`) |
| `VITE_SOCKET_URL` | No | Socket.IO server URL (default: same origin) |
| `VITE_GOOGLE_CLIENT_ID` | **Yes** | Google OAuth client ID |

---

## Local Development

### Prerequisites

- Node.js 20+
- PostgreSQL (or a NeonDB connection string)
- Groq API key ([get one here](https://console.groq.com/keys))
- Google OAuth Client ID ([create one here](https://console.cloud.google.com/apis/credentials))

### 1. Clone and install

```bash
git clone <repo-url> fintrack
cd fintrack

# Backend
cd backend
cp .env.example .env   # then fill in your values
npm install

# Frontend
cd ../frontend
cp .env.example .env   # then fill in your values
npm install
```

### 2. Database setup

Create the tables on your PostgreSQL instance. The schema uses:
- `users` — authentication, password hash, reset tokens, google_id
- `transactions` — user_id, title, amount, type, category, date, notes
- `budgets` — user_id, category, monthly_limit
- `categories` — user_id, name, type, icon, color
- `notifications` — user_id, title, message, type, is_read
- `refresh_tokens` — user_id, token, expires_at
- `ai_chats` — user_id, message, response, created_at

> **Important:** The `users.password_hash` column must allow NULLs for Google OAuth users.
> ```sql
> ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
> ```

### 3. Run

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Docker (Local)

```bash
docker compose up -d --build
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

Nginx proxies `/api/*` and `/socket.io/*` to the backend container, so the frontend uses relative URLs (`VITE_API_URL=/api`, `VITE_SOCKET_URL=""`).

---

## Production Deployment

### Architecture

```
Browser
  │
  ├── Static assets from Vercel CDN
  ├── API calls  → https://api.your-domain.com/api/*
  └── WebSocket  → wss://api.your-domain.com/socket.io
                        │
              Railway (Docker — Node.js)
                        │
              NeonDB (PostgreSQL)
```

### Deploy Backend (Railway)

1. Push code to GitHub
2. Create a new project on [Railway](https://railway.app) → **Deploy from GitHub repo**
3. Set the **Root Directory** to `backend`
4. Add environment variables (see table above) in Railway's dashboard
5. Railway auto-detects `backend/Dockerfile` and deploys
6. Generate a domain (e.g., `fintrack-backend.up.railway.app`)

### Deploy Frontend (Vercel)

1. Create a new project on [Vercel](https://vercel.com) → Import your GitHub repo
2. Set the **Root Directory** to `frontend`
3. Add environment variables in Vercel's dashboard:
   - `VITE_API_URL` → `https://fintrack-backend.up.railway.app/api`
   - `VITE_SOCKET_URL` → `https://fintrack-backend.up.railway.app`
   - `VITE_GOOGLE_CLIENT_ID` → your client ID
4. Vercel auto-detects Vite and runs `npm run build`
5. A `vercel.json` file in the frontend root handles SPA routing

### Google OAuth

Add your production frontend URL to the Google Cloud Console:
1. Go to [Credentials](https://console.cloud.google.com/apis/credentials)
2. Edit your OAuth 2.0 Client ID
3. Under **Authorized JavaScript origins**, add:
   - `https://your-frontend.vercel.app`

### After deployment

Update the backend's `CLIENT_URL` environment variable on Railway to point to your Vercel URL.

---

## API Endpoints

### Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register (email must be @gmail.com) |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/google` | Google OAuth sign-in |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/forgot-password` | Generate reset token |
| POST | `/api/auth/reset-password` | Reset password with token |
| GET | `/api/auth/me` | Get current user |

### Transactions

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/transactions` | List (paginated, filterable, sortable) |
| POST | `/api/transactions` | Create |
| GET | `/api/transactions/:id` | Get by ID |
| PUT | `/api/transactions/:id` | Update |
| DELETE | `/api/transactions/:id` | Delete |

### Budgets

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/budgets` | List all |
| POST | `/api/budgets` | Create |
| PUT | `/api/budgets/:id` | Update |
| DELETE | `/api/budgets/:id` | Delete |
| GET | `/api/budgets/progress` | Progress with current spend |

### Analytics

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/analytics/summary` | Income/expense totals |
| GET | `/api/analytics/monthly` | Monthly breakdown |
| GET | `/api/analytics/categories` | Category spending |
| GET | `/api/analytics/top-expenses` | Top 10 largest expenses |
| GET | `/api/analytics/dashboard` | All 4 datasets in one call |

### Categories

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/categories` | List all |
| POST | `/api/categories` | Create |
| PUT | `/api/categories/:id` | Update |
| DELETE | `/api/categories/:id` | Delete |

### Notifications

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/notifications` | List (paginated) |
| PUT | `/api/notifications/:id/read` | Mark as read |
| DELETE | `/api/notifications/:id` | Delete |

### AI

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/ai/chat` | Send a financial query |

### Profile

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/profile` | Get profile |
| PUT | `/api/profile` | Update profile |
| PUT | `/api/profile/password` | Change password |
| DELETE | `/api/profile` | Delete account |

---

## Key Design Decisions

- **@gmail.com only** — Registration, login, and forgot-password reject non-@gmail.com emails on both frontend and backend
- **No email service** — Password reset generates a crypto token stored in the DB and returned in the API response directly
- **Category names in transactions** — The `transactions.category` column stores category names (not UUIDs) so budget/analytics JOINs work without additional lookups
- **Rate limiting** — Separate limiters for auth, transactions, analytics, budgets, categories, notifications, profile, AI, and a global limiter (300 req/15min)
- **On DELETE CASCADE** — Deleting a user cascades to all child tables; no manual cleanup needed
- **NeonDB free tier** — Database auto-pauses after 5 minutes of inactivity; first connection after idle can take 10-30s

---

## Project Structure

```
fintrack/
├── backend/
│   ├── src/
│   │   ├── config/          # DB pool, env vars, CORS
│   │   ├── controllers/     # Request handlers
│   │   ├── middlewares/     # Auth, error handling, rate limiting
│   │   ├── repositories/   # Database queries
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Business logic
│   │   ├── socket/          # Socket.IO server setup
│   │   ├── utils/           # JWT, AppError
│   │   ├── cron/            # Scheduled reminders
│   │   ├── queries/         # Reference SQL (queries.sql)
│   │   ├── app.js           # Express app setup
│   │   └── server.js        # Entry point
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # React context providers
│   │   ├── hooks/           # Custom hooks (auth, socket, auto-refresh)
│   │   ├── pages/           # Route page components
│   │   │   ├── auth/        # Login, Register, Forgot/Reset password
│   │   │   ├── dashboard/   # Main dashboard
│   │   │   ├── analytics/   # Charts and reports
│   │   │   ├── transactions/# Transaction list and form
│   │   │   ├── budgets/     # Budget management
│   │   │   ├── categories/  # Category management
│   │   │   ├── notifications/ # Notification list
│   │   │   ├── ai/          # AI assistant chat
│   │   │   └── profile/     # User settings
│   │   ├── services/        # Axios API client
│   │   ├── utils/           # Socket service, formatting
│   │   ├── App.jsx          # Root with providers
│   │   ├── AppRoutes.jsx    # Route definitions
│   │   └── index.css        # Tailwind imports + globals
│   ├── public/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── docs/
│   └── FINTRACK.docx
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## Linting & Code Style

```bash
cd frontend
npm run lint        # ESLint

cd backend
npx eslint src/     # ESLint
```
