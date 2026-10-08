package com.marketplace.ecommerce.order.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminResolveReturnDisputeRequest {

    public enum AdminReturnDecision {
        APPROVE_RETURN,
        REJECT_RETURN
    }

    @NotNull(message = "Quyết định xử lý không được để trống")
    private AdminReturnDecision decision;

    @Size(max = 1000, message = "Ghi chú của quản trị viên tối đa 1000 ký tự")
    private String adminNote;
}
