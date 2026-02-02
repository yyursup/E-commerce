package com.marketplace.ecommerce.payment.valueObjects;

public enum EscrowStatus {
    HELD,                 // đang giữ tiền
    PARTIALLY_RELEASED,   // đã release một phần
    RELEASED,             // đã release hết
    PARTIALLY_REFUNDED,   // đã refund một phần
    REFUNDED,             // đã refund hết
    DISPUTED,             // tranh chấp (lock)
    CANCELED              // hủy/đóng escrow (tuỳ flow)
}
