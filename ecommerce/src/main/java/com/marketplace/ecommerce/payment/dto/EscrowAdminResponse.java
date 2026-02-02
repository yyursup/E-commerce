package com.marketplace.ecommerce.payment.dto;

import com.marketplace.ecommerce.payment.entity.Escrow;
import com.marketplace.ecommerce.payment.valueObjects.EscrowStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class EscrowAdminResponse {
    private UUID escrowId;
    private EscrowStatus status;
    private BigDecimal amount;

    private UUID orderId;
    private String orderNumber;
    private BigDecimal platformCommission;

    private UUID buyerWalletId;
    private UUID sellerWalletId;
    private UUID escrowWalletId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static EscrowAdminResponse from(Escrow e) {
        return EscrowAdminResponse.builder()
                .escrowId(e.getId())
                .status(e.getStatus())
                .amount(e.getAmount())
                .orderId(e.getOrder() != null ? e.getOrder().getId() : null)
                .orderNumber(e.getOrder() != null ? e.getOrder().getOrderNumber() : null)
                .platformCommission(e.getOrder() != null ? e.getOrder().getPlatformCommission() : null)
                .buyerWalletId(e.getBuyerWallet() != null ? e.getBuyerWallet().getId() : null)
                .sellerWalletId(e.getSellerWallet() != null ? e.getSellerWallet().getId() : null)
                .escrowWalletId(e.getEscrowWallet() != null ? e.getEscrowWallet().getId() : null)
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }

}
