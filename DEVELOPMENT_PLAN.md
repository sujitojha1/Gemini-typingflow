# Development Plan: Gemini TypingFlow

## Phase 1: Foundation & API Security
- [x] Initialize project with Manifest V3.
- [x] Create `options.html` and `options.js` for secure local storage of the Gemini API Key.
- [x] Build the `background.js` architecture to act as a secure proxy to Google Gemini Flash Lite 3.0 API, bypassing content-script CORS restrictions.

## Phase 2: The LLM Processing Engine
- [x] Develop the core Prompt Engineering strategy in `background.js`. It must enforce a strict JSON schema output from Gemini Flash Lite 3.0:
    - `tldr`: A single-sentence summary of the page.
    - `tags`: Array of semantic domain tags (e.g., `#productivity`, `#neuroscience`).
    - `nuggets`: Array of objects, each grouping the original author's text chunks logically together (`text`), alongside a related image reference (`img_src` or `null` if none exist).
- [x] Implement advanced DOM extraction in `content.js` to preserve image `src` urls and pass them alongside their adjacent text blocks to the LLM for semantic mapping.

## Phase 3: Hybrid Visuals & Asset Generation (Gemini 2.5 Flash Image)
- [x] Ensure the Active Recall overlay dynamically displays the existing `img_src` attached to a nugget by the LLM processing unit.
- [x] Interface with the **gemini-2.5-flash-image** API executing as an asynchronous background routine.
- [x] For any `nugget` where `img_src` is null, automatically prompt the Image model to generate a stunning, highly representative aesthetic image based on that nugget's text.

## Phase 4: Active Learning UI (Glassmorphism)
- [x] Rebuild the premium overlay using modern vanilla CSS directly inside `content.js`, ensuring it is immune to host-page style collisions.
- [x] Integrate the dynamic `TL;DR`, `Tags`, and **hybrid contextual images** into the overlay so the user has immediate visual context before they type.
- [x] Wire up the Active Recall typing mechanics to process the logically structured original `text` strings with character-by-character real-time validation (green/red feedback).

## Phase 5: Second Brain Integration
- [x] Build the `exportToMarkdown()` function in `content.js`.
- [x] Implement a rich formatting structure that natively leverages the LLM's **content tags** and embeds the **Gemini 2.5 Flash generated images** directly alongside the concepts.
- [x] Format the Markdown output to include standard YAML frontmatter for seamless integration into Obsidian/Notion.
- [x] Trigger an automatic download of the `.md` file upon successful completion of the typing session, or via explicit CTA in the UI.

## Phase 6: Terminal Popup & Polish
- [x] Build the terminal-styled `popup.html` interface as the main user control center.
- [x] Implement clear UI loader states (e.g., "Extracting Context...", "Synthesizing with Gemini Flash Lite 3.0...", "Rendering Image Assets...") to manage expectations during asynchronous LLM calls.
- [x] Final testing across different webpage frameworks (Medium, Wikipedia, standard blogs) and packaging for extension distribution.
