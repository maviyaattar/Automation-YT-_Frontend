/**
 * modal.js — Modal popup system
 */

import { icon } from './icons.js';

let activeModal = null;

/**
 * Show a confirmation modal
 * @param {object} opts
 * @param {string} opts.type - 'danger' | 'warning' | 'info'
 * @param {string} opts.title
 * @param {string} [opts.subtitle]
 * @param {string} opts.body - HTML or text content
 * @param {string} [opts.confirmText] - confirm button label
 * @param {string} [opts.cancelText]
 * @param {string} [opts.confirmClass] - btn class for confirm button
 * @returns {Promise<boolean>} resolves true on confirm, false on cancel
 */
export function showModal(opts) {
  return new Promise(resolve => {
    // Close any open modal
    if (activeModal) {
      activeModal.remove();
      activeModal = null;
    }

    const {
      type = 'danger',
      title,
      subtitle = '',
      body = '',
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      confirmClass = type === 'danger' ? 'btn-danger' : 'btn-primary',
    } = opts;

    const iconMap = {
      danger: 'alertTriangle',
      warning: 'alertTriangle',
      info: 'info',
    };

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal-header">
          <div class="modal-icon ${type}">
            ${icon(iconMap[type] || 'alertTriangle', { size: 22 })}
          </div>
          <div>
            <div class="modal-title" id="modal-title">${escHtml(title)}</div>
            ${subtitle ? `<div class="modal-subtitle">${escHtml(subtitle)}</div>` : ''}
          </div>
        </div>
        ${body ? `<div class="modal-body"><p>${body}</p></div>` : ''}
        <div class="modal-footer">
          <button class="btn btn-secondary" id="modal-cancel">${escHtml(cancelText)}</button>
          <button class="btn ${confirmClass}" id="modal-confirm">
            <span class="btn-spinner"></span>
            <span class="btn-text-content">${escHtml(confirmText)}</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    activeModal = backdrop;

    const confirmBtn = backdrop.querySelector('#modal-confirm');
    const cancelBtn = backdrop.querySelector('#modal-cancel');

    const close = (result) => {
      backdrop.style.animation = 'modal-fade-in 0.15s ease reverse';
      setTimeout(() => {
        backdrop.remove();
        if (activeModal === backdrop) activeModal = null;
      }, 150);
      resolve(result);
    };

    confirmBtn.addEventListener('click', () => close(true));
    cancelBtn.addEventListener('click', () => close(false));

    // Close on backdrop click
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) close(false);
    });

    // Close on Escape
    const keyHandler = (e) => {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', keyHandler);
        close(false);
      }
    };
    document.addEventListener('keydown', keyHandler);

    // Focus confirm button
    setTimeout(() => confirmBtn.focus(), 50);
  });
}

/**
 * Set a modal confirm button into loading state
 * Useful when the confirm action involves an async operation.
 * @param {boolean} loading
 */
export function setModalLoading(loading) {
  if (!activeModal) return;
  const btn = activeModal.querySelector('#modal-confirm');
  if (!btn) return;
  if (loading) {
    btn.classList.add('loading');
    btn.disabled = true;
    activeModal.querySelector('#modal-cancel').disabled = true;
  } else {
    btn.classList.remove('loading');
    btn.disabled = false;
    activeModal.querySelector('#modal-cancel').disabled = false;
  }
}

function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
