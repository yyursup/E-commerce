package com.marketplace.ecommerce.voucher.entity;

import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.voucher.valueObjects.VoucherScope;
import com.marketplace.ecommerce.voucher.valueObjects.VoucherStatus;
import com.marketplace.ecommerce.voucher.valueObjects.VoucherType;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "vouchers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Voucher {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", columnDefinition = "uuid")
    private UUID id;

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "voucher_type", nullable = false, length = 30)
    private VoucherType voucherType;

    @Column(name = "discount_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal discountValue;

    @Column(name = "max_discount_amount", precision = 12, scale = 2)
    private BigDecimal maxDiscountAmount;

    @Column(name = "min_order_value", precision = 12, scale = 2)
    private BigDecimal minOrderValue;

    @Column(name = "usage_limit")
    private Integer usageLimit;

    @Builder.Default
    @Column(name = "used_count", nullable = false)
    private Integer usedCount = 0;

    @Builder.Default
    @Column(name = "user_usage_limit", nullable = false)
    private Integer userUsageLimit = 1;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private VoucherStatus status = VoucherStatus.ACTIVE;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "scope", nullable = false, length = 30)
    private VoucherScope scope = VoucherScope.PLATFORM;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_id")
    private Shop shop;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public boolean isCurrentlyActive() {
        if (status != VoucherStatus.ACTIVE) {
            return false;
        }
        LocalDateTime now = LocalDateTime.now();
        if (startDate != null && now.isBefore(startDate)) {
            return false;
        }
        if (endDate != null && now.isAfter(endDate)) {
            return false;
        }
        if (usageLimit != null && usedCount >= usageLimit) {
            return false;
        }
        return true;
    }
}
