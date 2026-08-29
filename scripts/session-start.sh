#!/usr/bin/env bash
# Session start checks for this repository.
#
# Run this at the start of a working session. It is safe to run repeatedly.
# It only inspects local state and reinstalls a local git hook. It makes no
# network calls, touches no database, and changes nothing that is committed.
#
#   bash scripts/session-start.sh
#
set -u
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "--- session start: $(basename "$REPO_ROOT") ---"

# 1. commit-msg hook.
# .git/hooks is never committed, so a fresh clone or a reset loses it.
# The hook keeps tooling trailers and em dashes out of commit messages,
# both of which are visible to everyone with repository access.
HOOK="$REPO_ROOT/.git/hooks/commit-msg"
if [ -x "$HOOK" ]; then
  echo "commit-msg hook: present"
else
  echo "commit-msg hook: MISSING"
  echo "  This repository is visible to the client. Reinstall it before committing."
fi

# 2. Git author.
# Environment variables beat every git config level, so check them, not config.
# If they are absent, whatever sits in global config lands on the commit instead.
if [ -n "${GIT_AUTHOR_EMAIL:-}" ]; then
  echo "git author: ${GIT_AUTHOR_NAME:-unset} <${GIT_AUTHOR_EMAIL}>"
else
  echo "git author: WARNING, GIT_AUTHOR_* not set."
  echo "  git config would decide the author. Check it before committing:"
  echo "    git log -1 --format='%an <%ae>'"
fi

# 3. Branch, and a reminder that main is not the place to work.
BRANCH="$(git -C "$REPO_ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
echo "branch: $BRANCH"
[ "$BRANCH" = "main" ] && echo "  WARNING: on main. Work happens on a branch."

# 4. Required reading. AGENTS.md is the entry point and lists the rest in order.
echo "read AGENTS.md before touching code. It names the required reading in order."

# 5. Merged is not live.
echo "merged is not live. frontend needs the deployment to build. check prod:"
echo "  curl -s https://belt.sterilebydesign.ai/ | grep -oE '(ui-views|logic|api-supabase|index)\.(js|css)\?v=[0-9]+' | sort -u"
echo "--- end ---"
