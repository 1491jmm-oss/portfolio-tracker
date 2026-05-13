"use client";

import { useCallback, useEffect, useState } from "react";

import { getSnapshotItems, type SnapshotItem } from "@/services/api";

export function useSnapshotItems() {
  const [data, setData] = useState<SnapshotItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSnapshotItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const items = await getSnapshotItems();
      setData(items);
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "Error desconocido");
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSnapshotItems();
  }, [fetchSnapshotItems]);

  return {
    data,
    error,
    isLoading,
    refetch: fetchSnapshotItems,
  };
}
