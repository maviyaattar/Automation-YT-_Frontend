/**
 * app.js — App initialization, auth check, sidebar/nav, routing
 */

import { icon } from './icons.js';
import { auth, ApiError } from './api.js';
import { store, bus } from './store.js';
import { initRouter, route, replace, render } from './router.js';
import { toastError } from './toast.js';

// Pages
import { renderLogin, initLogin } from './pages/login.js';
import { dashboardPage } from './pages/dashboard.js';
import { generatePage } from './pages/generate.js';
import { autoPage } from './pages/auto.js';
import { logsPage } from './pages/logs.js';
import { profilePage } from './pages/profile.js';

// ================= SIDEBAR =================
function buildSidebar(user) {
  const name = user?.name || user?.email || 'User';
  const email = user?.email || '';
  const initial = name[0]?.toUpperCase() || 'U';

  return `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-logo">
        ${icon('youtube')}
        <div>
          <span>AutoShorts AI</span>
          <small>YouTube Automation</small>
        </div>
      </div>

      <nav class="sidebar-nav">
        <a class="nav-item" data-path="/dashboard">${icon('layoutDashboard')} Dashboard</a>
        <a class="nav-item" data-path="/generate">${icon('sparkles')} Generate</a>
        <a class="nav-item" data-path="/auto">${icon('bolt')} Auto Mode</a>
        <a class="nav-item" data-path="/logs">${icon('scrollText')} Logs</a>
        <a class="nav-item" data-path="/profile">${icon('user')} Profile</a>
      </nav>

      <div class="sidebar-footer">
        <div>${initial}</div>
        <div>
          <div>${escHtml(name)}</div>
          <small>${escHtml(email)}</small>
        </div>
      </div>
    </aside>

    <div id="sidebar-overlay"></div>
  `;
}

// ================= ROUTES =================
function registerRoutes() {
  route('/dashboard', dashboardPage);
  route('/generate', generatePage);
  route('/auto', autoPage);
  route('/logs', logsPage);
  route('/profile', profilePage);
}

// ================= AUTH =================
async function checkAuth() {
  try {
    return await auth.status();
  } catch (err) {
    // 401 means not authenticated — normal flow, not an error
    if (err instanceof ApiError && err.status === 401) return { authenticated: false };
    return null;
  }
}

// ================= SCREENS =================
function showLogin() {
  const app = document.getElementById('app');
  app.innerHTML = renderLogin();
  initLogin(app);
}

function showLoading() {
  document.getElementById('app').innerHTML = `
    <div class="center">
      <div class="spinner"></div>
      <p>Loading...</p>
    </div>
  `;
}

// ================= INIT =================
async function init() {
  showLoading();

  // Pages can emit 'unauthenticated' on the bus when they receive a 401
  bus.on('unauthenticated', () => {
    store.set({ user: null, isAuthenticated: false });
    showLogin();
  });

  const authData = await checkAuth();

  const isAuthenticated = authData?.authenticated === true;

  if (!isAuthenticated) {
    showLogin();
    return;
  }

  const user = authData.user || {
    email: '',
    name: 'User',
    avatar: null
  };

  store.set({ user, isAuthenticated: true });

  document.getElementById('app').innerHTML = `
    ${buildSidebar(user)}
    <main><div id="view"></div></main>
  `;

  registerRoutes();
  initRouter();

  const path = window.location.pathname;
  const valid = ['/dashboard','/generate','/auto','/logs','/profile'];

  valid.includes(path) ? render(path) : replace('/dashboard');
}

// ================= UTIL =================
function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;');
}

// ================= START =================
init();
