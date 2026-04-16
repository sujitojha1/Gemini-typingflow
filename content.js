// Phase 2: Advanced DOM Extraction for Semantic LLM Structuring

function extractPageContent() {
    // Prefer main article containers to avoid aggressive noise
    const root = document.querySelector('article, main, [role="main"]') || document.body;
    
    // Snag elements in chronological DOM order
    const elements = Array.from(root.querySelectorAll('p, h1, h2, h3, li, blockquote, img'))
        .filter(el => {
            // Strip out classic noise classes
            if (el.closest('nav, header, footer, aside, [role="navigation"]')) return false;
            
            // Cull tiny images (like icons, avatars, trackers)
            if (el.tagName === 'IMG') {
                const rect = el.getBoundingClientRect();
                // Browsers often default width to 0 if not loaded, fallback to checking actual attributes or src bounds if possible
                // Just use basic width attr and rect heuristics
                if ((el.width && el.width < 100) || rect.width < 100) return false;
                return true;
            }
            
            // Cull impossibly short text chunks (usually button labels or straggling <span> wrappers)
            if (el.tagName !== 'IMG' && el.innerText.trim().length < 30) return false;
            
            return true;
        });

    let structuredPayload = [];
    elements.forEach(el => {
        if (el.tagName === 'IMG') {
            const src = el.src || el.dataset.src; // Handle basic lazy loading tags
            if (src && !src.startsWith('data:')) {
                structuredPayload.push({ type: 'image', src: src });
            }
        } else {
            structuredPayload.push({ type: 'text', content: el.innerText.trim() });
        }
    });

    return structuredPayload;
}

if (!window.geminiTfContentInitialized) {
    window.geminiTfContentInitialized = true;
    
    chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
        if (request.action === 'extract_content') {
            console.log("Gemini TypingFlow: Extracting structured DOM payload...");
            const domPayload = extractPageContent();
            
            // Pass the sequenced array mapping back to whoever called it (the popup)
            // The popup will forward this to background.js for the Gemini API.
            sendResponse({ payload: domPayload });
        }
    });
}
