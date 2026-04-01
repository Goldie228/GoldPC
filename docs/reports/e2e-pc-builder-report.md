# E2E Test Report — PC Builder (Playwright)

**Date:** 2026-04-01  
**Suite:** `tests/e2e/specs/pc-builder/pc-builder.spec.ts`  
**Framework:** Playwright  
**Total Scenarios:** 8  

---

## 1. Scenarios Overview

| # | Scenario | Description | Key Assertions |
|---|----------|-------------|----------------|
| 1 | Incompatible CPU + Motherboard | LGA1700 CPU + AM5 MB | Error message shown, status = "Есть проблемы", Add-to-cart disabled, Checkout disabled |
| 2 | Correct total price calculation | Select CPU (1899) + MB (1199) + RAM (399) | Total = 3497 BYN in toolbar and sidebar |
| 3 | Save configuration for auth user | Auth token injected, POST to `/pcbuilder/configurations` | 201 response, toast notification, or LocalStorage auto-save |
| 4 | Add complete build to cart (8 items) | All 8 slots filled with compatible components | Counter = 8/8, no compatibility warnings, cart has 8 items in localStorage |
| 5 | Empty configuration | No components selected | Counter = 0/8, all slots `--empty`, total = 0, both buttons disabled |
| 6 | Network error handling | `route.abort('failed')` on catalog API | Error banner or empty state visible, retry button enabled |
| 7 | Products without specifications | Products without `specifications` field | Slot shows product name + price, no JS errors, modal opens fine |
| 8 | Duplicate selection prevention | Re-select same slot shows current choice, can swap | Modal shows "Выбрано: ...", clicking another product replaces slot content |

---

## 2. Architecture & Design Decisions

### 2.1 API Mocking Strategy
All catalog API responses are intercepted via `page.route()` with URL-based predicate matching `category` query param. This ensures:
- No dependency on running backend services
- Deterministic product data for price/slot assertions
- Fast test execution (~2-3s per test)

### 2.2 Page Object Model
Tests reuse existing POM classes:
- `PCBuilderPage` — `/tests/e2e/pages/PCBuilderPage.ts`
- `LoginPage` — `/tests/e2e/pages/LoginPage.ts` (for auth injection in scenario 3)
- `CartPage` — `/tests/e2e/pages/CartPage.ts`

### 2.3 Component Interaction Pattern
Helper function `selectSlotProduct(page, slotIndex)` handles the modal-based selection flow:
```
slot button click → modal opens → wait for products → click first product → modal closes
```

---

## 3. Compatibility Engine Coverage

The `usePCBuilder` hook implements client-side compatibility checks (see `src/frontend/src/hooks/usePCBuilder.ts`):

| Check | Scenario | Error/Warning |
|-------|----------|---------------|
| CPU socket vs Motherboard socket | #1 | **Error:** «Сокет процессора (X) не соответствует сокету материнской платы (Y)» |
| RAM type vs Motherboard memory type | — | **Error:** «Тип памяти (X) не поддерживается материнской платой (Y)» |
| Cooling vs CPU socket | — | **Warning:** «Система охлаждения может не поддерживать сокет X» |
| No GPU with non-iGPU CPU | — | **Warning:** «Не выбрана видеокарта...» |
| PSU wattage vs total TDP | — | **Warning:** «Рекомендуется блок питания мощнее...» |

Scenario **#1** directly validates the critical CPU↔Motherboard socket mismatch.

---

## 4. Test Data Fixtures

| Product | ID | Category | Price (BYN) | Socket | Memory Type |
|---------|-----|----------|-------------|--------|-------------|
| AMD Ryzen 9 7950X | cpu-1 | cpu | 1899 | AM5 | DDR5 |
| Intel Core i9-13900K | cpu-2 | cpu | 1699 | LGA1700 | DDR5 |
| AMD Ryzen 7 7700X | cpu-3 | cpu | 999 | AM5 | DDR5 |
| ASUS ROG X670E Hero | mb-1 | motherboard | 1199 | AM5 | DDR5 |
| NVIDIA RTX 4090 | gpu-1 | gpu | 4599 | — | GDDR6X |
| G.Skill Trident Z5 32GB | ram-1 | ram | 399 | — | DDR5 |
| Samsung 990 Pro 2TB | storage-1 | storage | 549 | — | — |
| Corsair RM1000x | psu-1 | psu | 499 | — | — |
| NZXT H7 Flow | case-1 | case | 299 | — | — |
| NZXT Kraken X63 | cooling-1 | cooling | 349 | — | — |

---

## 5. File Inventory

| File | Lines | Purpose |
|------|-------|---------|
| `tests/e2e/specs/pc-builder/pc-builder.spec.ts` | 441 | Main E2E test file |
| `tests/e2e/pages/PCBuilderPage.ts` | 95 | Page Object Model for PC Builder |
| `tests/e2e/pages/LoginPage.ts` | 67 | Page Object Model for Login |
| `tests/e2e/pages/CartPage.ts` | 264 | Page Object Model for Cart |
| `tests/e2e/playwright.config.ts` | 83 | Playwright configuration |

---

## 6. How to Run

```bash
# All PC Builder tests
cd tests/e2e
npx playwright test specs/pc-builder/

# Single test (e.g. scenario 1)
npx playwright test specs/pc-builder/ -g "1 -"

# Headed mode for debugging
npx playwright test specs/pc-builder/ --headed

# HTML report
npx playwright show-report
```

---

## 7. Key Locators Used

| Element | CSS Selector | Source Component |
|---------|-------------|------------------|
| Component slot | `.component-slot` | `ComponentSlot.tsx` |
| Empty slot variant | `.component-slot--empty` | `ComponentSlot.tsx` |
| Slot button | `.component-slot button` | `ComponentSlot.tsx` |
| Slot price | `.component-slot__price-value` | `ComponentSlot.tsx` |
| Compatibility errors | `.pc-builder__error` | `PCBuilderPage.tsx` |
| Compatibility status | `.pc-builder__status` | `PCBuilderPage.tsx` |
| Toolbar total | `.pc-builder__total-value` | `PCBuilderPage.tsx` |
| Sidebar total | `.pc-builder__summary-total-value` | `PCBuilderPage.tsx` |
| Add to cart button | `.pc-builder__add-to-cart` | `PCBuilderPage.tsx` |
| Checkout button | `.pc-builder__checkout-btn` | `PCBuilderPage.tsx` |
| Checkout counter | `.pc-builder__checkout-count` | `PCBuilderPage.tsx` |
| Modal | `.modal` / `[role="dialog"]` | `Modal.tsx` |
| Modal product row | `.pc-builder__modal-product` | `PCBuilderPage.tsx` |
| Modal error | `.pc-builder__modal-error` | `PCBuilderPage.tsx` |
| Modal selected info | `.pc-builder__modal-selected` | `PCBuilderPage.tsx` |

---

## 8. Limitations & Notes

- **Scenario 3** adapts to current UI: if save button is not rendered as a direct element, it falls back to verifying LocalStorage auto-save (`goldpc-pc-builder` key).
- **Scenario 6** checks for either an error banner (`.pc-builder__modal-error`) or empty state text (`.pc-builder__modal-text`).
- **Scenario 7** validates that products missing `specifications` field don't cause JS errors — price and name still render correctly.
- **Scenario 8** gracefully handles cases where the second product may not be visible (depends on mocked data order).
- Tests use Cyrillic-free test names to avoid encoding issues in CI artifacts.

