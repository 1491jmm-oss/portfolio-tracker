"use client";

import { useCallback, useEffect, useState } from "react";

import {
  createMovement,
  deleteMovement,
  getMovements,
  type Movement,
  type MovementCreate,
} from "@/services/api";

export function useMovements() {
  const [data, setData] = useState<Movement[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);

  const fetchMovements = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const movements = await getMovements();
      setData(movements);
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "Error desconocido");
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMovements();
  }, [fetchMovements]);

  const addMovement = useCallback(async (movement: MovementCreate) => {
    setIsMutating(true);
    setError(null);

    try {
      await createMovement(movement);
      await fetchMovements();
    } catch (currentError) {
      const message = currentError instanceof Error ? currentError.message : "Error desconocido";
      setError(message);
      throw new Error(message);
    } finally {
      setIsMutating(false);
    }
  }, [fetchMovements]);

  const removeMovement = useCallback(async (movementId: number) => {
    setIsMutating(true);
    setError(null);

    try {
      await deleteMovement(movementId);
      await fetchMovements();
    } catch (currentError) {
      const message = currentError instanceof Error ? currentError.message : "Error desconocido";
      setError(message);
      throw new Error(message);
    } finally {
      setIsMutating(false);
    }
  }, [fetchMovements]);

  return {
    data,
    error,
    isLoading,
    isMutating,
    addMovement,
    removeMovement,
    refetch: fetchMovements,
  };
}
