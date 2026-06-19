import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { UserAddress } from '../api/addresses';

const mockGetAddresses = vi.fn();
const mockGetAddress = vi.fn();
const mockCreateAddress = vi.fn();
const mockUpdateAddress = vi.fn();
const mockDeleteAddress = vi.fn();
const mockSetDefaultAddress = vi.fn();

vi.mock('../api/addresses', () => ({
  addressesApi: {
    getAddresses: (...args: any[]) => mockGetAddresses(...args),
    getAddress: (...args: any[]) => mockGetAddress(...args),
    createAddress: (...args: any[]) => mockCreateAddress(...args),
    updateAddress: (...args: any[]) => mockUpdateAddress(...args),
    deleteAddress: (...args: any[]) => mockDeleteAddress(...args),
    setDefaultAddress: (...args: any[]) => mockSetDefaultAddress(...args),
  },
}));

import { useAddresses } from './useAddresses';

describe('hooks/useAddresses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns initial state', () => {
    const { result } = renderHook(() => useAddresses());
    expect(result.current.addresses).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('getAddresses fetches and sets addresses', async () => {
    const fakeAddresses: UserAddress[] = [{ id: '1', userId: 'u1', name: 'Home', city: 'Minsk', address: 'St 1', isDefault: false, createdAt: '2024-01-01' }];
    mockGetAddresses.mockResolvedValue(fakeAddresses);

    const { result } = renderHook(() => useAddresses());

    let res: UserAddress[] | null = null;
    await act(async () => {
      res = await result.current.getAddresses();
    });

    expect(res).toEqual(fakeAddresses);
    expect(result.current.addresses).toEqual(fakeAddresses);
    expect(result.current.loading).toBe(false);
  });

  it('getAddresses sets error on failure', async () => {
    mockGetAddresses.mockRejectedValue(new Error('Network'));

    const { result } = renderHook(() => useAddresses());

    await act(async () => {
      const res = await result.current.getAddresses();
      expect(res).toBeNull();
    });

    expect(result.current.error?.message).toBe('Network');
  });

  it('createAddress calls API and updates list', async () => {
    const newAddr: UserAddress = { id: '2', userId: 'u1', name: 'Office', city: 'Minsk', address: 'St 2', isDefault: false, createdAt: '2024-01-02' };
    mockCreateAddress.mockResolvedValue(newAddr);
    mockGetAddresses.mockResolvedValue([newAddr]);

    const { result } = renderHook(() => useAddresses());

    let res: UserAddress | null = null;
    await act(async () => {
      res = await result.current.createAddress({ name: 'Office', city: 'Minsk', address: 'St 1' });
    });

    expect(res).toEqual(newAddr);
    expect(mockCreateAddress).toHaveBeenCalled();
  });

  it('deleteAddress calls API', async () => {
    mockDeleteAddress.mockResolvedValue(true);

    const { result } = renderHook(() => useAddresses());

    await act(async () => {
      const res = await result.current.deleteAddress('1');
      expect(res).toBe(true);
    });

    expect(mockDeleteAddress).toHaveBeenCalledWith('1');
  });
});
