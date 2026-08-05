"use client";

import useSWR, { type SWRConfiguration } from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/**
 * `endpoint` = null либо пустая строка — запрос не отправляется.
 * Без этого пустой эндпоинт превращался в `/api/` и давал 404 на каждой
 * загрузке страницы анализов, пока маркер ещё не выбран.
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
