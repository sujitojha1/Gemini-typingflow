let nuggets = [];
let overlay = null;
let mode = 'none';
let typingIndex = 0;
let typingStartTime = 0;
let totalCharsTyped = 0;

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function injectStyles() {
  const existing = document.getElementById('tf-styles');
  if (existing) existing.remove(); // always replace so updates take effect
  const s = document.createElement('style');
  s.id = 'tf-styles';
  s.textContent = `
@keyframes tf-fade-in { from { opacity:0 } to { opacity:1 } }
@keyframes tf-cursor-blink { 0%,100% { border-bottom-color:#D97757 } 50% { border-bottom-color:transparent } }

#tf-master-overlay {
  position:fixed !important; inset:0 !important; z-index:2147483647 !important;
  background:#0d0c0b !important; color:#ECEBDE !important;
  font-family:'Menlo','Monaco',ui-monospace,'Courier New',monospace !important;
  display:flex !important; flex-direction:column !important;
  overflow-y:auto !important; animation:tf-fade-in 0.2s ease !important;
  box-sizing:border-box !important;
}
/* Block all host-page text transforms and resets from leaking in */
#tf-master-overlay, #tf-master-overlay * {
  text-transform:none !important; font-style:normal !important;
  text-decoration:none !important; box-sizing:border-box !important;
}
.tf-topbar {
  display:flex !important; align-items:center !important; gap:6px !important;
  padding:14px 24px !important; border-bottom:1px solid #1a1917 !important;
  background:#0d0c0b !important; position:sticky !important; top:0 !important;
  z-index:10 !important; flex-shrink:0 !important;
}
.tf-dot { width:10px !important; height:10px !important; border-radius:50% !important; flex-shrink:0 !important; }
.tf-topbar-title { font-size:13px !important; color:#3a3834 !important; margin-left:8px !important; letter-spacing:0.3px !important; }
#tf-close {
  margin-left:auto !important; background:transparent !important;
  border:1px solid #2a2926 !important; color:#5a5550 !important;
  border-radius:3px !important; width:38px !important; height:38px !important;
  cursor:pointer !important; font-size:17px !important;
  display:flex !important; align-items:center !important; justify-content:center !important;
  transition:all 0.15s !important; font-family:inherit !important;
}
#tf-close:hover { background:#1a1917 !important; color:#ECEBDE !important; border-color:#3a3834 !important; }
.tf-inner-wrapper {
  max-width:900px !important; width:100% !important;
  margin:0 auto !important; padding:40px 32px 60px !important;
}
.tf-h1 { font-size:15px !important; font-weight:normal !important; color:#D97757 !important; margin:0 0 4px !important; }
.tf-subtitle { color:#3a3834 !important; font-size:10px !important; letter-spacing:0.5px !important; margin-bottom:28px !important; }
.tf-nugget-card {
  background:#111010 !important; border:1px solid #1a1917 !important;
  border-left:3px solid #D97757 !important; padding:18px 22px !important;
  border-radius:0 4px 4px 0 !important; margin-bottom:10px !important;
  font-size:14px !important; line-height:1.75 !important; position:relative !important;
  transition:all 0.12s ease !important;
}
.tf-nugget-card:hover {
  background:#161514 !important; border-left-color:#E58668 !important;
  border-color:#2a2926 !important; transform:translateX(2px) !important;
}
.tf-nugget-idx { display:block !important; font-size:10px !important; color:#5a5550 !important; margin-bottom:10px !important; letter-spacing:1px !important; }
.tf-typing-container { max-width:1080px !important; margin:0 auto !important; width:100% !important; padding:28px 32px 60px !important; }
.tf-typing-card { display:flex !important; gap:40px !important; align-items:flex-start !important; margin-top:24px !important; }
.tf-card-image { width:300px !important; flex-shrink:0 !important; position:sticky !important; top:76px !important; }
.tf-card-image img { width:100% !important; border-radius:4px !important; opacity:0.85 !important; object-fit:cover !important; max-height:500px !important; display:block !important; }
.tf-card-content { flex:1 !important; min-width:0 !important; }
.tf-typing-header { color:#3a3834 !important; font-size:13px !important; letter-spacing:0.5px !important; margin-bottom:8px !important; }
.tf-target {
  font-size:clamp(15px,2vw,19px) !important; line-height:2 !important;
  color:#4a4744 !important; font-family:'Menlo','Monaco',ui-monospace,'Courier New',monospace !important;
  white-space:pre-wrap !important; word-break:break-word !important; overflow-wrap:break-word !important;
  margin-top:20px !important;
}
.tf-char.correct { color:#ECEBDE !important; }
.tf-char.wrong { color:#f87171 !important; background:rgba(248,113,113,0.14) !important; border-bottom:1px solid #f87171 !important; }
.tf-char.cursor { color:#D97757 !important; border-bottom:2px solid #D97757 !important; animation:tf-cursor-blink 1s step-end infinite !important; }
.tf-input-hidden { opacity:0 !important; position:absolute !important; top:-9999px !important; }
.tf-action-btn {
  background:transparent !important; border:1px solid #D97757 !important;
  padding:8px 20px !important; border-radius:3px !important; color:#D97757 !important;
  font-size:11px !important; cursor:pointer !important; margin-top:28px !important;
  font-family:'Menlo','Monaco',ui-monospace,monospace !important;
  letter-spacing:1px !important; transition:all 0.15s !important;
}
.tf-action-btn:hover { background:#D97757 !important; color:#0d0c0b !important; }
.tf-stats { display:flex !important; gap:12px !important; justify-content:center !important; margin-top:28px !important; }
.tf-stat-box { border:1px solid #1a1917 !important; padding:16px 24px !important; border-radius:3px !important; text-align:center !important; min-width:80px !important; }
.tf-stat-val { font-size:22px !important; color:#D97757 !important; margin-bottom:4px !important; }
.tf-stat-label { font-size:10px !important; color:#3a3834 !important; letter-spacing:1px !important; }
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

function extractNuggets() {
  nuggets = [];

  // Prefer focused content containers over the whole body
  const root = document.querySelector(
    'article, main, [role="main"], .post-content, .entry-content, .article-body, .content-body'
  ) || document.body;

  // Collect text-bearing elements; skip nav/header/footer/sidebar noise
  const els = Array.from(root.querySelectorAll('p, h2, h3, li, blockquote'))
    .filter(el => !el.closest('nav, header, footer, aside, [role="navigation"], [role="banner"], [role="complementary"]'));

  const TARGET = 600; // aim for ~600 chars (~100 words) per nugget
  const MIN    = 80;

  let buffer = '';
  let bufImg  = null;
  const chunks = [];

  function nearbyImg(el) {
    let img = el.querySelector('img');
    if (img) return img;
    let sib = el.previousElementSibling;
    for (let i = 0; i < 4 && sib; i++) {
      if (sib.tagName === 'IMG') return sib;
      const cls = typeof sib.className === 'string' ? sib.className : '';
      if (sib.tagName === 'FIGURE' || cls.includes('img') || cls.includes('image')) {
        img = sib.querySelector('img'); if (img) return img;
      }
      sib = sib.previousElementSibling;
    }
    return null;
  }

  function flush() {
    if (buffer.length >= MIN) chunks.push({ text: buffer.trim(), image: bufImg });
    buffer = ''; bufImg = null;
  }

  for (const el of els) {
    if (chunks.length >= 8) break;
    const text = el.innerText.trim();
    // Skip very short fragments, pure numbers, or lines that look like UI/nav labels
    if (text.length < 25 || /^[\d\s\W]+$/.test(text)) continue;

    const img = nearbyImg(el);
    if (img && !(img.width > 0 && img.width < 50) && img.src && !img.src.startsWith('data:') && !bufImg) {
      bufImg = img.src;
    }

    if (buffer.length > 0 && buffer.length + 1 + text.length > TARGET) {
      flush();
      if (chunks.length >= 8) break;
    }
    buffer += (buffer ? ' ' : '') + text;
  }
  flush();

  if (chunks.length === 0) {
    nuggets = [{ text: 'No substantial content could be extracted from this page.', image: null }];
    return nuggets;
  }

  nuggets = chunks.map(c => {
    let imgSrc = c.image || null;
    if (!imgSrc && typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
      imgSrc = chrome.runtime.getURL(`icons/placeholders/${Math.floor(Math.random() * 4) + 1}.png`);
    }
    return { text: c.text, image: imgSrc };
  });
  return nuggets;
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

  let html = topBar('typingflow — extract');
  html += `<div class="tf-inner-wrapper">
    <div class="tf-h1">$ extract --page-nuggets</div>
    <div class="tf-subtitle">${nuggets.length} fragments  ·  click any to type</div>`;

  nuggets.forEach((n, i) => {
    const imgHtml = n.image
      ? `<img src="${n.image}" style="width:100%;max-height:150px;object-fit:cover;border-radius:2px;margin-bottom:14px;opacity:0.85;" />`
      : '';
    html += `<div class="tf-nugget-card tf-clickable-card" data-idx="${i}" title="Click to type this nugget">
      <span class="tf-nugget-idx">[${String(i + 1).padStart(2, '0')}] ── click to type ›</span>
      ${imgHtml}<div>${escapeHtml(n.text)}</div>
    </div>`;
  });

  html += `</div>`;
  overlay.innerHTML = html;

  document.getElementById('tf-close').addEventListener('click', removeOverlay);
  document.querySelectorAll('.tf-clickable-card').forEach(card => {
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
  if (nuggets.length === 0) extractNuggets();
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
    overlay.innerHTML = `
      ${topBar('typingflow — complete')}
      <div class="tf-inner-wrapper" style="text-align:center;padding-top:80px;">
        <div style="font-size:10px;color:#3a3834;margin-bottom:12px;letter-spacing:1px;">process exited with code 0</div>
        <div class="tf-h1" style="font-size:22px;margin-bottom:4px;">$ session --complete</div>
        <div style="color:#3a3834;font-size:10px;margin-bottom:32px;">all ${nuggets.length} nuggets engaged</div>
        <div class="tf-stats">
          <div class="tf-stat-box"><div class="tf-stat-val">${elapsedSec}s</div><div class="tf-stat-label">time</div></div>
          <div class="tf-stat-box"><div class="tf-stat-val">${totalCharsTyped}</div><div class="tf-stat-label">chars</div></div>
          <div class="tf-stat-box"><div class="tf-stat-val">${wpm}</div><div class="tf-stat-label">wpm</div></div>
        </div>
        <button id="tf-done-btn" class="tf-action-btn">exit</button>
      </div>`;
    document.getElementById('tf-close').addEventListener('click', removeOverlay);
    document.getElementById('tf-done-btn').addEventListener('click', removeOverlay);
    return;
  }

  const nugget = nuggets[typingIndex];
  const text = nugget.text.replace(/\s+/g, ' ');
  let nuggetStartTime = Date.now();

  const prevDisabled = typingIndex === 0;
  const prevStyle = `background:none;border:none;color:${prevDisabled ? '#2a2926' : '#5a5550'};font-size:13px;cursor:${prevDisabled ? 'not-allowed' : 'pointer'};font-family:inherit;letter-spacing:0.5px;opacity:${prevDisabled ? 0.3 : 1};padding:4px 0;transition:color 0.1s;`;
  const nextStyle = `background:none;border:none;color:#D97757;font-size:13px;cursor:pointer;font-family:inherit;letter-spacing:0.5px;padding:4px 0;`;

  // Use inline styles for layout so host-page CSS can never override them
  const hasImage = !!nugget.image;

  const cardImageHtml = hasImage
    ? `<div style="width:280px;flex-shrink:0;position:sticky;top:76px;align-self:flex-start;">
         <img src="${nugget.image}" style="width:100%;display:block;border-radius:4px;object-fit:cover;max-height:480px;opacity:0.85;" />
       </div>`
    : '';

  const cardWrapperStyle = hasImage
    ? `display:flex;flex-direction:row;gap:40px;align-items:flex-start;margin-top:20px;`
    : `margin-top:20px;`;

  const contentStyle = hasImage
    ? `flex:1;min-width:0;`
    : ``;

  let html = `
    ${topBar('typingflow — type')}
    <div class="tf-typing-container">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;padding-bottom:12px;border-bottom:1px solid #1a1917;">
        <div style="display:flex;gap:24px;">
          <button id="tf-prev-btn" style="${prevStyle}">← prev</button>
          <button id="tf-next-btn" style="${nextStyle}">next →</button>
        </div>
        <div style="font-size:12px;color:#3a3834;letter-spacing:0.5px;">
          <span id="tf-live-wpm">0 wpm</span> &nbsp;·&nbsp;
          <span id="tf-live-acc">100% acc</span> &nbsp;·&nbsp;
          <span id="tf-live-prog" style="color:#D97757;">0/${text.length}</span>
        </div>
      </div>
      <div style="${cardWrapperStyle}">
        ${cardImageHtml}
        <div style="${contentStyle}">
          <div class="tf-typing-header">nugget_${typingIndex + 1}_of_${nuggets.length}.txt</div>
          <div id="tf-target" class="tf-target">`;

  for (let i = 0; i < text.length; i++) {
    html += `<span class="tf-char">${text[i] === ' ' ? '&nbsp;' : escapeHtml(text[i])}</span>`;
  }

  html += `</div>
          <input type="text" id="tf-hidden-input" class="tf-input-hidden" autocomplete="off" spellcheck="false" />
        </div>
      </div>
    </div>`;

  overlay.innerHTML = html;

  const targetDiv = document.getElementById('tf-target');
  const input = document.getElementById('tf-hidden-input');

  targetDiv.querySelectorAll('.tf-char')[0]?.classList.add('cursor');
  setTimeout(() => input.focus(), 100);
  document.getElementById('tf-master-overlay').addEventListener('click', () => input.focus());
  document.getElementById('tf-close').addEventListener('click', removeOverlay);
  document.getElementById('tf-next-btn').addEventListener('click', () => { typingIndex++; renderTypingChallenge(); });
  document.getElementById('tf-prev-btn').addEventListener('click', () => {
    if (typingIndex > 0) { typingIndex--; renderTypingChallenge(); }
  });

  input.addEventListener('paste', e => e.preventDefault());
  input.addEventListener('drop', e => e.preventDefault());

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
        chrome.storage.local.get(['lifetimeChars'], (res) => {
          chrome.storage.local.set({ lifetimeChars: (res.lifetimeChars || 0) + text.length });
        });
        typingIndex++;
        renderTypingChallenge();
      }, 400);
    }
  });
}

function saveAsHTML() {
  if (nuggets.length === 0) extractNuggets();
  const date = new Date().toLocaleDateString();
  const cardsHtml = nuggets.map((n, i) => {
    const imgHtml = n.image
      ? `<img src="${n.image}" style="width:100%;max-height:150px;object-fit:cover;border-radius:2px;margin-bottom:16px;opacity:0.85;" />`
      : '';
    return `<div class="card"><div class="chip">[${String(i + 1).padStart(2, '0')}]</div>${imgHtml}<div>${escapeHtml(n.text)}</div></div>`;
  }).join('');

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>TypingFlow — Saved Nuggets</title>
  <style>
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:'Menlo','Monaco',ui-monospace,'Courier New',monospace; background:#0d0c0b; color:#ECEBDE; padding:40px 20px; line-height:1.7; }
    .container { max-width:720px; margin:auto; }
    h1 { color:#D97757; font-size:15px; font-weight:normal; margin-bottom:4px; }
    .meta { color:#3a3834; font-size:10px; letter-spacing:0.5px; margin-bottom:32px; }
    .card { border:1px solid #1a1917; border-left:3px solid #D97757; padding:18px 22px; margin-bottom:10px; border-radius:0 4px 4px 0; font-size:14px; }
    .chip { font-size:10px; color:#5a5550; margin-bottom:10px; letter-spacing:1px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>$ typingflow --export-nuggets</h1>
    <div class="meta">extracted ${date}</div>
    ${cardsHtml}
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `TypingFlow_Nuggets_${Date.now()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

if (!window.tfContentInitialized) {
  window.tfContentInitialized = true;
  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === 'ping') {
      sendResponse({ hasNuggets: nuggets.length > 0 });
    } else if (request.action === 'beautify') {
      if (nuggets.length === 0) extractNuggets();
      showBeautified();
      sendResponse({ success: true });
    } else if (request.action === 'type') {
      showTyping();
      sendResponse({ success: true });
    } else if (request.action === 'save') {
      saveAsHTML();
      sendResponse({ success: true });
    }
  });

  let activeSeconds = 0;
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      activeSeconds++;
      if (activeSeconds % 60 === 0) {
        const domain = window.location.hostname;
        chrome.storage.local.get([domain], (res) => {
          chrome.storage.local.set({ [domain]: (res[domain] || 0) + 1 });
        });
      }
    }
  }, 1000);
}
