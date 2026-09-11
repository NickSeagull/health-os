"use client";

import useSWR, { type SWRConfiguration } from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/**
 * When `endpoint` is null or an empty string, do not send a request.
 * Without this guard, an empty endpoint becomes `/api/` and returns a 404 on
 * every lab-results page load until a marker is selected.
 */
export function useHealthData<T>(
  endpoint: string | null,
  options?: SWRConfiguration & { refreshInterval?: number }
) {
  return useSWR<T>(
    endpoint ? `/api/${endpoint}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 30000,
      dedupingInterval: 10000,
      ...options,
    }
  );
}
