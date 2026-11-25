---
name: review-diff
description: Review the current uncommitted diff against assessment non-negotiables.
---

# Review the current diff

Review `git diff` (and staged changes) against this checklist. Do not change files unless the user asks you to fix something.

- Engine code in `src/engine/` is still pure (no React, fetch, Zustand, `Date.now()`).
- No hardcoded option ids, names, or limits in engine or UI. Messages and limits come from fixture data.
- Money is integer poisha; percentage steps half-up to poisha; payable half-up to whole BDT; step order 1–6.
- Time uses `serverTime` / clock offset, not `Date.now()`, for expiry and coupon eligibility.
- `/price` debounce 300 ms; query key hashes the config; `fetch` uses `AbortSignal`; stale responses cannot win (TC-12).
- Add to Cart / Pay mutations send idempotency keys; reservations are atomic; failed reserve holds no stock.
- Zustand holds only UI/config/chat flags; cart, stock, reservations, orders are mirrored from MSW via Query.
- UI uses shadcn/ui + Tailwind only, `cn()` for classes, real disabled states on options and Add to Cart.
- Gemini path uses function calling; stats are pure; error states for missing/invalid/429/network exist if chat changed.
- Tests that were added use `TC-xx` names and Section 9 exact values.
- No agent-written prose landed in `DECISIONS.md` or `ANSWERS.md`. No secrets, no `PLAYBOOK.md`.

Report findings as a short list: blockers first, then nits. If the diff is clean, say so and suggest a commit message only.
