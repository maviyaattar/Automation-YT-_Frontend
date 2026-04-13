/**
 * login.js — Login / authentication page
 */

import { icon } from '../icons.js';
import { auth } from '../api.js';
import { toastError } from '../toast.js';

export function renderLogin() {
  return `
    <div class="auth-layout animate-fade-in">
      <div class="auth-card">
        <div class="auth-logo">
          ${icon('youtube', { size: 32 })}
        </div>
        <h1 class="auth-title">AutoShorts AI</h1>
        <p class="auth-subtitle">
          AI-powered YouTube Shorts automation.<br>
          Sign in to start creating viral content.
        </p>

        <button class="btn btn-google btn-full btn-lg" id="login-google-btn">
          <span class="btn-spinner"></span>
          <span class="btn-text-content" style="display:flex;align-items:center;gap:10px;justify-content:center;">
            ${icon('google', { size: 20 })}
            Continue with Google
          </span>
        </button>

        <div class="auth-divider">or</div>

        <div class="alert alert-info" style="text-align:left;">
          ${icon('info', { size: 18 })}
          <div class="alert-content">
            <div class="alert-title">Secure & private</div>
            We only access your YouTube channel to post Shorts. No data is sold.
          </div>
        </div>

        <div class="auth-footer">
          By signing in, you agree to our
          <a href="#" onclick="return false;">Terms of Service</a> and
          <a href="#" onclick="return false;">Privacy Policy</a>.
        </div>
      </div>
    </div>
  `;
}

export function initLogin(container) {
  const btn = container.querySelector('#login-google-btn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    btn.classList.add('loading');
    btn.disabled = true;
    try {
      auth.loginWithGoogle();
    } catch (err) {
      btn.classList.remove('loading');
      btn.disabled = false;
      toastError('Login failed', err.message);
    }
  });
}
