---
name: gemini-tool
description: Add a sales-assistant stats function, its Gemini function-calling tool declaration, and a unit test against seed or fixture orders. Use when extending the chatbot tools or wiring @google/genai.
---

# Add a Gemini tool

Numbers come from our code. The model only chooses a tool and phrases the result.

## Steps

1. Name the question this tool answers (e.g. order count, total revenue, best-selling option by units, revenue by payment method, AOV, coupon-applied count, orders on a date). If C2 is not in the user's `DECISIONS.md` yet, remind them to list questions and function signatures themselves — do not write C2 for them.
2. Implement a **pure** function in `src/engine/` (or `src/engine/stats/`) over the orders JSON. No Gemini import here. Money in the same unit as stored orders (see the user's D6 when it exists; otherwise keep poisha consistently and ask).
3. Declare the matching function/tool schema for `@google/genai` (name, description, parameters). Keep descriptions honest so the model picks the right tool.
4. Wire the chat path: model returns a function call → run the pure function on **current** orders (post-checkout, no reload) → send the tool result back → model phrases it. Never upload the raw orders list for the model to total.
5. Add a unit test that calls the pure function with seed (or fixture) orders and asserts an exact value. Mock the Gemini client in any UI test.
6. Error states stay in the chat UI: missing key, invalid key, 429, network. If the question cannot be answered from the data (e.g. "best customer"), the tool or a no-tool path must say so — no invented names (TC-20, D5).

Stop after the function, declaration, wiring, and test are in place. Suggest a small commit like `feat(assistant): add revenue-by-method tool`.
