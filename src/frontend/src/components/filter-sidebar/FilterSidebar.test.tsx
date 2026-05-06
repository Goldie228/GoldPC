import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FilterSidebar } from './FilterSidebar';

describe('FilterSidebar', () => {
  const defaultProps = {
    selectedCategory: null,
    onCategoryChange: vi.fn(),
    priceRange: { min: 0, max: 0 },
    onPriceChange: vi.fn(),
    selectedManufacturerIds: [],
    onManufacturerIdsChange: vi.fn(),
    minRating: 0,
    onRatingChange: vi.fn(),
    selectedAvailability: ['in_stock'],
    onAvailabilityChange: vi.fn(),
    selectedSpecifications: {},
    onSpecificationsChange: vi.fn(),
    onReset: vi.fn(),
  };

  it('renders filter title', () => {
    render(<FilterSidebar {...defaultProps} />);
    expect(screen.getByText('Фильтры')).toBeInTheDocument();
  });

  it('renders category filter group', () => {
    render(<FilterSidebar {...defaultProps} />);
    expect(screen.getByText('Категория')).toBeInTheDocument();
  });

  it('renders price filter group', () => {
    render(<FilterSidebar {...defaultProps} />);
    expect(screen.getByText('Цена')).toBeInTheDocument();
  });
});
