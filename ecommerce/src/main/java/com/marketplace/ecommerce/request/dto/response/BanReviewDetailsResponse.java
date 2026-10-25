package com.marketplace.ecommerce.request.dto.response;

import com.marketplace.ecommerce.auth.valueObjects.AccountStatus;
import com.marketplace.ecommerce.auth.valueObjects.DisciplineLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BanReviewDetailsResponse {
    private UUID accountId;
    private String username;
    private String email;
    private AccountStatus currentAccountStatus;
    private DisciplineLevel currentDisciplineLevel;
    private Integer currentViolationCount;
    private Integer oldViolationCount;
    private Integer newViolationCount;
    private String description;
    private String coverImageUrl;
    private List<CreateRequestResponse> priorAppeals;
    private List<ViolationHistoryItemResponse> violationHistory;
}
