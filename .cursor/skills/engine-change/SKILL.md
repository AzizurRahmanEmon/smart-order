---
name: engine-change
description: Test-first loop for validate, shared stock (net-difference edits), or priceCart. Use when changing src/engine or when the user works on Parts A–C logic.
paths:
  - src/engine/**/*.{ts,tsx}
  - src/engine/**/*.{test,spec}.{ts,tsx}
---

# Engine change (TDD)

Use this for `validate`, stock helpers, and `priceCart` only.

## Loop

1. State the behavior in one or two sentences, tied to a TC-xx id when one exists.
2. Write or extend a **failing** unit test with exact Section 9 values (or a clear fixture-driven assertion). Run it and show the failure.
3. Implement the minimum change in `src/engine/`. Keep the function pure: no React, no fetch, no Zustand, no `Date.now()`.
4. Re-run the targeted tests, then the related engine file. Do not "fix" a test by loosening expectations.
5. Stop and suggest a small commit (`test(engine): …` and/or `feat(engine): …`).

## Rules of the road

- `validate` collects all violations. Messages and limits come from the data, not hardcoded option ids or names.
- Compute effective group max from `overrideLimit` **before** min/max/step checks.
- Stock edits are net difference: never double-count the item being edited; never release more than it holds; list every short ingredient.
- `priceCart` uses integer poisha, brief step order 1–6, half-up poisha on each percentage step, half-up whole BDT only on payable, and the injected `serverTime`.
- If a checkpoint (C1) or decision (D2) is still unanswered, ask the user to write it in `DECISIONS.md` before coding. Do not write that prose for them.
