package com.marketplace.ecommerce.shop.valueObjects;

public enum EscrowFundTransactionType {
    INITIAL_DEPOSIT,         // Nạp tiền ký quỹ ban đầu khi đăng ký mở gian hàng
    TOPUP_DEPOSIT,           // Nạp thêm / Nạp bù tiền ký quỹ duy trì cấp độ uy tín
    COMPENSATION_DEDUCTION,  // Trích tiền ký quỹ đền bù cho Buyer do lỗi gian hàng / vi phạm
    WITHDRAWAL_ON_CLOSE,     // Hoàn trả toàn bộ tiền ký quỹ khi đóng gian hàng
    ADMIN_ADJUSTMENT         // Điều chỉnh hạn mức / số dư ký quỹ bởi Quản trị viên sàn
}
