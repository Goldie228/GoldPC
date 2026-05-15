import { render, screen, act } from '@testing-library/react';
import type { ProductCategory } from '../../api/types';
import '@testing-library/jest-dom';
import { FilterSidebar } from './FilterSidebar';

// Suppress network error logs in tests
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

afterEach(() => {
  consoleSpy.mockClear();
});

afterAll(() => {
  consoleSpy.mockRestore();
});

const defaultProps = {
  selectedCategory: null as ProductCategory | null,
  onCategoryChange: vi.fn(),
  priceRange: { min: 0, max: 0 },
  onPriceChange: vi.fn(),
  priceMin: undefined as number | undefined,
  priceMax: undefined as number | undefined,
  selectedManufacturerIds: [] as string[],
  onManufacturerIdsChange: vi.fn(),
  minRating: 0,
  onRatingChange: vi.fn(),
  selectedAvailability: ['in_stock'] as string[],
  onAvailabilityChange: vi.fn(),
  selectedSpecifications: {} as Record<string, string[]>,
  onSpecificationsChange: vi.fn(),
  onReset: vi.fn(),
};

describe('FilterSidebar', () => {
  it('renders filter title', () => {
    render(<FilterSidebar {...defaultProps} />);
    expect(screen.getByText('Фильтры')).toBeInTheDocument();
  });

  it('renders category filter group', async () => {
    render(<FilterSidebar {...defaultProps} />);
    // Categories load fails (no API server) but the group header is always rendered
    expect(await screen.findByText('Категории')).toBeInTheDocument();
  });

  it('renders price filter group', () => {
    render(<FilterSidebar {...defaultProps} />);
    expect(screen.getByText('Цена')).toBeInTheDocument();
  });

  it('renders manufacturers filter group', async () => {
    render(<FilterSidebar {...defaultProps} />);
    expect(await screen.findByText('Производители')).toBeInTheDocument();
  });

  it('renders rating filter group', () => {
    render(<FilterSidebar {...defaultProps} />);
    expect(screen.getByText('Рейтинг')).toBeInTheDocument();
  });

  it('renders availability filter group', () => {
    render(<FilterSidebar {...defaultProps} />);
    expect(screen.getByText('Наличие')).toBeInTheDocument();
  });

  it('calls onCategoryChange when category is clicked', async () => {
    render(<FilterSidebar {...defaultProps} />);
    await screen.findByText('Категории');

    const processorBtn = screen.getByText('Процессоры');
    await act(async () => {
      processorBtn.click();
    });
    expect(defaultProps.onCategoryChange).toHaveBeenCalledWith('cpu');
  });

  it('calls onReset when reset button is clicked', async () => {
    render(<FilterSidebar {...defaultProps} selectedCategory="cpu" />);
    await screen.findByText('Сбросить');

    const resetBtn = screen.getByText('Сбросить');
    await act(async () => {
      resetBtn.click();
    });
    expect(defaultProps.onReset).toHaveBeenCalledTimes(1);
  });
});