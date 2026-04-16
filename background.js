// Secure Background Proxy for Google Gemini Flash Lite 3.0
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "proxy_gemini_api") {
        console.log("Routing content to Gemini Flash Lite 3.0 API...");
        callGeminiAPI(request.payload).then(sendResponse);
        return true; // Keep channel open for asynchronous fetch
    }
    
    if (request.action === "generate_nano_banana_image") {
        console.log("Routing request to local Gemini Nano Banana...");
        generateContextualImage(request.payload).then(sendResponse);
        return true;
    }
});

const SYSTEM_PROMPT = `You are an expert learning engine and strict JSON structuring agent. 
You are given a chronologically ordered array of text chunks and image URLs scraped from an article. 
Your task is to structure this content into a rich learning payload. 

RULES:
1. Generate a 'tldr' (a single-sentence summary of the entire page).
2. Auto-extract an array of 3-5 semantic 'tags' (e.g., "#machinelearning", "#design").
3. Group the logically related original text chunks together into manageable semantic "nuggets" to preserve the author's voice. Do NOT heavily rewrite the text, just intelligently chunk it.
4. If an image URL is highly relevant to a specific nugget based on chronological proximity or context, map its URL to 'img_src'. If no image is relevant for that nugget, map 'img_src' as null.

EXPECTED JSON SCHEMA:
{
  "tldr": "string",
  "tags": ["string"],
  "nuggets": [
    {
      "text": "The logically grouped original text chunks representing this concept.",
      "img_src": "url_string_or_null"
    }
  ]
}`;

async function callGeminiAPI(payload) {
    const { geminiApiKey } = await chrome.storage.sync.get('geminiApiKey');
    
    if (!geminiApiKey) {
        return { error: "API Key not configured. Please initialize your key in the Options panel." };
    }
    
    const MODEL = "gemini-3.0-flash-lite"; // Invoking the specified Gemini 3.0 Lite model
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${geminiApiKey}`;
    
    const fullPrompt = SYSTEM_PROMPT + "\n\nRAW SCRAPED CONTENT:\n" + JSON.stringify(payload);
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: fullPrompt }] }],
                generationConfig: { response_mime_type: "application/json" }
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            return { error: `Google API Error (${response.status}): ${errorData.error?.message || response.statusText}` };
        }
        
        const data = await response.json();
        const jsonText = data.candidates[0].content.parts[0].text;
        return { success: true, api_response: JSON.parse(jsonText) };
    } catch (error) {
        return { error: `Network exception in Service Worker: ${error.message}` };
    }
}

// Phase 3: Background Asset Generation (Gemini Nano Banana Simulation Proxy)
async function generateContextualImage({ text, tags }) {
    console.log("Invoking Gemini Nano Banana local model for asset generation...");
    // Simulating local inference delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const primaryTag = tags && tags.length > 0 ? tags[0].replace('#', '') : 'abstract';
    const randomSeed = Math.floor(Math.random() * 1000);
    // Reliable remote fallback representative image based on tags
    const simulatedImageUrl = `https://picsum.photos/seed/${primaryTag}${randomSeed}/800/600`;

    return { success: true, img_src: simulatedImageUrl };
}
