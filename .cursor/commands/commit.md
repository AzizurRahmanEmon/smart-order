---
name: commit
description: Create one small conventional commit from the current changes.
---

# Commit

Reviewers read the history. Make **one** small conventional commit.

1. Inspect status, diff, and recent log.
2. If the changes mix concerns (e.g. engine + UI + docs), split: stage one concern, leave the rest, and say what remains.
3. Proposed message: `type(scope): short imperative summary` (50–72 chars). Types: `feat`, `fix`, `test`, `refactor`, `docs`, `chore`, `build`.
4. Do not stage `.env`, `.env.local`, `PLAYBOOK.md`, `dist`, or secrets. Do not stage `DECISIONS.md` / `ANSWERS.md` if the diff is agent-written prose — leave those for the user.
5. Commit with a message that matches the staged files. No amend, no force-push, unless the user explicitly asked.
6. Show `git log -1 --stat` and stop.
