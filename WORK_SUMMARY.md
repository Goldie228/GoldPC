# GoldPC Frontend Work Summary & Pending Tasks

**Date:** 2025-01-14
**Branch:** (check current branch)

---

## ✅ What Was Done Today

### 1. Fixed Wishlist 401 Error (Stage 0 — ad-hoc fix)
- **`src/frontend/src/hooks/useAuth.ts`**: Added `syncWishlistWithServer()` call after login with setTimeout to ensure tokens are saved before sync
- **`src/frontend/src/store/wishlistStore.ts`**: Improved error handling — on 401, clears local wishlist data
- **`src/frontend/src/api/client.ts`**: Fixed `extractData` to throw on undefined data instead of unsafe `as T` cast
- **`src/frontend/src/api/authService.ts`**: Same `extractData` fix
- **`src/frontend/src/api/wishlist.ts`**: Same `extractData` fix
- **`src/frontend/src/api/orders.ts`**: Rewrote entire file — fixed invalid TypeScript syntax (`|` inside generic), fixed `unwrap` function, all API calls now use `ApiResponse<T>` wrapper correctly

### 2. Stage 1: Replace Hardcoded Values with CSS Tokens (PARTIALLY DONE)
**Files fixed:**
- `src/frontend/src/components/ProductCard/ProductCard.module.css` — FULLY FIXED (rewritten with tokens)
- `src/frontend/src/components/layout/Footer/Footer.module.css` — FULLY FIXED
- `src/frontend/src/components/ui/Button/Button.module.css` — FULLY FIXED
- `src/frontend/src/components/catalog/FilterSidebar.module.css` — PARTIALLY FIXED
- `src/frontend/src/components/catalog/ActiveFiltersBar.module.css` — FULLY FIXED
- `src/frontend/src/components/Feedback/FeedbackWidget.module.css` — FULLY FIXED
- `src/frontend/src/components/admin/StatCard.css` — PARTIALLY FIXED

**Remaining files with hardcoded values (check with `grep -rn '#[0-9a-f]\|rgba(' src/frontend/src/`):**
- `src/frontend/src/components/layout/Header/Header.module.css` — has some remaining `rgba()` values
- `src/frontend/src/pages/**/*.module.css` — many pages still have hardcoded hex colors (HomePage, CatalogPage, ProductPage, CartPage, CheckoutPage, ComparisonPage, etc.)
- `src/frontend/src/components/**/*.module.css` — some component CSS files

### 3. Stage 2: Migrate 23 Pages to CSS Modules (PARTIALLY DONE)
**Files renamed (`.css` → `.module.css`):**
- ✅ All 23 `.css` files in `src/frontend/src/pages/` were renamed to `.module.css`
- ✅ `src/frontend/src/components/Feedback/FeedbackWidget.css` → `FeedbackWidget.module.css`
- ✅ All corresponding `.tsx` imports were updated to use `.module.css`

**Remaining:**
- ❌ `src/frontend/src/components/admin/StatCard.css` — still `.css` (not `.module.css`), has hardcoded values
- ❌ `src/frontend/src/components/admin/StubManager.css` — still `.css`
- ❌ `src/frontend/src/components/layout/MainLayout/MainLayout.css` — still `.css`
- ❌ `src/frontend/src/components/pc-builder/BuildSummaryPanel.css` — still `.css`
- ❌ `src/frontend/src/components/pc-builder/ComponentSlot.css` — still `.css`
- ❌ `src/frontend/src/components/ui/Modal/Modal.css` — still `.css`

### 4. Stage 3: Fix TypeScript Types and `any` Usage (PARTIALLY DONE)
**Files fixed:**
- ✅ `src/frontend/src/components/auth/RegisterModal/RegisterModal.tsx` — `catch (error: any)` → `catch (error: unknown)`
- ✅ `src/frontend/src/components/pc-builder/ComponentPickerModal/ComponentPickerModal.tsx` — fixed multiple `any` types:
  - `function summaryToProduct(s: any)` → `ProductSummary`
  - `product: any` in interface → `Product`
  - `onSelect: (product: any)` → `Product`
  - All `(buildContext.motherboard.product.specifications as any)` → optional chaining `buildContext.otherboard?.product?.specifications`
  - `catMap: Record<string, any>` → `Record<string, ProductSummary>`

**Remaining:**
- ❌ `src/frontend/src/components/pc-builder/PdfExportModal/PdfExportModal.tsx` — has `(s as any).fan`, `(doc as any).lastAutoTable`
- ❌ `src/frontend/src/components/cart/RelatedProducts.tsx` — has `el.removeEventListener('scroll', update as any)`
- ❌ `src/frontend/src/components/wizard/BuildResult.tsx` — has `wizardState.cpuPreference === 'any'` (string literal, not type)
- ❌ Need to add proper types for `jsPDF` and `jspdf-autotable` (Declarate module or @types)

### 5. Stage 4: Replace Mocks with Real API (NOT STARTED)
**Files with MOCK data that need real API integration:**
- ❌ `src/frontend/src/pages/accountant/ReportsPage.tsx` — `MOCK_STATS`
- ❌ `src/frontend/src/pages/accountant/ExportPage.tsx` — `MOCK_EXPORT_OPTIONS`
- ❌ `src/frontend/src/pages/manager/ManagerDashboard.tsx` — `MOCK_WIDGETS`, `MOCK_LOW_STOCK`, `MOCK_PENDING_TICKETS`
- ❌ `src/frontend/src/pages/manager/OrdersPage.tsx` — `MOCK_ORDERS`
- ❌ `src/frontend/src/pages/manager/OrderDetailPage.tsx` — `MOCK_ORDER`
- ❌ `src/frontend/src/pages/manager/InventoryPage.tsx` — `MOCK_INVENTORY`
- ❌ `src/frontend/src/pages/master/TicketsPage.tsx` — `MOCK_TICKETS`
- ❌ `src/frontend/src/pages/master/TicketDetailPage.tsx` — `MOCK_TICKET`
- ❌ `src/frontend/src/pages/AccountPage/*` — hardcoded user data

---

## 📋 Pending Tasks (For Tomorrow)

### High Priority
1. **Finish Stage 1**: Replace remaining hardcoded values in ALL `.module.css` files
   - Run: `grep -rn '#[0-9a-f]\|rgba(' src/frontend/src/ --include="*.module.css" | grep -v 'var(--'`
   - Focus on: `Header.module.css`, `HomePage.module.css`, `CatalogPage.module.css`, `ProductPage.module.css`, `CartPage.module.css`, `CheckoutPage.module.css`

2. **Finish Stage 2**: Rename remaining `.css` → `.module.css` in `components/`
   - `StatCard.css`, `StubManager.css`, `MainLayout.css`, `BuildSummaryPanel.css`, `ComponentSlot.css`, `Modal.css`
   - Update corresponding `.tsx` imports

3. **Finish Stage 3**: Fix remaining `any` types
   - `PdfExportModal.tsx` — add proper types for jsPDF
   - `RelatedProducts.tsx` — fix event listener types
   - Add ESLint rule to prevent future `any` usage

### Medium Priority
4. **Stage 4**: Replace mocks with real API (depends on backend API being ready)
   - Start with simpler pages: `ReportsPage`, `ExportPage`
   - Use existing API files: `src/frontend/src/api/manager.ts`, `src/frontend/src/api/admin.ts`

### Low Priority
5. **Delete unused CSS files** (the old `.css` files that were renamed)
   - Run: `find src/frontend/src -name "*.css" ! -name "*module.css" -delete`

6. **Build verification**
   - Run `cd src/frontend && npm run build` to check for remaining TypeScript errors
   - Fix any errors found

---

## 🔍 Git Status (Before Commit)
- Modified: AGENTS.md, authService, client, orders, wishlist, types, RegisterModal, etc.
- Renamed: 23+ CSS files (.css → .module.css)
- New file: FeedbackWidget.module.css (renamed from .css)

## 💾 Commit Message (English)
```
fix(frontend): replace hardcoded CSS values, migrate to CSS Modules, fix TypeScript types

- Replace hardcoded hex colors and rgba values with CSS token variables
  from tokens.css in ProductCard, Footer, Button, FilterSidebar,
  ActiveFiltersBar, FeedbackWidget, and StatCard components
- Migrate 23 page-level CSS files from .css to .module.css
  and update all corresponding TSX imports
- Fix unsafe `extractData`/`unwrap` functions to throw on undefined data
  instead of unsafe `as T` type cast
- Replace `any` types with proper TypeScript types in RegisterModal
  and ComponentPickerModal (use Product/ProductSummary types)
- Fix invalid TypeScript syntax in orders.ts (union type inside generic)
- Add wishlist sync after login with proper timing (setTimeout)

Partially completed Stage 1 (CSS tokens) and Stage 2 (CSS Modules).
Remaining work: finish token replacement in page CSS, rename
component CSS files, fix remaining `any` types, and
replace mock data with real API integration.

Co-authored-by: Claude Opus 4.5 <noreply@anthropic.com>
```

---

## 🚀 Quick Commands for Tomorrow

```bash
# 1. Check remaining hardcoded values
cd /home/goldie/Progs/kursovaya/GoldPC
grep -rn '#[0-9a-f]\|rgba(' src/frontend/src/ --include="*.module.css" | grep -v 'var(--' | head -50

# 2. Find remaining .css files (not .module.css)
find src/frontend/src -name "*.css" ! -name "*module.css"

# 3. Check TypeScript errors
cd src/frontend && npx tsc --noEmit

# 4. Continue work
# (pick up from Stage 1/2/3 as needed)
```

---

**Good job today! See you tomorrow! 🚀**
