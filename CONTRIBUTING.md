# Contributing / submit checklist

Before pushing or opening a PR:

```bash
npm run verify
```

That runs ESLint, Vitest (`--run`), and the production build—the same steps as [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

## Commits

Use conventional commits so reviewers can follow the history:

`type(scope): imperative summary`

Examples: `test(ui): add TC-01 builder violation RTL`, `fix(ui): remove unused next-themes in toasts`, `ci: add lint and test workflow`.

One concern per commit; do not bundle unrelated changes.