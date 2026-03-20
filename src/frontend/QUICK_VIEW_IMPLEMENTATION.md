# Quick View Modal Implementation

## Overview
Successfully implemented the Quick View functionality for the ProductCard component in the GoldPC catalog.

## Changes Made

### 1. Updated `ImageContainerProps` Interface
Added the `onQuickViewClick` prop to enable modal opening functionality:
```typescript
interface ImageContainerProps {
  product: ProductSummary;
  hasDiscount: boolean;
  discountPercent: number;
  isQuickViewHovered: boolean;
  onQuickViewOpen: () => void;
  onQuickViewClose: () => void;
  onQuickViewClick: () => void;  // NEW: Handler for opening modal
}
```

### 2. Updated `ImageContainer` Component
- Added `onQuickViewClick` to the function parameters
- Updated the Quick View button's `onClick` handler to call `onQuickViewClick()`:
```typescript
<button
  className={`${styles.quickViewBtn} ${isQuickViewHovered ? styles.quickViewVisible : ''}`}
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickViewClick();  // Opens the modal
  }}
  aria-label="Быстрый просмотр"
  type="button"
>
  <Icon name="eye" size="sm" />
  <span>Быстрый просмотр</span>
</button>
```

### 3. Updated `ProductCard` Component
Passed the `onQuickViewClick` prop to the `ImageContainer`:
```typescript
<ImageContainer
  product={product}
  hasDiscount={hasDiscount}
  discountPercent={discountPercent}
  isQuickViewHovered={isQuickViewHovered}
  onQuickViewOpen={() => setIsQuickViewHovered(true)}
  onQuickViewClose={() => setIsQuickViewHovered(false)}
  onQuickViewClick={() => setIsQuickViewOpen(true)}  // Opens modal
/>
```

## How It Works

### User Flow:
1. **Hover**: User hovers over the product card image
2. **Button Appears**: Quick View button fades in at the bottom of the image
3. **Click**: User clicks the Quick View button
4. **Modal Opens**: Modal displays with product details
5. **Close**: User can close the modal via:
   - Clicking the X button
   - Clicking outside the modal
   - Pressing ESC key

### Modal Content:
The `QuickViewContent` component displays:
- **Product Image**: Large product image with proper fallback
- **Manufacturer**: Brand name if available
- **Product Name**: Full product title
- **Price**: Formatted price in BYN
- **Rating**: Star rating with numeric value
- **Description**: Placeholder text (actual description would require API integration)
- **Link**: "Перейти к товару →" button to navigate to full product page

## Technical Details

### State Management:
- `isQuickViewHovered`: Controls button visibility on hover
- `isQuickViewOpen`: Controls modal open/close state

### Styling:
- Button uses existing `.quickViewBtn` class with `.quickViewVisible` for visibility
- Modal uses the existing `Modal` component with `size="large"`
- Quick View content styled with `.quickViewContent`, `.quickViewImage`, `.quickViewDetails`

### Accessibility:
- Button has `aria-label="Быстрый просмотр"` for screen readers
- Modal includes proper ARIA attributes
- Keyboard navigation supported (ESC to close)

## Files Modified
- `src/components/ProductCard/ProductCard.tsx`

## Dependencies Used
- `Modal` component from `src/components/ui/Modal/Modal.tsx`
- `Icon` component from `src/components/ui/Icon/Icon.tsx`
- Existing CSS styles in `ProductCard.module.css`

## Testing
✅ TypeScript compilation: PASSED (no errors)
✅ Development server: Running on http://localhost:5173/
✅ No linting errors

## Future Enhancements
To make the Quick View more useful, consider:
1. Adding an "Add to Cart" button in the modal
2. Displaying full product description from API
3. Showing stock status
4. Adding product specifications
5. Including a gallery for multiple images

## Notes
- The implementation follows the existing codebase patterns
- All Russian text preserved for consistency
- Dark gold theme maintained
- Mobile responsive design included in existing CSS