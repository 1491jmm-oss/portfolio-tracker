"use client";

import { useCallback, useEffect, useState } from "react";

import { getSnapshots, type Snapshot } from "@/services/api";

export function useSnapshots() {
  const [data, setData] = useState<Snapshot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSnapshots = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const snapshots = await getSnapshots();
      setData(snapshots);
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "Error desconocido");
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSnapshots();
  }, [fetchSnapshots]);

  return {
    data,
    error,
    isLoading,
    refetch: fetchSnapshots,
  };
}
