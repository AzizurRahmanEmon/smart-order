---
name: add-acceptance-test
description: Map a Section 9 TC-xx scenario to a Vitest/RTL test with the exact expected values. Use when adding or fixing TC-01–TC-20, or when the user names a TC id.
---

# Add an acceptance test

Turn one brief test case into a failing (or correctly asserting) Vitest test. Do not implement production code unless the user also asked for the implementation.

## Steps

1. Identify the TC-xx id. If missing, ask which one.
2. Read the scenario and **exact** expected result from the table below. Do not invent different rounding or wording.
3. Prefer a pure-engine unit test when the case is validate / stock / `priceCart`. Use RTL + MSW + a test `QueryClient` (`retry: false`) for UI, race, reservation, checkout, or chatbot cases.
4. Name the test so the id is visible, e.g. `it('TC-06: cart B x1 + C x2 at 10:59:59 applies C2, VAT 75.48, payable 1585', ...)`.
5. Build fixtures with a helper (`buildConfig`, canned A/B/C) — no hardcoded limits copied from Appendix A as magic numbers in assertions except the Section 9 expected totals.
6. Inject `serverTime` for pricing and expiry cases. Do not use the real clock.
7. Run only the new test first and show the result. Stop after the test exists unless the user asked to make it pass.

## Section 9 (exact)

A = Toast, Scrambled ×2, Chicken Sausage ×1, Ketchup. B = Croissant, Omelette ×2, Fried ×2, Chicken Sausage ×1, Beef Bacon ×1, Hash Brown ×1, Mushroom ×1, Hollandaise. C = Paratha, Fried ×2, Tofu ×1, Cheese ×2, Baked Beans ×1, Mushroom ×1, Chili.

| ID | Scenario | Expected |
| --- | --- | --- |
| TC-01 | Scrambled ×3 (plus valid bread/protein) | Blocked: eggs total must be 2–6 in steps of 2 |
| TC-02 | Croissant + 3 extras | Blocked: extras max is 2 when Croissant is selected (override wins) |
| TC-03 | Hollandaise with only Fried eggs | Blocked: Hollandaise requires Scrambled or Omelette |
| TC-04 | Tofu + Beef Bacon / Chili + Hollandaise | Blocked (excludes); both violations listed when both exist |
| TC-05 | Unit price of A, B, C | A = 380.00, B = 679.50, C = 490.00 BDT |
| TC-06 | Cart B×1 + C×2, server time 10:59:59 | Subtotal 1,659.50; C2 = 150.00 wins over C1; VAT 75.48; payable 1,585 |
| TC-07 | Same cart, 11:00:00 (coupon entered) | Coupon rejected; C1 = 100.00; VAT 77.98; payable 1,637 |
| TC-08 | Cart B×1 + C×2: remaining stock | egg 0, cheese 0, croissant 1; new item needing eggs blocked with reason |
| TC-09 | In that cart, edit B to Omelette ×3 + Fried ×1 | Blocked: "Short: 1 egg" (B's own 6 eggs available) |
| TC-10 | In that cart, edit B to Omelette ×1 + Fried ×3 | Allowed; B becomes 643.50; egg remaining becomes 1 |
| TC-11 | In that cart, change C quantity 2 → 3 | Blocked: "Short: 2 egg, 2 cheese" (all shortages listed) |
| TC-12 | Pricing responses return out of order | Only the latest configuration's price is displayed |
| TC-13 | Add to Cart clicked 3 times quickly | Exactly one cart item and one reservation |
| TC-14 | Reserve call fails mid-way | No stock held; configuration kept; Retry works |
| TC-15 | Reservation passes 5:00 (server time) | Stock released; item read-only; countdown used server time |
| TC-16 | Pay clicked twice quickly | Exactly one order; cart empty; sold stock not released again |
| TC-17 | Refresh after checkout, then Download orders.json | Orders still there; file is valid JSON in the documented D6 shape |
| TC-18 | Bot "How many orders?" after seed, then after one checkout | Answers differ by exactly one, no reload |
| TC-19 | Bot best-selling option | Same answer as the stats function (reviewers will change data) |
| TC-20 | Bot "Who is our best customer?" | Explains it cannot know; does not invent a name |

Do not answer D1–D6, C1–C2, or Q1–Q8 in this skill.
