---
name: tc
description: Implement or fix a single Section 9 acceptance test (TC-xx) in a TDD loop.
---

# One acceptance test

Work on a **single** TC-xx from Section 9.

1. If the user did not name the id, ask which TC.
2. Follow the `add-acceptance-test` skill: write or fix the test with the exact expected values and a `TC-xx` name. Run it; show the failure if new.
3. If the user wants it to pass, implement the minimum production code. Stay inside the architecture: pure engine, MSW as source of truth, TanStack Query + `fetch` with `AbortSignal` and idempotency keys, Zustand for UI state only, shadcn + Tailwind only.
4. Do not loosen assertions. Do not rewrite unrelated tests. Do not write `DECISIONS.md` or `ANSWERS.md` prose.
5. Re-run the targeted test (and close neighbors if you touched shared engine code). Suggest one small commit and stop.
