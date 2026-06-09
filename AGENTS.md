
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
**Dirs**: `src/frontend/` | `src/backend/` | `src/CatalogService/` | `src/AuthService/` | `src/SharedKernel/` | `src/Shared/`  
**Never call backend services directly. All requests go through `/api/...`.**

### Frontend Structure
```
src/frontend/src/
├── api/                  # API layer (use these, never fetch directly)
│   ├── client.ts         # Axios instance with JWT refresh, base /api/v1
│   ├── admin.ts          # Admin API (users, products, dictionaries, settings, stats)
│   ├── catalog.ts        # Public catalog API
│   └── ...
├── index.css             # Tailwind @theme (CRITICAL – do not touch)
├── components/ui/        # SHARED PRIMITIVES – DO NOT EDIT WITHOUT APPROVAL
├── components/admin/     # Admin panel components
│   ├── product-card/     # Product card grid + view toggle
│   ├── product-editor/   # Tabbed product editor (basic, specs, images, prices)
│   └── ...
├── components/layout/    # Header, footer, admin-layout, main layout
├── components/catalog/   # Feature components
├── components/filter-sidebar/
├── components/pc-builder/
├── pages/
│   ├── admin/            # Admin panel pages (see Section 8)
│   ├── info/             # Info pages
│   ├── home-page/
│   └── ...
├── store/                # Zustand stores
├── styles/
│   ├── globals.css       # Legacy CSS variables (often overridden by JSX)
│   ├── tokens.css        # Migrated to index.css @theme (empty shell)
│   └── staff.css
├── hooks/                # Shared hooks
└── utils/
```

### Backend Microservices Architecture
```
src/
├── backend/GoldPC.Api/       # API Gateway — single entry point (port 5000)
│   ├── Controllers/          # AdminController, AdminImageController
│   ├── Services/             # CatalogServiceClient, FileService, AuthForwardingHandler
│   ├── Hubs/                 # SignalR hubs (NotificationHub)
│   ├── Models/               # FileUploadResult, ProductImageDto
│   └── Program.cs
├── CatalogService/           # Product catalog (port 5001)
│   ├── Controllers/          # ProductsController
│   ├── Services/             # CatalogService, CategoryParser, ProductNameGenerator
│   ├── Repositories/         # ProductRepository, CategoryRepository
│   ├── Data/                 # CatalogDbContext (EF Core + PostgreSQL)
│   ├── Models/               # SpecificationAttribute, PriceHistory, FilterAttribute
│   └── Migrations/
├── AuthService/              # Auth + JWT + 2FA (port 5002)
├── WarrantyService/          # Warranty cards
├── ServicesService/          # Service requests + chat
├── PCBuilderService/         # Compatibility checking
├── OrdersService/            # Orders (in progress)
├── ReportingService/         # Reports (in progress)
├── SharedKernel/             # Shared DTOs (GoldPC.SharedKernel.DTOs)
└── Shared/                   # Shared services (notifications, auth, mocks)
```

**Gateway Pattern**: Frontend → `/api/v1/admin/...` → `GoldPC.Api/AdminController` → `CatalogServiceClient` → `CatalogService`

### C# Context Files (load before editing .cs files)
- `.opencode/context/core/standards/csharp.md` — universal C# / .NET patterns
- `.opencode/context/core/standards/csharp-project-structure.md` — ASP.NET Core project layout
- `.opencode/context/development/csharp-conventions.md` — GoldPC-specific C# conventions

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

## 8. New Files (Redesign Phase)

### UI Components (`components/ui/`)
| File | Purpose |
|------|---------|
| `Input.tsx` | Reusable input with label, error state, and Tailwind styling |
| `PhoneInput.tsx` | Phone input with auto-formatting (+375 (XX) XXX-XX-XX) and `parsePhone`/`formatPhone` utils |
| `ImageUpload/ImageUpload.tsx` | Image upload with preview and drag-drop |

### Admin Panel Pages (`pages/admin/`)
| Route (`/admin/...`) | File | Purpose |
|----------------------|------|---------|
| `users` | `user-management-page/UserManagementPage.tsx` | User list with role filter, inline role change, activate/deactivate, pagination + pageSize selector |
| `users/new` | `user-form-page/UserFormPage.tsx` | Create/edit user form |
| `users/:id/edit` | `user-form-page/UserFormPage.tsx` | Edit user (same component) |
| `catalog` | `catalog-management-page/CatalogManagementPage.tsx` | Product table/grid, search, category/status filter, pageSize (10/25/50/100), inline spec filter |
| `dictionaries` | `dictionaries-page/DictionariesPage.tsx` | Tabs: Categories, Manufacturers, Attributes — inline CRUD, search |
| `coordinator` | `coordinator-dashboard/CoordinatorDashboard.tsx` | 4 stats cards (users, orders, revenue, updated) |
| `settings` | `settings-page/SettingsPage.tsx` | 4 sections: General, Delivery, Notifications, Maintenance mode |

### Admin Backend (`src/backend/GoldPC.Api/`)
| File | Purpose |
|------|---------|
| `Controllers/AdminController.cs` | Main admin controller (~1350 lines): users, products, stats, dictionaries, settings — contains inline `AdminService` (in-memory → JSON persistence) |
| `Controllers/AdminImageController.cs` | Product image upload/management |
| `Services/CatalogServiceClient.cs` | Typed HttpClient → CatalogService |
| `Services/AuthForwardingHandler.cs` | DelegatingHandler that forwards JWT to downstream services |
| `Services/FileService.cs` | Local file storage for uploaded images |
| `Hubs/NotificationHub.cs` | SignalR hub for real-time notifications |

### Admin Components (`components/admin/`)
| File | Purpose |
|------|---------|
| `product-card/ProductCard.tsx` | Admin product card with quick-edit |
| `product-card/ProductCardGrid.tsx` | Grid layout for admin catalog |
| `product-card/ViewToggle.tsx` | Table/grid view toggle |
| `product-editor/ProductEditorPage.tsx` | Full-screen tabbed product editor |
| `product-editor/ProductEditorDrawer.tsx` | Drawer variant for quick edits |
| `product-editor/ProductEditorTabs.tsx` | Tab navigation: Basic, Description, Specs, Images, Price |
| `product-editor/tabs/BasicInfoTab.tsx` | Name, category, manufacturer, price, stock |
| `product-editor/tabs/DescriptionTab.tsx` | WYSIWYG-like description editor |
| `product-editor/tabs/ImagesTab.tsx` | Image gallery management |
| `product-editor/tabs/PriceHistoryTab.tsx` | Price history chart |
| `product-editor/tabs/SpecificationsTab.tsx` | Dynamic spec editor per category |
| `layout/admin-layout/AdminLayout.tsx` | Admin sidebar + topbar layout |

### Info Pages (`pages/info/`)
| File | Purpose |
|------|---------|
| `ContactsPage.tsx` | Contact cards, working hours table, Yandex Maps link |
| `PrivacyPage.tsx` | Privacy policy (6 sections) |
| `TermsPage.tsx` | Terms of service (6 sections) |
| `SitemapPage.tsx` | Site map with all routes grouped by category |
| `PromotionsPage.tsx` | Promotions grid with real `<Link>` CTAs |
| `BrandsPage.tsx` | 18 brands with icons and categories |

### Modified Pages
| File | Changes |
|------|---------|
| `pages/info/DeliveryPage.tsx` | Full redesign (breadcrumb, hero, 3 cards) |
| `pages/info/PaymentPage.tsx` | Full redesign (4 payment methods, security block) |
| `pages/info/WarrantyPage.tsx` | Full redesign + `/service-request` link |
| `pages/info/ReturnsPage.tsx` | Full redesign + `/faq`, `/contacts` links |
| `pages/info/FaqPage.tsx` | Expanded to 10 questions, anchor links |
| `pages/about-page/AboutPage.tsx` | Real contacts, developer info, `/contacts` link |
| `pages/services-page/ServicesPage.tsx` | Fixed duplicate CTA, broken JSX, style links |
| `pages/service-request-page/ServiceRequestPage.tsx` | Fixed TS errors (createTicket, model) |
| `pages/home-page/HomePage.tsx` | Added promotions/brands section |

### Layout Components
| File | Changes |
|------|---------|
| `components/layout/Footer.tsx` | Restructured to 6 columns (Catalog, Services, Info, Customers, Contacts) |
| `components/layout/Header.tsx` | Added "Акции" nav item (5th in desktop/mobile menu) |

### Routing
| File | Changes |
|------|---------|
| `App.tsx` | Added lazy imports + routes for 6 new pages after `/faq`; admin routes (lazy-loaded `AdminLayout` + `RoleGuard`) |

### Admin Hooks & API
| File | Purpose |
|------|---------|
| `api/admin.ts` | All admin API calls (users, products, dictionaries, settings, stats, images) — 504 lines |
| `api/client.ts` | Axios instance, JWT refresh interceptor, base `/api/v1` |
| `hooks/useAdmin.ts` | TanStack Query hooks for admin CRUD |
| `hooks/useTokenRefresh.ts` | Silent JWT refresh on page load |

### Utilities
| File | Purpose |
|------|---------|
| `utils/phone.ts` | `isValidPhone`, `normalizePhone`, `parsePhone`, `formatPhone` |

### Mock Assets
| Path | Purpose |
|------|---------|
| `public/placeholders/services/*.svg` | 6 service category mock SVGs |
| `public/placeholders/about/hero-team.svg` | AboutPage hero mock |

---

*End of AGENTS.md*
