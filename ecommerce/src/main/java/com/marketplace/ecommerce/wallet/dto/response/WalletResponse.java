package com.marketplace.ecommerce.wallet.dto.response;

import com.marketplace.ecommerce.wallet.entity.Wallet;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalletResponse {
    private UUID walletId;
    private UUID userId;

    private String currency;

    private BigDecimal availableBalance;
    private BigDecimal heldBalance;

    // tiện cho FE
    private BigDecimal totalBalance;


    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static WalletResponse from(Wallet wallet) {
        if (wallet == null) return null;

        BigDecimal av = wallet.getAvailableBalance() == null ? BigDecimal.ZERO : wallet.getAvailableBalance();
        BigDecimal hd = wallet.getLockedBalance() == null ? BigDecimal.ZERO : wallet.getLockedBalance();

        return WalletResponse.builder()
                .walletId(wallet.getId())
                .userId(wallet.getUser().getId())
                .currency(wallet.getCurrency())
                .availableBalance(av)
                .heldBalance(hd)
                .totalBalance(av.add(hd))
                .createdAt(wallet.getCreatedAt())
                .updatedAt(wallet.getUpdatedAt())
                .build();
    }

}
