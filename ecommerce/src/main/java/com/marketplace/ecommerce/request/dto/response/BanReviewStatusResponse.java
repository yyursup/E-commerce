package com.marketplace.ecommerce.request.dto.response;

import com.marketplace.ecommerce.auth.valueObjects.AccountStatus;
import com.marketplace.ecommerce.auth.valueObjects.DisciplineLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BanReviewStatusResponse {
    private UUID accountId;
    private String username;
    private String email;
    private AccountStatus status;
    private DisciplineLevel disciplineLevel;
    private Integer violationCount;
    private boolean canSubmit;
    private String blockReason; // "PENDING_REVIEW", "PERMANENTLY_BLOCKED_REJECTED", "NOT_BANNED", null
    private CreateRequestResponse latestAppeal;
    private List<CreateRequestResponse> appealHistory;
}
