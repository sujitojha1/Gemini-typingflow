// Phase 2: Advanced DOM Extraction for Semantic LLM Structuring
function extractPageContent() {
    const root = document.querySelector('article, main, [role="main"]') || document.body;
    const elements = Array.from(root.querySelectorAll('p, h1, h2, h3, li, blockquote, img'))
        .filter(el => {
            if (el.closest('nav, header, footer, aside, [role="navigation"]')) return false;
            if (el.tagName === 'IMG') {
                const rect = el.getBoundingClientRect();
                if ((el.width && el.width < 100) || rect.width < 100) return false;
                return true;
            }
            if (el.tagName !== 'IMG' && el.innerText.trim().length < 30) return false;
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

const INJECT_CSS = \`
  @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  #tf-overlay-root {
    position: fixed; inset: 0; z-index: 2147483647; background: rgba(10, 10, 10, 0.85); backdrop-filter: blur(16px);
    display: flex; flex-direction: column; font-family: 'Inter', system-ui, sans-serif; color: #f1f1f1;
    animation: fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1); overflow-y: auto; padding: 40px; box-sizing: border-box;
  }
  #tf-overlay-root * { box-sizing: border-box; text-transform: none; }
  .tf-header { display: flex; justify-content: space-between; align-items: flex-start; max-width: 1000px; margin: 0 auto; width: 100%; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px; margin-bottom: 40px; }
  .tf-tldr { font-size: 24px; font-weight: 500; color: #ECEBDE; line-height: 1.4; max-width: 700px; }
  .tf-tags { display: flex; gap: 8px; margin-top: 12px; }
  .tf-tag { background: rgba(74, 140, 212, 0.15); color: #4a8cd4; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
  .tf-close { background: none; border: none; color: #888; font-size: 32px; cursor: pointer; transition: color 0.2s; }
  .tf-close:hover { color: #f1f1f1; }
  .tf-nugget-container { display: flex; gap: 40px; max-width: 1000px; margin: 0 auto; width: 100%; align-items: flex-start; }
  .tf-image-panel { flex: 0 0 400px; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 32px rgba(0,0,0,0.4); aspect-ratio: 4/3; background: #1a1a1a; display: flex; justify-content: center; align-items: center; position: sticky; top: 100px; }
  .tf-image-panel img { width: 100%; height: 100%; object-fit: cover; }
  .tf-typing-panel { flex: 1; font-family: 'Menlo', monospace; font-size: 18px; line-height: 1.8; color: #666; position: relative; }
  .tf-char.correct { color: #ECEBDE; }
  .tf-char.wrong { color: #ff5555; background: rgba(255, 85, 85, 0.1); border-bottom: 2px solid #ff5555; }
  .tf-char.cursor { color: #4a8cd4; border-bottom: 2px solid #4a8cd4; animation: blink 1s step-end infinite; }
  @keyframes blink { 50% { border-color: transparent; } }
  .tf-hidden-input { position: absolute; opacity: 0; top: -100px; }
  .tf-progress { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; display: block; }
  .tf-export-btn { display: block; padding: 16px 32px; background: #4a8cd4; color: #fff; font-size: 16px; font-weight: 600; border: none; border-radius: 8px; cursor: pointer; margin: 40px auto 0; transition: transform 0.2s; }
  .tf-export-btn:hover { transform: scale(1.05); }
  .tf-nano-loader { font-size: 12px; color: #E1C04C; animation: pulse 1s infinite; padding: 20px; text-align: center; }
\`;

function mountUI(data) {
    if(!document.getElementById('tf-style')) {
        const s = document.createElement('style');
        s.id = 'tf-style';
        s.textContent = INJECT_CSS;
        document.head.appendChild(s);
    }
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

    const nugget = sessionData.nuggets[currentNuggetIndex];
    let visualHtml = '';
    
    if (nugget.img_src) {
        visualHtml = \`<img src="\${nugget.img_src}" alt="Contextual Asset" />\`;
    } else {
        // Phase 3: Gemini 2.5 Flash Image generation request
        visualHtml = \`<div class="tf-nano-loader" id="tf-nano-\${currentNuggetIndex}">🖼️ Rendering visual via Gemini 2.5 Flash Image...</div>\`;
        chrome.runtime.sendMessage({ 
            action: "generate_image_asset", 
            payload: { text: nugget.text, tags: sessionData.tags } 
        }, (resp) => {
            if (resp && resp.success) {
                sessionData.nuggets[currentNuggetIndex].img_src = resp.img_src; // Save for Markdown export
                const imgContainer = document.getElementById(\`tf-nano-\${currentNuggetIndex}\`);
                if (imgContainer) {
                    const img = document.createElement('img');
                    img.src = resp.img_src;
                    img.style.animation = 'fade-in 0.5s ease-out';
                    imgContainer.replaceWith(img);
                }
            }
        });
    }

    const tagsHtml = (sessionData.tags || []).map(t => \`<div class="tf-tag">\${t}</div>\`).join('');
    let charsHtml = '';
    const textToType = nugget.text.replace(/\s+/g, ' ');
    
    for (let i = 0; i < textToType.length; i++) {
        // Fix: Do not force &nbsp;, output literal spaces so the browser treats it as text and allows wrapping
        charsHtml += \`<span class="tf-char">\${textToType[i]}</span>\`;
    }

    overlayWrapper.innerHTML = \`
        <div class="tf-header">
            <div>
                <div class="tf-tldr">"\${sessionData.tldr}"</div>
                <div class="tf-tags">\${tagsHtml}</div>
            </div>
            <button class="tf-close" id="tf-close-btn">&times;</button>
        </div>
        <div class="tf-nugget-container">
            <div class="tf-image-panel">\${visualHtml}</div>
            <div class="tf-typing-panel">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px;">
                    <span class="tf-progress" style="margin-bottom:0;">Insight \${currentNuggetIndex + 1} of \${sessionData.nuggets.length}</span>
                    <button id="tf-skip-btn" style="background:none; border:none; color:#4a8cd4; opacity:0.8; cursor:pointer; font-size:12px; font-weight:bold; letter-spacing:1px; text-transform:uppercase; transition:color 0.2s;">Skip &rarr;</button>
                </div>
                <div id="tf-target" style="white-space: pre-wrap; word-break: break-word;">\${charsHtml}</div>
                <input type="text" class="tf-hidden-input" id="tf-type-input" autocomplete="off" spellcheck="false" />
            </div>
        </div>
    \`;

    document.getElementById('tf-close-btn').addEventListener('click', closeOverlay);
    document.getElementById('tf-skip-btn').addEventListener('click', () => {
        currentNuggetIndex++;
        renderCurrentNugget();
    });
    
    const targetDiv = document.getElementById('tf-target');
    const input = document.getElementById('tf-type-input');
    
    targetDiv.querySelectorAll('.tf-char')[0]?.classList.add('cursor');
    setTimeout(() => input.focus(), 100);
    overlayWrapper.addEventListener('click', () => input.focus());

    input.addEventListener('input', (e) => {
        const typed = e.target.value;
        const spans = targetDiv.querySelectorAll('.tf-char');
        if (typed.length > textToType.length) {
            input.value = typed.slice(0, textToType.length);
            return;
        }

        let allCorrect = true;
        spans.forEach((span, i) => {
            span.className = 'tf-char';
            if (i < typed.length) {
                if (typed[i] === textToType[i]) span.classList.add('correct');
                else { span.classList.add('wrong'); allCorrect = false; }
            } else if (i === typed.length) span.classList.add('cursor');
        });

        if (typed.length === textToType.length && allCorrect) {
            currentNuggetIndex++;
            setTimeout(() => renderCurrentNugget(), 300);
        }
    });
}

function renderCompletionState() {
    overlayWrapper.innerHTML = \`
        <div style="max-width:600px; margin: 100px auto; text-align: center;">
            <div style="font-size: 64px; margin-bottom: 20px;">🧠</div>
            <div class="tf-tldr" style="margin: 0 auto; text-align:center;">Session Complete</div>
            <p style="color:#aaa; font-size:16px; margin-top:16px;">You have actively internalized \${sessionData.nuggets.length} key insights.</p>
            <button class="tf-export-btn" id="tf-trigger-export">Export to Second Brain 🗂️</button>
            <br>
            <button class="tf-close" style="font-size:14px; text-decoration:underline; border:none; background:none; cursor:pointer;" id="tf-final-close">Return to page</button>
        </div>
    \`;
    
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
    
    let md = \`---
title: "Insights: \${document.title.replace(/"/g, "'")}"
date: \${d}
tags: [\${tagsYaml}]
source: \${window.location.href}
---

# \${document.title}

> **TL;DR**: *\${sessionData.tldr}*

## Core Concepts Internalized
\`;

    sessionData.nuggets.forEach((n, i) => {
        md += \`\\n### Insight \${i+1}\\n\\n\`;
        md += \`> \${n.text}\\n\\n\`;
        if (n.img_src) {
            // Embeds hybrid contextual images (DOM + Gemini Image Gen) natively
            md += \`![Contextual Asset](\${n.img_src})\\n\\n\`;
        }
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`Gemini_Insights_\${Date.now()}.md\`;
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
        }
    });
}
