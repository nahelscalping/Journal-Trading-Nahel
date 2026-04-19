"use client";

// Hook qui rejoue un callback à chaque fois que le cloud pull redescend
// de nouvelles données (event `nodex-data-refreshed` émis par CloudSyncProvider
// après une sync initiale). À utiliser sur les pages qui lisent le store
// pour qu'elles reflètent les données cloud sans reload manuel.

import { useEffect } from "react";

export function useDataRefresh(callback: () => void): void {
  useEffect(() => {
    window.addEventListener("nodex-data-refreshed", callback);
    return () => window.removeEventListener("nodex-data-refreshed", callback);
  }, [callback]);
}
