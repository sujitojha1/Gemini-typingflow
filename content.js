let nuggets = [];
let overlay = null;
let mode = 'none';
let typingIndex = 0;
let typingStartTime = 0;
let totalCharsTyped = 0;

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function extractFullText() {
  const root = document.querySelector('article, main, [role="main"]') || document.body;
  const els = Array.from(root.querySelectorAll('p, h1, h2, h3, li, blockquote'))
    .filter(el => !el.closest('nav, header, footer, aside, [role="navigation"]'));
  
  return els.map(el => el.innerText.trim()).filter(text => text.length > 25).join('\n\n');
}

function injectStyles() {
  const existing = document.getElementById('tf-styles');
  if (existing) existing.remove();
  const s = document.createElement('style');
  s.id = 'tf-styles';
  s.textContent = `
    @keyframes tf-fade-in { from { opacity:0 } to { opacity:1 } }
    @keyframes tf-cursor-blink { 0%,100% { border-bottom-color:#4a8cd4 } 50% { border-bottom-color:transparent } }

    #tf-master-overlay {
      position:fixed !important; inset:0 !important; z-index:2147483647 !important;
      background:rgba(13, 12, 11, 0.95) !important; color:#ECEBDE !important;
      backdrop-filter: blur(8px);
      font-family:'Menlo','Monaco',ui-monospace,'Courier New',monospace !important;
      display:flex !important; flex-direction:column !important;
      overflow-y:auto !important; animation:tf-fade-in 0.3s ease !important;
      box-sizing:border-box !important;
    }
    #tf-master-overlay * {
      text-transform:none !important; font-style:normal !important;
      text-decoration:none !important; box-sizing:border-box !important;
    }
    .tf-topbar {
      display:flex !important; align-items:center !important; gap:6px !important;
      padding:14px 24px !important; border-bottom:1px solid rgba(255,255,255,0.1) !important;
      background:rgba(20,20,20,0.8) !important; position:sticky !important; top:0 !important;
      z-index:10 !important; flex-shrink:0 !important;
    }
    .tf-dot { width:10px !important; height:10px !important; border-radius:50% !important; flex-shrink:0 !important; }
    .tf-topbar-title { font-size:13px !important; color:#a19d96 !important; margin-left:8px !important; letter-spacing:0.3px !important; }
    #tf-close {
      margin-left:auto !important; background:transparent !important;
      border:1px solid rgba(255,255,255,0.1) !important; color:#a19d96 !important;
      border-radius:3px !important; width:28px !important; height:28px !important;
      cursor:pointer !important; font-size:14px !important;
      display:flex !important; align-items:center !important; justify-content:center !important;
      transition:all 0.15s !important;
    }
    #tf-close:hover { background:rgba(255,255,255,0.1) !important; color:#ECEBDE !important; }
    
    .tf-inner-wrapper {
      max-width:800px !important; width:100% !important;
      margin:0 auto !important; padding:40px 32px 60px !important;
    }
    .tf-h1 { font-size:18px !important; font-weight:normal !important; color:#4a8cd4 !important; margin:0 0 8px !important; }
    .tf-subtitle { color:#8c8a85 !important; font-size:12px !important; letter-spacing:0.5px !important; margin-bottom:32px !important; }
    
    .tf-nugget-card {
      background:rgba(30, 30, 30, 0.4) !important; border:1px solid rgba(255,255,255,0.05) !important;
      border-left:3px solid #4a8cd4 !important; padding:20px 24px !important;
      border-radius:0 6px 6px 0 !important; margin-bottom:16px !important;
      font-size:15px !important; line-height:1.6 !important; position:relative !important;
      transition:all 0.2s ease !important; cursor:pointer !important;
    }
    .tf-nugget-card:hover {
      background:rgba(40, 40, 40, 0.6) !important; border-left-color:#6ba3d6 !important;
      border-color:rgba(255,255,255,0.1) !important; transform:translateX(4px) !important;
    }
    .tf-nugget-idx { display:block !important; font-size:10px !important; color:#a19d96 !important; margin-bottom:8px !important; letter-spacing:1px !important; }
    
    .tf-target {
      font-size:18px !important; line-height:2 !important;
      color:#5e5c59 !important; font-family:'Menlo','Monaco',ui-monospace,'Courier New',monospace !important;
      white-space:pre-wrap !important; word-break:break-word !important;
      margin-top:20px !important;
    }
    .tf-char.correct { color:#ECEBDE !important; }
    .tf-char.wrong { color:#f87171 !important; background:rgba(248,113,113,0.1) !important; border-bottom:1px solid #f87171 !important; }
    .tf-char.cursor { color:#4a8cd4 !important; border-bottom:2px solid #4a8cd4 !important; animation:tf-cursor-blink 1s step-end infinite !important; }
    
    .tf-input-hidden { opacity:0 !important; position:absolute !important; top:-9999px !important; }
    
    .tf-action-btn {
      background:transparent !important; border:1px solid #4a8cd4 !important;
      padding:10px 24px !important; border-radius:4px !important; color:#4a8cd4 !important;
      font-size:13px !important; cursor:pointer !important; margin-top:28px !important;
      font-family:inherit !important; transition:all 0.15s !important;
    }
    .tf-action-btn:hover { background:#4a8cd4 !important; color:#0d0c0b !important; }
    
    .tf-stats { display:flex !important; gap:12px !important; justify-content:center !important; margin-top:28px !important; }
    .tf-stat-box { border:1px solid rgba(255,255,255,0.1) !important; padding:16px 24px !important; border-radius:4px !important; text-align:center !important; min-width:90px !important; }
    .tf-stat-val { font-size:24px !important; color:#4a8cd4 !important; margin-bottom:4px !important; }
    .tf-stat-label { font-size:10px !important; color:#8c8a85 !important; letter-spacing:1px !important; }
  `;
  document.head.appendChild(s);
}

function topBar(title) {
  return `<div class="tf-topbar">
    <div class="tf-dot" style="background:#ED655A"></div>
    <div class="tf-dot" style="background:#E1C04C"></div>
    <div class="tf-dot" style="background:#72BE47"></div>
    <span class="tf-topbar-title">${title}</span>
    <button id="tf-close">✕</button>
  </div>`;
}

function createOverlay() {
  injectStyles();
  if (overlay) document.body.removeChild(overlay);
  overlay = document.createElement('div');
  overlay.id = 'tf-master-overlay';
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
}

function removeOverlay() {
  if (overlay) { overlay.remove(); overlay = null; }
  document.body.style.overflow = '';
  mode = 'none';
}

function showBeautified() {
  createOverlay();
  mode = 'beautify';

  let html = topBar('gemini_typing_flow — extracted nuggets');
  html += `<div class="tf-inner-wrapper">
    <div class="tf-h1">$ print insights.json</div>
    <div class="tf-subtitle">Extracted ${nuggets.length} key insights via Gemini · click any to start typing</div>`;

  nuggets.forEach((n, i) => {
    html += `<div class="tf-nugget-card tf-clickable" data-idx="${i}">
      <span class="tf-nugget-idx">[insight_${String(i + 1).padStart(2, '0')}] ── click to internalize ›</span>
      <div>${escapeHtml(n.text)}</div>
    </div>`;
  });

  html += `</div>`;
  overlay.innerHTML = html;

  document.getElementById('tf-close').addEventListener('click', removeOverlay);
  document.querySelectorAll('.tf-clickable').forEach(card => {
    card.addEventListener('click', (e) => {
      typingIndex = parseInt(e.currentTarget.getAttribute('data-idx'));
      typingStartTime = Date.now();
      totalCharsTyped = 0;
      mode = 'type';
      renderTypingChallenge();
    });
  });
}

function showTyping() {
  createOverlay();
  mode = 'type';
  typingIndex = 0;
  typingStartTime = Date.now();
  totalCharsTyped = 0;
  renderTypingChallenge();
}

function renderTypingChallenge() {
  if (typingIndex >= nuggets.length) {
    const elapsedSec = Math.floor((Date.now() - typingStartTime) / 1000);
    const wpm = elapsedSec > 0 ? Math.round((totalCharsTyped / 5) / (elapsedSec / 60)) : 0;
    overlay.innerHTML = `${topBar('gemini_typing_flow — session complete')}
      <div class="tf-inner-wrapper" style="text-align:center;padding-top:80px;">
        <div class="tf-h1" style="font-size:24px;margin-bottom:8px;">All insights internalized.</div>
        <div style="color:#8c8a85;font-size:12px;margin-bottom:32px;">You've actively typed all ${nuggets.length} nuggets.</div>
        <div class="tf-stats">
          <div class="tf-stat-box"><div class="tf-stat-val">${elapsedSec}s</div><div class="tf-stat-label">TIME</div></div>
          <div class="tf-stat-box"><div class="tf-stat-val">${totalCharsTyped}</div><div class="tf-stat-label">CHARS</div></div>
          <div class="tf-stat-box"><div class="tf-stat-val">${wpm}</div><div class="tf-stat-label">WPM</div></div>
        </div>
        <button id="tf-done-btn" class="tf-action-btn">Close Session</button>
      </div>`;
    document.getElementById('tf-close').addEventListener('click', removeOverlay);
    document.getElementById('tf-done-btn').addEventListener('click', removeOverlay);
    return;
  }

  const text = nuggets[typingIndex].text.replace(/\s+/g, ' ');
  let nuggetStartTime = Date.now();

  let html = `${topBar('gemini_typing_flow — active recall')}
    <div class="tf-inner-wrapper">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.1);">
        <div style="font-size:12px;color:#8c8a85;">Insight ${typingIndex + 1} of ${nuggets.length}</div>
        <div style="font-size:12px;color:#8c8a85;">
          <span id="tf-live-wpm">0 wpm</span> &nbsp;·&nbsp;
          <span id="tf-live-acc">100% acc</span> &nbsp;·&nbsp;
          <span id="tf-live-prog" style="color:#4a8cd4;">0/${text.length}</span>
        </div>
      </div>
      <div id="tf-target" class="tf-target">`;

  for (let i = 0; i < text.length; i++) {
    html += `<span class="tf-char">${text[i] === ' ' ? '&nbsp;' : escapeHtml(text[i])}</span>`;
  }
  
  html += `</div><input type="text" id="tf-hidden-input" class="tf-input-hidden" autocomplete="off" spellcheck="false" /></div>`;
  overlay.innerHTML = html;

  const targetDiv = document.getElementById('tf-target');
  const input = document.getElementById('tf-hidden-input');

  targetDiv.querySelectorAll('.tf-char')[0]?.classList.add('cursor');
  setTimeout(() => input.focus(), 100);
  document.getElementById('tf-master-overlay').addEventListener('click', () => input.focus());
  document.getElementById('tf-close').addEventListener('click', removeOverlay);

  input.addEventListener('input', (e) => {
    const typed = e.target.value;
    const spans = targetDiv.querySelectorAll('.tf-char');
    if (typed.length > text.length) {
      input.value = typed.slice(0, text.length);
      return;
    }

    let allCorrect = true;
    let errors = 0;
    spans.forEach((span, i) => {
      span.className = 'tf-char';
      if (i < typed.length) {
        if (typed[i] === text[i]) { span.classList.add('correct'); }
        else { span.classList.add('wrong'); errors++; allCorrect = false; }
      } else if (i === typed.length) {
        span.classList.add('cursor');
      }
    });

    const timeElapsedMins = (Date.now() - nuggetStartTime) / 60000;
    const wpm = timeElapsedMins > 0 ? Math.round((typed.length / 5) / timeElapsedMins) : 0;
    const acc = typed.length > 0 ? Math.round(((typed.length - errors) / typed.length) * 100) : 100;
    document.getElementById('tf-live-prog').innerText = `${typed.length}/${text.length}`;
    document.getElementById('tf-live-wpm').innerText = `${wpm} wpm`;
    document.getElementById('tf-live-acc').innerText = `${acc}% acc`;

    if (typed.length === text.length && allCorrect) {
      setTimeout(() => {
        totalCharsTyped += text.length;
        typingIndex++;
        renderTypingChallenge();
      }, 400);
    }
  });
}

function saveAsHTML() {
  const date = new Date().toLocaleDateString();
  const cardsHtml = nuggets.map((n, i) => `
    <div style="border:1px solid #eee; border-left:4px solid #4a8cd4; padding:20px; margin-bottom:12px; font-family:sans-serif; background:#fefefe;">
      <div style="color:#888; font-size:12px; margin-bottom:8px;">Insight ${i + 1}</div>
      <div style="font-size:16px; line-height:1.5;">${escapeHtml(n.text)}</div>
    </div>`).join('');

  const htmlContent = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Gemini TypingFlow — Saved Insights</title>
<style>body{background:#f9f9f9; padding:40px;} .container{max-width:700px; margin:auto;} h1{color:#333;font-family:sans-serif;}</style>
</head><body>
  <div class="container">
    <h1>Extracted Insights</h1>
    <p style="color:#666; font-family:sans-serif; margin-bottom:24px;">Generated on ${date}</p>
    ${cardsHtml}
  </div>
</body></html>`;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Gemini_Insights_${Date.now()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

if (!window.geminiTfInitialized) {
  window.geminiTfInitialized = true;
  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === 'ping') {
      sendResponse({ hasNuggets: nuggets.length > 0 });
    } else if (request.action === 'extract_text') {
      sendResponse({ text: extractFullText() });
    } else if (request.action === 'beautify') {
      nuggets = request.nuggets.map(text => ({ text }));
      showBeautified();
      sendResponse({ success: true });
    } else if (request.action === 'type') {
      if (nuggets.length > 0) showTyping();
      sendResponse({ success: true });
    } else if (request.action === 'save') {
      if (nuggets.length > 0) saveAsHTML();
      sendResponse({ success: true });
    }
  });
}
