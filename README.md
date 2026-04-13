# AutoShorts AI — Frontend

A production-ready, fully responsive SaaS frontend for an AI-powered YouTube Shorts automation platform. Built with **pure HTML, CSS, and Vanilla JavaScript** — no build tools, no frameworks, no dependencies.

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

Base URL: `https://automation-yt-saas.onrender.com`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/google` | Redirect to Google OAuth |
| GET | `/auth/status` | Check auth status |
| POST | `/auth/logout` | Logout |
| GET | `/dashboard` | Dashboard data |
| POST | `/generate` | Generate a Short |
| POST | `/auto` | Set auto mode |
| GET | `/logs` | Fetch logs |
| DELETE | `/logs` | Clear logs |
| GET | `/profile` | Get profile |
| PATCH | `/profile` | Update profile |
| POST | `/disconnect` | Disconnect YouTube |

---

## 🏃 Running Locally

Because this is a pure static site (no build step), you just need a static file server.

### Option 1: Python (built-in)

```bash
# Python 3
python -m http.server 8080
# Then open: http://localhost:8080
```

### Option 2: Node.js `serve`

```bash
npx serve .
# Then open the URL shown in the terminal
```

### Option 3: VS Code Live Server

Install the **Live Server** extension, right-click `index.html`, and choose "Open with Live Server".

### Option 4: Any static host

Deploy the entire folder to **Netlify**, **Vercel** (static), **GitHub Pages**, **Cloudflare Pages**, etc.

---

## 🔐 Auth Flow

1. App loads → calls `GET /auth/status`
2. If unauthenticated → shows login screen with **"Continue with Google"** button
3. Clicking the button redirects to `GET /auth/google` (full page redirect)
4. After OAuth, the backend sets a cookie and redirects back to the app
5. App re-checks auth status and renders the main SPA

> **CORS / Cookies**: All API calls use `fetch` with `credentials: 'include'` to send cookies. Your backend must have the correct `Access-Control-Allow-Origin` and `Access-Control-Allow-Credentials: true` headers.

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
- **No build tool** — Open `index.html` directly with a static server
- **No dependencies** — Zero `npm install` required
- **Icons** — Inline Lucide SVGs (no external CDN needed)
- **Timeouts** — All API calls have a 30-second timeout via `AbortController`
- **Error handling** — Centralized in `api.js`, consistent across all pages