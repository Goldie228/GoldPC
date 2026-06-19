import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { WarrantyCard, PagedResult } from '../api/warranty';

const mockGetMyCards = vi.fn();
const mockGetCard = vi.fn();

vi.mock('../api/warranty', () => ({
  warrantyApi: {
    getMyCards: (...args: any[]) => mockGetMyCards(...args),
    getCard: (...args: any[]) => mockGetCard(...args),
  },
}));

import { useWarranty } from './useWarranty';

const mockCard: WarrantyCard = {
  id: 'w1',
  warrantyNumber: 'WC-001',
  productName: 'Test Product',
  serialNumber: null,
  startDate: '2024-01-01',
  endDate: '2025-01-01',
  warrantyMonths: 12,
  status: 'active',
};

describe('hooks/useWarranty', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns initial state', () => {
    const { result } = renderHook(() => useWarranty());
    expect(result.current.cards).toBeNull();
    expect(result.current.totalCount).toBe(0);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('getMyCards loads cards', async () => {
    const response: PagedResult<WarrantyCard> = { items: [mockCard], totalCount: 1, pageNumber: 1, pageSize: 10 };
    mockGetMyCards.mockResolvedValue(response);

    const { result } = renderHook(() => useWarranty());
    let res: PagedResult<WarrantyCard> | null = null;
    await act(async () => {
      res = await result.current.getMyCards(1, 10);
    });

    expect(res).toEqual(response);
    expect(result.current.cards).toEqual(response.items);
    expect(result.current.totalCount).toBe(1);
  });

  it('getMyCards sets error on failure', async () => {
    mockGetMyCards.mockRejectedValue(new Error('Not found'));

    const { result } = renderHook(() => useWarranty());
    await act(async () => {
      await result.current.getMyCards();
    });

    expect(result.current.error?.message).toBe('Not found');
    expect(result.current.cards).toBeNull();
  });

  it('getCard returns card by id', async () => {
    mockGetCard.mockResolvedValue(mockCard);

    const { result } = renderHook(() => useWarranty());
    let res: WarrantyCard | null = null;
    await act(async () => {
      res = await result.current.getCard('w1');
    });

    expect(res).toEqual(mockCard);
  });

  it('getCard sets error on failure', async () => {
    mockGetCard.mockRejectedValue(new Error('Invalid'));

    const { result } = renderHook(() => useWarranty());
    await act(async () => {
      await result.current.getCard('bad');
    });

    expect(result.current.error?.message).toBe('Invalid');
  });
});
