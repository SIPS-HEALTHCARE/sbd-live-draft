---
name: code-review
description: Automated PR code review using 4 parallel agents with confidence-based scoring. Checks CLAUDE.md compliance, bug detection, and git history context. Only surfaces issues with 80+ confidence score.
---

# Code Review

Automated code review for pull requests using multiple specialized agents with confidence-based scoring to filter false positives.

## Overview

The Code Review skill automates pull request review by launching multiple agents in parallel to independently audit changes from different perspectives. It uses confidence scoring to filter out false positives, ensuring only high-quality, actionable feedback is posted.

## How to Use

Performs automated code review on a pull request using 4 specialized agents.

### Workflow

1. **Pre-check**: Skips closed, draft, trivial, or already-reviewed PRs
2. **Gather context**: Finds all relevant CLAUDE.md guideline files from the repository
3. **Summarize**: Creates a summary of the pull request changes
4. **Parallel review** — Launches 4 agents independently:
   - **Agents #1 & #2**: Audit for CLAUDE.md compliance
   - **Agent #3**: Scan for obvious bugs in the diff (no outside context needed)
   - **Agent #4**: Analyze git blame/history for context-based issues (regressions vs. intentional changes)
5. **Score**: Each issue gets a confidence score 0-100
6. **Filter**: Only issues scoring 80+ are surfaced
7. **Output**: Review to terminal (default) or as PR comment with `--comment`

### Usage

```bash
/code-review [--comment]
```

**Options:**
- `--comment`: Post the review as inline comments on the pull request (default: terminal output only)

### Example

```bash
# On a PR branch, run locally (outputs to terminal):
/code-review

# Post review as PR comment:
/code-review --comment
```

## Agent Architecture

| Agent | Focus | What It Catches |
|-------|-------|-----------------|
| Agent 1 | CLAUDE.md compliance | Code that breaks your own rules |
| Agent 2 | CLAUDE.md compliance (redundant) | Duplicate or conflicting instructions |
| Agent 3 | Bug detection (Opus) | Logic errors, missing validation, edge cases |
| Agent 4 | Git history context (Opus) | Regressions vs. intentional changes |

### The Git History Trick

Agent 4 runs `git blame`, reads commit messages, checks PR descriptions. If a null guard was removed, it checks whether it was intentional (moved to middleware) or a regression (dropped during rebase). This is the critical context that prevents false positives.

## Confidence Scoring

Every finding gets a score 0-100:

| Score | Meaning |
|-------|---------|
| 0 | Not confident, false positive |
| 25 | Somewhat confident, might be real |
| 50 | Moderately confident, real but minor |
| 75 | Highly confident, real and important |
| 100 | Absolutely certain, definitely real |

**Threshold**: Only issues ≥80 are shown. No noise.

## What Gets Filtered Out (False Positives)

- Pre-existing issues not introduced in PR
- Code that looks like a bug but isn't
- Pedantic nitpicks a senior engineer wouldn't flag
- Issues linters will catch (don't run the linter to verify)
- General quality concerns (unless in CLAUDE.md)
- Issues silenced with lint ignore comments

## What Gets Flagged (HIGH SIGNAL only)

- Code that will fail to compile or parse (syntax errors, type errors, missing imports)
- Code that will definitely produce wrong results regardless of inputs (clear logic errors)
- Clear, unambiguous CLAUDE.md violations where the exact rule can be quoted

## Review Comment Format

```markdown
## Code review

Found 3 issues:

1. Missing error handling for OAuth callback (CLAUDE.md says "Always handle OAuth errors")

   https://github.com/owner/repo/blob/abc123.../src/auth.ts#L67-L72

2. Memory leak: OAuth state not cleaned up (bug due to missing cleanup in finally block)

   https://github.com/owner/repo/blob/abc123.../src/auth.ts#L88-L95

3. Inconsistent naming pattern (src/conventions/CLAUDE.md says "Use camelCase for functions")

   https://github.com/owner/repo/blob/abc123.../src/utils.ts#L23-L28
```

## Link Format

When linking to code in inline comments, follow this format precisely:

```
https://github.com/owner/repo/blob/[full-sha]/path/file.ext#L[start]-L[end]
```

- Must use **full git SHA** (not abbreviated)
- Must use `#L` notation after file name
- Line range format: `L[start]-L[end]`
- Include at least 1 line of context before and after

## Requirements

- Git repository with GitHub integration
- GitHub CLI (`gh`) installed and authenticated
- CLAUDE.md files (optional but recommended for guideline checking)

## Best Practices

- **Write specific CLAUDE.md files**: Clear guidelines = better reviews
- **Include context in PRs**: Helps agents understand intent
- **Iterate on guidelines**: Update CLAUDE.md based on recurring patterns
- **Run on all non-trivial PRs**: Catch issues early
- **Trust the 80+ threshold**: False positives are already filtered

## Author

Boris Cherny (boris@anthropic.com) — Anthropic
