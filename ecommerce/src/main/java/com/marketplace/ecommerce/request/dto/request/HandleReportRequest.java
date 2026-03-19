package com.marketplace.ecommerce.request.dto.request;

import com.marketplace.ecommerce.request.valueObjects.ReportDecision;
import jakarta.validation.constraints.NotNull;
import lombok.Data;


@Data
public class HandleReportRequest {
    @NotNull
    private ReportDecision decision;

    private String note;
}
