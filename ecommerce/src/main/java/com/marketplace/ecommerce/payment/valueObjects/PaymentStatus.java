package com.marketplace.ecommerce.payment.valueObjects;

public enum PaymentStatus {
    INIT,        // Khởi tạo, chưa redirect
    PENDING,     // COD chờ thanh toán
    SUCCESS,     // Thanh toán thành công
    FAILED,      // Thanh toán thất bại
    CANCELLED    // Hủy
}
