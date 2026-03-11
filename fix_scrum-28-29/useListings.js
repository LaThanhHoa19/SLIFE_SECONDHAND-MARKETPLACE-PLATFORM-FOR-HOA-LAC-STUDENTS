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
        setData(params.page === 0 ? res.content : [...data, ...res.content]);
        setMeta({ totalPages: res.totalPages, totalElements: res.totalElements });
      } finally { setLoading(false); }
    };
    run();
    // TODO: xử lý race-condition bằng AbortController.
  }, [params.page, params.size, params.category, params.sort, debouncedQuery]);

  return { data, meta, isLoading, params, setParams };
}
