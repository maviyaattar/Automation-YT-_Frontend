/**
 * toast.js — Toast notification system
 */

import { icon } from './icons.js';

let container = null;

function getContainer() {
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

const ICONS = {
  success: 'checkCircle',
  error: 'alertCircle',
  warning: 'alertTriangle',
  info: 'info',
};

/**
 * Show a toast notification
 * @param {object} opts
 * @param {string} opts.type - 'success' | 'error' | 'warning' | 'info'
 * @param {string} opts.title
 * @param {string} [opts.message]
 * @param {number} [opts.duration] - ms, 0 = persistent
 */
export function toast({ type = 'info', title, message, duration = 4000 }) {
  const c = getContainer();

  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `
    <div class="toast-icon">${icon(ICONS[type] || 'info', { size: 12 })}</div>
    <div class="toast-content">
      <div class="toast-title">${escHtml(title)}</div>
      ${message ? `<div class="toast-message">${escHtml(message)}</div>` : ''}
    </div>
    <button class="toast-close" aria-label="Dismiss">${icon('x', { size: 14 })}</button>
  `;

  c.appendChild(el);

  const dismiss = () => {
    el.classList.add('dismissing');
    el.addEventListener('animationend', () => el.remove(), { once: true });
    setTimeout(() => el.remove(), 400); // fallback
  };

  el.querySelector('.toast-close').addEventListener('click', dismiss);

  if (duration > 0) {
    setTimeout(dismiss, duration);
  }

  return dismiss;
}

export const toastSuccess = (title, message) => toast({ type: 'success', title, message });
export const toastError = (title, message) => toast({ type: 'error', title, message });
export const toastWarning = (title, message) => toast({ type: 'warning', title, message });
export const toastInfo = (title, message) => toast({ type: 'info', title, message });

function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
