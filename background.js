// Secure Background Proxy for Google Gemini Flash Lite 3.0
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "proxy_gemini_api") {
        console.log("Routing content to Gemini Flash Lite 3.0 API...");
        callGeminiAPI(request.payload).then(sendResponse);
        return true; // Keep channel open for asynchronous fetch
    }

    if (request.action === "generate_image_asset") {
        console.log("Routing request to gemini-2.5-flash-image...");
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

// Phase 3: Background Asset Generation (gemini-2.5-flash-image)
async function generateContextualImage({ text, tags }) {
    console.log("Invoking gemini-2.5-flash-image for asset generation...");
    
    const { geminiApiKey } = await chrome.storage.sync.get('geminiApiKey');
    if (!geminiApiKey) return { success: false, error: "API Key Missing" };

    const MODEL = "gemini-2.5-flash-image";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${geminiApiKey}`;
    const prompt = `Create a visually stunning, premium representative asset or abstract representation for this learning concept. Context: ${text} Tags: ${(tags||[]).join(', ')}. Return nothing but the image URL or Base64 string directly.`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) {
            if (response.status === 404) {
                console.warn(`gemini-2.5-flash-image returned 404. Falling back to semantic placeholder.`);
                const primaryTag = tags && tags.length > 0 ? tags[0].replace('#', '') : 'abstract';
                return { success: true, img_src: `https://picsum.photos/seed/${primaryTag}${Math.floor(Math.random()*1000)}/800/600` };
            }
            return { error: `Image API Error: ${response.statusText}` };
        }

        const data = await response.json();
        const part = data.candidates[0].content.parts[0];
        // Handle response assuming either plain text URL return or inlineData component
        let imgSrc = part.text || part.inlineData?.data;
        if (imgSrc && part.inlineData) {
            imgSrc = `data:${part.inlineData.mimeType};base64,${imgSrc}`;
        } else if (imgSrc && !imgSrc.startsWith("http") && !imgSrc.startsWith("data:")) {
             imgSrc = `https://picsum.photos/seed/generated/800/600`; // Failsafe fallback
        }
        return { success: true, img_src: imgSrc };
    } catch (e) {
        return { error: e.message };
    }
}
