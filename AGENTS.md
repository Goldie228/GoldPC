
# AGENTS.md — GoldPC

> ENGINEERING MANUAL FOR AI CODING AGENTS
> Mode: Human‑In‑Loop. Model: constrained, must ask before acting.

## 0. Hard Behavioral Rules (READ FIRST)

1. **Think Before You Code.**
   - If anything is unclear, STOP and ask in Russian.
   - If multiple interpretations exist, present all of them — DO NOT pick one silently.
   - State your assumptions explicitly before writing any code.

2. **Simplicity First.**
   - Write the minimum code that solves the problem.
   - No speculative features, no "future‑proof" abstractions.
   - If you wrote 200 lines and it could be 50, rewrite it.

3. **Surgical Changes Only.**
   - Touch ONLY files directly required by the task.
   - Do NOT reformat, refactor, or “improve” adjacent code, comments, or imports.
   - If you notice unrelated dead code, mention it — do NOT delete it.

4. **Goal‑Driven Execution.**
   - Convert every request into a verifiable goal with explicit pass/fail criteria.
   - “Add validation” → “Write a test for invalid input, make it pass”.
   - Report after each step: `Completed: [X]. Verified: [Y]`.

5. **When in Doubt — ASK. Never Assume.**
   - You do NOT have full context. If information is missing, stop and ask the user.
   - All clarification questions MUST be written in Russian.
   - Prefer asking over guessing, even if it feels “too simple”.

6. **No Hallucinations.**
   - Do NOT invent API endpoints, component props, or design tokens.
   - If you can’t find it with `grep` or by reading existing files, it doesn’t exist.
   - Use ONLY tools like `grep`, `read_file` to verify existence.

## 1. Project Architecture (What You Must Know)

**Stack**: React 19 + Vite 8 + Tailwind v4 + Zustand + TanStack Query.  
**Backend**: ASP.NET Core 8 microservices behind `GoldPC.Api` gateway.  
**Never call backend services directly. All requests go through `/api/...`.**

### Critical directories
```
src/frontend/src/
├── api/                  # API layer (use these, never fetch directly)
├── components/ui/        # SHARED PRIMITIVES – DO NOT EDIT WITHOUT APPROVAL
├── components/layout/    # Header, footer, main layout
├── components/catalog/   # Feature components
├── components/pc-builder/
├── pages/                # Route pages
├── store/                # Zustand stores
├── styles/
│   ├── index.css         # Tailwind @theme (CRITICAL – do not touch)
│   ├── globals.css       # Legacy CSS variables (often overridden by JSX)
│   └── staff.css
├── hooks/                # Shared hooks
└── utils/
```

## 2. Styling & Typography — THE RULES

### 2.1 How styling ACTUALLY works
- Tailwind utilities (`className="text-5xl bg-primary"`) **override** CSS classes.
- `globals.css` h1 styles are **often ignored** when a component uses Tailwind.
- Responsive classes (`md:text-5xl`) override **both** CSS and base Tailwind.
- Inline styles (`style={{}}`) win over everything.

**Therefore, to change typography or spacing:**
1. **Never** edit only `globals.css` or `index.css`.
2. Find **every** component that uses the relevant Tailwind class:
   ```bash
   grep -r "text-5xl" src/frontend/src/
   grep -r "className.*h1" src/frontend/src/
   grep -r "md:text-5xl" src/frontend/src/
   ```
3. Change **each** occurrence directly in JSX.
4. Build and visually verify in the browser (check computed styles!).

### 2.2 Safe styling modifications
- Use design tokens via Tailwind: `bg-primary`, `text-muted-foreground`, `p-lg`.
- If Tailwind can’t handle it, use CSS variables: `style={{ color: 'var(--color-body-text)' }}`.
- Hardcoded colors (`#FCD535`) or arbitrary values (`text-[23px]`) are **FORBIDDEN**.
- **Emergency typography fix only**: you may use inline `style={{ fontSize: '36px' }}` *temporarily*, then refactor to tokens and report.

### 2.3 Forbidden actions (will break the whole UI)
- Editing `index.css` `@theme` block.
- Modifying any component in `components/ui/`.
- Changing `globals.css` `:root` variables without explicit approval.
- “Fixing” typography by editing CSS only – **JSX overrides it**.

## 3. AI Agent Workflow (Mandatory)

### 3.1 Step‑by‑step cycle
**Phase 1 – INSPECT**
- Read the files relevant to the request.
- Run `grep` to find all usages of affected tokens/components.
- Identify if the change touches `ui/`, `index.css`, or `globals.css`. If YES → extra caution.

**Phase 2 – PROPOSE (STOP AND WAIT)**
- Write in **Russian**:
  - What you need to change.
  - Which files will be modified (exact paths).
  - Why this is the minimal change.
- **Do NOT start coding until the user approves.**

**Phase 3 – IMPLEMENT**
- Make ONLY the approved changes.
- Use existing components and tokens.
- Run `npm run build` after every logical change.

**Phase 4 – VERIFY**
- Confirm build passes.
- Check for new console errors.
- For visual changes, describe expected result; if possible, test.

### 3.2 Self‑check before ANY change
- [ ] Did I read the correct source of truth (`DESIGN.md` → `index.css` → `globals.css`)?
- [ ] Did I grep for **all** JSX usages (not just CSS)?
- [ ] Did I check for responsive classes (`md:`, `lg:`)?
- [ ] Did I present the plan in Russian and wait for approval?
- [ ] Will this change break a shared component?

## 4. What You MUST NEVER Do

| Action | Reason |
|--------|--------|
| Edit `ui/*` without approval | Breaks entire UI |
| Change `index.css` `@theme` | Breaks design tokens for all |
| Edit `globals.css` blindly | JSX may ignore it |
| Add direct `fetch()` in components | Use `api/` layer |
| Invent API endpoints or props | Hallucination |
| Refactor unrelated code | Surgical changes only |
| Hardcode colors/font sizes | Breaks design system |
| Use inline styles for permanent UI | Except emergency typography (then refactor) |

## 5. Component & Data Patterns

- **Reuse `ui/*` primitives** – Button, Modal, Input, Pagination, etc.
- **API calls**: `import { useProducts } from '@/api/catalog'`. Never `fetch`.
- **Loading & error states mandatory** – every data component must handle them.
- **No `any` types** – all props and API responses must be typed.

### Branch naming
- `feature/TV-XXX-short-desc`
- `bugfix/TV-XXX-short-desc`
- `hotfix/TV-XXX-short-desc`

### Commit format
```
feat(scope): description
fix(scope): description
```

## 6. Quick Reference: Where to Edit

| Change | Look in | Action |
|--------|---------|--------|
| Typography size | JSX className | `grep` + edit each component |
| Color / spacing token | `index.css` @theme (after approval) | Update DESIGN.md → index.css → globals.css |
| Shared component behavior | `components/ui/` | Request permission first |
| Page layout | `pages/*` | Safe to edit |
| Feature logic | `components/catalog/*` etc. | Safe within feature |

## 7. Emergency Rollback

If a change breaks the build or visual appearance:
```bash
git checkout -- <file>
```
For multiple files, revert last commit: `git revert HEAD` (and inform the user).

---

*End of AGENTS.md*
