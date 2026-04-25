
# AGENTS.md — GoldPC

## Behavioral Guidelines (Project-Wide)

These rules take priority over speed. For trivial, one-shot tasks, use your judgment.

### 1. Think Before Coding
- If something is unclear, stop and ask. Don’t guess.
- Surface assumptions explicitly. If multiple interpretations exist, list them; don’t pick silently.
- If you see a simpler route, propose it. Push back on overengineered requirements when warranted.

### 2. Simplicity First
- Minimum code that solves the problem. Nothing speculative.
- No abstractions for single-use code.
- No “flexibility” or “configurability” that wasn’t asked for.
- Handle errors only for realistic scenarios.
- If you wrote 200 lines where 50 would do — rewrite.
- Test: “Would a senior engineer call this overcomplicated?” If yes, simplify.

### 3. Surgical Changes
- Don’t “improve” adjacent code, comments, or formatting.
- Don’t refactor unbroken code.
- Match the existing style, even if you’d do it differently.
- If you spot unrelated dead code, mention it — don’t delete it.
- Only remove imports/variables/functions that YOUR changes made unused.
- Every changed line must trace directly to the user’s request.

### 4. Goal-Driven Execution
Turn requests into verifiable goals:
- “Add validation” → “Write tests for invalid inputs, then make them pass.”
- “Fix the bug” → “Reproduce with a test, then fix.”
- “Refactor X” → “Ensure tests pass before and after.”

For multi-step tasks, provide a brief plan:
```
1. [Step] → verify: [criterion]
2. [Step] → verify: [criterion]
```

Strong criteria let you loop independently. Vague ones (“make it work”) require constant clarification.

---

## Startup
```bash
./scripts/dev-local.sh --tail
```

## Do's
- **Components**: Use existing ones from `src/components/ui/` (Button, Modal, Input, Pagination, ProductCard). Don’t reinvent the wheel.
- **Styles**: Colors, spacing, shadows — only through CSS custom properties from `styles/tokens.css` (`var(--brand-primary)`, `var(--space-md)`).
- **API**: Place calls in service modules (`api/*.ts`); never call `fetch` directly inside a component.
- **Loading states**: Always show skeletons or loaders (`isLoading`), and handle errors gracefully.
- **Typing**: No `any`. All props and API responses must be strictly typed.
- **Debounce**: For filters and search inputs, add a 300 ms delay before the request.
- **Modularity**: Keep styles in `.module.css` files; avoid polluting global stylesheets.

## Don'ts
- Do not duplicate pagination logic in every component — use the `<Pagination />` component.
- Do not hardcode colors, spacing, or breakpoints (no `#FFD700` or raw `px` values).
- Do not create new modals or overlays — use the existing `<Modal size="...">`.
- Do not fire a request on every filter keystroke — always debounce.
- Do not ignore typing — `@ts-ignore` is strictly forbidden.
- Do not use `useEffect` for data fetching if React Query (or a similar hook) is available.

## Golden Rule
When in doubt, check `src/components/ui/` and `api/` first. 90% of the time, what you need is already there.
