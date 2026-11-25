# Smart Order Builder

DevsStream frontend assessment. Logic over design. Reviewers read commit history, run Section 9 tests, and will ask you to explain or change any line live.

## Stack

React 18, TypeScript (`strict: true`), Vite, Tailwind CSS v4, shadcn/ui (the **only** UI library), Zustand (client/UI state only), TanStack Query + native `fetch` (no axios), MSW, Vitest + React Testing Library, `@google/genai` (Gemini Flash, function calling).

## Layout

- `src/engine/` — pure functions: `validate`, stock, `priceCart`, assistant stats. No React, no fetch, no store, no `Date.now()`.
- `src/mocks/` — MSW handlers and fixtures (`menu.json`, promotions, `orders.seed.json`).
- `src/api/` — native `fetch` wrappers used by TanStack Query. Pass `AbortSignal` through.
- `src/store/` — Zustand: current configuration, chat panel open, UI flags. Mirror server responses; do not own stock, cart, reservations, or orders.
- `src/components/` — React components. shadcn/ui primitives + Tailwind utilities only.

## Commands

- Dev: `npm run dev`
- Tests (one command for Section 9): `npm test`
- Build: `npm run build`

## Non-negotiables

- **Data-driven.** Groups, options, rules, ingredients, stock, and promotions come from the mock API. Never hardcode option ids, names, or limits. A swapped menu fixture must work with no code changes.
- **Money.** Integer poisha (1 BDT = 100). Every percentage step rounds half-up to the nearest poisha. Only the final payable rounds half-up to whole BDT. Apply pricing steps 1–6 in brief order.
- **Time.** Reservations, coupon window, and countdowns use **server time**. Read `serverTime` and store a clock offset. Never use `Date.now()` for expiry or promo eligibility.
- **Idempotency.** Add to Cart and Pay send an idempotency key. Double/triple clicks create exactly one item or one order.
- **Atomic reservations.** All-or-nothing. A failed reserve leaves no partial hold. Edit is one atomic net-difference swap.
- **Stale price.** Debounce 300 ms. Query key is a stable hash of the configuration. Cancel in-flight work with the `AbortSignal` from `queryFn`. An older response must never replace a newer config's price (TC-12).
- **Gemini.** Numbers come from our tools (pure functions over orders JSON). The model only phrases results. Never send raw orders and ask it to add them up.
- **Parts.** Do not start Part G until A–F pass their tests.

## Workflow

Plan the part → user answers any D/C checkpoint in their own words → write a failing `TC-xx` test → implement the minimum → run tests → small conventional commit.

## Decisions and answers

Never write or rewrite prose in `DECISIONS.md` or `ANSWERS.md`. Do not fill D1–D6, C1–C2, or Q1–Q8. Ask questions or give a short checklist only. The user writes those files themselves.
