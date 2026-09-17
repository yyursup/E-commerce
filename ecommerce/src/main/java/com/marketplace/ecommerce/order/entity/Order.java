package com.marketplace.ecommerce.order.entity;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.shop.entity.Shop;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", columnDefinition = "uuid")
    private UUID id;

    @Column(name = "order_number", nullable = false, unique = true, length = 50)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_id", nullable = false)
    private Shop shop;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private OrderStatus status = OrderStatus.PENDING;

    @Column(name = "shipping_name", nullable = false, length = 255)
    private String shippingName;

    @Column(name = "shipping_phone", nullable = false, length = 20)
    private String shippingPhone;

    @Column(name = "shipping_address", nullable = false, length = 500)
    private String shippingAddress;

    @Column(name = "shipping_city", length = 100)
    private String shippingCity;

    @Column(name = "shipping_district", length = 100)
    private String shippingDistrict;

    @Column(name = "shipping_ward", length = 100)
    private String shippingWard;

    @Column(name = "shipping_district_id")
    private Integer shippingDistrictId; // Mã quận/huyện GHN

    @Column(name = "shipping_ward_code", length = 20)
    private String shippingWardCode; // Mã phường/xã GHN

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voucher_id")
    private com.marketplace.ecommerce.voucher.entity.Voucher voucher;

    @Column(name = "voucher_code", length = 50)
    private String voucherCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_voucher_id")
    private com.marketplace.ecommerce.voucher.entity.Voucher shopVoucher;

    @Column(name = "shop_voucher_code", length = 50)
    private String shopVoucherCode;

    @Builder.Default
    @Column(name = "shop_discount_amount", precision = 12, scale = 2)
    private BigDecimal shopDiscountAmount = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "platform_voucher_id")
    private com.marketplace.ecommerce.voucher.entity.Voucher platformVoucher;

    @Column(name = "platform_voucher_code", length = 50)
    private String platformVoucherCode;

    @Builder.Default
    @Column(name = "platform_discount_amount", precision = 12, scale = 2)
    private BigDecimal platformDiscountAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "discount_amount", precision = 12, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "subtotal", nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "shipping_fee", nullable = false, precision = 12, scale = 2)
    private BigDecimal shippingFee = BigDecimal.ZERO;

    @Column(name = "total", nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    @Column(name = "ghn_order_code", length = 100)
    private String ghnOrderCode;

    @Column(name = "platform_commission", precision = 12, scale = 2)
    private BigDecimal platformCommission = BigDecimal.ZERO;

    @Column(name = "commission_rate")
    private Double commissionRate;

    @Column(name = "received_by_buyer", nullable = false)
    private boolean receivedByBuyer = false;

    @Column(name = "received_at")
    private LocalDateTime receivedAt;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Set<OrderItem> items = new HashSet<>();

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "stock_deducted")
    private boolean stockDeducted;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public void calculateTotal() {
        if (subtotal == null) {
            subtotal = BigDecimal.ZERO;
        }
        if (shippingFee == null) {
            shippingFee = BigDecimal.ZERO;
        }
        BigDecimal sDiscount = shopDiscountAmount != null ? shopDiscountAmount : BigDecimal.ZERO;
        BigDecimal pDiscount = platformDiscountAmount != null ? platformDiscountAmount : BigDecimal.ZERO;
        BigDecimal sumVoucherDiscount = sDiscount.add(pDiscount);

        if (sumVoucherDiscount.compareTo(BigDecimal.ZERO) > 0) {
            discountAmount = sumVoucherDiscount;
        } else if (discountAmount == null) {
            discountAmount = BigDecimal.ZERO;
        }

        BigDecimal rawTotal = subtotal.add(shippingFee).subtract(discountAmount);
        total = rawTotal.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : rawTotal;
    }
}
