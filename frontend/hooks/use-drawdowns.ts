"use client";

import { useCallback, useEffect, useState } from "react";

import { getDrawdowns, type Currency, type DrawdownResponse } from "@/services/api";

export function useDrawdowns(currency: Currency) {
  const [data, setData] = useState<DrawdownResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDrawdowns = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const drawdowns = await getDrawdowns(currency);
      setData(drawdowns);
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "Error desconocido");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [currency]);

  useEffect(() => {
    void fetchDrawdowns();
  }, [fetchDrawdowns]);

  return {
    data,
    error,
    isLoading,
    refetch: fetchDrawdowns,
  };
}
