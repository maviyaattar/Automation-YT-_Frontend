/**
 * app.js — App initialization, auth check, sidebar/nav, routing
 */

import { icon } from './icons.js';
import { auth } from './api.js';
import { store } from './store.js';
import { initRouter, route, navigate, replace, render } from './router.js';
import { toastError } from './toast.js';

// Pages (lazy-loaded via async functions)
import { renderLogin, initLogin } from './pages/login.js';
import { dashboardPage } from './pages/dashboard.js';
import { generatePage } from './pages/generate.js';
import { autoPage } from './pages/auto.js';
import { logsPage } from './pages/logs.js';
import { profilePage } from './pages/profile.js';

// ---- Sidebar HTML ----
function buildSidebar(user) {
  const name = user?.name || user?.email || 'User';
  const email = user?.email || '';
  const initial = name[0].toUpperCase();

  return `
    <aside class="sidebar" id="sidebar">
      <!-- Logo -->
      <div class="sidebar-logo">
        <div class="sidebar-logo-icon">
          ${icon('youtube', { size: 20 })}
        </div>
        <div class="sidebar-logo-text">
          <span class="sidebar-logo-name">AutoShorts AI</span>
          <span class="sidebar-logo-tagline">YouTube Automation</span>
        </div>
      </div>

      <!-- Nav -->
      <nav class="sidebar-nav">
        <div class="nav-section-label">Main</div>

        <a class="nav-item" data-path="/dashboard" href="/dashboard">
          ${icon('layoutDashboard', { size: 18 })}
          <span class="nav-item-label">Dashboard</span>
        </a>

        <a class="nav-item" data-path="/generate" href="/generate">
          ${icon('sparkles', { size: 18 })}
          <span class="nav-item-label">Generate</span>
        </a>

        <a class="nav-item" data-path="/auto" href="/auto">
          ${icon('bolt', { size: 18 })}
          <span class="nav-item-label">Auto Mode</span>
        </a>

        <div class="nav-section-label">Monitoring</div>

        <a class="nav-item" data-path="/logs" href="/logs">
          ${icon('scrollText', { size: 18 })}
          <span class="nav-item-label">Logs</span>
        </a>

        <div class="nav-section-label">Account</div>

        <a class="nav-item" data-path="/profile" href="/profile">
          ${icon('user', { size: 18 })}
          <span class="nav-item-label">Profile</span>
        </a>
      </nav>

      <!-- User footer -->
      <div class="sidebar-footer">
        <div class="sidebar-user" data-path="/profile">
          <div class="sidebar-user-avatar">
            ${user?.avatar
              ? `<img src="${user.avatar}" alt="${name}" onerror="this.style.display='none';this.parentElement.textContent='${initial}'">`
              : initial
            }
          </div>
          <div class="sidebar-user-info">
            <div class="sidebar-user-name">${escHtml(name)}</div>
            <div class="sidebar-user-email">${escHtml(email)}</div>
          </div>
        </div>
      </div>
    </aside>

    <!-- Mobile overlay -->
    <div class="sidebar-overlay" id="sidebar-overlay"></div>
  `;
}

function buildTopbar() {
  return `
    <header class="topbar" id="topbar">
      <button class="topbar-hamburger" id="hamburger-btn" aria-label="Toggle menu">
        ${icon('menu', { size: 20 })}
      </button>
      <div class="topbar-logo">
        <div class="topbar-logo-icon">
          ${icon('youtube', { size: 16 })}
        </div>
        <span class="topbar-name">AutoShorts</span>
      </div>
      <div style="width:36px;"></div>
    </header>
  `;
}

function buildAppShell(user) {
  return `
    ${buildTopbar()}
    ${buildSidebar(user)}
    <main class="main-content">
      <div id="view"></div>
    </main>
  `;
}

function setupSidebarToggle() {
  const hamburger = document.getElementById('hamburger-btn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (!hamburger || !sidebar || !overlay) return;

  function openSidebar() {
    sidebar.classList.add('open');
    overlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('visible');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', () => {
    if (sidebar.classList.contains('open')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });

  overlay.addEventListener('click', closeSidebar);

  // Close sidebar on route change (mobile)
  document.addEventListener('click', (e) => {
    const navItem = e.target.closest('[data-path]');
    if (navItem && window.innerWidth <= 768) {
      closeSidebar();
    }
  });
}

function registerRoutes() {
  route('/dashboard', () => dashboardPage());
  route('/generate', () => generatePage());
  route('/auto', () => autoPage());
  route('/logs', () => logsPage());
  route('/profile', () => profilePage());
}

async function checkAuth() {
  try {
    const data = await auth.status();
    return data;
  } catch (err) {
    return null;
  }
}

function showLoginScreen() {
  document.getElementById('app').innerHTML = renderLogin();
  const app = document.getElementById('app');
  initLogin(app);
}

function showLoadingScreen() {
  document.getElementById('app').innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px;background:var(--color-bg);">
      <div style="width:48px;height:48px;background:var(--color-primary);border-radius:12px;display:flex;align-items:center;justify-content:center;color:white;margin-bottom:4px;">
        ${icon('youtube', { size: 28 })}
      </div>
      <div class="spinner"></div>
      <p style="font-size:13px;color:var(--color-text-muted);">Loading AutoShorts AI…</p>
    </div>
  `;
}

function handleInitialRoute() {
  const path = window.location.pathname;
  const validRoutes = ['/dashboard', '/generate', '/auto', '/logs', '/profile'];
  if (validRoutes.includes(path)) {
    render(path);
  } else {
    replace('/dashboard');
  }
}

async function init() {
  showLoadingScreen();

  // Check if user is authenticated
  const authData = await checkAuth();
  const user = authData?.user || authData?.profile || authData || null;
  const isAuthenticated = !!(authData && (authData.authenticated || authData.isAuthenticated || authData.user || authData.email || authData.name));

  if (!isAuthenticated) {
    showLoginScreen();
    return;
  }

  // Update store
  store.set({ user, isAuthenticated: true, isLoadingAuth: false });

  // Build app shell
  document.getElementById('app').innerHTML = buildAppShell(user);

  // Setup sidebar toggle
  setupSidebarToggle();

  // Register routes and init router
  registerRoutes();
  initRouter();

  // Navigate to current path or dashboard
  handleInitialRoute();
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Start app
init();
