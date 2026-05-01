import { useState, useCallback } from 'react';
import { addressesApi, type UserAddress, type CreateAddressRequest, type UpdateAddressRequest } from '../api/addresses';

export interface UseAddressesReturn {
  addresses: UserAddress[];
  loading: boolean;
  error: Error | null;
  getAddresses: () => Promise<UserAddress[] | null>;
  getAddress: (id: string) => Promise<UserAddress | null>;
  createAddress: (data: CreateAddressRequest) => Promise<UserAddress | null>;
  updateAddress: (id: string, data: UpdateAddressRequest) => Promise<UserAddress | null>;
  deleteAddress: (id: string) => Promise<boolean>;
  setDefaultAddress: (id: string) => Promise<UserAddress | null>;
}

export function useAddresses(): UseAddressesReturn {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getAddresses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await addressesApi.getAddresses();
      setAddresses(result);
      return result;
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to fetch addresses');
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAddress = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      return await addressesApi.getAddress(id);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to fetch address');
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createAddress = useCallback(async (data: CreateAddressRequest) => {
    setLoading(true);
    setError(null);
    try {
      const result = await addressesApi.createAddress(data);
      setAddresses((prev) => [...prev, result]);
      return result;
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to create address');
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAddress = useCallback(async (id: string, data: UpdateAddressRequest) => {
    setLoading(true);
    setError(null);
    try {
      const result = await addressesApi.updateAddress(id, data);
      setAddresses((prev) => prev.map((a) => (a.id === id ? result : a)));
      return result;
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to update address');
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAddress = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await addressesApi.deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      return true;
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to delete address');
      setError(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const setDefaultAddress = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await addressesApi.setDefaultAddress(id);
      setAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          isDefault: a.id === id,
        }))
      );
      return result;
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to set default address');
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    addresses,
    loading,
    error,
    getAddresses,
    getAddress,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  };
}

export default useAddresses;