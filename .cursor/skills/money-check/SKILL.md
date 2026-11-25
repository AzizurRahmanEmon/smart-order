---
name: money-check
description: Hand-verify a poisha pricing calculation against the brief's rounding rules and Section 9 expected totals. Use before or while implementing priceCart, TC-05–TC-07, TC-10, or ANSWERS.md Q3/Q4/Q8 working.
---

# Money check

Help the user verify a price **by hand**. Do not silently compute ANSWERS.md Q-items as finished prose, and do not write C1's explanation for them. You may set up the worksheet and check arithmetic they already did.

## Rules (from the brief)

- All money is integer poisha (1 BDT = 100 poisha).
- Apply in this exact order:
  1. Unit subtotal = base + sum(option price × option qty).
  2. P2 Extras deal (per unit): for every 3 extra units, the cheapest extra unit is free (`floor(extraUnits / 3)` cheapest units).
  3. P1 Combo (per unit): if eggs ≥ 4 AND protein ≥ 2, take 10% off the step-2 amount.
  4. Line total = unit price × item qty. Cart subtotal = sum of line totals.
  5. Cart discount, only one (larger wins; tie → C1): C1 = 100 BDT off if subtotal ≥ 1,200 BDT. C2 = coupon `MORNING15`: 15% of subtotal, capped at 150 BDT, valid only if server time (Asia/Dhaka) is **strictly before** 11:00.
  6. VAT 5% on the discounted subtotal. Payable = discounted subtotal + VAT, rounded to whole BDT.
- Rounding: every **percentage** step rounds **half-up to the nearest poisha**. Only the **final payable** rounds half-up to whole BDT.

Half-up to poisha: for a poisha amount `n` possibly fractional, `floor(n + 0.5)` when n ≥ 0.

## Worksheet (fill with the user)

For the configuration or cart under review, list:

1. Each option's poisha contribution.
2. P2 free units and the new unit amount.
3. Whether P1 applies, 10% off in poisha, rounded.
4. Line totals and subtotal.
5. C1 vs C2 at the given `serverTime`; which one wins and why.
6. VAT = 5% of discounted subtotal, rounded to poisha.
7. Payable = discounted subtotal + VAT, rounded to whole BDT.

Then compare to a known target when one exists (do not substitute a different rounding):

- TC-05: A = 380.00, B = 679.50, C = 490.00 BDT
- TC-06: subtotal 1,659.50; C2 = 150.00; VAT 75.48; payable 1,585
- TC-07: C1 = 100.00; VAT 77.98; payable 1,637
- TC-10: edited B unit price 643.50

If the code disagrees with Section 9, the code is wrong. Point at the step that diverged. Leave C1 (why floats are risky; the 75.48 working) and Q3/Q4/Q8 write-ups for the user to author.
