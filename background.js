// Secure Background Proxy for Google Gemini Flash Lite 3.0
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "proxy_gemini_api") {
        console.log("Routing content to Gemini Flash Lite 3.0 API...");
        callGeminiAPI(request.payload).then(sendResponse);
        return true; // Keep channel open for asynchronous fetch
    }
});

async function callGeminiAPI(payload) {
    const { geminiApiKey } = await chrome.storage.sync.get('geminiApiKey');
    
    if (!geminiApiKey) {
        return { error: "API Key not configured. Please initialize your key in the Options panel." };
    }
    
    const MODEL = "gemini-3.0-flash-lite"; // As per Phase 1 spec
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${geminiApiKey}`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload) // Expected payload will contain JSON schema enforcement config in Phase 2
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            return { error: `Google API Error (${response.status}): ${errorData.error?.message || response.statusText}` };
        }
        
        const data = await response.json();
        return { success: true, api_response: data };
    } catch (error) {
        return { error: `Network exception in Service Worker: ${error.message}` };
    }
}
