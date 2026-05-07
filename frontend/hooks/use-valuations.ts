"use client";

import { useCallback, useEffect, useState } from "react";

import { getValuations, type ValuationResponse } from "@/services/api";

export function useValuations(date: string) {
  const [data, setData] = useState<ValuationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchValuations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const valuations = await getValuations(date);
      setData(valuations);
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "Error desconocido");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [date]);

  useEffect(() => {
    void fetchValuations();
  }, [fetchValuations]);

  return {
    data,
    error,
    isLoading,
    refetch: fetchValuations,
  };
}
