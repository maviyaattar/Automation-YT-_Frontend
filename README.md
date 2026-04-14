# AutoShorts AI — Frontend

A production-ready, fully responsive SaaS frontend for an AI-powered YouTube Shorts automation platform. Built with **pure HTML, CSS, and Vanilla JavaScript** using **Vite** as the build tool.

---

## 🚀 Features

- **SPA Routing** — Client-side routing with the History API (no page reloads)
- **Fully Responsive** — Mobile-first layout; sidebar collapses to a drawer on small screens
- **Professional SaaS UI** — Stripe/Vercel/Notion-style design with cards, badges, and clean typography
- **Skeleton Loaders** — Shown during all loading states
- **Toast Notifications** — Success/error/warning/info toasts
- **Modal Popups** — Confirm dialogs for logout, disconnect, and clear logs
- **Smooth Animations** — CSS transitions, page fade-in/slide-up, stagger effects
- **Status Badges** — Active / Disabled / Error with pulsing dot
- **Loading Spinners** — Inside buttons during API calls
- **Hover Effects** — On buttons and cards

---

## 📁 Project Structure

```
/
├── index.html              # App shell entry point
├── .env.example            # Environment variable template
├── vite.config.js          # (optional) Vite config
├── package.json            # Dependencies & scripts
├── styles/
│   ├── base.css            # CSS variables, reset, typography
│   ├── layout.css          # Sidebar, topbar, main content, auth layout
│   ├── components.css      # Buttons, cards, badges, forms, toasts, modals, skeletons
│   └── animations.css      # Keyframes, page transitions, hover effects
└── src/
    ├── app.js              # App init, auth check, sidebar, routing
    ├── api.js              # Centralized fetch wrapper (AbortController, error handling)
    ├── router.js           # History API SPA router
    ├── store.js            # Reactive state store + event bus
    ├── toast.js            # Toast notification system
    ├── modal.js            # Modal popup system
    ├── icons.js            # Inline Lucide SVG icons
    └── pages/
        ├── login.js        # Login page (Google OAuth)
        ├── dashboard.js    # Dashboard (channel info, stats, recent videos)
        ├── generate.js     # Manual generate page (progress steps, result)
        ├── auto.js         # Auto mode (toggle, schedule, last/next run)
        ├── logs.js         # Logs page (live polling, color-coded, clear action)
        └── profile.js      # Profile & settings (form, disconnect, logout)
```

---

## 🌐 Backend API

Base URL configured via `VITE_API_BASE_URL` (see [Environment Variables](#-environment-variables)).

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/google` | Redirect to Google OAuth |
| GET | `/auth/google/callback` | OAuth callback (sets session cookie, redirects to frontend) |
| GET | `/auth/status` | Check auth status `{ authenticated, user? }` |
| POST | `/auth/logout` | Logout (destroys session) |
| GET | `/dashboard` | Dashboard data (channel info, recent videos) |
| POST | `/generate` | Generate a Short → `{ videoId, quote }` |
| POST | `/auto` | Set auto mode `{ enabled, scheduleHours? }` |
| GET | `/logs` | Fetch logs |
| DELETE | `/logs` | Clear logs |
| GET | `/profile` | Get profile |
| PATCH | `/profile` | Update profile |
| POST | `/disconnect` | Disconnect YouTube |
| GET | `/health` | Health check |

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL (no trailing slash) | `https://automation-yt-saas.onrender.com` |

> **Note**: On Vercel, set `VITE_API_BASE_URL` in **Project Settings → Environment Variables**.

---

## 🏃 Running Locally

### Install dependencies

```bash
npm install
```

### Start dev server

```bash
npm run dev
# Open http://localhost:5173
```

### Build for production

```bash
npm run build
# Output in dist/
```

### Preview production build

```bash
npm run preview
```

---

## 🔐 Auth Flow

1. App loads → calls `GET /auth/status`
2. If unauthenticated → shows login screen with **"Continue with Google"** button
3. Clicking the button redirects to `GET /auth/google` (full page redirect)
4. After OAuth, the backend sets a session cookie and redirects back to the frontend
5. App re-checks auth status and renders the main SPA

> **CORS / Cookies**: All API calls use `fetch` with `credentials: 'include'` to send session cookies. The backend must have matching `Access-Control-Allow-Origin` and `Access-Control-Allow-Credentials: true` headers.

---

## 📱 Pages

| Route | Description |
|-------|-------------|
| `/dashboard` | Channel info, stats, recent videos |
| `/generate` | Manual Short generation with progress steps |
| `/auto` | Auto mode toggle, schedule selector, last/next run |
| `/logs` | Live log viewer with polling and clear action |
| `/profile` | Account settings, disconnect, and logout |

---

## 🛠 Tech Notes

- **No framework** — Vanilla JS with ES Modules (`type="module"`)
- **Build tool** — Vite (for `import.meta.env` env vars and fast HMR in dev)
- **Icons** — Inline Lucide SVGs (no external CDN needed)
- **Timeouts** — All API calls have a 30-second timeout via `AbortController`
- **Error handling** — Centralized in `api.js`; 401 responses redirect to login
- **Cookies** — `credentials: 'include'` on every fetch for session cookie support