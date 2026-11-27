import Pagination from '../order/Pagination'

// page bắt đầu từ 0 (Spring Pageable); Pagination hiển thị từ 1
export default function AdminEscrowPagination({ isDark, page, totalPages, totalItems, pageSize, onPageChange }) {
  return (
    <Pagination
      currentPage={page + 1}
      totalPages={totalPages}
      totalItems={totalItems}
      pageSize={pageSize}
      onPageChange={(p) => onPageChange(p - 1)}
      isDark={isDark}
    />
  )
}
