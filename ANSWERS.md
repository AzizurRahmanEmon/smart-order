# Section 10 — Answers

Verified by `npm test -- --run src/engine/answers.test.ts` (and related engine tests).

## Q1 — Max item C on empty cart

**2** plates. **Egg** is the limit (configuration C uses 2 eggs per plate × qty; stock 10 → 5 plates worth of eggs, but cheese stock 4 caps at **2** plates when cheese need is 2 per plate).

## Q2 — Cheapest valid plate

Example minimum-style plate: toast, fried ×1, scrambled ×1, sausage — validates, unit payable **394 BDT** at 10:00 Dhaka (`answers.test.ts`). I did not exhaust every combination; reviewers can ask me to justify or search further live.

## Q3 — Cart A ×3, MORNING15, 10:30 vs 11:30

Configuration A ×3, coupon entered.

| | 10:30 Dhaka | 11:30 Dhaka |
|---|-------------|-------------|
| Subtotal | 1,140 BDT | 1,140 BDT |
| Discount | MORNING15 (coupon) | none (subtotal &lt; 1,200 for C1; coupon expired) |
| VAT | per engine | per engine |
| Payable | **1,040 BDT** | **1,197 BDT** |

Working: `priceCart` at `2026-11-25T10:30:00+06:00` vs `11:30:00+06:00` — see `answers.test.ts`.

## Q4 — Payable after TC-10 at 11:30

Cart after TC-10: edited **B×1** (Omelette×1, Fried×3, … — unit **643.50 BDT**) + **C×2** unchanged. Coupon **MORNING15** still entered; server time **11:30** Dhaka (same policy as TC-07 / D2).

| Step | Amount (BDT) |
|------|----------------|
| Subtotal | 1,623.50 |
| Discount (C1; coupon expired) | −100.00 |
| VAT (5%, half-up) | 76.18 |
| **Payable** | **1,600** |

Command: `npm test -- --run src/engine/answers.test.ts -t Q4`

## Q5 — Seed order payables and total revenue

Run `buildSeedOrders(menu)` — six orders, **total revenue 4,995 BDT** (499,500 poisha). Per-order payables are in each seed order’s `totals.payableBDT` after `ordersSeed.ts` pricing.

## Q6 — Best-selling option (units)

**fried**, **10** units across seed orders (`topOptions` in `stats.test.ts` / `answers.test.ts`).

## Q7 — Top payment method (seed revenue)

**Card** brings the most revenue among seed orders (`revenueByPaymentMethod` in `answers.test.ts`).

## Q8 — Seed orders with MORNING15 applied

**3** orders received the coupon discount (`totals.chosen === 'coupon'`). Orders with code entered but not applied (e.g. **ORD-1006** after 11:00) have `couponRejection: 'expired'` and no coupon amount in totals.