/**
 * dashboard.js — Dashboard page
 */

import { icon } from '../icons.js';
import { dashboard as dashboardApi, ApiError } from '../api.js';
import { toastError } from '../toast.js';
import { bus } from '../store.js';

function formatNumber(n) {
  if (!n && n !== 0) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dateStr));
  } catch { return dateStr; }
}

function skeletonDashboard() {
  return `
    <div class="page-container">
      <div class="page-header">
        <div class="skeleton skeleton-text lg" style="width:200px;margin-bottom:8px;"></div>
        <div class="skeleton skeleton-text" style="width:300px;"></div>
      </div>

      <!-- Channel skeleton -->
      <div class="skeleton" style="height:160px;border-radius:14px;margin-bottom:24px;"></div>

      <!-- Stats skeletons -->
      <div class="grid-4 stagger" style="margin-bottom:32px;">
        ${Array(4).fill(`
          <div class="card stat-card">
            <div class="skeleton skeleton-circle" style="width:44px;height:44px;margin-bottom:16px;"></div>
            <div class="skeleton skeleton-text lg" style="width:80px;margin-bottom:8px;"></div>
            <div class="skeleton skeleton-text" style="width:120px;"></div>
          </div>
        `).join('')}
      </div>

      <!-- Videos skeleton -->
      <div class="card">
        <div class="card-header">
          <div class="skeleton skeleton-text" style="width:140px;"></div>
        </div>
        <div class="card-body" style="padding:8px 16px;">
          ${Array(5).fill(`
            <div class="video-card">
              <div class="skeleton" style="width:80px;height:52px;border-radius:6px;flex-shrink:0;"></div>
              <div style="flex:1;">
                <div class="skeleton skeleton-text" style="width:80%;margin-bottom:8px;"></div>
                <div class="skeleton skeleton-text sm" style="width:50%;"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderChannelBanner(channel) {
  const initial = (channel?.name || 'C')[0].toUpperCase();
  return `
    <div class="channel-banner">
      <div class="channel-avatar">
        ${channel?.avatar
          ? `<img src="${channel.avatar}" alt="${channel?.name || 'Channel'}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
             <div class="channel-avatar-placeholder" style="display:none;">${icon('youtube', { size: 36 })}</div>`
          : `<div class="channel-avatar-placeholder">${icon('youtube', { size: 36 })}</div>`
        }
      </div>
      <div style="flex:1;min-width:0;">
        <div class="channel-name">${channel?.name || 'Your Channel'}</div>
        ${channel?.handle ? `<div class="channel-handle">${channel.handle}</div>` : ''}
        <div class="channel-stats">
          <div class="channel-stat">
            <span class="channel-stat-value">${formatNumber(channel?.subscriberCount)}</span>
            <span class="channel-stat-label">Subscribers</span>
          </div>
          <div class="channel-stat">
            <span class="channel-stat-value">${formatNumber(channel?.videoCount)}</span>
            <span class="channel-stat-label">Videos</span>
          </div>
          <div class="channel-stat">
            <span class="channel-stat-value">${formatNumber(channel?.viewCount)}</span>
            <span class="channel-stat-label">Total Views</span>
          </div>
        </div>
      </div>
      <div class="badge badge-active" style="align-self:flex-start;">
        <div class="badge-dot"></div> Active
      </div>
    </div>
  `;
}

function renderStatCards(data) {
  const stats = [
    {
      icon: 'video',
      iconClass: 'indigo',
      value: formatNumber(data?.totalShorts || data?.shortsCount),
      label: 'Shorts Created',
      change: null,
    },
    {
      icon: 'eye',
      iconClass: 'blue',
      value: formatNumber(data?.totalViews),
      label: 'Total Views',
      change: null,
    },
    {
      icon: 'thumbsUp',
      iconClass: 'green',
      value: formatNumber(data?.totalLikes),
      label: 'Total Likes',
      change: null,
    },
    {
      icon: 'activity',
      iconClass: 'amber',
      value: data?.autoEnabled ? 'ON' : 'OFF',
      label: 'Auto Mode',
      change: null,
    },
  ];

  return `
    <div class="grid-4 stagger" style="margin-bottom:32px;">
      ${stats.map(s => `
        <div class="card stat-card hover-lift">
          <div class="stat-card-icon ${s.iconClass}">${icon(s.icon, { size: 22 })}</div>
          <div class="stat-value">${s.value || '—'}</div>
          <div class="stat-label">${s.label}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderRecentVideos(videos) {
  if (!videos || videos.length === 0) {
    return `
      <div class="empty-state" style="padding: 48px 32px;">
        <div class="empty-state-icon">${icon('video', { size: 30 })}</div>
        <div class="empty-state-title">No videos yet</div>
        <div class="empty-state-desc">Generate your first YouTube Short to see it here.</div>
        <button class="btn btn-primary" data-path="/generate">
          ${icon('sparkles', { size: 16 })} Create First Short
        </button>
      </div>
    `;
  }

  return videos.map(v => `
    <div class="video-card">
      <div class="video-thumbnail">
        ${v.thumbnail
          ? `<img src="${v.thumbnail}" alt="${v.title || 'Video'}" loading="lazy"
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
             <div class="video-thumbnail-placeholder" style="display:none;">${icon('play', { size: 24 })}</div>`
          : `<div class="video-thumbnail-placeholder">${icon('play', { size: 24 })}</div>`
        }
      </div>
      <div class="video-info">
        <div class="video-title">${v.title || 'Untitled'}</div>
        <div class="video-meta">
          ${v.views ? `${formatNumber(v.views)} views · ` : ''}${formatDate(v.publishedAt || v.createdAt)}
        </div>
      </div>
      ${v.status ? `<div class="badge badge-${v.status === 'published' ? 'active' : 'neutral'}">${v.status}</div>` : ''}
    </div>
  `).join('');
}

function renderError(message, retryFn) {
  return `
    <div class="page-container">
      <div class="alert alert-error" style="margin-bottom:16px;">
        ${icon('alertCircle', { size: 18 })}
        <div class="alert-content">
          <div class="alert-title">Failed to load dashboard</div>
          ${message}
        </div>
      </div>
      <div class="empty-state">
        <div class="empty-state-icon" style="background:var(--color-error-bg);color:var(--color-error);">
          ${icon('refreshCw', { size: 30 })}
        </div>
        <div class="empty-state-title">Could not load your data</div>
        <div class="empty-state-desc">${message}</div>
        <button class="btn btn-primary" id="dashboard-retry">
          ${icon('refreshCw', { size: 16 })} Retry
        </button>
      </div>
    </div>
  `;
}

async function loadDashboard(container) {
  const view = container.querySelector('#dashboard-view');
  if (!view) return;

  view.innerHTML = skeletonDashboard();

  try {
    const data = await dashboardApi.get();
    const channel = data?.channel || data?.channelInfo || {};
    const videos = data?.recentVideos || data?.videos || [];
    view.innerHTML = `
      <div class="page-container animate-slide-up">
        <div class="page-header">
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">Overview of your YouTube Shorts automation.</p>
        </div>

        ${renderChannelBanner(channel)}
        ${renderStatCards(data)}

        <div class="card">
          <div class="card-header">
            <div class="card-header-left">
              ${icon('video', { size: 18 })}
              <div>
                <div class="card-title">Recent Shorts</div>
                <div class="card-subtitle">${videos.length} video${videos.length !== 1 ? 's' : ''} found</div>
              </div>
            </div>
            <button class="btn btn-secondary btn-sm" data-path="/generate">
              ${icon('sparkles', { size: 14 })} Create New
            </button>
          </div>
          <div class="card-body" style="padding: 8px 16px;">
            ${renderRecentVideos(videos)}
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      bus.emit('unauthenticated');
      return;
    }
    view.innerHTML = renderError(err.message || 'Failed to load dashboard');
    const retryBtn = view.querySelector('#dashboard-retry');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => loadDashboard(container));
    }
  }
}

export function dashboardPage() {
  return {
    html: `<div id="dashboard-view">${skeletonDashboard()}</div>`,
    init(container) {
      loadDashboard(container);
    },
  };
}
