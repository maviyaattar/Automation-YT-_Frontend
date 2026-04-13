/**
 * profile.js — Profile page
 */

import { icon } from '../icons.js';
import { profile as profileApi, auth, disconnect as disconnectApi } from '../api.js';
import { toastSuccess, toastError } from '../toast.js';
import { showModal } from '../modal.js';
import { store } from '../store.js';
import { navigate } from '../router.js';

function skeletonProfile() {
  return `
    <div class="page-container">
      <div class="page-header">
        <div class="skeleton skeleton-text lg" style="width:160px;margin-bottom:8px;"></div>
        <div class="skeleton skeleton-text" style="width:280px;"></div>
      </div>

      <div class="grid-2" style="align-items:start;gap:24px;">
        <div>
          <!-- Profile card skeleton -->
          <div class="card" style="margin-bottom:24px;">
            <div class="card-body" style="display:flex;align-items:center;gap:16px;">
              <div class="skeleton skeleton-avatar"></div>
              <div style="flex:1;">
                <div class="skeleton skeleton-text lg" style="width:160px;margin-bottom:8px;"></div>
                <div class="skeleton skeleton-text" style="width:200px;"></div>
              </div>
            </div>
          </div>

          <!-- Form skeleton -->
          <div class="card">
            <div class="card-header"><div class="skeleton skeleton-text" style="width:120px;"></div></div>
            <div class="card-body">
              ${Array(3).fill(`
                <div class="form-group">
                  <div class="skeleton skeleton-text sm" style="width:80px;margin-bottom:8px;"></div>
                  <div class="skeleton" style="height:40px;border-radius:10px;"></div>
                </div>
              `).join('')}
              <div class="skeleton skeleton-btn" style="width:140px;margin-top:8px;"></div>
            </div>
          </div>
        </div>

        <div>
          <div class="skeleton" style="height:200px;border-radius:14px;"></div>
        </div>
      </div>
    </div>
  `;
}

async function loadProfile(container) {
  const view = container.querySelector('#profile-view');
  if (!view) return;

  view.innerHTML = skeletonProfile();

  let profileData = {};
  try {
    profileData = await profileApi.get();
  } catch (err) {
    view.innerHTML = `
      <div class="page-container">
        <div class="alert alert-error" style="margin-bottom:16px;">
          ${icon('alertCircle', { size: 18 })}
          <div class="alert-content">
            <div class="alert-title">Failed to load profile</div>
            ${err.message}
          </div>
        </div>
        <button class="btn btn-primary" id="profile-retry">${icon('refreshCw', { size: 16 })} Retry</button>
      </div>
    `;
    view.querySelector('#profile-retry')?.addEventListener('click', () => loadProfile(container));
    return;
  }

  const user = store.get('user') || {};
  const name = profileData?.name || user?.name || '';
  const email = profileData?.email || user?.email || '';
  const channelName = profileData?.channelName || profileData?.channel?.name || '';
  const notifications = profileData?.notifications ?? true;
  const autoEnabled = profileData?.autoMode?.enabled ?? profileData?.autoEnabled ?? false;
  const topic = profileData?.defaultTopic || '';
  const initial = (name || email || 'U')[0].toUpperCase();

  view.innerHTML = `
    <div class="page-container animate-slide-up">
      <div class="page-header">
        <h1 class="page-title">Profile & Settings</h1>
        <p class="page-subtitle">Manage your account settings and preferences.</p>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start;">
        <div>
          <!-- User card -->
          <div class="card" style="margin-bottom:24px;">
            <div class="card-body" style="display:flex;align-items:center;gap:16px;">
              <div class="avatar" style="width:56px;height:56px;font-size:20px;">
                ${profileData?.avatar
                  ? `<img src="${profileData.avatar}" alt="${name}">`
                  : initial
                }
              </div>
              <div>
                <div style="font-size:16px;font-weight:700;color:var(--color-text);">${escHtml(name) || 'No name'}</div>
                <div style="font-size:13px;color:var(--color-text-secondary);">${escHtml(email)}</div>
                ${channelName ? `<div style="font-size:12px;color:var(--color-text-muted);margin-top:2px;">Channel: ${escHtml(channelName)}</div>` : ''}
              </div>
            </div>
          </div>

          <!-- Settings form -->
          <div class="card" style="margin-bottom:24px;">
            <div class="card-header">
              <div class="card-header-left">
                ${icon('settings', { size: 18 })}
                <div class="card-title">Account Settings</div>
              </div>
            </div>
            <div class="card-body">
              <form id="profile-form">
                <div class="form-group">
                  <label class="form-label" for="profile-name">Display Name</label>
                  <input class="input" type="text" id="profile-name" value="${escHtml(name)}" placeholder="Your name">
                </div>

                <div class="form-group">
                  <label class="form-label" for="profile-email">Email</label>
                  <input class="input" type="email" id="profile-email" value="${escHtml(email)}" placeholder="Email address" disabled>
                  <div class="form-hint">Email is managed by Google OAuth and cannot be changed here.</div>
                </div>

                <div class="form-group">
                  <label class="form-label" for="profile-topic">Default Topic</label>
                  <input class="input" type="text" id="profile-topic" value="${escHtml(topic)}" placeholder="e.g. space exploration, cooking tips">
                  <div class="form-hint">Default topic for auto-generated Shorts.</div>
                </div>

                <div class="form-group" style="margin-bottom:24px;">
                  <label class="form-label">Notifications</label>
                  <label class="toggle-wrapper">
                    <div class="toggle">
                      <input type="checkbox" id="profile-notifications" ${notifications ? 'checked' : ''}>
                      <span class="toggle-slider"></span>
                    </div>
                    <div>
                      <div class="toggle-label">Email notifications</div>
                      <div class="toggle-desc">Receive emails when Shorts are generated</div>
                    </div>
                  </label>
                </div>

                <button type="submit" class="btn btn-primary" id="save-profile-btn">
                  <span class="btn-spinner"></span>
                  <span class="btn-text-content" style="display:flex;align-items:center;gap:8px;">
                    ${icon('save', { size: 16 })} Save Changes
                  </span>
                </button>
              </form>
            </div>
          </div>
        </div>

        <div>
          <!-- Account Info -->
          <div class="card" style="margin-bottom:24px;">
            <div class="card-header">
              <div class="card-header-left">
                ${icon('user', { size: 18 })}
                <div class="card-title">Account</div>
              </div>
              <div class="badge badge-active"><div class="badge-dot"></div> Connected</div>
            </div>
            <div class="card-body">
              <div style="display:flex;flex-direction:column;gap:16px;">
                <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:16px;border-bottom:1px solid var(--color-border);">
                  <div>
                    <div style="font-size:13px;font-weight:600;color:var(--color-text);">Google Account</div>
                    <div style="font-size:12px;color:var(--color-text-secondary);">${escHtml(email)}</div>
                  </div>
                  ${icon('google', { size: 20 })}
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:16px;border-bottom:1px solid var(--color-border);">
                  <div>
                    <div style="font-size:13px;font-weight:600;color:var(--color-text);">YouTube Channel</div>
                    <div style="font-size:12px;color:var(--color-text-secondary);">${channelName ? escHtml(channelName) : 'Not connected'}</div>
                  </div>
                  ${icon('youtube', { size: 20 })}
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <div>
                    <div style="font-size:13px;font-weight:600;color:var(--color-text);">Auto Mode</div>
                    <div style="font-size:12px;color:var(--color-text-secondary);">${autoEnabled ? 'Enabled' : 'Disabled'}</div>
                  </div>
                  <div class="badge ${autoEnabled ? 'badge-active' : 'badge-neutral'}">
                    ${autoEnabled ? '<div class="badge-dot"></div> On' : 'Off'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Danger zone -->
          <div class="danger-zone">
            <div class="card-header">
              <div class="card-header-left">
                ${icon('alertTriangle', { size: 18 })}
                <div class="card-title">Danger Zone</div>
              </div>
            </div>
            <div class="card-body">
              <!-- Disconnect -->
              <div class="danger-action">
                <div class="danger-action-info">
                  <div class="danger-action-title">Disconnect YouTube</div>
                  <div class="danger-action-desc">Remove access to your YouTube channel. You'll need to reconnect to post videos.</div>
                </div>
                <button class="btn btn-danger-outline btn-sm" id="disconnect-btn">
                  <span class="btn-spinner"></span>
                  <span class="btn-text-content" style="display:flex;align-items:center;gap:6px;">
                    ${icon('link2Off', { size: 14 })} Disconnect
                  </span>
                </button>
              </div>

              <!-- Logout -->
              <div class="danger-action">
                <div class="danger-action-info">
                  <div class="danger-action-title">Sign Out</div>
                  <div class="danger-action-desc">Sign out of your account on this device.</div>
                </div>
                <button class="btn btn-danger btn-sm" id="logout-btn">
                  <span class="btn-spinner"></span>
                  <span class="btn-text-content" style="display:flex;align-items:center;gap:6px;">
                    ${icon('logOut', { size: 14 })} Sign Out
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // ---- Wire up events ----
  // Save profile
  const form = view.querySelector('#profile-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = view.querySelector('#save-profile-btn');
    saveBtn.classList.add('loading');
    saveBtn.disabled = true;

    const payload = {
      name: view.querySelector('#profile-name').value.trim(),
      defaultTopic: view.querySelector('#profile-topic').value.trim(),
      notifications: view.querySelector('#profile-notifications').checked,
    };

    try {
      await profileApi.update(payload);
      store.set({ user: { ...store.get('user'), name: payload.name } });
      // Update sidebar user name
      const sidebarName = document.querySelector('.sidebar-user-name');
      if (sidebarName) sidebarName.textContent = payload.name || email;
      toastSuccess('Profile saved', 'Your settings have been updated.');
    } catch (err) {
      toastError('Save failed', err.message);
    } finally {
      saveBtn.classList.remove('loading');
      saveBtn.disabled = false;
    }
  });

  // Disconnect
  view.querySelector('#disconnect-btn').addEventListener('click', async () => {
    const confirmed = await showModal({
      type: 'danger',
      title: 'Disconnect YouTube Channel',
      subtitle: 'This will revoke API access.',
      body: 'Are you sure you want to disconnect your YouTube channel? Auto Mode will stop, and you\'ll need to reconnect to post new Shorts.',
      confirmText: 'Disconnect',
      cancelText: 'Cancel',
    });
    if (!confirmed) return;

    const btn = view.querySelector('#disconnect-btn');
    btn.classList.add('loading');
    btn.disabled = true;

    try {
      await disconnectApi.run();
      toastSuccess('Disconnected', 'Your YouTube channel has been disconnected.');
      // Reload profile
      setTimeout(() => loadProfile(container), 1000);
    } catch (err) {
      toastError('Disconnect failed', err.message);
    } finally {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  });

  // Logout
  view.querySelector('#logout-btn').addEventListener('click', async () => {
    const confirmed = await showModal({
      type: 'warning',
      title: 'Sign Out',
      subtitle: 'You will be signed out of AutoShorts AI.',
      body: 'Are you sure you want to sign out? Your settings and data will be preserved.',
      confirmText: 'Sign Out',
      cancelText: 'Cancel',
      confirmClass: 'btn-danger',
    });
    if (!confirmed) return;

    const btn = view.querySelector('#logout-btn');
    btn.classList.add('loading');
    btn.disabled = true;

    try {
      await auth.logout();
      store.set({ user: null, isAuthenticated: false });
      window.location.href = '/';
    } catch (err) {
      toastError('Logout failed', err.message);
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  });
}

export function profilePage() {
  return {
    html: `<div id="profile-view">${skeletonProfile()}</div>`,
    init(container) {
      loadProfile(container);
    },
  };
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
