package com.marketplace.ecommerce.request.valueObjects;

public enum DisputeSellerAction {
    ACCEPT_REFUND("ACCEPT_REFUND", "Đồng ý hoàn tiền 100% cho người mua"),
    ACCEPT_RETURN("ACCEPT_RETURN", "Đồng ý nhận hàng đổi trả từ người mua"),
    REJECT_AND_ESCALATE("REJECT_AND_ESCALATE", "Từ chối và yêu cầu Quản trị viên can thiệp");

    private final String code;
    private final String description;

    DisputeSellerAction(String code, String description) {
        this.code = code;
        this.description = description;
    }

    public String getCode() {
        return code;
    }

    public String getDescription() {
        return description;
    }
}
