chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "summarize") {
        handleSummarize(request.text).then(sendResponse);
        return true; // Keep the message channel open for async response
    }
});

async function handleSummarize(text) {
    const { geminiApiKey } = await chrome.storage.sync.get('geminiApiKey');
    if (!geminiApiKey) {
        return { error: "API Key not found. Please set it in options." };
    }
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
    
    // Using gemini-1.5-flash for speed
    const prompt = `You are an expert reading assistant working on an interactive active recall application. 
Read the following article text and extract exactly 3 to 6 core 'nuggets' of information. 
Each nugget should be a key takeaway, insight, or highly memorable fact from the text. 
Keep each nugget concise (1-3 sentences maximum). 
Respond ONLY with a JSON array of strings and nothing else. Do not wrap it in markdown code blocks like \`\`\`json. Just standard JSON array format.

Text:
${text.substring(0, 30000)}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { response_mime_type: "application/json" }
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            return { error: `Gemini API error: ${errorData.error?.message || response.statusText}` };
        }
        
        const data = await response.json();
        let outputText = data.candidates[0].content.parts[0].text;
        
        try {
            const nuggets = JSON.parse(outputText);
            return { success: true, nuggets };
        } catch (e) {
            const cleaned = outputText.replace(/```json/g, "").replace(/```/g, "").trim();
            const nuggets = JSON.parse(cleaned);
            return { success: true, nuggets };
        }
    } catch (error) {
        return { error: error.message };
    }
}
