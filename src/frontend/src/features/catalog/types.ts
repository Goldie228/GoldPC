/**
 * Catalog Feature Types
 * Extracted from FilterSidebar for better organization
 */

import type { ProductCategory, Category, FilterFacetAttribute, Manufacturer } from '../../api/types';

export interface FilterState {
  selectedCategory: ProductCategory | null;
  priceRange: { min: number; max: number };
  selectedManufacturerIds: string[];
  minRating: number;
  selectedAvailability: string[];
  selectedSpecifications: Record<string, string | number | string[]>;
}

export interface CategoryCountMap {
  [key: string]: number;
}

export interface PriceBounds {
  min: number;
  max: number;
}

export type { ProductCategory, Category, FilterFacetAttribute, Manufacturer };