package com.marketplace.ecommerce.review.dto.request;

import com.marketplace.ecommerce.review.valueObjects.ReviewReportReason;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateReportReviewRequest {

    @NotNull
    private ReviewReportReason reason;

    @Size(max = 500)
    private String note;
}
