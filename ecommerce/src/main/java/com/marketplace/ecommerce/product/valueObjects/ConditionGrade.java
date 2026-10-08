package com.marketplace.ecommerce.product.valueObjects;

public enum ConditionGrade {
    GRADE_NEW("Mới 100% Nguyên Seal"),
    GRADE_OPEN_BOX("Hàng Trưng Bày / Open Box"),
    GRADE_LIKE_NEW("Like New 99%"),
    GRADE_FAIR("Cũ Dùng Tốt 90-95%"),
    GRADE_AS_IS("Hàng Xác / Linh Kiện - Bán Đứt");

    private final String description;

    ConditionGrade(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
