/**
 * useFpsApi — Debounced API call for FPS calculation
 * Isolated side effect: FPS API calls + debounce timer
 */

import { useState, useEffect, useRef } from 'react';
import { calculateFpsApi } from '../../api/pcBuilderService';
import type { FpsApiResponse } from '../../api/pcBuilderService';
import type { PCBuilderSelectedState } from '@/features/pc-builder/logic/types';
import { FPS_DEBOUNCE_MS } from '@/features/pc-builder/logic/constants';

interface UseFpsApiResult {
  fpsData: FpsApiResponse | null;
  isLoading: boolean;
  error: Error | null;
}

export function useFpsApi(components: PCBuilderSelectedState): UseFpsApiResult {
  const [fpsData, setFpsData] = useState<FpsApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const cpuId = components.cpu?.product.id;
    const gpuId = components.gpu?.product.id;
    const ramProduct = components.ram[0]?.product ?? null;

    if (!cpuId || !gpuId) {
      setFpsData(null);
      setError(null);
      return;
    }

    const ramCapacity = (ramProduct?.specifications?.capacity as number) ?? undefined;
    const ramFrequency = (ramProduct?.specifications?.frequency as number) ?? undefined;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await calculateFpsApi({
          cpuId,
          gpuId,
          ramCapacity,
          ramFrequency,
        });
        setFpsData(result);
      } catch (e) {
        setError(e instanceof Error ? e : new Error('FPS API error'));
        setFpsData(null);
      } finally {
        setIsLoading(false);
      }
    }, FPS_DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    components.cpu?.product.id,
    components.gpu?.product.id,
    components.ram,
  ]);

  return { fpsData, isLoading, error };
}