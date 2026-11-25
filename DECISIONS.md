# Decisions (Smart Order Builder)

My notes for review checkpoints. Behavior matches this repo.

## C1 — Money as floats

I store money as integer poisha everywhere and only show BDT in the UI. Floats cannot represent amounts like 679.50 exactly. For TC-06, I compute VAT as five percent of the discounted subtotal in poisha and round half-up; 1,509.50 BDT becomes 75.48 BDT VAT, then the payable rounds to whole BDT.

## C2 — Assistant tools

The chat bot can call eight tools: order count, total revenue, average order value, top selling options, revenue by payment method, coupon usage, revenue by day, and a stub for “best customer” when the question is unsupported. Gemini picks the tool; I compute every number in the stats module from the orders list returned by the API.

## D1 — Two tabs, last eggs

If another tab takes the last eggs before I save an edit, the server rejects the PUT with insufficient stock and my cart line stays unchanged. My half-finished choices stay in the builder locally. If another tab changes the cart first, writes can also fail with a version conflict and the client refetches the cart instead of overwriting.

## D2 — When price is locked

Prices at checkout use server time when I pay. A coupon in the field does not lock in morning pricing while the plate sits in the cart. At 11:00 or later, MORNING15 is rejected and the fixed cart discount can apply instead, consistent with TC-06 and TC-07. The live preview while I build is indicative only.

## D3 — Expiry mid-edit

If the reservation expires while I am editing, I leave the cart line alone, exit edit mode, keep my option picks on screen, and show a banner that I can add the same plate as a new item. Saving after expiry still fails on the server. A successful edit keeps the original expiry timestamp.

## D4 — Order id and double Pay

The mock server assigns each order its id and created-at timestamp. Pay sends an idempotency key; a double click replays the same checkout response and clears the cart once without selling the same stock twice (TC-16).

## D5 — “Best customer”

Stored orders have no customer name or id. The best-customer tool answers that the data cannot support the question; the model must not invent a name (TC-20).

## D6 — Stored order JSON

Each stored order has id, createdAt, paymentMethod, couponCode (what I typed, even if rejected), lines with config and qty, and totals from the pricing engine in poisha. couponCode can be set when totals show the fixed discount or no coupon discount, for example when the code expired or lost to the fixed cart offer.