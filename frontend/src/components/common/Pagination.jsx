/** Mục đích: Pagination wrapper. Props: page,totalPages,onChange,size/pageSizes. */
import { Pagination as MuiPagination, Stack } from '@mui/material';
export default function Pagination({ page = 0, totalPages = 0, onChange }){ return <Stack alignItems='center' p={2}><MuiPagination count={totalPages} page={page + 1} onChange={(_,value)=>onChange?.(value-1)} /></Stack>; }
