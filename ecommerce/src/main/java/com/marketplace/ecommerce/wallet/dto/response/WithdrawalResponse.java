package com.marketplace.ecommerce.wallet.dto.response;

import com.marketplace.ecommerce.wallet.entity.WithdrawalRequest;
import com.marketplace.ecommerce.wallet.valueObjects.WithdrawalStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WithdrawalResponse {

    private UUID id;
    private UUID userId;
    private String userFullName;
    private String userEmail;
    private String userPhone;

    private BigDecimal amount;
    private String bankName;
    private String bankAccountNumber;
    private String bankAccountName;

    private WithdrawalStatus status;
    private String txRef;
    private String note;
    private String adminNote;

    private UUID reviewedBy;
    private LocalDateTime reviewedAt;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static WithdrawalResponse from(WithdrawalRequest req) {
        if (req == null) return null;
        return WithdrawalResponse.builder()
                .id(req.getId())
                .userId(req.getUser() != null ? req.getUser().getId() : null)
                .userFullName(req.getUser() != null ? req.getUser().getFullName() : null)
                .userEmail(req.getUser() != null ? req.getUser().getEmail() : null)
                .userPhone(req.getUser() != null ? req.getUser().getPhoneNumber() : null)
                .amount(req.getAmount())
                .bankName(req.getBankName())
                .bankAccountNumber(req.getBankAccountNumber())
                .bankAccountName(req.getBankAccountName())
                .status(req.getStatus())
                .txRef(req.getTxRef())
                .note(req.getNote())
                .adminNote(req.getAdminNote())
                .reviewedBy(req.getReviewedBy())
                .reviewedAt(req.getReviewedAt())
                .createdAt(req.getCreatedAt())
                .updatedAt(req.getUpdatedAt())
                .build();
    }
}

