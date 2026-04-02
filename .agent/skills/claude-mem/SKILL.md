---
name: claude-mem
description: Persistent memory compression system for Claude Code. Records tool calls, compresses observations into key insights, stores locally, and injects relevant context at session start. 100% local storage, no cloud sync.
---

# Claude-Mem

Persistent memory compression system built for Claude Code. Seamlessly preserves context across sessions by automatically capturing tool usage observations, generating semantic summaries, and injecting them into future sessions.

**Author:** Alex Newman (@thedotmack) | **Repo:** [thedotmack/claude-mem](https://github.com/thedotmack/claude-mem) | **License:** AGPL-3.0

## How It Works

1. **Records** every tool call and observation during your session
2. **Compresses** raw observations into key insights using AI summarization
3. **Stores** compressed memory locally (no cloud, no data leaving your machine)
4. **Injects** relevant context at the start of every new session

## What Gets Remembered

- Project conventions ("commit format is NM-XXX")
- User preferences ("dark mode first, coral is the brand color")
- Tech stack details ("Canvas 2D, not WebGL")
- Previous decisions ("chose Zustand over Redux, here's why")
- File patterns ("templates use config.ts + renderer.ts")

## Core Components

| Component | Purpose |
|-----------|---------|
| **5 Lifecycle Hooks** | SessionStart, UserPromptSubmit, PostToolUse, Stop, SessionEnd |
| **Worker Service** | HTTP API on port 37777 with web viewer UI and search endpoints |
| **SQLite Database** | Stores sessions, observations, summaries |
| **Chroma Vector DB** | Hybrid semantic + keyword search for intelligent retrieval |
| **mem-search Skill** | Natural language queries with progressive disclosure |

## Hook Architecture

```
Setup         → Install dependencies, configure environment
SessionStart  → Smart install check → Start worker → Inject context
UserPrompt    → Initialize session tracking
PostToolUse   → Record observation from every tool call
Stop          → Compress and summarize session observations
SessionEnd    → Mark session complete
```

## MCP Search Tools (3-Layer Workflow)

Token-efficient search with **~10x savings** by filtering before fetching:

1. **`search`** — Get compact index with IDs (~50-100 tokens/result)
2. **`timeline`** — Get chronological context around interesting results
3. **`get_observations`** — Fetch full details ONLY for filtered IDs (~500-1,000 tokens/result)

```typescript
// Step 1: Search for index
search(query="authentication bug", type="bugfix", limit=10)

// Step 2: Review index, identify relevant IDs (e.g., #123, #456)

// Step 3: Fetch full details
get_observations(ids=[123, 456])
```

## Plugin Skills

| Skill | Purpose |
|-------|---------|
| **mem-search** | Natural language memory queries |
| **smart-explore** | Intelligent project exploration |
| **make-plan** | Plan generation from memory context |
| **do** | Execute tasks with memory awareness |
| **timeline-report** | Generate chronological session reports |

## Privacy

- **`<private>` tags** — Exclude sensitive content from storage
- **100% local** — JSON/SQLite files on your machine
- **No cloud sync, no API calls, no data sharing**

## Configuration

Settings managed in `~/.claude-mem/settings.json` (auto-created with defaults).
Configure: AI model, worker port, data directory, log level, context injection settings.

## Web Viewer

Real-time memory stream at **http://localhost:37777**
- Browse all observations and summaries
- Search memory with filters
- View citations by ID
- Switch between stable/beta channels

## System Requirements

- **Node.js**: 18.0.0+
- **Claude Code**: Latest with plugin support
- **Bun**: Auto-installed if missing
- **uv**: Python package manager for vector search (auto-installed if missing)

## Installation

```bash
# Via Claude Code plugin marketplace:
/plugin marketplace add thedotmack/claude-mem
/plugin install claude-mem

# Via OpenClaw gateway:
curl -fsSL https://install.cmem.ai/openclaw.sh | bash
```

> **Note:** `npm install -g claude-mem` installs the SDK/library only — it does NOT register hooks or set up the worker. Always install via `/plugin` commands.
