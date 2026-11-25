# Decisions (Smart Order Builder)

Short notes in my own words for review checkpoints. Behavior should match this repo’s code.

## C1 — Money as floats

JavaScript `number` cannot represent 679.50 BDT exactly, so I keep **integer poisha** end-to-end and only format to BDT in the UI. For TC-06, VAT is `halfUpPoisha(5% × discounted subtotal)` on poisha integers, e.g. 1,509.50 BDT × 5% → 75.475 → **75.48 BDT** (7,548 poisha), then payable rounds half-up to whole BDT.

## C2 — Assistant tools

The sales chat exposes tools: `order_count`, `total_revenue`, `average_order_value`, `top_selling_options`, `revenue_by_payment_method`, `coupon_usage`, `revenue_by_day`, and `best_customer_check` (unsupported questions). Gemini picks a tool; numbers always come from `src/engine/stats.ts` over `GET /api/orders`.

## D1 — Two tabs, last eggs

Tab A’s edit uses PUT with server-side net-difference stock. If tab B takes the last eggs before save, tab A gets **409 insufficient_stock**. Unsaved builder state stays local; the cart line is unchanged until a successful save. Nothing is silently merged.

## D2 — When price is locked

Cart/checkout totals are computed with **current server time** when you pay. Reservations do not freeze promo rules; expired coupons are rejected at checkout (same engine as TC-06/07). Builder preview is best-effort until items are in the cart.

## D3 — Expiry mid-edit

If the edited line expires, we exit edit mode, **keep** builder selections, show a banner to add as a new item, and block PUT. Save after expiry still returns 409 as a fallback. Successful edits keep the original `expiresAt`.

## D4 — Order id and double Pay

The **mock server** generates order ids and `createdAt` at checkout. **Pay** sends an `Idempotency-Key`; retries return the same order and an empty cart without double-consuming stock (TC-16).

## D5 — “Best customer”

Orders have **no customer field**. The `best_customer_check` tool returns unsupported; the model must explain that we cannot name a customer (TC-20).

## D6 — Stored order JSON

Each order stores: `id`, `createdAt`, `paymentMethod`, `couponCode` (entered, may be rejected), `lines[]` with `config` + `qty`, and `totals` from `priceCart` (all money in **poisha**). `couponCode` can be set while `totals.chosen !== 'coupon'` when the coupon expired or lost to C1.