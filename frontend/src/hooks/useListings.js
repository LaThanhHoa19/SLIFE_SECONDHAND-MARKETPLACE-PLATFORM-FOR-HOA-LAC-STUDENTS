/**
 * Mục đích: fetch listings + debounce keyword.
 * API dùng: GET /api/listings?q=&category=&sort=&page=&size=.
 * Expose: data, meta, isLoading, error, refetch, params, setParams.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { getListings } from '../api/listingApi';
import useDebounce from './useDebounce';

export default function useListings(initialParams = {}) {
  const [params, setParams] = useState({ page: 0, size: 10, ...initialParams });
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ totalPages: 0, totalElements: 0 });
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debouncedQuery = useDebounce(params.q);
  const abortRef = useRef(null);

  const fetchData = useCallback(async (currentParams, query) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const { data: res } = await getListings(
          { ...currentParams, q: query },
          { signal: controller.signal },
      );
      if (controller.signal.aborted) return;

      // Backend current contract: { code, message, data: { content, totalPages, totalElements, ... } }
      // Fallback to legacy payloads for compatibility.
      const payload = res?.data ?? res;
      const list = Array.isArray(payload?.content)
          ? payload.content
          : Array.isArray(payload)
              ? payload
              : [];
      setData(list);
      setMeta({
        totalPages: payload?.totalPages ?? 1,
        totalElements: payload?.totalElements ?? list.length,
      });
    } catch (err) {
      if (err?.name === 'CanceledError' || controller.signal.aborted) return;
      const isNetwork = !err?.status && !err?.response;
      setError({
        variant: isNetwork ? 'network' : 'generic',
        message: err?.message || 'Tải danh sách thất bại.',
      });
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(params, debouncedQuery);
  }, [params.page, params.size, params.category, params.location, params.sort, debouncedQuery, fetchData]);

  const refetch = useCallback(() => {
    fetchData(params, debouncedQuery);
  }, [fetchData, params, debouncedQuery]);

  return { data, meta, isLoading, error, refetch, params, setParams };
}
