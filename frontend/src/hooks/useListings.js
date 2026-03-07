/**
 * Mục đích: fetch listings + debounce keyword + infinite scroll skeleton.
 * API dùng: GET /api/listings?q=&category=&sort=&page=&size=.
 */
import { useEffect, useState } from 'react';
import { getListings } from '../api/listingApi';
import useDebounce from './useDebounce';

export default function useListings(initialParams = {}) {
  const [params, setParams] = useState({ page: 0, size: 10, ...initialParams });
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ totalPages: 0, totalElements: 0 });
  const [isLoading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(params.q);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const { data: res } = await getListings({ ...params, q: debouncedQuery });
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res?.content) ? res.content : [];
        setData(params.page === 0 ? list : [...data, ...list]);
        setMeta({
          totalPages: res?.totalPages ?? 1,
          totalElements: res?.totalElements ?? list.length,
        });
      } finally { setLoading(false); }
    };
    run();
    // TODO: xử lý race-condition bằng AbortController.
  }, [params.page, params.size, params.category, params.sort, debouncedQuery]);

  return { data, meta, isLoading, params, setParams };
}
