# Gemini TypingFlow 🧠✨

Welcome to **Gemini TypingFlow**, an intelligent evolution of the original [typingflow-extension](https://github.com/sujitojha1/typingflow-extension)!

Instead of manually slicing up HTML to find takeaways or running rote typing exams, this version uses the **Google Gemini Flash Lite 3.0 API** to deeply contextualize web content and synthesize it straight into your personal knowledge base.

## 🚀 Concept & Core Features

### 1. 📖 LLM-Powered Semantic Structuring
When you encounter a dense article, Gemini acts as an intelligent processing unit. Instead of blindly chunking paragraphs or completely rewriting them, it analyzes the full page content to:
- Generate a concise **TL;DR** and auto-extract semantic **domain tags**.
- Intelligently group related concepts into meaningful **Nuggets**. It maximizes the use of the original, author-written text by deeply understanding which sentences and points logically belong together.

### 2. 🗂️ "Second Brain" Markdown Export
Once you finish your active recall typing session, the extension generates an Obsidian, Roam, and Notion-ready structured Markdown file. 
- It wraps everything in standard YAML frontmatter (Date, Tags).
- It embeds the TL;DR, beautifully formats your typed concepts, and automatically weaves the **semantic tags and gemini-2.5-flash-image generated assets** directly into the Markdown layout to heavily enrich your notes.
- One click archives your newly validated knowledge forever in your local second brain.

### 3. 🖼️ Hybrid Visual Context (Existing & Generated)
Visual context is crucial for memory. The processing unit preserves and carries over **existing page images** that semantically align with the extracted nuggets. If a nugget lacks a visual aid, the extension falls back to a background process using the **gemini-2.5-flash-image** model to generate a highly representative, stunning image specifically tailored to that nugget's context.

### 4. ✨ Premium Active Recall Flow
Drop into an ultra-premium glassmorphism typing zone customized with your generated visuals to burn those enriched facts into your memory. It transforms passive web surfing into a focused study session.

---

## 🛠️ Development Plan
The roadmap to executing this vision is detailed in the [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md).
