# Section 10 — Answers

Verified by `npm test -- --run src/engine/answers.test.ts`.

## Q1 — Max item C on empty cart

**2** plates. **Cheese** is the limit: each plate uses Cheese ×2 (4 cheese stock → at most 2 plates). Eggs would allow 5 plates (2 eggs × qty ≤ 10).

## Q2 — Cheapest valid plate

Toast, Fried ×2, Tofu (no extras, no sauce). Unit subtotal after promos **360 BDT**; VAT 5% **18 BDT**; payable **378 BDT** (`answers.test.ts` brute-forces every valid config).

## Q3 — Cart A ×3, MORNING15, 10:30 vs 11:30

Configuration A ×3, coupon entered.

**10:30 Dhaka**

| Step | BDT |
|------|-----|
| Subtotal (3 × 380) | 1,140.00 |
| MORNING15 (15%, cap 150) | −150.00 |
| After discount | 990.00 |
| VAT 5% (half-up) | 49.50 |
| Payable (half-up whole BDT) | **1,040** |

**11:30 Dhaka**

| Step | BDT |
|------|-----|
| Subtotal | 1,140.00 |
| Discount | 0 (coupon expired; subtotal &lt; 1,200 so C1 does not apply) |
| VAT 5% | 57.00 |
| Payable | **1,197** |

## Q4 — Payable after TC-10 at 11:30

Cart after TC-10: edited **B×1** — Croissant, Omelette ×1, Fried ×3, Chicken Sausage, Beef Bacon, Hash Brown, Mushroom, Hollandaise (unit **643.50 BDT**) — plus **C×2** (plate C unchanged). Coupon **MORNING15** still entered; server time **11:30** Dhaka (same policy as TC-07 / D2).

| Step | Amount (BDT) |
|------|----------------|
| Subtotal | 1,623.50 |
| Discount (C1; coupon expired) | −100.00 |
| VAT (5%, half-up) | 76.18 |
| **Payable** | **1,600** |

Command: `npm test -- --run src/engine/answers.test.ts -t Q4`

## Q5 — Seed order payables and total revenue

`buildSeedOrders(menu)` at each order’s `createdAt` (Asia/Dhaka):

| Order | Payable (BDT) |
|-------|---------------|
| ORD-1001 | 339 |
| ORD-1002 | 713 |
| ORD-1003 | 1,271 |
| ORD-1004 | 578 |
| ORD-1005 | 866 |
| ORD-1006 | 1,228 |

**Total revenue:** 4,995 BDT (499,500 poisha).

## Q6 — Best-selling option (units)

**Fried** eggs (10 units) across seed orders (menu option “Fried”).

## Q7 — Top payment method (seed revenue)

**Card** brings the most revenue among seed orders.

## Q8 — Seed orders and MORNING15

| Order | Local time | Coupon on order | Applied? | Why |
|-------|------------|-----------------|----------|-----|
| ORD-1001 | 09:15 | MORNING15 | Yes | Before 11:00; discount chosen over C1 |
| ORD-1002 | 12:40 | — | — | No coupon entered |
| ORD-1003 | 10:05 | MORNING15 | Yes | Before 11:00 |
| ORD-1004 | 19:30 | — | — | No coupon entered |
| ORD-1005 | 08:50 | MORNING15 | Yes | Before 11:00 |
| ORD-1006 | 13:10 | MORNING15 | No | After 11:00 → `expired`; no coupon amount in totals |

**Three** orders (1001, 1003, 1005) received the coupon discount. **One** (1006) had the code but did not get the discount because checkout was after the coupon window.