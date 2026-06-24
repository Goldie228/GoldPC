# BUILD NOTES: Checkout & Order System Bug Fixes
**Builder:** frontend-builder
**Date:** 2026-06-22

## Implementation Status

### Bug 1: CheckoutPage crash ("status?.toLowerCase is not a function")
**Status:** ALREADY FIXED (OrderSuccessPage.tsx)
**Verified:** No `toLowerCase` calls on `status` exist in CheckoutPage.tsx. The crash was in OrderSuccessPage.tsx where `order.status?.toLowerCase()` was called but `status` could be a non-string (e.g., number from API). That fix is already committed. No action needed.

### Bug 2: Missing delivery date picker ("нет даты доставки")
**Status:** ALREADY PRESENT
**Verified:** `CheckoutPage.tsx` line ~504-509 renders `DeliveryTimeSlotPicker` component which provides:
- Date input (`<input type="date">`) with min=today, max=today+7
- 4 time slot buttons (10:00-13:00, 13:00-16:00, 16:00-19:00, 19:00-22:00)
- Auto-sets default date to tomorrow
- The `deliveryDate` and `timeSlot` are included in the order payload (lines 260-261)
- If user reports "нет даты доставки", it may be a UX issue (not prominent enough) or the backend is not storing/returning it. Backend check needed.

### Bug 3: Phone format wrong ("телефон не по формату")
**Status:** ALREADY CORRECT
**Verified:** CheckoutPage.tsx uses:
- `PhoneInput` component (line ~601) which auto-formats to `+375 (XX) XXX-XX-XX`
- `isValidPhone` validation (line ~157) checking 7-15 digits
- `parsePhone` on submission (line 252) converting to raw digits with `375` prefix
- The phone is sent as `parsePhone(contactData.phone.trim())` which strips formatting
- If backend rejects the phone, it's a backend validation mismatch, not a frontend issue.

### Bug 4: "товар(ов)" doesn't decline — FIXED
**Files modified:**
- `src/frontend/src/pages/cart-page/CartPage.tsx` — added `import { pluralizeRu } from '@/utils/pluralizeRu'` and replaced broken inline ternary with `pluralizeRu(itemCount, ['товар', 'товара', 'товаров'])`
- `src/frontend/src/pages/pc-builder-page/PCBuilderPage.tsx` — same pattern: added import and replaced broken ternary

**Before:** `count === 1 ? 'товар' : count < 5 ? 'товара' : 'товаров'`
**After:** `pluralizeRu(count, ['товар', 'товара', 'товаров'])`

The old code was wrong for numbers ending in 1 (like 21, 31) — it showed "товаров" instead of "товар". The `pluralizeRu` utility handles Russian pluralization correctly per linguistic rules.

### Bug 5: Orders not linked to DB ("пишет МОНИТОР везде, нет фото")
**Status:** PARTIALLY A DATA/BACKEND ISSUE
**Verified:**
- `AccountOrders.tsx` calls `useMyOrders()` which hits `GET /api/v1/orders/my` — this IS a real API call, not hardcoded
- The OrdersController in OrdersService has a `GET /api/v1/orders/my` endpoint that queries PostgreSQL
- "МОНИТОР везде" is a data issue — if all products display as "МОНИТОР", it means either:
  1. The order items in the DB all have `ProductName = 'МОНИТОР'` (seed data issue)
  2. The API is not returning `ProductName` and the frontend falls back to a default
- "Нет фото" is expected because `OrderItemDto` has `ProductName`, `CategoryName`, `UnitPrice`, `Quantity` but NO `ImageUrl`. The frontend `OrderItemCard` does not display product images.
- **Frontend improvement:** Added a category icon fallback in the order item card using `getCategoryIcon()` to at least show a relevant icon instead of nothing.
- **Backend fix needed:** `OrderItem` should store `ImageUrl` or `ProductImageId` for order history display.

### Bug 6: Saved builds don't save — FIXED
**File modified:** `src/frontend/src/pages/pc-builder-page/PCBuilderPage.tsx`
**Root cause:** The `onSave` handler was `() => showToast('Сборка сохранена', 'success', 3000)` — it showed a success toast but NEVER opened the SaveConfigurationModal or called any API.

**Fix:**
1. Added `import SaveConfigurationModal` from `@/components/pc-builder/save-configuration-modal/SaveConfigurationModal`
2. Added `const [saveModalOpen, setSaveModalOpen] = useState(false)` state
3. Changed `onSave={() => showToast(...)}` to `onSave={() => setSaveModalOpen(true)}`
4. Rendered `<SaveConfigurationModal>` at the bottom of the component

The `SaveConfigurationModal` component already had full save functionality:
- Name input, purpose dropdown (Gaming/Office/Workstation)
- Calls `POST /api/v1/pcbuilder/configurations` via `apiClient`
- Shows success toast and navigates to account builds page after save

## API Integration Points

| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /api/v1/orders/my` | Used correctly | Returns orders from PostgreSQL |
| `POST /api/v1/orders` | Used correctly | Creates order with phone, deliveryDate, etc. |
| `POST /api/v1/pcbuilder/configurations` | NOW WIRED UP | SaveConfigurationModal calls this on save |

## Deviations from Architecture

None. All changes are minimal and surgical.

## Accessibility Notes

- PhoneInput component has proper `inputMode="numeric"`, `aria-label`, and placeholder attributes
- DeliveryTimeSlotPicker date input has `aria-label="Дата доставки"`
- SaveConfigurationModal has focus management and keyboard handling (Escape to close)

## Browser/Environment Compatibility

- No browser-specific APIs used
- All components use standard React + Tailwind patterns

## Wire Points Ready

- `SaveConfigurationModal` is now rendered when user clicks "Сохранить сборку"
- The modal handles API call, error display, and navigation on success
- Need to verify the backend `POST /api/v1/pcbuilder/configurations` endpoint exists and works

## Known Issues

1. **Bug 5 (OrderItem photos):** `OrderItem` backend entity does not store image URLs. This requires a backend migration to add `ImageUrl` or `ProductImageId` to `OrderItem`. Out of frontend scope.
2. **Bug 5 (МОНИТОР data):** If orders in the database have all products named "МОНИТОР", this is a seed/migration data issue. Frontend can't fix this.
3. **Backend endpoint verification:** The `POST /api/v1/pcbuilder/configurations` endpoint needs to be verified as working. The `pcbuilder.ts` API file sends to `/pcbuilder/configurations` which should be proxied to the PCBuilderService.
