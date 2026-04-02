---
name: gstack
description: Virtual engineering team — 27 skills, 6 core agents. CEO review, eng review, design review, code review, QA testing, and release management. One plugin, full sprint pipeline.
---

# gstack

**Author:** Garry Tan (CEO, Y Combinator) | **Repo:** [garrytan/gstack](https://github.com/garrytan/gstack) | **License:** MIT

Virtual engineering team that turns Claude Code into a full sprint pipeline: **Think → Plan → Build → Review → Test → Ship → Reflect**. Each skill feeds into the next — nothing falls through the cracks.

## The Sprint Pipeline

| Phase | Command | Agent | What They Do |
|-------|---------|-------|-------------|
| **Think** | `/office-hours` | YC Office Hours | Six forcing questions that reframe your product before you write code |
| **Plan** | `/plan-ceo-review` | CEO / Founder | Rethink the problem. Find the 10-star product. Four scope modes |
| **Plan** | `/plan-eng-review` | Eng Manager | Lock architecture, data flow, diagrams, edge cases, tests |
| **Plan** | `/plan-design-review` | Senior Designer | Rates each design dimension 0-10, explains what a 10 looks like |
| **Plan** | `/design-consultation` | Design Partner | Build a complete design system from scratch |
| **Plan** | `/autoplan` | Review Pipeline | Runs CEO → design → eng review automatically |
| **Build** | `/investigate` | Debugger | Systematic root-cause debugging. No fixes without investigation |
| **Review** | `/review` | Staff Engineer | Line-by-line code review, auto-fixes obvious issues |
| **Review** | `/design-review` | Designer Who Codes | Visual audit + atomic fix commits with before/after screenshots |
| **Review** | `/codex` | Second Opinion | Independent review from OpenAI Codex CLI (3 modes) |
| **Review** | `/cso` | Chief Security Officer | OWASP Top 10 + STRIDE threat model, 8/10+ confidence gate |
| **Test** | `/qa` | QA Lead | Opens real browser, clicks through flows, fixes bugs, re-verifies |
| **Test** | `/qa-only` | QA Reporter | Same methodology, report only — no code changes |
| **Test** | `/benchmark` | Performance Engineer | Baseline Core Web Vitals, compare before/after on every PR |
| **Ship** | `/ship` | Release Engineer | Sync main, run tests, audit coverage, push, open PR |
| **Ship** | `/land-and-deploy` | Release Engineer | Merge PR, wait for CI, verify production health |
| **Ship** | `/canary` | SRE | Post-deploy monitoring for errors and performance regressions |
| **Reflect** | `/retro` | Eng Manager | Team-aware weekly retro with per-person breakdowns and trends |
| **Reflect** | `/document-release` | Technical Writer | Update all project docs to match what shipped |

## Power Tools

| Command | Purpose |
|---------|---------|
| `/browse` | Real Chromium browser, real clicks, ~100ms per command |
| `/setup-browser-cookies` | Import cookies from Chrome/Arc/Brave/Edge for authenticated testing |
| `/careful` | Warns before destructive commands (rm -rf, DROP TABLE, force-push) |
| `/freeze` | Restrict file edits to one directory |
| `/guard` | `/careful` + `/freeze` combined — maximum safety for prod work |
| `/unfreeze` | Remove the freeze boundary |
| `/setup-deploy` | One-time deploy config for `/land-and-deploy` |
| `/gstack-upgrade` | Self-updater — upgrade gstack to latest |

## The Pipeline Pattern

```
/office-hours     → Design doc
/plan-ceo-review  → Should we build this?
/plan-eng-review  → How should we build this?
/plan-design-review → Does the UX hold up?
[implement]       → Write the code
/review           → Find the bugs CI misses
/qa               → Click through it in a real browser
/ship             → PR, tests, merge, deploy
/retro            → What did we learn?
```

## Install

```bash
# Global (30 seconds):
git clone https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
cd ~/.claude/skills/gstack && ./setup

# Per-project (teammates get it):
cp -Rf ~/.claude/skills/gstack .claude/skills/gstack
rm -rf .claude/skills/gstack/.git
cd .claude/skills/gstack && ./setup
```

## Troubleshooting

- **Skill not showing?** `cd ~/.claude/skills/gstack && ./setup`
- **`/browse` fails?** `cd ~/.claude/skills/gstack && bun install && bun run build`
- **Stale install?** Run `/gstack-upgrade`
