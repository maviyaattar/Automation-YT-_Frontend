/**
 * router.js — History API SPA Router
 */

import { store } from './store.js';

const routes = new Map();
let currentCleanup = null;

/**
 * Register a route
 * @param {string} path - e.g. '/dashboard'
 * @param {Function} handler - async function that returns rendered content
 */
export function route(path, handler) {
  routes.set(path, handler);
}

/**
 * Navigate to a path (pushes history state)
 * @param {string} path
 */
export function navigate(path) {
  if (window.location.pathname === path) return;
  history.pushState(null, '', path);
  render(path);
}

/**
 * Replace current path without adding to history
 * @param {string} path
 */
export function replace(path) {
  history.replaceState(null, '', path);
  render(path);
}

/**
 * Render the current route into #view
 */
export async function render(path) {
  const viewEl = document.getElementById('view');
  if (!viewEl) return;

  // Update active nav item
  store.set({ currentRoute: path });
  updateNav(path);

  // Run cleanup of previous page
  if (typeof currentCleanup === 'function') {
    try { currentCleanup(); } catch (e) { /* ignore */ }
    currentCleanup = null;
  }

  // Find handler (exact match first, then prefix)
  let handler = routes.get(path);
  if (!handler) {
    // Try to find by prefix (e.g. /generate matches /generate)
    for (const [routePath, h] of routes) {
      if (path.startsWith(routePath + '/') || path === routePath) {
        handler = h;
        break;
      }
    }
  }

  if (!handler) {
    viewEl.innerHTML = renderNotFound();
    addPageTransition(viewEl);
    return;
  }

  try {
    const result = await handler(path);
    if (result && typeof result === 'object') {
      if (result.html) {
        viewEl.innerHTML = result.html;
      }
      if (typeof result.init === 'function') {
        currentCleanup = result.init(viewEl) || null;
      }
    } else if (typeof result === 'string') {
      viewEl.innerHTML = result;
    }
    addPageTransition(viewEl);
    // Scroll to top
    viewEl.closest('.main-content')?.scrollTo(0, 0);
    window.scrollTo(0, 0);
  } catch (err) {
    console.error('Route error:', err);
    viewEl.innerHTML = renderError(err);
    addPageTransition(viewEl);
  }
}

function addPageTransition(el) {
  el.classList.remove('page-enter');
  // Force reflow
  void el.offsetWidth;
  el.classList.add('page-enter');
}

function updateNav(path) {
  document.querySelectorAll('.nav-item[data-path]').forEach(item => {
    const itemPath = item.getAttribute('data-path');
    const isActive = path === itemPath || (itemPath !== '/' && path.startsWith(itemPath));
    item.classList.toggle('active', isActive);
  });
}

function renderNotFound() {
  return `
    <div class="page-container">
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </div>
        <div class="empty-state-title">404 — Page Not Found</div>
        <div class="empty-state-desc">The page you're looking for doesn't exist.</div>
        <button class="btn btn-primary" onclick="history.back()">Go Back</button>
      </div>
    </div>
  `;
}

function renderError(err) {
  return `
    <div class="page-container">
      <div class="empty-state">
        <div class="empty-state-icon" style="background: var(--color-error-bg); color: var(--color-error);">
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <div class="empty-state-title">Something went wrong</div>
        <div class="empty-state-desc">${err?.message || 'An unexpected error occurred.'}</div>
        <button class="btn btn-primary" onclick="window.location.reload()">Reload Page</button>
      </div>
    </div>
  `;
}

/** Initialize router (call once on app start) */
export function initRouter() {
  // Handle back/forward navigation
  window.addEventListener('popstate', () => {
    render(window.location.pathname);
  });

  // Intercept all clicks on nav-item elements
  document.addEventListener('click', (e) => {
    const navItem = e.target.closest('[data-path]');
    if (navItem && navItem.getAttribute('data-path')) {
      e.preventDefault();
      navigate(navItem.getAttribute('data-path'));
    }
  });
}
