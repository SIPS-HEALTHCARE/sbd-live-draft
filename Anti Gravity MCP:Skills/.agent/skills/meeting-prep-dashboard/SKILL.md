---
name: meeting-prep-dashboard
description: "Automated Meeting Prep Dashboard Generator. Takes a company name/meeting context and builds a full intelligence pipeline using NotebookLM: deep research, multimedia artifacts (audio, quiz, flashcards, infographic), and a premium glassmorphic HTML dashboard. Use when asked to 'prep for a meeting', 'research a company', 'generate a meeting brief', or 'build a sales dashboard'."
---

# 🧠 Automated Meeting Prep Dashboard Generator

Elite intelligence analyst + engineer mode. Takes a raw company/meeting input and delivers a ready-to-view, premium glassmorphic HTML dashboard packed with AI-generated research, multimedia, and interactive components.

---

## ⚡ Trigger Conditions

Activate when the user provides any of:
- A company name and/or domain
- A meeting context (discovery call, demo, sales call, etc.)
- A contact name + company
- A Zapier/Make/CRM payload with `company_name`, `company_domain`, `meeting_date`, `meeting_type`

Minimum required input: **`company_name`**

---

## 🔁 Execution Pipeline

### Phase 0: Agent Pre-Research (Data Enrichment)

Before touching NotebookLM, gather high-quality seed data. NotebookLM outputs are only as good as their sources.

**Step 0.1 — Website Scrape**
Use `read_url_content` or available web tools to read:
- About / Company page
- Products / Services / Platform page
- Pricing page (if public)
- Team / Leadership page
- Blog / News / Press page
- Careers page (reveals growth stage + tech stack)

**Step 0.2 — External Enrichment**
Search for:
- LinkedIn company page (employee count, recent posts, hiring)
- Crunchbase / PitchBook (funding rounds, investors, valuation)
- Recent news articles / press / founder interviews (last 6 months)
- Wikipedia page (if exists)
- Any YouTube videos featuring company or founders

**Step 0.3 — Synthesize Company Profile**
Combine all scraped data into a single "Company Profile" document:
- Company name, HQ, founding year
- CEO/founder names and backgrounds
- Employee count range
- Funding history (rounds, amounts, lead investors)
- Revenue model (SaaS, services, hybrid, marketplace)
- Core products/services with brief descriptions
- Key clients / case studies from their site
- Direct competitors
- Recent news highlights (last 2-3 events)
- Meeting context (why are we meeting them?)

> 💡 This profile is the foundational "seed" for NotebookLM — verified facts prevent hallucination.

---

### Phase 1: Notebook Preparation

**Step 1.1 — Create Notebook**
```
notebooklm create "Meeting Prep - [Company Name]"
```

**Step 1.2 — Inject Seed Data as Text Source**
```
notebooklm source add --type text --title "[Company Name] — Company Profile" \
  --content "[synthesized profile from Phase 0.3]" --wait
```

**Step 1.3 — Add Scraped URLs as Sources**
Add 3-8 of the best URLs found during Phase 0:
```
notebooklm source add --type url --url "[each URL]" --wait
```
> Do not add more than 10 URLs here — deep research will find more.

---

### Phase 2: Autonomous Deep Research

**Step 2.1 — Start Deep Research**
```
notebooklm source add-research \
  --query "[Company Name] competitive landscape market trends [industry] 2025 2026" \
  --mode deep
```
Use `deep` for exhaustive coverage (5 min, 40-100+ sources).
Use `fast` if speed is critical (~30s, ~10 sources).

**Step 2.2 — Poll Until Complete**
```
notebooklm research wait
```

**Step 2.3 — Batch Import Sources (CRITICAL)**
If deep mode returns 40-100+ sources, NEVER import all at once — this causes timeout errors.
Import in batches of 20, waiting 2-3 seconds between each batch:
```
notebooklm source import --indices 0-19
# wait 3 seconds
notebooklm source import --indices 20-39
# continue in chunks of 20...
```
If using `fast` mode, import all sources at once safely.

---

### Phase 3: Artifact Generation

**Step 3.1 — Executive Briefing** → `01_briefing_doc.md`
```
notebooklm generate report
```
Prompt: "Create a comprehensive executive pre-meeting briefing with: 1) Company Overview, 2) Competitive Landscape (name each competitor), 3) Market Opportunity (specific dollar figures + growth rates), 4) Key Talking Points (numbered, actionable), 5) Handling Objections (table: Objection | Response), 6) Recommended Next Steps (3 concrete follow-ups)."

**Step 3.2 — Deep Research Report** → `02_deep_research_report.md`
```
notebooklm ask "Write a deep research report on macro trends affecting this company's industry over 2 years. Include a table of top 10 sources (Source Name | Why It Matters)."
```

**Step 3.3 — Competitive Intelligence** → `03_competitive_intel.md`
```
notebooklm ask "Create a rapid competitive intelligence cheat sheet: Top 3 Things to Know (bold headline, 3-4 bullet evidence points, 'Your angle' recommendation each), then 'Market Numbers to Drop' (7-10 stats with $ and %)."
```

**Step 3.4 — Market Infographic** → `04_market_infographic.png`
```
notebooklm generate infographic
notebooklm artifact wait
notebooklm download infographic --output "[prep_folder]/04_market_infographic.png"
```

**Step 3.5 — Audio Briefing Podcast** → `audio_briefing.mp3`
```
notebooklm generate audio --format brief --length short
notebooklm artifact wait
notebooklm download audio --output "[prep_folder]/audio_briefing.mp3"
```

**Step 3.6 — Knowledge Quiz** → `06_pre_call_quiz.md`
```
notebooklm generate quiz --count 8 --difficulty medium
notebooklm download quiz --output "[prep_folder]/06_pre_call_quiz.md" --format markdown
```

**Step 3.7 — Flashcards** → `07_flashcards.md`
```
notebooklm generate flashcards --difficulty medium
notebooklm download flashcards --output "[prep_folder]/07_flashcards.md" --format markdown
```
> 💡 Fallback: if fewer than 8 cards, run:
> `notebooklm ask "Generate 10 flashcard Q&A pairs covering the most important facts before meeting [Company]. Format as 'Q: ...' and 'A: ...'"`
> Append to 07_flashcards.md

**Step 3.8 — Slide Deck (Optional)** → `08_slide_deck.pdf`
```
notebooklm generate slide-deck --format detailed_deck
notebooklm download slide-deck --output "[prep_folder]/08_slide_deck.pdf"
```

---

### Phase 4: Index File

Create `00_INDEX.md` as the table of contents for the prep folder:

```markdown
# Meeting Prep Package: [Company Name]
**Generated:** [timestamp]  
**Meeting Date:** [date]  
**Meeting Type:** [type]

## Downloaded Files
| # | File | Description |
|---|------|-------------|
| 1 | 01_briefing_doc.md | Executive pre-meeting briefing |
| 2 | 02_deep_research_report.md | Deep research summary + source table |
| 3 | 03_competitive_intel.md | Competitive intelligence cheat sheet |
| 4 | 04_market_infographic.png | Visual market landscape infographic |
| 5 | 06_pre_call_quiz.md | Knowledge test (8 questions) |
| 6 | 07_flashcards.md | Rapid-review flashcards |
| 7 | audio_briefing.mp3 | AI podcast briefing |
| 8 | index.html | Interactive glassmorphic dashboard |

## Cloud Resources
- **NotebookLM Notebook:** [link]
- **Research Sources:** [N] web sources analyzed

## How to Use
1. Open `index.html` in browser for the full interactive experience
2. Or: `python3 -m http.server 8888` → visit localhost:8888
3. Listen to `audio_briefing.mp3` on your commute
4. Review `01_briefing_doc.md` for a 3-minute text summary
```

---

### Phase 5: Premium HTML Dashboard

**Step 5.1 — Create Output Folder**
```
mkdir -p "Meeting Prep - [Company Name]"
```

**Step 5.2 — Build `index.html`**

The dashboard MUST include:

| Component | Spec |
|-----------|------|
| **Navbar** | "Meeting OS" branding, meeting date badge, Export PDF button |
| **Header** | Company name, subtitle, embedded audio player with animated visualizer bars |
| **Sidebar nav** | 6 tabs: Executive Briefing, Competitive Intel, Deep Research, Knowledge Test, Flashcards, Market Infographic |
| **Content area** | Dynamically renders markdown for tabs 1-3 via marked.js |

**Critical implementation details:**

1. **Markdown tabs** (Briefing, Intel, Research): Store raw markdown in `<script type="text/markdown" id="md-[tabname]">` blocks. Parse/render via marked.js on tab click.

2. **Quiz tab**: Interactive quiz — NOT markdown rendered:
   - Question cards with clickable radio options
   - Green ✓ / Red ✗ visual feedback on selection
   - Score counter appears after all questions answered
   - Content sourced from 06_pre_call_quiz.md

3. **Flashcards tab**: Interactive flashcard component — NOT markdown rendered:
   - 3D flip animation (CSS `perspective` + `rotateY(180deg)`)
   - Blue/gold gradient front (Question), gold accent back (Answer)
   - Left/right arrow navigation + card counter
   - Progress dots below card
   - Content sourced from 07_flashcards.md

4. **Market Infographic tab**: Render as `<img>` tag pointing to `04_market_infographic.png` (NOT markdown — the tag would get escaped).

5. **Audio player**: `<audio>` element → `audio_briefing.mp3`, play/pause toggle + animated visualizer bars.

6. **Styling requirements:**
   - Dark mode: background `#08080c`, blue + gold accent colors (user preference)
   - Glassmorphism: `backdrop-filter: blur(10px)`, transparent white backgrounds, subtle borders
   - Font: Inter from Google Fonts
   - Icons: Font Awesome 6
   - CSS: Tailwind via CDN
   - Markdown styling: custom CSS for h1-h3, p, ul, li, strong, a, table within `.markdown-content`

**Step 5.3 — Start Local Server**
```bash
cd "Meeting Prep - [Company Name]"
python3 -m http.server 8888
# Open: http://localhost:8888/index.html
```

---

## 📐 Guiding Principles

### 🔴 Batch Imports (Non-Negotiable)
Never bulk-import 100+ sources at once. Always iterate in chunks of 20. Wait 2-3 seconds between batches.

### 🟡 Fail Gracefully
- Thin flashcards (<8 cards) → regenerate via `notebooklm ask` and append
- Infographic fails → skip, note in INDEX, dashboard still works
- Audio still processing after 5 min → move on, note as "generating" in INDEX

### 🎨 Aesthetics Are Non-Negotiable
The HTML dashboard must feel premium: dark mode, glassmorphism, smooth transitions, crisp typography, animated elements. Blue + gold color palette. It must look like a product, not a prototype.

### 🔐 Data Isolation
Each client/meeting gets its own NotebookLM notebook. Never reuse notebooks across clients.

### 🛡️ Security
- Never embed API keys or auth tokens in the HTML dashboard
- All servers are localhost only
- Generated content stays on the user's machine

---

## 📁 File Naming Convention
```
Meeting Prep - [Company Name]/
├── 00_INDEX.md
├── 01_briefing_doc.md
├── 02_deep_research_report.md
├── 03_competitive_intel.md
├── 04_market_infographic.png
├── 06_pre_call_quiz.md
├── 07_flashcards.md
├── 08_slide_deck.pdf       (optional)
├── audio_briefing.mp3
└── index.html
```

---

## 🔧 NotebookLM CLI Quick Reference

| Action | Command |
|--------|---------|
| Auth check | `notebooklm auth check` |
| Create notebook | `notebooklm create "Title"` |
| Add text source | `notebooklm source add --type text --content "..." --wait` |
| Add URL source | `notebooklm source add --type url --url "https://..." --wait` |
| Start deep research | `notebooklm source add-research --query "..." --mode deep` |
| Wait for research | `notebooklm research wait` |
| Generate artifact | `notebooklm generate [audio|quiz|flashcards|infographic|report]` |
| Wait for artifact | `notebooklm artifact wait` |
| Download artifact | `notebooklm download [type] --output path/file.ext` |
| Ask notebook | `notebooklm ask "your question"` |
| List notebooks | `notebooklm list` |

## Prerequisites
- `notebooklm-py` installed: `pip install "notebooklm-py[browser]"`
- Playwright Chromium: `playwright install chromium`
- Authenticated: `notebooklm auth check` (must show "Authentication is valid")
- Python 3.10+, pip available
