# Gemini TypingFlow 🧠✨

Welcome to **Gemini TypingFlow**, an intelligent evolution of the original [typingflow-extension](https://github.com/sujitojha1/typingflow-extension)!

Instead of manually slicing up HTML to find takeaways, this version uses the **Google Gemini API** (specifically `gemini-1.5-flash`) to read the web page you're on, actively synthesize the 3-6 most critical "nuggets" of insight, and instantly drop you into an ultra-premium glassmorphism typing zone to burn those facts into your memory.

## 🚀 How to Explore It

1. **Load the Extension in Chrome**:
   - Go to `chrome://extensions/`
   - Turn on **Developer mode** (top right)
   - Click **Load unpacked** and select the `/Users/payalchakraborty/Dev/EAG3/Gemini-typingflow` folder.
   
2. **Add Your Gemini API Key**:
   - Right-click the extension icon in your Chrome toolbar -> **Options** (or click "Settings / API Key" in the popup).
   - Enter your Gemini API key and hit Save.

3. **Try It Out**:
   - Navigate to an interesting article (for example, a Medium post or a Wikipedia page).
   - Click the extension icon.
   - Click `> gemini.extract()`.
   - The extension reads the page, pings the background script (which calls Gemini), and soon a stunning overlay will appear.
   - Click on an insight to initiate active recall mode! Type it back correctly.
   - Use `> save_html()` to export your synthesized insights.

## 🛠️ Architecture

- **`manifest.json`** (V3): Grants permissions to `scripting`, `activeTab`, and `storage`. Registers background script.
- **`background.js`**: Communicates with the `generativelanguage.googleapis.com` endpoint so you skip cross-origin (CORS) blocks on regular web pages.
- **`content.js`**: Contains DOM extraction fallback and the core UI for the Active Recall typing component. Replaces the old DOM-chunker with the Gemini responses.
- **`popup.html/js`**: A terminal-themed command center. Added loader states for when Gemini is 'thinking'.
- **`options.html/js`**: Secure sync storage for API keys.

Enjoy your new AI-powered learning flow!
