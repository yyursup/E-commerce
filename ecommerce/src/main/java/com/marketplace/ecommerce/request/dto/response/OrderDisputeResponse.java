package com.marketplace.ecommerce.request.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderDisputeResponse {
    private boolean hasActiveDispute;
    private String disputeStatus; // NONE, REPORT_PENDING, REPORT_APPROVED, APPEAL_PENDING, APPEAL_APPROVED, REFUNDED
    private String disputeReason;
}
