"use client";

import { useCallback, useEffect, useState } from "react";

import { getSnapshots, type Snapshot } from "@/services/api";

const refreshIntervalMs = 60_000;

export function useSnapshots() {
  const [data, setData] = useState<Snapshot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSnapshots = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const snapshots = await getSnapshots();
      setData(snapshots);
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "Error desconocido");
      if (!silent) {
        setData([]);
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchSnapshots();
  }, [fetchSnapshots]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void fetchSnapshots({ silent: true });
    }, refreshIntervalMs);

    return () => window.clearInterval(intervalId);
  }, [fetchSnapshots]);

  return {
    data,
    error,
    isLoading,
    refetch: fetchSnapshots,
  };
}
