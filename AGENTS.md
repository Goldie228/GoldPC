
# GoldPC — Hints for AI Agents

## Local Launch for Testing (Current)

Usually the project is started for manual testing like this:

```bash
./scripts/dev-local.sh --tail
```

The script spins up the necessary infrastructure in Docker, mounts the directory, starts microservices and the frontend; `--tail` shows progress and then logs. Details and options — [`.cursor/skills/goldpc-local-dev/SKILL.md`](.cursor/skills/goldpc-local-dev/SKILL.md).

**Important:** fragments of **README** and **docs/architecture** may differ from actual practice; when in doubt, rely on `scripts/dev-local.sh` and the code.

---

## Cursor Configuration (`.cursor/`)

| Type | Path | Purpose |
|------|------|---------|
| **Rules** | `.cursor/rules/*.mdc` | Permanent rules (general, C#, React, tests, Docker) |
| **Skills** | `.cursor/skills/*/SKILL.md` | Domain, tests, local launch, [microservices stack](.cursor/skills/goldpc-microservices-stack/SKILL.md) |
| **MCP** | `.cursor/mcp.json` | `skills-server` — `npx -y @skills-server/mcp`, skills from `.agents/skills/` (`SKILLS_DIR`) |
| **Subagents** | `.cursor/agents/*.md` | Specializations: backend, frontend, verifier, infra-review |
| **Commands** | `.cursor/commands/*.md` | Slash commands: `/test-all`, `/review-diff`, etc. |

Stack: .NET 8 microservices, React + Vite, PostgreSQL, Redis, RabbitMQ. Product overview — [README.md](README.md) (verify command relevance against `dev-local.sh`).

---

## Development Guidelines (Code Guidelines)

### 1. General Principles (Do's / Don'ts)

**Do:**
- Before creating a new component/function, look for an existing one in `src/components/ui/` or `src/utils/`.
- Use tokens from `styles/tokens.css` for colors, shadows, transitions, fonts — never hardcode colors.
- When working with filters and forms, use debounce (300 ms) for requests to avoid overloading the backend.
- For lists with multi-select, use checkboxes rather than radio buttons.
- When adding a new API call, always implement a loading indicator and error handling.

**Don't:**
- Do not create new CSS classes if existing CSS modules can be used (e.g., from `Button.module.css`, `Card.module.css`).
- Do not copy pagination logic into every component — use the `Pagination` component from `src/components/catalog/Pagination`.
- Do not hardcode breakpoints — use variables from `tokens.css` (`--layout-page-max`, `--layout-page-pad-x`, etc.) or media queries via CSS modules.

### 2. Working with Components and Reusability

- Always check if a ready solution exists in `src/components/ui/` (Button, Input, Modal, Tabs, Skeleton, RangeSlider, etc.).
- For modals, use the `Modal` component (sizes `small/medium/large/xlarge`), do not create your own overlay.
- For forms, use `Input`, `PasswordField`, `Button` with correct variants (`primary`, `secondary`, `outline`, `ghost`, `danger`).
- For displaying product cards, use `ProductCard` or `ProductTable`, do not write your own layout each time.
- For pagination — only `Pagination` (it already supports page size change, direct page jump, and scrolling).
- For loading skeletons, use `ProductCardSkeleton` or `SimplePageLoader`.

### 3. Working with API and State

- All API calls must be wrapped in service functions (e.g., `api/products.ts`, `api/catalog.ts`), not called directly in components via `fetch`.
- Use React Query (or equivalent) for caching and request invalidation. Do not write manual `useEffect` if data can be obtained via a hook.
- When changing filter parameters (slider, checkbox, sorting), use `useDebouncedCallback` or `useEffect` with a timeout to avoid sending a request on every click.
- Always handle `isLoading`, `isError` states and show appropriate UI (skeleton, error banner, retry button).

### 4. Typing and TypeScript

- All component props must be strictly typed (interface or type). Do not use `any`.
- For API responses, create types in `src/types/api.ts` or alongside the service.
- For complex objects (e.g., PC build, filters), create separate types in `src/types/pc-builder.ts`.
- Do not use `@ts-ignore` without a good reason.

### 5. Styles and Responsiveness

- Write all styles in CSS modules (`.module.css`), not in global files (except `globals.css` and `tokens.css`).
- Use variables from `tokens.css` for colors (`var(--brand-primary)`, `var(--bg-card)`), spacing (`var(--space-md)`), radius (`var(--radius-md)`), shadows (`var(--shadow-gold)`).
- For responsiveness, use media queries inside CSS modules. Breakpoints: `768px`, `1024px`, `1280px`.
- Do not hardcode pixel spacing — use `var(--space-*)` or multiples of 4/8.

### 6. Performance and Optimization

- Avoid multiple effects that could cause duplicate requests. Combine filter parameters into one object and subscribe to its changes.
- For large lists (over 50 items), use virtualization (React Virtuoso) or pagination.
- For modals with large content (component catalog), use lazy data loading only when opened.
- Memoize callbacks and heavy components using `useCallback`, `React.memo`.

### 7. Testing

- Write unit tests for critical functions (filtering, compatibility validation).
- For UI components, add snapshot tests or tests with React Testing Library.

### 8. Documentation and Comments

- Complex functions and hooks should be commented (what it does, parameters, usage example).
- If a component has non‑obvious props, add JSDoc.

---

## Code Examples

### ❌ Bad: Hardcoded color
```tsx
const style = { color: '#FFD700' }; // Golden color hardcoded
```

### ✅ Good: Using tokens
```tsx
const style = { color: 'var(--brand-primary)' }; // Using a variable from tokens.css
```

### ❌ Bad: Direct fetch in component
```tsx
useEffect(() => {
  fetch('/api/products').then(res => res.json()).then(setProducts);
}, []);
```

### ✅ Good: Service layer
```tsx
import { getProducts } from 'api/catalog';

useEffect(() => {
  getProducts().then(setProducts);
}, []);
```

### ❌ Bad: No debounce on filters
```tsx
const [filters, setFilters] = useState({ price: 0 });
useEffect(() => {
  fetchFilteredProducts(filters); // Request on every change
}, [filters]);
```

### ✅ Good: Debounce on filters
```tsx
import { useDebouncedCallback } from 'hooks/useDebouncedCallback';

const debouncedFetch = useDebouncedCallback(fetchFilteredProducts, 300);

useEffect(() => {
  debouncedFetch(filters);
}, [filters, debouncedFetch]);
```

### ❌ Bad: `any` types
```tsx
const handleData = (data: any) => { // No typing
  console.log(data.name);
};
```

### ✅ Good: Strict typing
```tsx
interface ProductData {
  name: string;
  price: number;
}

const handleData = (data: ProductData) => {
  console.log(data.name);
};
```
