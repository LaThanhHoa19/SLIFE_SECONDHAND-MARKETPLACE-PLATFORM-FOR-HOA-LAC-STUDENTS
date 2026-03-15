import {
    Box,
    CircularProgress,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import PropTypes from 'prop-types';

/**
 * AdminDataTable — bảng dùng chung cho trang admin .
 * Props:
 *   columns      – [{ id, label, width?, align?, render?(row) }]
 *   rows         – mảng dữ liệu
 *   getRowId     – (row, index) => key (default: row.id ?? index)
 *   isLoading    – boolean
 *   emptyMessage – chuỗi khi không có dữ liệu
 */
export default function AdminDataTable({
                                           columns,
                                           rows,
                                           getRowId,
                                           isLoading = false,
                                           emptyMessage = 'Không có dữ liệu.',
                                       }) {
    const safeRows = rows || [];
    const resolveRowId = getRowId || ((row, index) => row?.id ?? index);

    return (
        <Paper
            sx={{
                width: '100%',
                overflow: 'hidden',
                borderRadius: 3,
                border: '1px solid #e5e7eb',
                boxShadow: '0 16px 40px rgba(15,23,42,0.06)',
            }}
        >
            {isLoading ? (
                <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    py={6}
                >
                    <CircularProgress />
                </Box>
            ) : (
                <Box sx={{ width: '100%', overflowX: 'auto' }}>
                    <Table
                        size="small"
                        sx={{
                            minWidth: 650,
                            '& thead th': {
                                fontSize: 12,
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: 0.4,
                                color: '#6b7280',
                                backgroundColor: '#f9fafb',
                                borderBottom: '1px solid #e5e7eb',
                            },
                            '& tbody td': {
                                fontSize: 13,
                                borderBottom: '1px solid #f3f4f6',
                            },
                        }}
                    >
                        <TableHead>
                            <TableRow>
                                {columns.map((column) => (
                                    <TableCell
                                        key={column.id}
                                        align={column.align || 'left'}
                                        sx={column.width ? { width: column.width } : undefined}
                                    >
                                        {column.label}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {safeRows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length} align="center">
                                        <Typography variant="body2" color="text.secondary">
                                            {emptyMessage}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                safeRows.map((row, index) => (
                                    <TableRow
                                        key={resolveRowId(row, index)}
                                        hover
                                        sx={{
                                            '&:nth-of-type(odd)': {
                                                backgroundColor: '#fafafa',
                                            },
                                            '&:last-of-type td': {
                                                borderBottom: 'none',
                                            },
                                        }}
                                    >
                                        {columns.map((column) => {
                                            const value = row[column.id];
                                            const content = column.render ? column.render(row) : value;
                                            return (
                                                <TableCell key={column.id} align={column.align || 'left'}>
                                                    {content}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Box>
            )}
        </Paper>
    );
}

AdminDataTable.propTypes = {
    columns: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            label: PropTypes.node.isRequired,
            width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            align: PropTypes.oneOf(['left', 'right', 'center']),
            render: PropTypes.func,
        })
    ).isRequired,
    rows: PropTypes.array,
    getRowId: PropTypes.func,
    isLoading: PropTypes.bool,
    emptyMessage: PropTypes.string,
};

