import { useState, useCallback } from 'react';
import { warrantyApi } from '../api/warranty';
import type { WarrantyCard, PagedResult } from '../api/warranty';

export interface UseWarrantyReturn {
  cards: WarrantyCard[] | null;
  totalCount: number;
  loading: boolean;
  error: Error | null;
  getMyCards: (page?: number, pageSize?: number) => Promise<PagedResult<WarrantyCard> | null>;
  getCard: (id: string) => Promise<WarrantyCard | null>;
}

export function useWarranty(): UseWarrantyReturn {
  const [cards, setCards] = useState<WarrantyCard[] | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getMyCards = useCallback(
    async (page = 1, pageSize = 10): Promise<PagedResult<WarrantyCard> | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await warrantyApi.getMyCards(page, pageSize);
        setCards(result.items);
        setTotalCount(result.totalCount);
        return result;
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Failed to fetch warranty cards');
        setError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getCard = useCallback(async (id: string): Promise<WarrantyCard | null> => {
    setLoading(true);
    setError(null);
    try {
      return await warrantyApi.getCard(id);
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to fetch warranty card');
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    cards,
    totalCount,
    loading,
    error,
    getMyCards,
    getCard,
  };
}

export default useWarranty;
