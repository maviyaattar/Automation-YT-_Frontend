/**
 * auto.js — Auto Mode page
 */

import { icon } from '../icons.js';
import { auto as autoApi, profile as profileApi, ApiError } from '../api.js';
import { toastSuccess, toastError, toastInfo } from '../toast.js';
import { store, bus } from '../store.js';

const SCHEDULES = [
  { value: 'hourly',  label: 'Every Hour',   desc: 'Post once per hour (high frequency)',  hours: 1   },
  { value: '4hours',  label: 'Every 4 Hours', desc: 'Post 6 times per day',                 hours: 4   },
  { value: '12hours', label: 'Twice Daily',   desc: 'Post morning and evening',             hours: 12  },
  { value: 'daily',   label: 'Once Daily',    desc: 'Post once per day (recommended)',      hours: 24  },
  { value: 'weekly',  label: 'Weekly',        desc: 'Post once per week',                   hours: 168 },
];

/** Convert a schedule string ('daily', etc.) to hours number for the backend. */
function scheduleToHours(value) {
  return SCHEDULES.find(s => s.value === value)?.hours ?? 24;
}

/** Convert a scheduleHours number from the backend to our schedule string. */
function hoursToSchedule(hours) {
  if (!hours && hours !== 0) return 'daily';
  // Pick the closest match
  let best = SCHEDULES[3]; // default: daily
  let bestDiff = Infinity;
  for (const s of SCHEDULES) {
    const diff = Math.abs(s.hours - hours);
    if (diff < bestDiff) { bestDiff = diff; best = s; }
  }
  return best.value;
}

function formatDateTime(dt) {
  if (!dt) return '—';
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(dt));
  } catch { return dt; }
}

function skeletonAuto() {
  return `
    <div class="page-container">
      <div class="page-header">
        <div class="skeleton skeleton-text lg" style="width:180px;margin-bottom:8px;"></div>
        <div class="skeleton skeleton-text" style="width:320px;"></div>
      </div>
      <div class="card" style="margin-bottom:24px;">
        <div class="card-body" style="display:flex;align-items:center;justify-content:space-between;gap:16px;">
          <div>
            <div class="skeleton skeleton-text lg" style="width:160px;margin-bottom:8px;"></div>
            <div class="skeleton skeleton-text" style="width:240px;"></div>
          </div>
          <div class="skeleton" style="width:44px;height:24px;border-radius:12px;"></div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><div class="skeleton skeleton-text" style="width:140px;"></div></div>
        <div class="card-body">
          ${Array(4).fill(`
            <div style="height:72px;border:2px solid var(--color-border);border-radius:10px;margin-bottom:12px;" class="skeleton"></div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

async function loadAutoMode(container) {
  const view = container.querySelector('#auto-view');
  if (!view) return;

  view.innerHTML = skeletonAuto();

  let currentEnabled = false;
  let currentSchedule = 'daily';
  let lastRun = null;
  let nextRun = null;

  // Try to load existing auto settings from profile
  try {
    const data = await profileApi.get();
    currentEnabled = data?.autoMode?.enabled ?? data?.autoEnabled ?? false;
    // Backend stores scheduleHours (number); fall back to schedule string if present
    const rawHours = data?.autoMode?.scheduleHours ?? data?.scheduleHours ?? null;
    const rawSchedule = data?.autoMode?.schedule ?? data?.schedule ?? null;
    currentSchedule = rawHours !== null ? hoursToSchedule(rawHours) : (rawSchedule ?? 'daily');
    lastRun = data?.autoMode?.lastRun ?? data?.lastRun ?? null;
    nextRun = data?.autoMode?.nextRun ?? data?.nextRun ?? null;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      bus.emit('unauthenticated');
      return;
    }
    /* other errors are non-fatal; use defaults */
  }

  store.set({ autoEnabled: currentEnabled, autoSchedule: currentSchedule, lastRun, nextRun });
  renderAutoView(view, { currentEnabled, currentSchedule, lastRun, nextRun });
}

function renderAutoView(view, { currentEnabled, currentSchedule, lastRun, nextRun }) {
  view.innerHTML = `
    <div class="page-container animate-slide-up">
      <div class="page-header">
        <h1 class="page-title">Auto Mode</h1>
        <p class="page-subtitle">Automate your YouTube Shorts posting on a schedule.</p>
      </div>

      <!-- Status card -->
      <div class="card" style="margin-bottom:24px;">
        <div class="card-body" style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;">
          <div>
            <div style="font-size:17px;font-weight:700;color:var(--color-text);margin-bottom:4px;">Automation Status</div>
            <div style="font-size:13px;color:var(--color-text-secondary);">
              ${currentEnabled
                ? 'Auto mode is active. Shorts will be posted automatically.'
                : 'Auto mode is paused. Enable to start automated posting.'}
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:12px;">
            <div id="auto-badge" class="badge ${currentEnabled ? 'badge-active' : 'badge-neutral'}">
              ${currentEnabled ? '<div class="badge-dot"></div> Active' : 'Paused'}
            </div>
            <label class="toggle">
              <input type="checkbox" id="auto-toggle" ${currentEnabled ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      <!-- Last/Next run -->
      <div class="grid-2" style="margin-bottom:24px;">
        <div class="card stat-card hover-lift">
          <div class="stat-card-icon green">${icon('clock', { size: 22 })}</div>
          <div class="stat-value" style="font-size:14px;" id="last-run-val">${formatDateTime(lastRun)}</div>
          <div class="stat-label">Last Run</div>
        </div>
        <div class="card stat-card hover-lift">
          <div class="stat-card-icon indigo">${icon('calendarClock', { size: 22 })}</div>
          <div class="stat-value" style="font-size:14px;" id="next-run-val">${formatDateTime(nextRun)}</div>
          <div class="stat-label">Next Run</div>
        </div>
      </div>

      <!-- Schedule -->
      <div class="card" style="margin-bottom:24px;">
        <div class="card-header">
          <div class="card-header-left">
            ${icon('calendarClock', { size: 18 })}
            <div class="card-title">Schedule</div>
          </div>
        </div>
        <div class="card-body">
          <div style="display:flex;flex-direction:column;gap:12px;" id="schedule-options">
            ${SCHEDULES.map(s => `
              <label class="schedule-option ${currentSchedule === s.value ? 'selected' : ''}">
                <input type="radio" name="schedule" value="${s.value}" ${currentSchedule === s.value ? 'checked' : ''}>
                <div>
                  <div class="schedule-option-label">${s.label}</div>
                  <div class="schedule-option-desc">${s.desc}</div>
                </div>
              </label>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Topic Settings -->
      <div class="card" style="margin-bottom:24px;">
        <div class="card-header">
          <div class="card-header-left">
            ${icon('sparkles', { size: 18 })}
            <div class="card-title">Auto Topic</div>
          </div>
        </div>
        <div class="card-body">
          <div class="form-group" style="margin-bottom:16px;">
            <label class="form-label" for="auto-topic">Topic / Theme</label>
            <textarea class="textarea" id="auto-topic" rows="3"
              placeholder="Leave blank for AI to choose trending topics, or specify a theme...&#10;Example: 'space exploration facts'"
            ></textarea>
            <div class="form-hint">AI will auto-select topics if left blank.</div>
          </div>

          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label" for="auto-style">Default Style</label>
            <select class="select" id="auto-style">
              <option value="auto" selected>Auto (AI chooses)</option>
              <option value="educational">Educational</option>
              <option value="entertaining">Entertaining</option>
              <option value="motivational">Motivational</option>
              <option value="news">News & Trending</option>
              <option value="listicle">Listicle</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Save button -->
      <div style="display:flex;justify-content:flex-end;gap:12px;">
        <button class="btn btn-secondary" id="auto-run-now-btn">
          <span class="btn-spinner"></span>
          <span class="btn-text-content" style="display:flex;align-items:center;gap:8px;">
            ${icon('play', { size: 16 })} Run Now
          </span>
        </button>
        <button class="btn btn-primary" id="auto-save-btn">
          <span class="btn-spinner"></span>
          <span class="btn-text-content" style="display:flex;align-items:center;gap:8px;">
            ${icon('save', { size: 16 })} Save Settings
          </span>
        </button>
      </div>
    </div>
  `;

  // Wire up interactivity
  const toggleEl = view.querySelector('#auto-toggle');
  const badgeEl = view.querySelector('#auto-badge');
  const saveBtn = view.querySelector('#auto-save-btn');
  const runNowBtn = view.querySelector('#auto-run-now-btn');
  const scheduleOptions = view.querySelectorAll('.schedule-option');

  // Toggle badge on change
  toggleEl.addEventListener('change', () => {
    const enabled = toggleEl.checked;
    badgeEl.className = `badge ${enabled ? 'badge-active' : 'badge-neutral'}`;
    badgeEl.innerHTML = enabled ? '<div class="badge-dot"></div> Active' : 'Paused';
  });

  // Schedule option click
  scheduleOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      scheduleOptions.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
    });
  });

  // Save settings
  saveBtn.addEventListener('click', async () => {
    saveBtn.classList.add('loading');
    saveBtn.disabled = true;
    runNowBtn.disabled = true;

    const selectedSchedule = view.querySelector('input[name="schedule"]:checked')?.value || 'daily';
    const enabled = toggleEl.checked;
    const topic = view.querySelector('#auto-topic')?.value?.trim() || '';
    const style = view.querySelector('#auto-style')?.value || 'auto';

    try {
      const data = await autoApi.set({ enabled, scheduleHours: scheduleToHours(selectedSchedule) });
      store.set({ autoEnabled: enabled, autoSchedule: selectedSchedule });

      // Backend returns { autoMode, scheduleHours, lastRun, nextRun } — handle both shapes
      const newLastRun = data?.lastRun ?? data?.autoMode?.lastRun ?? null;
      const newNextRun = data?.nextRun ?? data?.autoMode?.nextRun ?? null;
      if (newLastRun) view.querySelector('#last-run-val').textContent = formatDateTime(newLastRun);
      if (newNextRun) view.querySelector('#next-run-val').textContent = formatDateTime(newNextRun);

      toastSuccess(
        enabled ? 'Auto mode enabled' : 'Auto mode paused',
        enabled ? `Posts will run ${selectedSchedule}.` : 'No more automatic posts will be made.'
      );
    } catch (err) {
      toastError('Failed to save', err.message);
    } finally {
      saveBtn.classList.remove('loading');
      saveBtn.disabled = false;
      runNowBtn.disabled = false;
    }
  });

  // Run now
  runNowBtn.addEventListener('click', async () => {
    runNowBtn.classList.add('loading');
    runNowBtn.disabled = true;
    saveBtn.disabled = true;

    const topic = view.querySelector('#auto-topic')?.value?.trim() || '';
    const style = view.querySelector('#auto-style')?.value || 'auto';

    try {
      toastInfo('Running now…', 'Triggering an immediate generation. This may take a few minutes.');
      const data = await autoApi.set({ enabled: toggleEl.checked, runNow: true });

      const newLastRun = data?.lastRun ?? data?.autoMode?.lastRun ?? null;
      const newNextRun = data?.nextRun ?? data?.autoMode?.nextRun ?? null;
      if (newLastRun) view.querySelector('#last-run-val').textContent = formatDateTime(newLastRun);
      if (newNextRun) view.querySelector('#next-run-val').textContent = formatDateTime(newNextRun);

      toastSuccess('Run triggered!', 'A new Short is being generated.');
    } catch (err) {
      toastError('Run failed', err.message);
    } finally {
      runNowBtn.classList.remove('loading');
      runNowBtn.disabled = false;
      saveBtn.disabled = false;
    }
  });
}

export function autoPage() {
  return {
    html: `<div id="auto-view">${skeletonAuto()}</div>`,
    init(container) {
      loadAutoMode(container);
    },
  };
}
