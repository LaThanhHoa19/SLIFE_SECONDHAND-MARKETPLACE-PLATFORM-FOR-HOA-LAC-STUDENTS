import AdminDataTable from './AdminDataTable';

/**
 * ReusableTable — wrapper cho các bảng admin.
 * Mục tiêu: các trang admin có thể tái sử dụng 1 component bảng dùng chung.
 */
export default function ReusableTable(props) {
    return <AdminDataTable {...props} />;
}

