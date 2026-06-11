/**
 * useCompatibilityApi — Debounced API call for compatibility checking
 * Isolated side effect: API calls + debounce timer + AbortController
 */

import { useState, useEffect, useRef } from 'react';
import { checkCompatibilityAPI } from '@/api/pcBuilderService';
import type { CompatibilityCheckResponse } from '@/api/pcBuilderService';
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
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const hasComponents =
      components.cpu != null || components.gpu != null || components.motherboard != null;
    if (!hasComponents) {
      setApiResult(null);
      setError(null);
      return;
    }

    // Cancel previous timer
    if (timerRef.current) clearTimeout(timerRef.current);

    // Cancel previous in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    const requestId = ++requestIdRef.current;

    timerRef.current = setTimeout(() => {
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setError(null);

      checkCompatibilityAPI(
        components as Parameters<typeof checkCompatibilityAPI>[0],
        { signal: controller.signal }
      )
        .then((result) => {
          // Ignore stale responses from outdated requests
          if (requestId !== requestIdRef.current) return;
          setApiResult(result);
        })
        .catch((e) => {
          // Ignore aborted requests and stale responses
          if (e instanceof DOMException && e.name === 'AbortError') return;
          if (requestId !== requestIdRef.current) return;
          setError(e instanceof Error ? e : new Error('API error'));
          setApiResult(null);
        })
        .finally(() => {
          if (requestId === requestIdRef.current) {
            setIsLoading(false);
          }
          if (abortRef.current === controller) {
            abortRef.current = null;
          }
        });
    }, COMPATIBILITY_DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, [components]);

  return { apiResult, isLoading, error };
}
