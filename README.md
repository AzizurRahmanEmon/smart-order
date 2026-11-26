# Smart Order Builder

DevsStream frontend assessment — rules, shared stock, pricing, MSW cart/checkout, Gemini sales assistant.

## Setup

```bash
npm install
cp .env.example .env.local   # VITE_GEMINI_API_KEY + VITE_GEMINI_MODEL for sales chat
npm run dev
```

- **Tests:** `npm test`
- **Build:** `npm run build`
- **Production preview with mocks:** `npm run build:demo && npm run preview` (plain `build` + `preview` has no MSW unless built with demo env)

MSW is enabled in dev (`src/main.tsx`) and in demo builds (`.env.demo` → `VITE_ENABLE_MSW=true`). The mock server is the source of truth for cart, stock, reservations, and orders.

I used Cursor for implementation with project rules and skills under `.cursor/` (workflow, money/pricing checks, TC tests) alongside `AGENTS.md`.

## Architecture

| Area | Location |
|------|----------|
| Pure engines | `src/engine/` — `validate`, `stock`, `pricing`, `stats` |
| Mock API | `src/mocks/` — `serverState`, `handlers`, fixtures |
| Client API | `src/api/` + TanStack Query in `src/hooks/` |
| UI state | `src/store/configStore.ts` (config, coupon, edit mode only) |
| UI | `src/components/` — shadcn + Tailwind |
| Assistant | `src/assistant/` — Gemini tool loop; stats tools in `engine/stats.ts` |

Money is **integer poisha** (1 BDT = 100). Server time is 90s ahead of the browser; reservations last 5 minutes on server time.

## Features (Parts A–G)

- **A–C:** Rule engine, ingredient stock, pricing steps 1–6, live `/api/price` preview (debounced, stale-safe).
- **D:** Idempotent add, atomic reserves/edits, expiry UX.
- **E:** Checkout, persisted orders + seed repricing, download `orders.json`.
- **F:** Gemini Flash function calling; numbers only from local stats tools.
- **G:** Cart from server only on load (expired lines pruned on bootstrap); `If-Match` cart versioning + 409 `cart_conflict`; cross-tab sync via mock server `localStorage`; builder config/coupon/edit id in `sessionStorage`.

## Docs

- `DECISIONS.md` — checkpoints D1–D6, C1–C2.
- `ANSWERS.md` — Section 10; run `src/engine/answers.test.ts` to verify.

## Trade-offs

- Inventory is decremented on checkout in the mock server (not cart reservations alone).
- Gemini runs in the browser with a user-supplied key; tests mock the client.

## Time spent

About 12 hours over two days (engines and tests first, then UI, assistant, Part G, and docs).

## Unfinished

Nothing.