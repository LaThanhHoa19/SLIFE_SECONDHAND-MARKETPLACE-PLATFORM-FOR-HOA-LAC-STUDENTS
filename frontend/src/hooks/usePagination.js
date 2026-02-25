/** Mục đích: quản lý page/size/tổng trang cho list endpoint phân trang. */
import { useState } from 'react';
export default function usePagination(initialSize = 10){ const [page,setPage]=useState(0); const [size,setSize]=useState(initialSize); const [totalPages,setTotalPages]=useState(0); return {page,size,totalPages,setPage,setSize,setTotalPages}; }
