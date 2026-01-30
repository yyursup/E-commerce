package com.marketplace.ecommerce.review.dto.request;

import com.marketplace.ecommerce.review.valueObjects.ReviewReportReason;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReportReviewRequest {

    @NotNull
    private ReviewReportReason reason;

    @Size(max = 500)
    private String note;
}
