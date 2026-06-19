import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockGetMyCards = vi.fn();
const mockGetCard = vi.fn();

vi.mock('../api/warranty', () => ({
  warrantyApi: {
    getMyCards: (...args: any[]) => mockGetMyCards(...args),
    getCard: (...args: any[]) => mockGetCard(...args),
  },
}));

import { useWarranty } from './useWarranty';

describe('hooks/useWarranty', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial state', () => {
    const { result } = renderHook(() => useWarranty());
    expect(result.current.cards).toBeNull();
    expect(result.current.totalCount).toBe(0);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('getMyCards loads cards', async () => {
    const response = { items: [{ id: 'w1', productId: 'p1' }], totalCount: 1 } as any;
    mockGetMyCards.mockResolvedValue(response);

    const { result } = renderHook(() => useWarranty());
    let res: any;
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
    const card = { id: 'w1', orderId: 'o1' } as any;
    mockGetCard.mockResolvedValue(card);

    const { result } = renderHook(() => useWarranty());
    let res: any;
    await act(async () => {
      res = await result.current.getCard('w1');
    });

    expect(res).toEqual(card);
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
