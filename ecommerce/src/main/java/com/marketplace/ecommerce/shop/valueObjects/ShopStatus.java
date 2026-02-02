package com.marketplace.ecommerce.shop.valueObjects;

public enum ShopStatus {
    PENDING("PENDING", "Đang chờ"),
    ACTIVE("ACTIVE", "Hoạt động"),
    INACTIVE("INACTIVE", "Không hoạt động"),
    BANNED("BANNED", "Bị cấm");

    private final String code;
    private final String description;

    ShopStatus(String code, String description) {
        this.code = code;
        this.description = description;
    }

    public String getCode() {
        return code;
    }

    public String getDescription() {
        return description;
    }

    public static ShopStatus fromCode(String code) {
        for (ShopStatus status : values()) {
            if (status.code.equals(code)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown ShopStatus code: " + code);
    }
}
