
### Startup
```bash
./scripts/dev-local.sh --tail
```

### Do's

- **Components**: Use existing ones from `src/components/ui/` (Button, Modal, Input, Pagination, ProductCard). Do not reinvent the wheel.
- **Styles**: Colors, spacing, shadows — only via CSS custom properties from `styles/tokens.css` (`var(--brand-primary)`, `var(--space-md)`).
- **API**: Place calls in service modules (`api/*.ts`); never call `fetch` directly inside a component.
- **Loading states**: Always show skeletons or loaders (`isLoading`), and handle errors gracefully.
- **Typing**: No `any`. All props and API responses must be strictly typed.
- **Debounce**: For filters and search inputs, add a 300 ms delay before sending the request.
- **Modularity**: Keep styles in `.module.css` files; avoid polluting global stylesheets.

### Don'ts

- Do not duplicate pagination logic in every component — use the `<Pagination />` component.
- Do not hardcode colors, spacing, or breakpoints (no `#FFD700` or raw `px` values).
- Do not create new modals or overlays — use the existing `<Modal size="...">`.
- Do not fire a request on every filter keystroke — always debounce.
- Do not ignore typing — `@ts-ignore` is strictly forbidden.
- Do not use `useEffect` for data fetching if React Query (or a similar hook) is available.

### Golden Rule
When in doubt, check `src/components/ui/` and `api/` first. 90% of the time, what you need is already there.
