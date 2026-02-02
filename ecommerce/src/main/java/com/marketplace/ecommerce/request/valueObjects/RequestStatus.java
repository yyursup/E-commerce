package com.marketplace.ecommerce.request.valueObjects;

public enum RequestStatus {
    PENDING("PENDING", "Đang chờ duyệt"),
    APPROVED("APPROVED", "Đã được duyệt"),
    REJECTED("REJECTED", "Đã bị từ chối");

    private final String code;
    private final String description;

    RequestStatus(String code, String description) {
        this.code = code;
        this.description = description;
    }

    public String getCode() {
        return code;
    }

    public String getDescription() {
        return description;
    }

    public static RequestStatus fromCode(String code) {
        for (RequestStatus status : values()) {
            if (status.code.equals(code)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown SellerRequestStatus code: " + code);
    }
}
