---
name: plan-part
description: Plan one assessment part (setup or A–G) before writing code. Stops at a plan and a decision checklist.
---

# Plan a part

The user is about to start a part of the Smart Order Builder assessment. Do **not** write application code or any `DECISIONS.md` / `ANSWERS.md` prose.

1. Identify the part: Setup, A (rules), B (stock), C (pricing), D (cart/reservations), E (checkout/orders), F (assistant), or G (bonus). If unclear, ask.
2. List the files you expect to add or change (`src/engine`, `src/mocks`, `src/api`, `src/store`, `src/ui`, tests).
3. List the Section 9 TC-xx ids this part must pass, and whether each is an engine unit test or an RTL/MSW test.
4. List every ◆ decision and ✋ checkpoint that belongs to this part (D1–D6, C1–C2). **Ask the user to answer them in DECISIONS.md first.** Give a one-line prompt for each, not a draft answer.
5. Call out relevant project rules/skills (`engine`, `mocks`, `query`, `state`, `ui`, `gemini`, `/engine-change`, `/money-check`, `/add-acceptance-test`, `/gemini-tool`).
6. Propose a test-first order and a few small commit messages.
7. Ask any blocking questions, then stop and wait.
