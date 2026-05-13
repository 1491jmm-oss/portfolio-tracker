"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getBenchmarkPerformance,
  type Benchmark,
  type BenchmarkPerformancePoint,
} from "@/services/api";

export function useBenchmarkPerformance(benchmark: Benchmark) {
  const [data, setData] = useState<BenchmarkPerformancePoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPerformance = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const performance = await getBenchmarkPerformance(benchmark);
      setData(performance);
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "Error desconocido");
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [benchmark]);

  useEffect(() => {
    void fetchPerformance();
  }, [fetchPerformance]);

  return {
    data,
    error,
    isLoading,
    refetch: fetchPerformance,
  };
}
