package com.marketplace.ecommerce.payment.valueObjects;

public enum PaymentMethod {
    VNPAY,
    WALLET,
    /** Đã ngừng hỗ trợ: chỉ giữ để đọc các đơn COD cũ trong database, không cho tạo mới. */
    COD
}
