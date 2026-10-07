package com.marketplace.ecommerce.product.valueObjects;

public enum WarrantyType {
    OFFICIAL("Bảo Hành Chính Hãng"),
    SHOP("Bảo Hành Tại Cửa Hàng"),
    NONE("Không Bảo Hành / Bao Test");

    private final String description;

    WarrantyType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
