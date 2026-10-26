package com.marketplace.ecommerce.request.valueObjects;

import lombok.Getter;

@Getter
public enum ReportStage {
    DIRECT_NEGOTIATION("DIRECT_NEGOTIATION", "Thương lượng 1:1 giữa Khách hàng và Người bán"),
    RETURN_IN_PROGRESS("RETURN_IN_PROGRESS", "Đang trong tiến trình đổi trả hàng"),
    RESOLVED("RESOLVED", "Đã thống nhất giải quyết hoàn tất"),
    CANCELLED("CANCELLED", "Khách hàng đã hủy khiếu nại"),
    ESCALATED_TO_ADMIN("ESCALATED_TO_ADMIN", "Đã chuyển lên Quản trị viên can thiệp"),
    CLOSED("CLOSED", "Đã đóng sau phán quyết của Quản trị viên");

    private final String code;
    private final String description;

    ReportStage(String code, String description) {
        this.code = code;
        this.description = description;
    }

}
