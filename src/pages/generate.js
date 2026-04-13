/**
 * generate.js — Manual Generate page
 */

import { icon } from '../icons.js';
import { generate as generateApi } from '../api.js';
import { toastSuccess, toastError } from '../toast.js';

const STEPS = [
  { id: 'request', label: 'Sending request', desc: 'Submitting your generation request to the AI engine.' },
  { id: 'script', label: 'Generating script', desc: 'AI is writing an engaging Short script.' },
  { id: 'video', label: 'Creating video', desc: 'Assembling visuals, voiceover, and captions.' },
  { id: 'upload', label: 'Uploading to YouTube', desc: 'Publishing your Short to your channel.' },
  { id: 'done', label: 'Complete', desc: 'Your Short is live!' },
];

function renderSteps(activeIdx, errorIdx = -1) {
  return STEPS.map((step, i) => {
    let state = 'pending';
    if (i < activeIdx) state = 'completed';
    else if (i === activeIdx) state = 'active';
    if (i === errorIdx) state = 'error';

    const stepIcon = state === 'completed'
      ? icon('check', { size: 18 })
      : state === 'error'
        ? icon('x', { size: 18 })
        : state === 'active'
          ? `<div class="spinner sm"></div>`
          : `<span style="font-size:12px;font-weight:700;color:var(--color-text-muted);">${i + 1}</span>`;

    return `
      <div class="progress-step ${state}">
        <div class="progress-step-indicator">${stepIcon}</div>
        <div class="progress-step-content">
          <div class="progress-step-title">${step.label}</div>
          <div class="progress-step-desc">${step.desc}</div>
        </div>
      </div>
    `;
  }).join('');
}

function renderResult(data) {
  if (!data) return '';

  const videoUrl = data?.videoUrl || data?.url || data?.youtubeUrl;
  const title = data?.title || 'Your Short';
  const description = data?.description || '';
  const videoId = videoUrl ? extractVideoId(videoUrl) : null;

  return `
    <div class="card animate-slide-up" style="margin-top:32px;">
      <div class="card-header">
        <div class="card-header-left">
          ${icon('checkCircle', { size: 18 })}
          <div>
            <div class="card-title" style="color:var(--color-success);">Short Generated!</div>
            <div class="card-subtitle">Your video is ready and has been uploaded.</div>
          </div>
        </div>
        <div class="badge badge-active"><div class="badge-dot"></div> Live</div>
      </div>
      <div class="card-body">
        ${videoId ? `
          <div style="position:relative;padding-bottom:56.25%;height:0;margin-bottom:20px;border-radius:10px;overflow:hidden;background:#000;">
            <iframe
              src="https://www.youtube.com/embed/${videoId}"
              style="position:absolute;top:0;left:0;width:100%;height:100%;"
              frameborder="0"
              allowfullscreen
              loading="lazy"
            ></iframe>
          </div>
        ` : ''}

        <div class="form-group">
          <div class="form-label">Title</div>
          <div class="result-box"><pre>${escHtml(title)}</pre></div>
        </div>

        ${description ? `
          <div class="form-group">
            <div class="form-label">Description</div>
            <div class="result-box"><pre>${escHtml(description)}</pre></div>
          </div>
        ` : ''}

        ${videoUrl ? `
          <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:8px;">
            <a href="${videoUrl}" target="_blank" rel="noopener" class="btn btn-primary">
              ${icon('youtube', { size: 16 })} Watch on YouTube
            </a>
            <button class="btn btn-secondary" onclick="navigator.clipboard?.writeText('${videoUrl}').then(()=>window.toastSuccess?.('Copied!'))">
              ${icon('link', { size: 16 })} Copy Link
            </button>
          </div>
        ` : ''}

        ${data && !videoUrl ? `
          <div class="result-box">
            <pre>${escHtml(JSON.stringify(data, null, 2))}</pre>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function extractVideoId(url) {
  try {
    const u = new URL(url);
    return u.searchParams.get('v') || u.pathname.split('/').pop();
  } catch { return null; }
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function generatePage() {
  const html = `
    <div class="page-container animate-slide-up">
      <div class="page-header">
        <h1 class="page-title">Generate Short</h1>
        <p class="page-subtitle">Manually create a YouTube Short with AI assistance.</p>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start;">
        <!-- Form -->
        <div class="card" id="gen-form-card">
          <div class="card-header">
            <div class="card-header-left">
              ${icon('sparkles', { size: 18 })}
              <div class="card-title">Generation Settings</div>
            </div>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label" for="gen-topic">Topic / Prompt <span class="required">*</span></label>
              <textarea class="textarea" id="gen-topic" rows="4"
                placeholder="Enter a topic or detailed prompt for your YouTube Short...&#10;&#10;Example: '5 mind-blowing space facts that will blow your mind'"
              ></textarea>
              <div class="form-hint">Be specific for better results. AI will generate script, visuals, and voiceover.</div>
            </div>

            <div class="form-group">
              <label class="form-label" for="gen-style">Video Style</label>
              <select class="select" id="gen-style">
                <option value="educational">Educational</option>
                <option value="entertaining">Entertaining</option>
                <option value="motivational">Motivational</option>
                <option value="news">News & Trending</option>
                <option value="listicle">Listicle (Top 5/10)</option>
                <option value="tutorial">Tutorial / How-to</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="gen-duration">Duration</label>
              <select class="select" id="gen-duration">
                <option value="30">30 seconds</option>
                <option value="45">45 seconds</option>
                <option value="60" selected>60 seconds</option>
              </select>
            </div>

            <div class="alert alert-info" style="margin-bottom:20px;">
              ${icon('info', { size: 18 })}
              <div class="alert-content">
                <div class="alert-title">Generation takes 2–5 minutes</div>
                The AI will write the script, add visuals, generate voiceover, and upload to YouTube.
              </div>
            </div>

            <button class="btn btn-primary btn-full btn-lg" id="gen-btn">
              <span class="btn-spinner"></span>
              <span class="btn-text-content" style="display:flex;align-items:center;gap:8px;">
                ${icon('sparkles', { size: 18 })} Generate Short
              </span>
            </button>
          </div>
        </div>

        <!-- Progress -->
        <div>
          <div class="card" id="gen-progress-card">
            <div class="card-header">
              <div class="card-header-left">
                ${icon('activity', { size: 18 })}
                <div class="card-title">Progress</div>
              </div>
              <div class="badge badge-neutral" id="gen-status-badge">Ready</div>
            </div>
            <div class="card-body">
              <div class="progress-steps" id="gen-steps">
                ${renderSteps(-1)}
              </div>
            </div>
          </div>

          <div id="gen-result"></div>
        </div>
      </div>
    </div>
  `;

  return {
    html,
    init(container) {
      const btn = container.querySelector('#gen-btn');
      const topicEl = container.querySelector('#gen-topic');
      const styleEl = container.querySelector('#gen-style');
      const durationEl = container.querySelector('#gen-duration');
      const stepsEl = container.querySelector('#gen-steps');
      const badgeEl = container.querySelector('#gen-status-badge');
      const resultEl = container.querySelector('#gen-result');

      let activeStep = -1;
      let stepTimer = null;
      let generating = false;

      function setStep(idx, errorIdx = -1) {
        activeStep = idx;
        stepsEl.innerHTML = renderSteps(idx, errorIdx);
      }

      function setBadge(text, cls) {
        badgeEl.className = `badge badge-${cls}`;
        badgeEl.textContent = text;
      }

      function simulateProgress() {
        // Animate steps 0 and 1 during API call
        setStep(0);
        stepTimer = setTimeout(() => setStep(1), 4000);
      }

      btn.addEventListener('click', async () => {
        const topic = topicEl.value.trim();
        if (!topic) {
          topicEl.classList.add('error');
          topicEl.focus();
          toastError('Topic required', 'Please enter a topic or prompt.');
          return;
        }
        topicEl.classList.remove('error');

        if (generating) return;
        generating = true;

        btn.classList.add('loading');
        btn.disabled = true;
        resultEl.innerHTML = '';
        setBadge('Generating…', 'warning');
        simulateProgress();

        const payload = {
          topic,
          style: styleEl.value,
          duration: Number(durationEl.value),
        };

        try {
          const data = await generateApi.run(payload);

          clearTimeout(stepTimer);
          setStep(STEPS.length); // all complete

          setBadge('Complete', 'active');
          resultEl.innerHTML = renderResult(data);
          toastSuccess('Short generated!', 'Your YouTube Short has been created and uploaded.');

        } catch (err) {
          clearTimeout(stepTimer);
          setStep(activeStep, activeStep);
          setBadge('Failed', 'error');
          resultEl.innerHTML = `
            <div class="card" style="margin-top:24px;">
              <div class="card-body">
                <div class="alert alert-error">
                  ${icon('alertCircle', { size: 18 })}
                  <div class="alert-content">
                    <div class="alert-title">Generation failed</div>
                    ${err.message || 'An error occurred. Please try again.'}
                  </div>
                </div>
                <div style="margin-top:16px;display:flex;gap:12px;">
                  <button class="btn btn-primary" id="retry-gen-btn">
                    ${icon('refreshCw', { size: 16 })} Try Again
                  </button>
                </div>
              </div>
            </div>
          `;
          const retryBtn = resultEl.querySelector('#retry-gen-btn');
          if (retryBtn) retryBtn.addEventListener('click', () => btn.click());
          toastError('Generation failed', err.message);
        } finally {
          generating = false;
          btn.classList.remove('loading');
          btn.disabled = false;
        }
      });
    },
  };
}
