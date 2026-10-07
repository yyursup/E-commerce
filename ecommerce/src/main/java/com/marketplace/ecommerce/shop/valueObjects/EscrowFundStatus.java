package com.marketplace.ecommerce.shop.valueObjects;

public enum EscrowFundStatus {
    PENDING_DEPOSIT, // Quỹ chờ nạp cọc ban đầu để kích hoạt gian hàng
    ACTIVE,          // Quỹ hoạt động bình thường, số dư đảm bảo
    DEFICIT,         // Quỹ bị thiếu hụt sau khi trích đền bù, đang chờ nạp bù trong 72h
    LOCKED,          // Quỹ bị tạm khóa (gian hàng bị đình chỉ)
    REFUND_PENDING,  // Đang làm thủ tục hoàn trả quỹ khi đóng gian hàng
    REFUNDED         // Đã hoàn trả tiền quỹ và hoàn tất đóng gian hàng
}
