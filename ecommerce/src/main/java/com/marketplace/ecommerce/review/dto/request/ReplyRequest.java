package com.marketplace.ecommerce.review.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class ReplyRequest {
    @NotNull(message = "Thiếu mã đánh giá")
    private UUID reviewId;
    @NotNull(message = "Vui lòng nhập nội dung phản hồi")
    private String reply;
}
