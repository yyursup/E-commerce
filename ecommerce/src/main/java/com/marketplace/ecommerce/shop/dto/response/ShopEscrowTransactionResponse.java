package com.marketplace.ecommerce.shop.dto.response;

import com.marketplace.ecommerce.shop.entity.ShopEscrowTransaction;
import com.marketplace.ecommerce.shop.valueObjects.EscrowFundTransactionType;
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
public class ShopEscrowTransactionResponse {

    private UUID id;
    private UUID fundId;
    private EscrowFundTransactionType transactionType;
    private BigDecimal amount;
    private BigDecimal balanceBefore;
    private BigDecimal balanceAfter;
    private UUID orderId;
    private UUID reportId;
    private String referenceCode;
    private String note;
    private LocalDateTime createdAt;

    public static ShopEscrowTransactionResponse from(ShopEscrowTransaction tx) {
        if (tx == null) return null;
        return ShopEscrowTransactionResponse.builder()
                .id(tx.getId())
                .fundId(tx.getFund() != null ? tx.getFund().getId() : null)
                .transactionType(tx.getTransactionType())
                .amount(tx.getAmount())
                .balanceBefore(tx.getBalanceBefore())
                .balanceAfter(tx.getBalanceAfter())
                .orderId(tx.getOrderId())
                .reportId(tx.getReportId())
                .referenceCode(tx.getReferenceCode())
                .note(tx.getNote())
                .createdAt(tx.getCreatedAt())
                .build();
    }
}
