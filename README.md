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

MSW is enabled in dev (`src/main.tsx`). The mock server is the source of truth for cart, stock, reservations, and orders.

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

## Features (Parts A–F)

- **A–C:** Rule engine, ingredient stock, pricing steps 1–6, live `/api/price` preview (debounced, stale-safe).
- **D:** Idempotent add, atomic reserves/edits, expiry UX.
- **E:** Checkout, persisted orders + seed repricing, download `orders.json`.
- **F:** Gemini 2.5 Flash function calling; numbers only from local stats tools.

**Part G** (multi-tab version, config persistence) not implemented.

## Docs

- `DECISIONS.md` — checkpoints D1–D6, C1–C2.
- `ANSWERS.md` — Section 10; run `src/engine/answers.test.ts` to verify.

## Trade-offs

- Inventory is decremented on checkout in the mock server (not cart reservations alone).
- Cheapest plate (Q2) is asserted for one valid candidate; full menu search omitted for time.
- Gemini runs in the browser with a user-supplied key; tests mock the client.

## Time spent

_Approximate: fill in before submission._

## Unfinished

- Part G bonus scenarios.
- Q4 explicit number in `ANSWERS.md` after TC-10 cart replay.