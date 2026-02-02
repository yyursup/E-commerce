package com.marketplace.ecommerce.wallet.entity;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.wallet.valueObjects.WalletType;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "wallets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@Builder
public class Wallet {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", columnDefinition = "uuid")
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "wallet_type", nullable = false, length = 20)
    @Builder.Default
    private WalletType walletType = WalletType.USER;

    @Column(name = "currency", nullable = false, length = 10)
    @Builder.Default
    private String currency = "VND";

    @Column(name = "available_balance", nullable = false, precision = 19, scale = 2)
    @Builder.Default
    private BigDecimal availableBalance = BigDecimal.ZERO;

    @Column(name = "locked_balance", nullable = false, precision = 19, scale = 2)
    @Builder.Default
    private BigDecimal lockedBalance = BigDecimal.ZERO;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public BigDecimal total() {
        return (availableBalance == null ? BigDecimal.ZERO : availableBalance)
                .add(lockedBalance == null ? BigDecimal.ZERO : lockedBalance);
    }

    public void addAvailable(BigDecimal amt) {
        if (amt == null) return;
        this.availableBalance = this.availableBalance.add(amt);
    }

    public void subAvailable(BigDecimal amt) {
        if (amt == null) return;
        this.availableBalance = this.availableBalance.subtract(amt);
    }

    public void addLocked(BigDecimal amt) {
        if (amt == null) return;
        this.lockedBalance = this.lockedBalance.add(amt);
    }

    public void subLocked(BigDecimal amt) {
        if (amt == null) return;
        this.lockedBalance = this.lockedBalance.subtract(amt);
    }
}
