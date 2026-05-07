/* ============================================================
   WHY GREAT MANUFACTURERS STAY INVISIBLE
   app.js — SPA Brain
   Handles routing, navigation, transitions, localStorage
   ============================================================ */

// ── CONSTANTS ──
const RAILWAY_URL = 'https://manufacturing-book2-65462349033.asia-south1.run.app';
const SHELF_URL   = 'https://manufacturing-shelf-65462349033.asia-south1.run.app'; // Redirect here if no valid session
const TOTAL_CHAPTERS = 9;

// ── STATE ──
let currentChapter = null;   // chapter module currently loaded
let currentScreen  = 0;      // screen index within chapter
let totalScreens   = 0;      // total screens in current chapter
let isTransitioning = false; // prevent double-clicks during animation

// ── USER DATA (localStorage) ──
function getUser() {
  return {
    name:   localStorage.getItem('readerName')   || 'Founder',
    rev:    localStorage.getItem('readerRev')    || '10to25',
    sector: localStorage.getItem('readerSector') || 'manufacturing'
  };
}

function saveUser(name, rev, sector) {
  localStorage.setItem('readerName',   name);
  localStorage.setItem('readerRev',    rev);
  localStorage.setItem('readerSector', sector);
}

function markWorkbookDownloaded() {
  localStorage.setItem('workbookDownloaded', 'true');
  setTimeout(() => {
    const btn = document.getElementById('workbook-continue-btn');
    if (btn) btn.textContent = 'Continue →';
  }, 1000);
}

function isOnboarded() {
  return !!(localStorage.getItem('readerName') &&
            localStorage.getItem('readerRev')  &&
            localStorage.getItem('readerSector'));
}

function getAllTakeaways() {
  return JSON.parse(localStorage.getItem('allTakeaways') || '{}');
}

function saveTakeaways(chapterKey, takeaways) {
  const all = getAllTakeaways();
  all[chapterKey] = takeaways;
  localStorage.setItem('allTakeaways', JSON.stringify(all));
}

function getLastScreen(chapterNum) {
  return parseInt(localStorage.getItem('lastScreen_ch' + chapterNum) || '0');
}

function saveLastScreen(chapterNum, screenIdx) {
  localStorage.setItem('lastScreen_ch' + chapterNum, screenIdx);
}

function getLastChapter() {
  return parseInt(localStorage.getItem('lastChapter') || '0');
}

function saveLastChapter(chapterNum) {
  localStorage.setItem('lastChapter', chapterNum);
}

// ── AUTH ──
function getSession() {
  return {
    email: localStorage.getItem('readerEmail') || '',
    token: localStorage.getItem('readerToken') || ''
  };
}

function saveSession(email, token, name) {
  localStorage.setItem('readerEmail', email);
  localStorage.setItem('readerToken', token);
  localStorage.setItem('readerName',  name);
}

function clearSession() {
  localStorage.removeItem('readerEmail');
  localStorage.removeItem('readerToken');
}

function hasSession() {
  const { email, token } = getSession();
  return !!(email && token);
}






function getRoute() {
  const path = window.location.pathname;

  if (path === '/' || path === '')                   return { type: 'onboarding' };
  if (path === '/read')                              return { type: 'onboarding' };
  if (path === '/backmatter')                        return { type: 'backmatter' };
  if (path === '/diagnosis')                         return { type: 'diagnosis' };

  const chMatch = path.match(/^\/chapter\/(\d+)$/);
  if (chMatch) {
    const num = parseInt(chMatch[1]);
    if (num >= 1 && num <= TOTAL_CHAPTERS)            return { type: 'chapter', num };
  }

  return { type: 'notfound' };
}

function navigate(path, options = {}) {
  if (window.location.pathname === path && !options.force) return;
  history.pushState({}, '', path);
  route();
}

async function route(options = {}) {
  // ── TOKEN HANDOFF ─────────────────────────────────────────
  // On first load from shelf, URL contains ?token=xxx&email=yyy
  const urlParams = new URLSearchParams(window.location.search);
  const urlToken  = urlParams.get('token');
  const urlEmail  = urlParams.get('email');

  if (urlToken && urlEmail) {
    showLoader();
    try {
      const res  = await fetch(RAILWAY_URL + '/validate-token', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: urlEmail, token: urlToken })
      });
      const data = await res.json();

      if (data.valid) {
        saveSession(urlEmail, urlToken, data.name);
        // Clean token from URL without triggering a re-route
        const cleanPath = window.location.pathname;
        history.replaceState({}, '', cleanPath);
      } else {
        window.location.href = SHELF_URL;
        return;
      }
    } catch (err) {
      console.warn('Token validation failed (offline?), checking localStorage.');
    }
  }

  // ── SESSION GATE ──────────────────────────────────────────
  if (!hasSession()) {
    window.location.href = SHELF_URL;
    return;
  }
  // ─────────────────────────────────────────────────────────

  const r = getRoute();

  // Root / or /read → onboarding (resumes if already started)
  if (r.type === 'onboarding') {
    const lastCh = getLastChapter();
    if (lastCh >= 1) {
      await loadChapter(lastCh);
    } else {
      await loadOnboarding();
    }
    return;
  }

  if (r.type === 'chapter') {
    await loadChapter(r.num);
    return;
  }

  if (r.type === 'backmatter') {
    await loadBackmatter();
    return;
  }

  if (r.type === 'diagnosis') {
    await loadDiagnosis();
    return;
  }

  // 404 — go to onboarding
  await loadOnboarding();
}

// ── CHAPTER LOADER ──
async function loadChapter(num) {
  showLoader();

  try {
    // Dynamically import the chapter module
    const module = await import(`/chapters/ch${num}.js?v=2`);
    currentChapter = module.default;

    // Update bar
    document.getElementById('bar-book').textContent = 'Book Two';
    document.getElementById('bar-sep').style.display = '';
    document.getElementById('bar-ch').textContent = currentChapter.barTitle;
    document.getElementById('bar-shelf-btn').style.display = 'inline-flex';

    // Build screens into stage
    buildScreens(currentChapter.screens);

    // Restore last screen
    const lastScreen = getLastScreen(num);
    totalScreens = currentChapter.screens.length;
    currentScreen = 0;

    if (lastScreen > 0 && lastScreen < totalScreens) {
      // Restore without animation
      for (let i = 0; i < lastScreen; i++) {
        const el = document.getElementById('sc-' + i);
        if (el) { el.classList.remove('active'); el.classList.add('done'); }
      }
      const target = document.getElementById('sc-' + lastScreen);
      if (target) target.classList.add('active');
      currentScreen = lastScreen;
    }

    // Save last chapter
    saveLastChapter(num);

    buildDots();
    hideLoader();

  } catch (err) {
    console.error('Failed to load chapter', num, err);
    showError();
  }
}

// ── ONBOARDING LOADER ──
async function loadOnboarding(startScreen = 0) {
  showLoader();
  try {
    const module = await import('/onboarding/onboarding.js?v=2');
    currentChapter = module.default;

    // Push state so browser back doesn't trigger route() back to shelf
    if (window.location.pathname === '/') {
      history.pushState({}, '', '/read');
    }

    document.getElementById('bar-book').textContent = 'Stop Planning, Start Winning';
    document.getElementById('bar-sep').style.display = 'none';
    document.getElementById('bar-ch').textContent = '';
    document.getElementById('bar-shelf-btn').style.display = 'inline-flex';

    buildScreens(currentChapter.screens);
    totalScreens = currentChapter.screens.length;
    currentScreen = 0;

    // If startScreen specified (e.g. coming back from Chapter 1), land there
    const target = startScreen > 0 && startScreen < totalScreens ? startScreen : 0;
    if (target > 0) {
      for (let i = 0; i < target; i++) {
        const el = document.getElementById('sc-' + i);
        if (el) { el.classList.remove('active'); el.classList.add('done'); }
      }
      const targetEl = document.getElementById('sc-' + target);
      if (targetEl) targetEl.classList.add('active');
      currentScreen = target;
    }

    buildDots();
    hideLoader();
  } catch (err) {
    console.error('Failed to load onboarding', err);
    showError();
  }
}

// ── BACKMATTER LOADER ──
async function loadBackmatter() {
  showLoader();
  try {
    const module = await import('/chapters/backmatter.js?v=2');
    currentChapter = module.default;

    document.getElementById('bar-book').textContent = 'Book Two';
    document.getElementById('bar-sep').style.display = '';
    document.getElementById('bar-ch').textContent = 'Stop Planning, Start Winning';
    document.getElementById('bar-shelf-btn').style.display = 'inline-flex';

    buildScreens(currentChapter.screens);
    totalScreens = currentChapter.screens.length;
    currentScreen = 0;

    buildDots();
    hideLoader();
  } catch (err) {
    console.error('Failed to load backmatter', err);
    showError();
  }
}

// ── DIAGNOSIS LOADER ──
async function loadDiagnosis() {
  showLoader();
  try {
    const module = await import('/chapters/diagnosis.js?v=2');
    const diag = module.default;

    document.getElementById('bar-book').textContent = 'Book Two';
    document.getElementById('bar-sep').style.display = '';
    document.getElementById('bar-ch').textContent = 'Your Strategic Diagnosis';
    document.getElementById('bar-shelf-btn').style.display = 'inline-flex';

    buildScreens(diag.screens);
    totalScreens = diag.screens.length;
    currentScreen = 0;

    buildDots();
    hideLoader();

    // Trigger diagnosis data load automatically on first screen
    setTimeout(loadDiagnosisData, 800);

  } catch (err) {
    console.error('Failed to load diagnosis', err);
    showError();
  }
}

// ── SCREEN BUILDER ──
function buildScreens(screens) {
  const stage = document.getElementById('stage');
  stage.innerHTML = '';

  screens.forEach((screen, idx) => {
    const el = document.createElement('div');
    el.className = 'screen' + (idx === 0 ? ' active' : '');
    el.id = 'sc-' + idx;
    el.innerHTML = renderScreen(screen, idx, screens.length);
    stage.appendChild(el);
  });
}

// ── SCREEN RENDERER ──
function renderScreen(screen, idx, total) {
  const isFirst = idx === 0;
  const isLast  = idx === total - 1;
  const prevBtn = isFirst
    ? '<span></span>'
    : `<button class="btn btn-ghost" onclick="go(${idx}, ${idx - 1})">← Back</button>`;

  switch (screen.type) {

    case 'opener':
      return `
        <div class="screen-body center">
          <div class="opener-wrap">
            <div class="opener-part">${screen.part}</div>
            <div class="opener-num">Chapter ${currentChapter?.chapterNum || ''}</div>
            <div class="opener-title">${screen.title}</div>
            <div class="opener-line"></div>
            <div class="opener-intro">${screen.intro}</div>
          </div>
        </div>
        <div class="screen-footer">
          ${currentChapter?.chapterNum > 1
            ? `<button class="btn btn-ghost" onclick="goToChapter(${(currentChapter?.chapterNum || 1) - 1})">← Chapter ${(currentChapter?.chapterNum || 1) - 1}</button>`
            : `<button class="btn btn-ghost" onclick="loadOnboarding(parseInt(localStorage.getItem('lastOnboardingScreen') || '0'))">← Back</button>`}
          <span class="screen-ctr">${idx + 1} of ${total}</span>
          <button class="btn btn-primary" onclick="go(${idx}, ${idx + 1})">Begin Chapter →</button>
        </div>`;

    case 'content':
      return `
        <div class="screen-body">
          <div class="content-wrap">
            <div class="section-title">${screen.heading}</div>
            <div class="prose">${screen.body}</div>
            ${screen.extra || ''}
          </div>
        </div>
        <div class="screen-footer">
          ${prevBtn}
          <span class="screen-ctr">${idx + 1} of ${total}</span>
          <button class="btn btn-primary" onclick="go(${idx}, ${idx + 1})">Continue →</button>
        </div>`;

    case 'exchange':
      return `
        <div class="screen-body">
          <div class="exchange-wrap">
            <div class="exchange-title">Your 3 takeaways from Chapter ${currentChapter?.chapterNum || ''}</div>
            <div class="exchange-sub">Share what struck you. Arjun will share what hit him when he first read this.</div>

            <div id="reader-inputs">
              <div class="input-row">
                <div class="input-num">1</div>
                <textarea class="takeaway-input" id="t1" placeholder="First takeaway…" rows="2"
                  oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px';checkInputs()"></textarea>
              </div>
              <div class="input-row">
                <div class="input-num">2</div>
                <textarea class="takeaway-input" id="t2" placeholder="Second takeaway…" rows="2"
                  oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px';checkInputs()"></textarea>
              </div>
              <div class="input-row">
                <div class="input-num">3</div>
                <textarea class="takeaway-input" id="t3" placeholder="Third takeaway…" rows="2"
                  oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px';checkInputs()"></textarea>
              </div>
              <div class="submit-row">
                <button class="btn btn-primary" id="submit-btn" onclick="submitTakeaways(${idx + 1})" disabled>
                  Share my takeaways →
                </button>
              </div>
            </div>

            <div class="loading-state" id="loading-state">
              <div class="agent-avatar">V</div>
              <div class="loading-text">
                Arjun is reviewing your notes
                <span class="loading-dots"><span>.</span><span>.</span><span>.</span></span>
              </div>
            </div>

            <div class="agent-response" id="agent-response">
              <div class="agent-header-row">
                <div class="agent-avatar">V</div>
                <div class="agent-label">Arjun <span>· sharing his notes</span></div>
              </div>
              <div class="agent-items">
                <div class="agent-item" id="ai-1"><div class="agent-item-num">1</div><div class="agent-item-text" id="ai-text-1"></div></div>
                <div class="agent-item" id="ai-2"><div class="agent-item-num">2</div><div class="agent-item-text" id="ai-text-2"></div></div>
                <div class="agent-item" id="ai-3"><div class="agent-item-num">3</div><div class="agent-item-text" id="ai-text-3"></div></div>
              </div>
              <div class="continue-row" id="continue-row">
                <button class="btn btn-primary" onclick="go(${idx}, ${idx + 1})">Continue →</button>
              </div>
            </div>
          </div>
        </div>
        <div class="screen-footer">
          ${prevBtn}
          <span class="screen-ctr">${idx + 1} of ${total}</span>
          <span></span>
        </div>`;

    case 'end': {
      const nextNum = (currentChapter?.chapterNum || 0) + 1;
      const isLastChapter = currentChapter?.chapterNum === 9;
      const nextBtn = isLastChapter
        ? `<button class="btn btn-primary" style="width:100%;justify-content:center;padding:13px"
             onclick="goToBackmatter()">
             Continue the Journey →
           </button>`
        : nextNum <= TOTAL_CHAPTERS
        ? `<button class="btn btn-primary" style="width:100%;justify-content:center;padding:13px"
             onclick="goToChapter(${nextNum})">
             Chapter ${nextNum}: ${screen.nextTitle} →
           </button>`
        : `<button class="btn btn-primary" style="width:100%;justify-content:center;padding:13px"
             onclick="goToDiagnosis()">
             Get My Strategic Diagnosis →
           </button>`;
      return `
        <div class="screen-body center">
          <div class="end-wrap">
            <div class="end-check">✓</div>
            <div class="end-title">Chapter ${currentChapter?.chapterNum || ''} complete</div>
            <div class="your-takeaways">
              <div class="takeaway-section-label">Your takeaways · Chapter ${currentChapter?.chapterNum || ''}</div>
              <div id="saved-takeaways"></div>
            </div>
            <div class="author-note">
              <div class="author-note-text">At the end of this book, your notes from every chapter will be reviewed. You will receive a personalised strategic diagnosis for your business.</div>
              <div class="author-note-sig">— Sudharsan K R</div>
            </div>
            ${nextBtn}
          </div>
        </div>
        <div class="screen-footer">
          ${prevBtn}
          <span class="screen-ctr">${idx + 1} of ${total}</span>
          <span></span>
        </div>`;
    }

    case 'backmatter-prose':
      return `
        <div class="screen-body">
          <div class="content-wrap">
            <div class="bm-label">${screen.label || ''}</div>
            <div class="section-title">${screen.heading}</div>
            <div class="prose">${screen.body}</div>
          </div>
        </div>
        <div class="screen-footer">
          ${prevBtn}
          <span class="screen-ctr">${idx + 1} of ${total}</span>
          <button class="btn btn-primary" onclick="go(${idx}, ${idx + 1})">${screen.nextLabel || 'Continue →'}</button>
        </div>`;

    case 'vikram-closing':
      return `
        <div class="screen-body center">
          <div class="exchange-wrap">
            <div class="agent-header-row" style="margin-bottom:24px;">
              <div class="agent-avatar">V</div>
              <div>
                <div style="font:600 1rem/1 'Inter',sans-serif;color:var(--ink);margin-bottom:4px;">Arjun Mehta</div>
                <div style="font:400 0.8125rem/1 'Inter',sans-serif;color:var(--ink-3);">His closing notes</div>
              </div>
            </div>
            <div class="vikram-closing-msg" id="vikram-closing-msg"></div>
          </div>
        </div>
        <div class="screen-footer">
          ${prevBtn}
          <span class="screen-ctr">${idx + 1} of ${total}</span>
          <button class="btn btn-primary" id="vikram-closing-next" style="display:none" onclick="go(${idx}, ${idx + 1})">Continue →</button>
        </div>`;

    case 'book-exchange':
      return `
        <div class="screen-body">
          <div class="exchange-wrap">
            <div class="exchange-title">3 things this book changed for you</div>
            <div class="exchange-sub">Not chapter takeaways — the whole book. What are the 3 things that will change how you run your business from this point forward? Arjun will share his 3 in return.</div>

            <div id="reader-inputs">
              <div class="input-row">
                <div class="input-num">1</div>
                <textarea class="takeaway-input" id="t1" placeholder="First thing that will change…" rows="2"
                  oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px';checkInputs()"></textarea>
              </div>
              <div class="input-row">
                <div class="input-num">2</div>
                <textarea class="takeaway-input" id="t2" placeholder="Second thing…" rows="2"
                  oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px';checkInputs()"></textarea>
              </div>
              <div class="input-row">
                <div class="input-num">3</div>
                <textarea class="takeaway-input" id="t3" placeholder="Third thing…" rows="2"
                  oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px';checkInputs()"></textarea>
              </div>
              <div class="submit-row">
                <button class="btn btn-primary" id="submit-btn" onclick="submitBookTakeaways(${idx + 1})" disabled>Share →</button>
              </div>
            </div>

            <div class="loading-state" id="loading-state">
              <div class="agent-avatar">V</div>
              <div class="loading-text">Arjun is writing his final notes<span class="loading-dots"><span>.</span><span>.</span><span>.</span></span></div>
            </div>

            <div class="agent-response" id="agent-response">
              <div class="agent-header-row">
                <div class="agent-avatar">V</div>
                <div class="agent-label">Arjun <span>· his final notes</span></div>
              </div>
              <div class="agent-items">
                <div class="agent-item" id="ai-1"><div class="agent-item-num">1</div><div class="agent-item-text" id="ai-text-1"></div></div>
                <div class="agent-item" id="ai-2"><div class="agent-item-num">2</div><div class="agent-item-text" id="ai-text-2"></div></div>
                <div class="agent-item" id="ai-3"><div class="agent-item-num">3</div><div class="agent-item-text" id="ai-text-3"></div></div>
              </div>
              <div class="continue-row" id="continue-row">
                <button class="btn btn-primary" onclick="go(${idx}, ${idx + 1})">Continue →</button>
              </div>
            </div>
          </div>
        </div>
        <div class="screen-footer">
          ${prevBtn}
          <span class="screen-ctr">${idx + 1} of ${total}</span>
          <span></span>
        </div>`;

    case 'workbook':
      return `
        <div class="screen-body center">
          <div class="end-wrap">
            <div class="end-check">↓</div>
            <div class="end-title">The Workbook</div>
            <div class="prose" style="margin-bottom:32px;">
              <p>${(screen.body || "Download your Book Two workbook — a structured set of exercises to apply every strategic framework from this book to your own manufacturing business.").replace(/\n/g, '</p><p>')}</p>
            </div>
            <a href="/workbook.pdf" download id="workbook-download-btn" class="btn btn-primary" style="width:100%;justify-content:center;padding:13px;text-decoration:none;" onclick="markWorkbookDownloaded()">
              Download Workbook →
            </a>
          </div>
        </div>
        <div class="screen-footer">
          ${prevBtn}
          <span class="screen-ctr">${idx + 1} of ${total}</span>
          <button class="btn btn-ghost" id="workbook-continue-btn" onclick="go(${idx}, ${idx + 1})">${localStorage.getItem('workbookDownloaded') ? 'Continue →' : 'Continue without downloading'}</button>
        </div>`;

    case 'diagnosis-teaser':
      return `
        <div class="screen-body center">
          <div class="end-wrap" style="text-align:center;">
            <div style="font:400 1rem/1 'Inter',sans-serif;color:var(--ink-3);margin-bottom:24px;letter-spacing:0.5px;text-transform:uppercase;">One more thing</div>
            <div class="end-title" style="margin-bottom:16px;">You have read every chapter.<br>You have shared your notes.</div>
            <div class="prose" style="margin-bottom:40px;text-align:left;">
              <p>Everything you wrote — across all nine chapters — has been collected. Sudharsan will review it and deliver a personalised strategic diagnosis for your business.</p>
              <p>This is not a generic summary. It is a diagnosis specific to what you shared, at your revenue stage, in your sector.</p>
            </div>
            <button class="btn btn-primary" style="width:100%;justify-content:center;padding:14px;font-size:1rem;" onclick="goToDiagnosis()">
              Get My Strategic Diagnosis →
            </button>
          </div>
        </div>
        <div class="screen-footer">
          ${prevBtn}
          <span class="screen-ctr">${idx + 1} of ${total}</span>
          <span></span>
        </div>`;
    case 'cover':
    case 'copyright':
    case 'toc':
    case 'preface':
    case 'whoshouldread':
    case 'who':
    case 'introduction':
    case 'intro':
    case 'about':
    case 'form':
    case 'vikram':
      return renderOnboardingScreen(screen, idx, total, prevBtn);

    case 'diagnosis-loading':
      return `
        <div class="screen-body center">
          <div class="end-wrap" style="text-align:center;">
            <div id="diag-loading">
              <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:24px;">
                <div class="loader-dot"></div>
                <div class="loader-dot"></div>
                <div class="loader-dot"></div>
              </div>
              <div style="font:600 1.125rem/1.3 'Inter',sans-serif;color:var(--ink);margin-bottom:8px;">Sudharsan is reviewing your notes</div>
              <div style="font:400 0.9375rem/1.6 'Inter',sans-serif;color:var(--ink-3);">Across all nine chapters. This takes a moment.</div>
            </div>
            <div id="diag-error" style="display:none;">
              <div style="font:600 1.125rem/1.3 'Inter',sans-serif;color:var(--ink);margin-bottom:8px;">Something went wrong</div>
              <div style="font:400 0.9375rem/1.6 'Inter',sans-serif;color:var(--ink-3);margin-bottom:24px;">Unable to generate your diagnosis right now. Please try again.</div>
              <button class="btn btn-primary" onclick="loadDiagnosisData()">Try Again</button>
            </div>
          </div>
        </div>
        <div class="screen-footer">
          <span></span>
          <span class="screen-ctr">${idx + 1} of ${total}</span>
          <span></span>
        </div>`;

    case 'diagnosis-result':
      return `
        <div class="screen-body">
          <div class="content-wrap">
            <div style="font:500 0.75rem/1 'Inter',sans-serif;letter-spacing:1px;text-transform:uppercase;color:var(--ink-3);margin-bottom:8px;">Your Strategic Diagnosis</div>
            <div style="font:700 2rem/1.2 'Inter',sans-serif;color:var(--ink);margin-bottom:32px;letter-spacing:-0.5px;" id="diag-name">From Sudharsan K R</div>

            <div id="diag-content" style="display:none;animation:fadeUp 0.5s ease forwards;">

              <div style="margin-bottom:28px;">
                <div style="font:600 0.75rem/1 'Inter',sans-serif;letter-spacing:1px;text-transform:uppercase;color:var(--ink-3);margin-bottom:10px;">Where You Are</div>
                <div id="diag-position" class="prose"><p></p></div>
              </div>

              <div style="margin-bottom:28px;padding:20px 24px;background:var(--bg);border-radius:8px;border-left:3px solid var(--ink);">
                <div style="font:600 0.75rem/1 'Inter',sans-serif;letter-spacing:1px;text-transform:uppercase;color:var(--ink-3);margin-bottom:10px;">The Primary Constraint</div>
                <div id="diag-constraint" class="prose"><p></p></div>
              </div>

              <div style="margin-bottom:28px;padding:20px 24px;background:var(--blue-light);border-radius:8px;border-left:3px solid var(--blue);">
                <div style="font:600 0.75rem/1 'Inter',sans-serif;letter-spacing:1px;text-transform:uppercase;color:var(--blue);margin-bottom:10px;">The Strategic Choice — Next 90 Days</div>
                <div id="diag-choice" class="prose"><p></p></div>
              </div>

              <div style="border-top:1px solid var(--rule);padding-top:24px;margin-bottom:8px;">
                <div id="diag-closing" style="font:400 1.0625rem/1.75 'Inter',sans-serif;color:var(--ink-2);font-style:italic;"></div>
                <div style="font:500 0.8125rem/1 'Inter',sans-serif;color:var(--ink-3);margin-top:10px;">— Sudharsan K R</div>
              </div>

            </div>
          </div>
        </div>
        <div class="screen-footer">
          <span></span>
          <span class="screen-ctr">${idx + 1} of ${total}</span>
          <button class="btn btn-primary" id="diag-next-btn" style="display:none" onclick="go(${idx}, ${idx + 1})">Continue →</button>
        </div>`;

    case 'working-with-author':
      return `
        <div class="screen-body">
          <div class="content-wrap">
            <div class="section-title">${screen.heading}</div>
            <div class="prose">${screen.body}</div>
          </div>
        </div>
        <div class="screen-footer">
          ${prevBtn}
          <span class="screen-ctr">${idx + 1} of ${total}</span>
          <button class="btn btn-primary" onclick="window.location.href='https://manufacturing-shelf-65462349033.asia-south1.run.app'">Back to My Library →</button>
        </div>`;
  }
}

// ── ONBOARDING SCREEN RENDERER ──
function renderOnboardingScreen(screen, idx, total, prevBtn) {
  const isLast = idx === total - 1;

  switch (screen.type) {

    case 'cover':
      return `
        <div class="screen-body center">
          <div class="cover-wrap">
            <div class="cover-series">The Manufacturing Strategy Series · Book Two of Four</div>
            <div class="cover-title">Stop Planning, Start Winning</div>
            <div class="cover-subtitle">Making Strategic Choices Competitors Can't Copy</div>
            <div class="cover-rule"></div>
            <div class="cover-author">Sudharsan K R</div>
            <div class="cover-role">Business Model &amp; Strategy Advisor</div>
          </div>
        </div>
        <div class="screen-footer">
          <span></span>
          <span class="screen-ctr">${idx + 1} of ${total}</span>
          <button class="btn btn-primary" onclick="go(${idx}, ${idx + 1})">Open Book →</button>
        </div>`;

    case 'copyright':
      return `
        <div class="screen-body">
          <div class="copy-wrap">
            <div class="copy-title">Stop Planning, Start Winning</div>
            <div class="copy-sub">Making Strategic Choices Competitors Can't Copy</div>
            <div class="copy-rule"></div>
            <p class="copy-p">Copyright © 2026 by Sudharsan K R</p>
            <p class="copy-p">All rights reserved. No part of this publication may be reproduced, distributed, or transmitted in any form or by any means — including photocopying, recording, or other electronic or mechanical methods — without the prior written permission of the author, except in the case of brief quotations embodied in critical reviews and certain other non-commercial uses permitted by copyright law.</p>
            <p class="copy-disclaimer">The cases, factories, and individuals featured are composite accounts based on real-world consulting experiences. Names, locations, and metrics have been altered to protect client confidentiality. This publication is sold with the understanding that the author is not engaged in rendering legal, accounting, or other professional compliance services.</p>
            <p class="copy-p">Published in India.</p>
          </div>
        </div>
        <div class="screen-footer">
          ${prevBtn}
          <span class="screen-ctr">${idx + 1} of ${total}</span>
          <button class="btn btn-primary" onclick="go(${idx}, ${idx + 1})">Continue →</button>
        </div>`;

    case 'toc': {
      const tocRows = (screen.items || []).map(item => {
        if (item.isSection) {
          return `<div class="toc-section">${item.title}</div>`;
        }
        return `<div class="toc-row"><span class="toc-label">${item.label}</span><span class="toc-title">${item.title}</span></div>`;
      }).join('');
      return `
        <div class="screen-body">
          <div class="toc-wrap">
            <div class="toc-heading">Contents</div>
            ${tocRows}
          </div>
        </div>
        <div class="screen-footer">
          ${prevBtn}
          <span class="screen-ctr">${idx + 1} of ${total}</span>
          <button class="btn btn-primary" onclick="go(${idx}, ${idx + 1})">Continue →</button>
        </div>`;
    }

    case 'preface':
    case 'whoshouldread':
    case 'who':
    case 'introduction':
    case 'intro':
      return `
        <div class="screen-body">
          <div class="prose-wrap">
            <div class="prose-heading">${screen.heading}</div>
            ${screen.sub ? `<div class="prose-sub">${screen.sub}</div>` : ''}
            <div class="prose-rule"></div>
            <div class="prose">${screen.body}</div>
          </div>
        </div>
        <div class="screen-footer">
          ${prevBtn}
          <span class="screen-ctr">${idx + 1} of ${total}</span>
          <button class="btn btn-primary" onclick="go(${idx}, ${idx + 1})">Continue →</button>
        </div>`;

    case 'about':
      return `
        <div class="screen-body center">
          <div class="ate-wrap">
            <div class="ate-tag">Reading Experience</div>
            <div class="ate-title">This is not just a book. It thinks with you.</div>
            <div class="ate-body">After each chapter, you and your reading companion swap notes — what you took away, what they think matters most for a business like yours. At the end of the book, Sudharsan delivers a personalised strategic diagnosis.</div>
            <div class="ate-cards">
              <div class="ate-card"><div class="ate-card-num">1</div><div class="ate-card-text"><strong>Read each chapter</strong> — presented screen by screen, no scrolling.</div></div>
              <div class="ate-card"><div class="ate-card-num">2</div><div class="ate-card-text"><strong>Share 3 takeaways</strong> — what struck you from your business's perspective.</div></div>
              <div class="ate-card"><div class="ate-card-num">3</div><div class="ate-card-text"><strong>Your companion responds</strong> — 3 things they think matter most for where you are right now.</div></div>
              <div class="ate-card"><div class="ate-card-num">4</div><div class="ate-card-text"><strong>End of book</strong> — Sudharsan reviews all your notes and delivers your personalised diagnosis.</div></div>
            </div>
          </div>
        </div>
        <div class="screen-footer">
          ${prevBtn}
          <span class="screen-ctr">${idx + 1} of ${total}</span>
          <button class="btn btn-primary" onclick="go(${idx}, ${idx + 1})">Set Up My Experience →</button>
        </div>`;

    case 'form':
      return `
        <div class="screen-body center">
          <div class="form-wrap">
            <div class="form-title">Before we begin</div>
            <div class="form-sub">Your reading companion will personalise every exchange to your business throughout this book.</div>
            <div class="field">
              <label>Your name</label>
              <input id="ob-name" type="text" placeholder="e.g. Rajesh Kumar">
            </div>
            <div class="field">
              <label>Revenue band</label>
              <select id="ob-rev">
                <option value="">Select your revenue band</option>
                <option value="under10">Under ₹10 Crore</option>
                <option value="10to25">₹10 – ₹25 Crore</option>
                <option value="25to50">₹25 – ₹50 Crore</option>
                <option value="50plus">Above ₹50 Crore</option>
              </select>
            </div>
            <div class="field">
              <label>Manufacturing sector</label>
              <input id="ob-sector" type="text" placeholder="e.g. Precision machining, Injection moulding…">
            </div>
          </div>
        </div>
        <div class="screen-footer">
          ${prevBtn}
          <span class="screen-ctr">${idx + 1} of ${total}</span>
          <button class="btn btn-primary" onclick="submitForm(${idx})">Meet Your Reading Companion →</button>
        </div>`;

    case 'vikram':
      return `
        <div class="screen-body center">
          <div class="vikram-wrap">
            <div class="vikram-disclaimer">
              Arjun is a fictional character powered by an AI agent. Any resemblance to actual persons, businesses, or events is purely coincidental. Arjun's responses are AI-generated and do not constitute professional business or strategy advice.
            </div>
            <div class="vikram-card" id="vikram-card">
              <div class="vikram-header">
                <div class="vikram-avatar">V</div>
                <div>
                  <div class="vikram-name">Arjun Mehta</div>
                  <div class="vikram-role">MD, Precision Components · Pune</div>
                </div>
              </div>
              <div class="vikram-message" id="vikram-msg"></div>
            </div>
          </div>
        </div>
        <div class="screen-footer">
          ${prevBtn}
          <span class="screen-ctr">${idx + 1} of ${total}</span>
          <button class="btn btn-primary" id="begin-btn" style="display:none" onclick="goToChapter(1, true)">Continue →</button>
        </div>`;

    default:
      return `<div class="screen-body"><p>Unknown onboarding screen: ${screen.type}</p></div>`;
  }
}

// ── NAVIGATION ──
function go(from, to) {
  if (isTransitioning) return;
  if (to < 0 || to >= totalScreens) return;

  // Block forward navigation on form screen — must use Submit button
  const screens = currentChapter?.screens;
  if (screens && to > from) {
    const fromType = screens[from]?.type;
    if (fromType === 'vikram') return;
  }

  isTransitioning = true;

  const fromEl = document.getElementById('sc-' + from);
  const toEl   = document.getElementById('sc-' + to);

  if (to > from) {
    fromEl.classList.remove('active');
    fromEl.classList.add('done');
  } else {
    fromEl.classList.remove('active');
    fromEl.classList.remove('done');
    toEl.classList.remove('done');
  }

  toEl.classList.add('active');
  currentScreen = to;

  // Save screen position
  if (currentChapter) {
    if (currentChapter.chapterNum) {
      saveLastScreen(currentChapter.chapterNum, to);
    } else {
      // Onboarding — save separately
      localStorage.setItem('lastOnboardingScreen', to);
    }
  }

  updateDots();

  // If end screen, populate saved takeaways
  if (currentChapter) {
    const screens = currentChapter.screens;
    if (screens[to]?.type === 'end') {
      populateEndScreen();
    }
    // If diagnosis loading screen, trigger API call
    if (screens[to]?.type === 'diagnosis-loading') {
      setTimeout(loadDiagnosisData, 600);
    }
    // If vikram screen, trigger typewriter
    if (screens[to]?.type === 'vikram') {
      setTimeout(typeVikramIntro, 300);
    }
    // If vikram closing screen, trigger typewriter
    if (screens[to]?.type === 'vikram-closing') {
      setTimeout(() => typeVikramClosing(screens[to].body), 300);
    }
  }

  setTimeout(() => { isTransitioning = false; }, 350);
}

// ── CHAPTER-TO-CHAPTER NAVIGATION ──
function goToChapter(num, force = false) {
  if (num < 1 || num > TOTAL_CHAPTERS) return;
  navigate('/chapter/' + num, { force });
}

function goToBackmatter() {
  navigate('/backmatter');
}

function goToDiagnosis() {
  navigate('/diagnosis');
}

// ── DOTS ──
function buildDots() {
  const wrap = document.getElementById('dots');
  wrap.innerHTML = '';
  for (let i = 0; i < totalScreens; i++) {
    const d = document.createElement('div');
    d.className = 'dot';
    d.id = 'dot-' + i;
    wrap.appendChild(d);
  }
  updateDots();
}

function updateDots() {
  for (let i = 0; i < totalScreens; i++) {
    const d = document.getElementById('dot-' + i);
    if (!d) continue;
    d.className = 'dot' +
      (i === currentScreen ? ' active' : i < currentScreen ? ' done' : '');
  }
}

// ── FORM SUBMISSION ──
function submitForm(idx) {
  const name   = document.getElementById('ob-name')?.value?.trim();
  const rev    = document.getElementById('ob-rev')?.value;
  const sector = document.getElementById('ob-sector')?.value?.trim();

  if (!name || !rev || !sector) {
    alert('Please fill in all three fields to continue.');
    return;
  }

  saveUser(name, rev, sector);
  go(idx, idx + 1);
}

// ── VIKRAM TYPEWRITER ──
function typeVikramIntro() {
  const user = getUser();
  const revLabel = {
    'under10': 'under ₹10 Crore',
    '10to25':  'around ₹10–25 Crore',
    '25to50':  'around ₹25–50 Crore',
    '50plus':  'above ₹50 Crore'
  }[user.rev] || 'your stage';

  const intro =
    `${user.name}, I'm Arjun. MD of an electronics contract manufacturing unit in Chennai. ` +
    `We're at ₹52 Crore now — but I was stuck at ₹18 Crore for four years. ` +
    `Good quality, loyal customers, 18-hour days, shrinking margins. ` +
    `I read this book two years ago. It was uncomfortable.\n\n` +
    `I'm reading it again alongside you.\n\n` +
    `After each chapter, we'll swap notes. You share what struck you running ` +
    `${user.sector} at ${revLabel}. I'll share what hit me the first time — ` +
    `and what I think matters most for where you are right now.`;

  const card  = document.getElementById('vikram-card');
  const msgEl = document.getElementById('vikram-msg');
  const btn   = document.getElementById('begin-btn');

  if (!card || !msgEl) return;

  card.classList.add('show');
  msgEl.innerHTML = '';

  let i = 0;
  function type() {
    if (i < intro.length) {
      msgEl.innerHTML += intro[i] === '\n' ? '<br>' : intro[i];
      i++;
      setTimeout(type, 16);
    } else {
      if (btn) btn.style.display = 'inline-flex';
    }
  }
  setTimeout(type, 300);
}

// ── DIAGNOSIS DATA LOADER ──
async function loadDiagnosisData() {
  const user         = getUser();
  const allTakeaways = getAllTakeaways();
  const bookTakeaways = JSON.parse(localStorage.getItem('bookTakeaways') || '[]');

  const loadingEl = document.getElementById('diag-loading');
  const errorEl   = document.getElementById('diag-error');

  if (loadingEl) loadingEl.style.display = 'block';
  if (errorEl)   errorEl.style.display   = 'none';

  try {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 20000); // 20s for diagnosis

    const res = await fetch(RAILWAY_URL + '/api/diagnosis', {
      method:  'POST',
      signal:  controller.signal,
      headers: {
        'Content-Type':    'application/json',
        'x-reader-email':  localStorage.getItem('readerEmail') || '',
        'x-reader-token':  localStorage.getItem('readerToken') || ''
      },
      body: JSON.stringify({
        userName:     user.name,
        userRev:      user.rev,
        userSector:   user.sector,
        allTakeaways,
        bookTakeaways
      })
    });

    clearTimeout(timeout);

    if (!res.ok) throw new Error('Server error');

    const data = await res.json();

    // Hide loading, move to result screen
    if (loadingEl) loadingEl.style.display = 'none';

    // Navigate to result screen (screen 1)
    go(0, 1);

    // Populate after a short delay to let screen render
    setTimeout(() => {
      const nameEl       = document.getElementById('diag-name');
      const positionEl   = document.getElementById('diag-position');
      const constraintEl = document.getElementById('diag-constraint');
      const choiceEl     = document.getElementById('diag-choice');
      const closingEl    = document.getElementById('diag-closing');
      const contentEl    = document.getElementById('diag-content');
      const nextBtn      = document.getElementById('diag-next-btn');

      if (nameEl)       nameEl.textContent       = `For ${user.name}`;
      if (positionEl)   positionEl.innerHTML      = `<p>${data.position}</p>`;
      if (constraintEl) constraintEl.innerHTML    = `<p>${data.constraint}</p>`;
      if (choiceEl)     choiceEl.innerHTML        = `<p>${data.choice}</p>`;
      if (closingEl)    closingEl.textContent     = `"${data.closing}"`;
      if (contentEl)    contentEl.style.display   = 'block';
      if (nextBtn)      nextBtn.style.display     = 'inline-flex';

    }, 300);

  } catch (err) {
    console.error('Diagnosis error:', err.message);
    if (loadingEl) loadingEl.style.display = 'none';
    if (errorEl)   errorEl.style.display   = 'block';
  }
}
async function submitBookTakeaways(nextScreenIdx) {
  const t1 = document.getElementById('t1')?.value?.trim() || '';
  const t2 = document.getElementById('t2')?.value?.trim() || '';
  const t3 = document.getElementById('t3')?.value?.trim() || '';

  // Save book-level takeaways separately
  localStorage.setItem('bookTakeaways', JSON.stringify([t1, t2, t3]));

  document.getElementById('reader-inputs').style.display = 'none';
  document.getElementById('loading-state').classList.add('show');

  const user = getUser();
  let perspectives = currentChapter.vikramPerspectives;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(RAILWAY_URL + '/api/agent', {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName:     user.name,
        userRev:      user.rev,
        userSector:   user.sector,
        chapter:      'book',
        chapterTitle: 'Stop Planning, Start Winning — Full Book',
        takeaways:    [t1, t2, t3],
        isBookLevel:  true
      })
    });

    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data.perspectives?.length === 3) perspectives = data.perspectives;
    }
  } catch (e) {}

  document.getElementById('loading-state').classList.remove('show');
  document.getElementById('agent-response').classList.add('show');

  [0, 600, 1200].forEach((delay, i) => {
    setTimeout(() => {
      const textEl = document.getElementById('ai-text-' + (i + 1));
      const itemEl = document.getElementById('ai-' + (i + 1));
      if (textEl) textEl.innerHTML = perspectives[i];
      if (itemEl) itemEl.classList.add('show');
      if (i === 2) {
        setTimeout(() => {
          const cont = document.getElementById('continue-row');
          if (cont) cont.classList.add('show');
        }, 500);
      }
    }, delay);
  });
}

// ── VIKRAM CLOSING TYPEWRITER ──
function typeVikramClosing(text) {
  const msgEl = document.getElementById('vikram-closing-msg');
  const btn   = document.getElementById('vikram-closing-next');
  if (!msgEl) return;

  msgEl.innerHTML = '';
  let i = 0;

  function type() {
    if (i < text.length) {
      msgEl.innerHTML += text[i] === '\n' ? '<br>' : text[i];
      i++;
      setTimeout(type, 18);
    } else {
      if (btn) btn.style.display = 'inline-flex';
    }
  }
  setTimeout(type, 400);
}
function checkInputs() {
  const filled = ['t1', 't2', 't3'].every(
    id => document.getElementById(id)?.value?.trim()
  );
  const btn = document.getElementById('submit-btn');
  if (btn) btn.disabled = !filled;
}

// ── SUBMIT TAKEAWAYS ──
async function submitTakeaways(nextScreenIdx) {
  const t1 = document.getElementById('t1')?.value?.trim() || '';
  const t2 = document.getElementById('t2')?.value?.trim() || '';
  const t3 = document.getElementById('t3')?.value?.trim() || '';

  const chapterKey = 'chapter' + currentChapter.chapterNum;
  saveTakeaways(chapterKey, [t1, t2, t3]);

  // Hide inputs, show loading
  document.getElementById('reader-inputs').style.display = 'none';
  document.getElementById('loading-state').classList.add('show');

  const user = getUser();
  let perspectives = currentChapter.vikramPerspectives;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(RAILWAY_URL + '/api/agent', {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userName:     user.name,
        userRev:      user.rev,
        userSector:   user.sector,
        chapter:      currentChapter.chapterNum,
        chapterTitle: currentChapter.chapterTitle,
        takeaways:    [t1, t2, t3]
      })
    });

    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.perspectives?.length === 3) perspectives = data.perspectives;
    }
  } catch (e) {
    // Timeout or network error — use fallback silently
  }

  // Hide loading, show agent response
  document.getElementById('loading-state').classList.remove('show');
  document.getElementById('agent-response').classList.add('show');

  // Reveal Vikram's items one by one
  [0, 600, 1200].forEach((delay, i) => {
    setTimeout(() => {
      const textEl = document.getElementById('ai-text-' + (i + 1));
      const itemEl = document.getElementById('ai-' + (i + 1));
      if (textEl) textEl.innerHTML = perspectives[i];
      if (itemEl) itemEl.classList.add('show');
      if (i === 2) {
        setTimeout(() => {
          const cont = document.getElementById('continue-row');
          if (cont) cont.classList.add('show');
        }, 500);
      }
    }, delay);
  });
}

// ── END SCREEN ──
function populateEndScreen() {
  const wrap = document.getElementById('saved-takeaways');
  if (!wrap) return;

  const chapterKey = 'chapter' + currentChapter.chapterNum;
  const all        = getAllTakeaways();
  const takeaways  = all[chapterKey] || [];

  wrap.innerHTML = '';
  takeaways.forEach(t => {
    if (!t) return;
    const div = document.createElement('div');
    div.className = 'saved-item';
    div.innerHTML = '<div class="saved-dot"></div><div>' + t + '</div>';
    wrap.appendChild(div);
  });

  if (takeaways.length === 0) {
    wrap.innerHTML = '<div style="font:400 0.875rem/1.5 \'Inter\',sans-serif;color:var(--ink-3);">No takeaways recorded for this chapter.</div>';
  }
}

// ── LOADER / ERROR ──
function showLoader() {
  const el = document.getElementById('app-loader');
  if (el) { el.classList.remove('hide'); }
}

function hideLoader() {
  const el = document.getElementById('app-loader');
  if (el) {
    setTimeout(() => el.classList.add('hide'), 200);
  }
}

function showError() {
  hideLoader();
  const el = document.getElementById('app-error');
  if (el) el.classList.add('show');
}

// ── BROWSER BACK/FORWARD ──
window.addEventListener('popstate', () => route({ forceVerify: false }));

// ── KEYBOARD NAVIGATION ──
document.addEventListener('keydown', e => {
  const screen = document.getElementById('sc-' + currentScreen);
  const screenBody = screen?.querySelector('.screen-body');
  const screenType = getCurrentScreenType();

  // Block navigation on form and vikram screens
  if (screenType === 'form' || screenType === 'vikram') return;

  // Up/Down arrows scroll content, not navigate
  if (['ArrowDown', 'ArrowUp'].includes(e.key)) {
    if (screenBody) {
      e.preventDefault();
      screenBody.scrollBy({ top: e.key === 'ArrowDown' ? 120 : -120, behavior: 'smooth' });
    }
    return;
  }

  // Left/Right and Page keys navigate screens
  if (['ArrowRight', 'PageDown'].includes(e.key)) {
    go(currentScreen, currentScreen + 1);
  }
  if (['ArrowLeft', 'PageUp'].includes(e.key)) {
    go(currentScreen, currentScreen - 1);
  }
});

function getCurrentScreenType() {
  // Get the type of current screen from the loaded chapter/onboarding
  const screens = currentChapter?.screens;
  if (!screens) return null;
  return screens[currentScreen]?.type || null;
}

// ── SWIPE NAVIGATION ──
let touchStartX = 0;
document.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
}, { passive: true });

document.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 50) {
    go(currentScreen, currentScreen + (dx < 0 ? 1 : -1));
  }
}, { passive: true });

// ── EXPOSE GLOBALS (called from inline HTML onclick) ──
window.go                  = go;
window.goToChapter         = goToChapter;
window.goToBackmatter      = goToBackmatter;
window.goToDiagnosis       = goToDiagnosis;
window.submitForm          = submitForm;
window.submitTakeaways     = submitTakeaways;
window.submitBookTakeaways = submitBookTakeaways;
window.checkInputs         = checkInputs;
window.loadDiagnosisData   = loadDiagnosisData;
window.navigate            = navigate;
window.loadOnboarding      = loadOnboarding;
window.markWorkbookDownloaded = markWorkbookDownloaded;

// ── INIT ──
route();
