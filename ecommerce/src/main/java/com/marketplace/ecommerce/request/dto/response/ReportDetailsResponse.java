package com.marketplace.ecommerce.request.dto.response;

import com.marketplace.ecommerce.payment.dto.EscrowAdminResponse;
import com.marketplace.ecommerce.request.valueObjects.DisputeSellerAction;
import com.marketplace.ecommerce.request.valueObjects.ReportStage;
import com.marketplace.ecommerce.request.valueObjects.ResolutionType;
import com.marketplace.ecommerce.request.valueObjects.TargetType;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportDetailsResponse {
    private UUID id;
    private UUID requestId;
    private TargetType targetType;
    private UUID targetId;
    private String evidenceUrl;
    private String moderatorNote;
    private String targetName;
    private String targetInfo;
    private ReportStage stage;
    private LocalDateTime sellerResponseDeadline;
    private String sellerResponse;
    private String sellerEvidenceUrl;
    private DisputeSellerAction sellerAction;
    private LocalDateTime escalatedAt;
    private String escalationReason;
    private ResolutionType resolutionType;
    private String status;
    private String description;
    private String response;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;

    /**
     * Thông tin Ký Quỹ Escrow tích hợp đối với Báo Cáo Vi Phạm Đơn Hàng (TargetType = ORDER)
     */
    private EscrowAdminResponse escrow;
}
