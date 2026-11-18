package com.marketplace.ecommerce.payment.valueObjects;

public enum TransactionType {
    DEPOSIT,
    PAYMENT,
    REFUND,
    TRANSFER,
    WITHDRAWAL,
    COMMISSION,
    RELEASE,
    HOLD,
    COMPENSATION,
    /** Phí vận chuyển trả ra cho GHN (tiền ship khách đã trả hoặc cước trích từ quỹ ký quỹ shop). Không phải doanh thu sàn. */
    SHIPPING_FEE
}
