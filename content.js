const CONFIG = {
    SCRIPT_INJECTION_DELAY_MS: 250,
    MIN_TEXT_LENGTH: 30,
    MIN_IMAGE_WIDTH_PX: 100,
    CHARS_PER_WORD: 5,
};

function escapeHtml(str) {
    return str.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function isValidHttpUrl(str) {
    try {
        const url = new URL(str);
        return url.protocol === 'https:' || url.protocol === 'http:';
    } catch { return false; }
}

// Phase 2: Advanced DOM Extraction for Semantic LLM Structuring
function extractPageContent() {
    const root = document.querySelector('article, main, [role="main"]') || document.body;
    const elements = Array.from(root.querySelectorAll('p, h1, h2, h3, li, blockquote, img'))
        .filter(el => {
            if (el.closest('nav, header, footer, aside, [role="navigation"]')) return false;
            if (el.tagName === 'IMG') {
                const rect = el.getBoundingClientRect();
                if ((el.width && el.width < CONFIG.MIN_IMAGE_WIDTH_PX) || rect.width < CONFIG.MIN_IMAGE_WIDTH_PX) return false;
                return true;
            }
            if (el.tagName !== 'IMG' && el.innerText.trim().length < CONFIG.MIN_TEXT_LENGTH) return false;
            return true;
        });

    let structuredPayload = [];
    elements.forEach(el => {
        if (el.tagName === 'IMG') {
            const src = el.src || el.dataset.src;
            if (src && !src.startsWith('data:')) structuredPayload.push({ type: 'image', src: src });
        } else {
            structuredPayload.push({ type: 'text', content: el.innerText.trim() });
        }
    });
    return structuredPayload;
}

// -------------------------------------------------------------
// Phases 3, 4 & 5: Active Recall UI & Second Brain Markdown Export
// -------------------------------------------------------------

let sessionData = null;
let currentNuggetIndex = 0;
let overlayWrapper = null;
let startTime = null;
let errorsMade = 0;

const INJECT_CSS = `
  @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  #tf-overlay-root {
    position: fixed; inset: 0; z-index: 2147483647; background: rgba(15, 15, 20, 0.95); backdrop-filter: blur(16px);
    display: flex; flex-direction: column; font-family: 'Menlo', 'Monaco', monospace; color: #ECEBDE;
    animation: fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1); overflow-y: auto; box-sizing: border-box;
  }
  #tf-overlay-root * { box-sizing: border-box; text-transform: none; }
  
  .tf-topbar { 
    display: flex; justify-content: space-between; align-items: center; 
    padding: 20px 40px; background: rgba(0,0,0,0.3); border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .tf-dots { display: flex; gap: 8px; }
  .tf-dot { width: 12px; height: 12px; border-radius: 50%; }
  .tf-dot-r { background: #ff5f56; } .tf-dot-y { background: #ffbd2e; } .tf-dot-g { background: #27c93f; }
  .tf-title { color: #888; font-size: 13px; font-weight: 500; letter-spacing: 0.5px; }
  .tf-close-box { 
    width: 32px; height: 32px; display: flex; justify-content: center; align-items: center; 
    border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; cursor: pointer; color: #888; transition: all 0.2s; font-size: 20px;
  }
  .tf-close-box:hover { color: #fff; background: rgba(255,255,255,0.1); }
  
  .tf-stats-bar {
    display: flex; justify-content: space-between; align-items: center; max-width: 1100px; width: 100%; margin: 40px auto 20px;
    font-size: 12px; color: #888; font-family: 'Menlo', monospace; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 20px;
  }
  .tf-nav-btns { display: flex; gap: 20px; }
  .tf-nav-btn { background: none; border: none; color: #4a8cd4; cursor: pointer; font-family: inherit; font-size: 13px; font-weight: 600; padding: 0; outline: none; margin: 0; }
  .tf-nav-btn.disabled { color: #444; cursor: not-allowed; }
  
  .tf-main-container {
    display: flex; gap: 40px; max-width: 1100px; margin: 0 auto; width: 100%; align-items: flex-start;
  }
  
  .tf-image-panel {
    flex: 0 0 450px; border-radius: 8px; overflow: hidden; box-shadow: 0 12px 32px rgba(0,0,0,0.4);
    background: #1a1a1a; display: flex; justify-content: center; align-items: flex-start; position: sticky; top: 120px;
  }
  .tf-image-panel img { width: 100%; height: auto; object-fit: contain; display: block; max-height: 500px; }
  
  .tf-typing-panel { flex: 1; position: relative; }
  .tf-nugget-name { color: #666; font-size: 13px; margin-bottom: 24px; font-family: 'Menlo', monospace; }
  
  #tf-target { font-size: 18px; line-height: 1.8; color: #555; white-space: pre-wrap; word-break: break-word; outline: none; }
  .tf-char.correct { color: #ECEBDE; }
  .tf-char.wrong { color: #ff5555; background: rgba(255, 85, 85, 0.1); border-bottom: 2px solid #ff5555; }
  .tf-char.cursor { color: #4a8cd4; border-bottom: 2px solid #4a8cd4; animation: blink 1s step-end infinite; }
  @keyframes blink { 50% { border-color: transparent; } }
  
  .tf-hidden-input { position: absolute; opacity: 0; top: -100px; }
  
  .tf-nano-loader { font-size: 12px; color: #E1C04C; animation: pulse 1s infinite; padding: 20px; text-align: center; }
  .tf-export-btn { display: block; padding: 16px 32px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; font-size: 16px; font-family: 'Menlo', monospace; cursor: pointer; margin: 40px auto 0; transition: all 0.2s; border-radius: 4px; }
  .tf-export-btn:hover { background: rgba(74, 140, 212, 0.2); border-color: #4a8cd4; color: #4a8cd4; }
`;

function mountUI(data) {
    let s = document.getElementById('tf-style');
    if (s) s.remove();
    s = document.createElement('style');
    s.id = 'tf-style';
    s.textContent = INJECT_CSS;
    document.head.appendChild(s);
    sessionData = data;
}

function openOverlay() {
    if(!sessionData || !sessionData.nuggets || sessionData.nuggets.length === 0) return;
    if (overlayWrapper) overlayWrapper.remove();
    overlayWrapper = document.createElement('div');
    overlayWrapper.id = 'tf-overlay-root';
    document.body.appendChild(overlayWrapper);
    document.body.style.overflow = 'hidden';

    currentNuggetIndex = 0;
    renderCurrentNugget();
}

function renderCurrentNugget() {
    if (currentNuggetIndex >= sessionData.nuggets.length) {
        renderCompletionState();
        return;
    }

    startTime = null;
    errorsMade = 0;
    const nugget = sessionData.nuggets[currentNuggetIndex];
    const capturedIndex = currentNuggetIndex;
    const textToType = nugget.text.replace(/\s+/g, ' ');
    const isFirst = currentNuggetIndex === 0;

    overlayWrapper.innerHTML = `
        <div class="tf-topbar">
            <div class="tf-dots">
                <div class="tf-dot tf-dot-r"></div>
                <div class="tf-dot tf-dot-y"></div>
                <div class="tf-dot tf-dot-g"></div>
            </div>
            <div class="tf-title">typingflow - type</div>
            <div class="tf-close-box" id="tf-close-btn">&times;</div>
        </div>

        <div class="tf-stats-bar">
            <div class="tf-nav-btns">
                <button class="tf-nav-btn ${isFirst ? 'disabled' : ''}" id="tf-prev-btn">&larr; prev</button>
                <button class="tf-nav-btn" id="tf-next-btn">next &rarr;</button>
            </div>
            <div id="tf-stats">0 wpm &middot; 100% acc &middot; 0/${textToType.length}</div>
        </div>

        <div class="tf-main-container">
            <div class="tf-image-panel" id="tf-image-panel"></div>
            <div class="tf-typing-panel">
                <div class="tf-nugget-name">nugget_${currentNuggetIndex + 1}_of_${sessionData.nuggets.length}.txt</div>
                <div id="tf-target"></div>
                <input type="text" class="tf-hidden-input" id="tf-type-input" autocomplete="off" spellcheck="false" />
            </div>
        </div>
    `;

    // Populate image panel via DOM methods (avoids XSS from API-supplied URLs)
    const imagePanel = document.getElementById('tf-image-panel');
    if (nugget.img_src && isValidHttpUrl(nugget.img_src)) {
        const img = document.createElement('img');
        img.alt = 'Contextual Asset';
        img.src = nugget.img_src;
        imagePanel.appendChild(img);
    } else if (!nugget.img_src) {
        const loader = document.createElement('div');
        loader.className = 'tf-nano-loader';
        loader.id = `tf-nano-${capturedIndex}`;
        loader.textContent = '🖼️ Rendering visual via Gemini Flash Image...';
        imagePanel.appendChild(loader);
        chrome.runtime.sendMessage({
            action: "generate_image_asset",
            payload: { text: nugget.text, tags: sessionData.tags }
        }, (resp) => {
            if (resp && resp.success && resp.img_src) {
                sessionData.nuggets[capturedIndex].img_src = resp.img_src;
                const imgContainer = document.getElementById(`tf-nano-${capturedIndex}`);
                if (imgContainer) {
                    const img = document.createElement('img');
                    img.alt = 'Contextual Asset';
                    img.src = resp.img_src;
                    img.style.animation = 'fade-in 0.5s ease-out';
                    imgContainer.replaceWith(img);
                }
            }
        });
    }

    // Build char spans via DOM to avoid XSS from nugget text content
    const targetDiv = document.getElementById('tf-target');
    for (let i = 0; i < textToType.length; i++) {
        const span = document.createElement('span');
        span.className = 'tf-char';
        span.textContent = textToType[i];
        targetDiv.appendChild(span);
    }

    document.getElementById('tf-close-btn').addEventListener('click', closeOverlay);
    document.getElementById('tf-next-btn').addEventListener('click', () => {
        currentNuggetIndex++;
        renderCurrentNugget();
    });
    
    const prevBtn = document.getElementById('tf-prev-btn');
    if (!isFirst) {
        prevBtn.addEventListener('click', () => {
            currentNuggetIndex--;
            renderCurrentNugget();
        });
    }
    
    const input = document.getElementById('tf-type-input');
    const statsDiv = document.getElementById('tf-stats');

    targetDiv.querySelectorAll('.tf-char')[0]?.classList.add('cursor');
    setTimeout(() => input.focus(), 100);
    overlayWrapper.addEventListener('click', () => input.focus());

    input.addEventListener('input', (e) => {
        if (!startTime) startTime = Date.now();
        const typed = e.target.value;
        const spans = targetDiv.querySelectorAll('.tf-char');
        if (typed.length > textToType.length) {
            input.value = typed.slice(0, textToType.length);
            return;
        }

        let allCorrect = true;
        let localErrors = 0;
        
        spans.forEach((span, i) => {
            span.className = 'tf-char';
            if (i < typed.length) {
                if (typed[i] === textToType[i]) {
                    span.classList.add('correct');
                } else { 
                    span.classList.add('wrong'); 
                    allCorrect = false; 
                    localErrors++;
                }
            } else if (i === typed.length) span.classList.add('cursor');
        });

        const timeElapsedMin = (Date.now() - startTime) / 60000;
        const wordsTyped = typed.length / CONFIG.CHARS_PER_WORD;
        const wpm = timeElapsedMin > 0 ? Math.round(wordsTyped / timeElapsedMin) : 0;
        const acc = typed.length > 0 ? Math.round(((typed.length - localErrors) / typed.length) * 100) : 100;
        
        statsDiv.innerHTML = `${wpm} wpm &middot; ${acc}% acc &middot; ${typed.length}/${textToType.length}`;

        if (typed.length === textToType.length && allCorrect) {
            currentNuggetIndex++;
            setTimeout(() => renderCurrentNugget(), 300);
        }
    });
}

function renderCompletionState() {
    overlayWrapper.innerHTML = `
        <div class="tf-topbar">
            <div class="tf-dots"><div class="tf-dot tf-dot-r"></div><div class="tf-dot tf-dot-y"></div><div class="tf-dot tf-dot-g"></div></div>
            <div class="tf-title">typingflow - complete</div>
            <div class="tf-close-box" id="tf-final-close">&times;</div>
        </div>
        <div style="max-width:600px; margin: 100px auto; text-align: center;">
            <div style="font-size: 64px; margin-bottom: 20px;">🧠</div>
            <div style="font-size: 24px; color: #ECEBDE; margin-bottom: 16px;">Session Complete</div>
            <p style="color:#aaa; font-size:14px; line-height: 1.6;">You have actively internalized ${sessionData.nuggets.length} key insights.</p>
            <button class="tf-export-btn" id="tf-trigger-export">export_to_markdown() 🗂️</button>
        </div>
    `;
    
    document.getElementById('tf-final-close').addEventListener('click', closeOverlay);
    document.getElementById('tf-trigger-export').addEventListener('click', exportToMarkdown);
}

function closeOverlay() {
    if(overlayWrapper) { overlayWrapper.remove(); overlayWrapper = null; }
    document.body.style.overflow = '';
}

// Phase 5: Second Brain Markdown Export weaving tags and images
function exportToMarkdown() {
    const d = new Date().toISOString().split('T')[0];
    const rawTags = sessionData.tags || [];
    const tagsYaml = rawTags.map(t => t.replace('#','')).join(', ');
    
    let md = `---
title: "Insights: ${document.title.replace(/"/g, "'")}"
date: ${d}
tags: [${tagsYaml}]
source: ${window.location.href}
---

# ${document.title}

> **TL;DR**: *${sessionData.tldr}*

## Core Concepts Internalized
`;

    sessionData.nuggets.forEach((n, i) => {
        md += `\n### Insight ${i+1}\n\n`;
        md += `> ${n.text}\n\n`;
        if (n.img_src) {
            md += `![Contextual Asset](${n.img_src})\n\n`;
        }
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Gemini_Insights_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

if (!window.geminiTfEventListening) {
    window.geminiTfEventListening = true;
    chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
        if (request.action === 'extract_content') {
            sendResponse({ payload: extractPageContent() });
        } else if (request.action === 'mount_ui') {
            mountUI(request.data);
            sendResponse({ success: true });
        } else if (request.action === 'open_overlay') {
            openOverlay();
            sendResponse({ success: true });
        } else if (request.action === 'check_session') {
            sendResponse({ hasSession: !!sessionData });
        }
    });
}
