package com.marketplace.ecommerce.shop.dto.response;

import com.marketplace.ecommerce.shop.entity.ShopEscrowFund;
import com.marketplace.ecommerce.shop.valueObjects.EscrowFundStatus;
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
public class ShopEscrowFundResponse {

    private UUID id;
    private UUID shopId;
    private String shopName;
    private BigDecimal balance;
    private BigDecimal committedAmount;
    private Integer currentTrustLevel;
    private String tierName;
    private Boolean isDeficit;
    private BigDecimal deficitAmount;
    private LocalDateTime deficitDeadline;
    private EscrowFundStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ShopEscrowFundResponse from(ShopEscrowFund fund) {
        return from(fund, null);
    }

    public static ShopEscrowFundResponse from(ShopEscrowFund fund, String tierName) {
        if (fund == null) return null;
        return ShopEscrowFundResponse.builder()
                .id(fund.getId())
                .shopId(fund.getShop() != null ? fund.getShop().getId() : null)
                .shopName(fund.getShop() != null ? fund.getShop().getName() : null)
                .balance(fund.getBalance())
                .committedAmount(fund.getCommittedAmount())
                .currentTrustLevel(fund.getCurrentTrustLevel())
                .tierName(tierName)
                .isDeficit(fund.getIsDeficit())
                .deficitAmount(fund.getDeficitAmount())
                .deficitDeadline(fund.getDeficitDeadline())
                .status(fund.getStatus())
                .createdAt(fund.getCreatedAt())
                .updatedAt(fund.getUpdatedAt())
                .build();
    }
}
