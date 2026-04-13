/**
 * logs.js — Logs page with live polling, color-coded levels, clear action
 */

import { icon } from '../icons.js';
import { logs as logsApi } from '../api.js';
import { toastSuccess, toastError } from '../toast.js';
import { showModal } from '../modal.js';

const POLL_INTERVAL = 5000; // 5 seconds
let pollTimer = null;

function getLevelClass(level) {
  if (!level) return 'info';
  const l = level.toLowerCase();
  if (l === 'error' || l === 'err') return 'error';
  if (l === 'warn' || l === 'warning') return 'warning';
  if (l === 'success' || l === 'ok') return 'success';
  if (l === 'debug' || l === 'verbose') return 'debug';
  return 'info';
}

function formatLogTime(ts) {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
  } catch { return ts; }
}

function renderLogEntries(entries) {
  if (!entries || entries.length === 0) {
    return `
      <div style="display:flex;align-items:center;justify-content:center;height:160px;color:#475569;font-size:12px;">
        No log entries found.
      </div>
    `;
  }

  return entries.map(entry => {
    // Support multiple log formats
    const message = entry?.message || entry?.msg || entry?.log || entry || '';
    const level = entry?.level || entry?.type || 'info';
    const ts = entry?.timestamp || entry?.time || entry?.created_at || '';
    const levelClass = getLevelClass(level);

    return `
      <div class="log-entry">
        ${ts ? `<span class="log-time">[${formatLogTime(ts)}]</span>` : ''}
        <span class="log-level ${levelClass}">${levelClass.toUpperCase()}</span>
        <span class="log-message">${escHtml(String(message))}</span>
      </div>
    `;
  }).join('');
}

function renderLogContainer(entries) {
  return `<div class="log-container" id="log-terminal">${renderLogEntries(entries)}</div>`;
}

async function fetchAndRenderLogs(container, { showError = true } = {}) {
  const terminalEl = container.querySelector('#log-terminal');
  if (!terminalEl) return;

  try {
    const data = await logsApi.get();
    const entries = Array.isArray(data) ? data : (data?.logs || data?.entries || []);

    // Save scroll position
    const isAtBottom = terminalEl.scrollHeight - terminalEl.scrollTop <= terminalEl.clientHeight + 40;

    terminalEl.innerHTML = renderLogEntries(entries);

    // Update count badge
    const countEl = container.querySelector('#log-count');
    if (countEl) countEl.textContent = entries.length;

    // Auto-scroll if was at bottom
    if (isAtBottom) {
      terminalEl.scrollTop = terminalEl.scrollHeight;
    }
  } catch (err) {
    if (showError) {
      console.error('Failed to fetch logs:', err);
    }
  }
}

export function logsPage() {
  const html = `
    <div class="page-container animate-slide-up">
      <div class="page-header">
        <h1 class="page-title">Logs</h1>
        <p class="page-subtitle">Real-time logs from your automation pipeline.</p>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-header-left">
            ${icon('terminal', { size: 18 })}
            <div>
              <div class="card-title">System Logs</div>
              <div class="card-subtitle"><span id="log-count">0</span> entries</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <div class="badge badge-active" id="poll-badge">
              <div class="badge-dot"></div> Live
            </div>
            <button class="btn btn-secondary btn-sm" id="refresh-logs-btn" title="Refresh logs">
              ${icon('refreshCw', { size: 14 })}
            </button>
            <button class="btn btn-danger-outline btn-sm" id="clear-logs-btn">
              ${icon('trash2', { size: 14 })} Clear
            </button>
          </div>
        </div>
        <div class="card-body" style="padding:16px;">
          <!-- Log level legend -->
          <div style="display:flex;gap:16px;margin-bottom:12px;flex-wrap:wrap;">
            <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--color-text-secondary);">
              <span style="font-family:var(--font-mono);font-weight:700;font-size:11px;color:#3b82f6;">INFO</span> Informational
            </div>
            <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--color-text-secondary);">
              <span style="font-family:var(--font-mono);font-weight:700;font-size:11px;color:#10b981;">SUCCESS</span> Completed
            </div>
            <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--color-text-secondary);">
              <span style="font-family:var(--font-mono);font-weight:700;font-size:11px;color:#f59e0b;">WARNING</span> Warnings
            </div>
            <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--color-text-secondary);">
              <span style="font-family:var(--font-mono);font-weight:700;font-size:11px;color:#ef4444;">ERROR</span> Errors
            </div>
            <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--color-text-secondary);">
              <span style="font-family:var(--font-mono);font-weight:700;font-size:11px;color:#8b5cf6;">DEBUG</span> Debug
            </div>
          </div>

          <!-- Loading state -->
          <div id="logs-loading" style="display:flex;align-items:center;justify-content:center;height:120px;gap:12px;color:var(--color-text-secondary);font-size:13px;">
            <div class="spinner sm"></div> Loading logs…
          </div>

          <!-- Terminal -->
          <div id="log-terminal-wrapper" style="display:none;">
            <div class="log-container" id="log-terminal"></div>
          </div>
        </div>
        <div class="card-footer" style="display:flex;align-items:center;justify-content:space-between;font-size:12px;color:var(--color-text-muted);">
          <span>Auto-refreshes every 5 seconds</span>
          <span id="last-updated">—</span>
        </div>
      </div>
    </div>
  `;

  return {
    html,
    init(container) {
      const refreshBtn = container.querySelector('#refresh-logs-btn');
      const clearBtn = container.querySelector('#clear-logs-btn');
      const loadingEl = container.querySelector('#logs-loading');
      const terminalWrapper = container.querySelector('#log-terminal-wrapper');
      const lastUpdatedEl = container.querySelector('#last-updated');
      const pollBadge = container.querySelector('#poll-badge');

      async function initialLoad() {
        loadingEl.style.display = 'flex';
        terminalWrapper.style.display = 'none';

        try {
          const data = await logsApi.get();
          const entries = Array.isArray(data) ? data : (data?.logs || data?.entries || []);

          loadingEl.style.display = 'none';
          terminalWrapper.style.display = 'block';
          container.querySelector('#log-terminal').innerHTML = renderLogEntries(entries);
          container.querySelector('#log-count').textContent = entries.length;

          // Scroll to bottom
          const terminal = container.querySelector('#log-terminal');
          terminal.scrollTop = terminal.scrollHeight;

          updateLastUpdated();
        } catch (err) {
          loadingEl.innerHTML = `
            <div style="text-align:center;">
              <div style="color:var(--color-error);margin-bottom:8px;">${icon('alertCircle', { size: 18 })}</div>
              <div style="font-size:13px;color:var(--color-error);">Failed to load logs</div>
              <div style="font-size:12px;color:var(--color-text-muted);margin-top:4px;">${err.message}</div>
            </div>
          `;
        }
      }

      function updateLastUpdated() {
        if (lastUpdatedEl) {
          lastUpdatedEl.textContent = `Last updated: ${new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date())}`;
        }
      }

      // Initial load
      initialLoad();

      // Start polling
      pollTimer = setInterval(async () => {
        if (terminalWrapper.style.display === 'none') return;
        await fetchAndRenderLogs(container, { showError: false });
        updateLastUpdated();
      }, POLL_INTERVAL);

      // Refresh button
      refreshBtn.addEventListener('click', async () => {
        const origInner = refreshBtn.innerHTML;
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = `<div class="spinner sm"></div>`;
        await fetchAndRenderLogs(container);
        updateLastUpdated();
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = origInner;
      });

      // Clear logs
      clearBtn.addEventListener('click', async () => {
        const confirmed = await showModal({
          type: 'danger',
          title: 'Clear All Logs',
          subtitle: 'This action cannot be undone.',
          body: 'Are you sure you want to permanently delete all log entries? This will clear the entire log history.',
          confirmText: 'Clear Logs',
          cancelText: 'Cancel',
        });

        if (!confirmed) return;

        clearBtn.classList.add('loading');
        clearBtn.disabled = true;

        try {
          await logsApi.clear();
          const terminal = container.querySelector('#log-terminal');
          if (terminal) {
            terminal.innerHTML = `
              <div style="display:flex;align-items:center;justify-content:center;height:160px;color:#475569;font-size:12px;">
                Logs cleared.
              </div>
            `;
          }
          container.querySelector('#log-count').textContent = '0';
          toastSuccess('Logs cleared', 'All log entries have been deleted.');
        } catch (err) {
          toastError('Clear failed', err.message);
        } finally {
          clearBtn.classList.remove('loading');
          clearBtn.disabled = false;
        }
      });

      // Return cleanup function
      return () => {
        if (pollTimer) {
          clearInterval(pollTimer);
          pollTimer = null;
        }
      };
    },
  };
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
