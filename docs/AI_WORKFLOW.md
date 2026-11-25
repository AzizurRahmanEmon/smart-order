# How I used Cursor (draft for the README)

Fill this in yourself, in your own words, then copy a short version into the submission README. Do not paste this template unchanged. Do not let an agent write the final prose.

## Setup I used

- Project rules in `.cursor/rules/` (what they covered): <!-- e.g. engine purity, money, MSW, Query, Zustand, shadcn -->
- Skills I invoked: <!-- e.g. /engine-change, /money-check, /add-acceptance-test, /gemini-tool -->
- Custom commands: <!-- e.g. /plan-part, /tc, /review-diff, /commit -->
- `AGENTS.md`: <!-- one line on why you added it -->

## How I worked each part

- I used Plan mode / `/plan-part` before: <!-- which parts -->
- Tests were the spec: I wrote `TC-xx` tests first, then implemented until they matched Section 9 exactly.
- I wrote myself: <!-- engines? DECISIONS.md? ANSWERS.md working? -->
- I asked the agent to draft or scaffold: <!-- boilerplate, MSW handlers, shadcn wiring, test shells -->

## Model choice

- Cheap/fast model for: <!-- Vite/Tailwind/shadcn boilerplate, test shells, typings, repetitive UI -->
- Stronger model only for: <!-- stock net-difference, priceCart rounding, stale price/idempotency races -->
- I always reviewed the diff before committing, because I have to explain and change every line live.

## What I would do differently

- <!-- time I wasted, a rule I had to tighten, a prompt that worked well -->

## Hours

- Actual hours spent: <!-- required in the README -->
