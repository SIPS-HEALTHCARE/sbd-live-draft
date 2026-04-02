---
name: security-guidance
description: Security reminder hook that warns about potential security issues when editing files. Auto-scans every Write/Edit operation for command injection, XSS, eval(), unsafe deserialization, and more. Blocks changes with critical vulnerabilities.
---

# Security Guidance

Auto-scans every file you write or edit for security vulnerabilities. Catches injection, XSS, unsafe deserialization, and more before they ship.

## How It Works

Hooks into `PreToolUse` on **Write**, **Edit**, and **MultiEdit** operations. Runs a security scan before the file change is applied. Blocks the change if it finds a critical vulnerability.

## What It Catches

| Pattern | Substrings / Checks | Risk |
|---------|---------------------|------|
| **Command injection** | `child_process.exec`, `exec()`, `execSync()` | Shell injection via user input |
| **eval() injection** | `eval(` | Arbitrary code execution |
| **new Function() injection** | `new Function` | Code injection via dynamic strings |
| **XSS: dangerouslySetInnerHTML** | `dangerouslySetInnerHTML` | XSS with untrusted React content |
| **XSS: document.write** | `document.write` | XSS and performance issues |
| **XSS: innerHTML** | `.innerHTML =`, `.innerHTML=` | XSS with untrusted HTML content |
| **Unsafe deserialization** | `pickle` | Arbitrary code execution via pickle |
| **Python os.system injection** | `os.system`, `from os import system` | Command injection in Python |
| **GitHub Actions injection** | `.github/workflows/*.yml` path | Command injection via untrusted event data |

## Session-Scoped Warnings

- Each warning is shown **once per file per rule per session**
- State tracked in `~/.claude/security_warnings_state_{session_id}.json`
- Old state files auto-cleaned after 30 days

## Configuration

Set environment variable to disable:
```bash
ENABLE_SECURITY_REMINDER=0  # Disables the hook
```

Default is enabled (`ENABLE_SECURITY_REMINDER=1`).

## Hook Setup

The hook is configured in `hooks/hooks.json`:

```json
{
  "description": "Security reminder hook that warns about potential security issues when editing files",
  "hooks": {
    "PreToolUse": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python3 ${CLAUDE_PLUGIN_ROOT}/hooks/security_reminder_hook.py"
          }
        ],
        "matcher": "Edit|Write|MultiEdit"
      }
    ]
  }
}
```

## GitHub Actions Deep Check

When editing `.github/workflows/*.yml` or `.yaml` files, the hook provides detailed guidance on:
- **Command injection** via untrusted inputs (issue titles, PR descriptions, commit messages)
- **Safe pattern**: Use `env:` variables with proper quoting instead of direct `${{ }}` interpolation
- All risky GitHub event inputs (`github.event.issue.body`, `github.event.pull_request.title`, etc.)

## Author

Anthropic (support@anthropic.com)
