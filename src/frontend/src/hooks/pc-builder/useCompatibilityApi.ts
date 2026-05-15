/**
 * useCompatibilityApi — Debounced API call for compatibility checking
 * Isolated side effect: API calls + debounce timer
 */

import { useState, useEffect, useRef } from 'react';
import { checkCompatibilityAPI } from '../../api/pcBuilderService';
import type { CompatibilityCheckResponse } from '../../api/pcBuilderService';
import type { PCBuilderSelectedState } from '@/features/pc-builder/logic/types';
import { COMPATIBILITY_DEBOUNCE_MS } from '@/features/pc-builder/logic/constants';

interface UseCompatibilityApiResult {
  apiResult: CompatibilityCheckResponse | null;
  isLoading: boolean;
  error: Error | null;
}

export function useCompatibilityApi(
  components: PCBuilderSelectedState
): UseCompatibilityApiResult {
  const [apiResult, setApiResult] = useState<CompatibilityCheckResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const hasComponents =
      !!components.cpu || !!components.gpu || !!components.motherboard;
    if (!hasComponents) {
      setApiResult(null);
      setError(null);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    const requestId = ++requestIdRef.current;

    timerRef.current = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await checkCompatibilityAPI(
          components as Parameters<typeof checkCompatibilityAPI>[0]
        );
        // Ignore stale responses from outdated requests
        if (requestId !== requestIdRef.current) return;
        setApiResult(result);
      } catch (e) {
        // Ignore errors from outdated requests
        if (requestId !== requestIdRef.current) return;
        setError(e instanceof Error ? e : new Error('API error'));
        setApiResult(null);
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    }, COMPATIBILITY_DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [components]);

  return { apiResult, isLoading, error };
}