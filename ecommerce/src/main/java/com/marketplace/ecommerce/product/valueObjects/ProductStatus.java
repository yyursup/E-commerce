package com.marketplace.ecommerce.product.valueObjects;

public enum ProductStatus {
    DRAFT,              // Nháp - chưa publish
    PENDING_APPROVAL,   // Đang chờ Admin xét duyệt
    REJECTED,           // Bị Admin từ chối phê duyệt
    PUBLISHED,          // Đã publish - hiển thị công khai
    ARCHIVED,
    DELETED,
    INACTIVE            // Đã lưu trữ - không hiển thị
}
