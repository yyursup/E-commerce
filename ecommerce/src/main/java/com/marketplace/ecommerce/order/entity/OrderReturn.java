package com.marketplace.ecommerce.order.entity;

import com.marketplace.ecommerce.order.valueObjects.ReturnConditionStatus;
import com.marketplace.ecommerce.order.valueObjects.ReturnStatus;
import com.marketplace.ecommerce.request.entity.Report;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "order_returns", indexes = {
        @Index(name = "idx_order_return_order_id", columnList = "order_id", unique = true),
        @Index(name = "idx_order_return_report_id", columnList = "report_id"),
        @Index(name = "idx_order_return_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class OrderReturn {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", columnDefinition = "uuid")
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "report_id", nullable = false)
    private Report report;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private ReturnStatus status;

    @Column(name = "return_address", nullable = false, length = 500)
    private String returnAddress;

    @Column(name = "return_recipient_name", nullable = false, length = 100)
    private String returnRecipientName;

    @Column(name = "return_recipient_phone", nullable = false, length = 20)
    private String returnRecipientPhone;

    @Column(name = "return_tracking_code", length = 100)
    private String returnTrackingCode;

    @Column(name = "carrier_name", length = 100)
    private String carrierName;

    @Column(name = "shipping_fee", precision = 12, scale = 2)
    private BigDecimal shippingFee;

    @Column(name = "buyer_evidence_urls", columnDefinition = "TEXT")
    private String buyerEvidenceUrls;

    @Column(name = "buyer_shipped_at")
    private LocalDateTime buyerShippedAt;

    @Column(name = "buyer_shipment_deadline", nullable = false)
    private LocalDateTime buyerShipmentDeadline;

    @Column(name = "seller_received_at")
    private LocalDateTime sellerReceivedAt;

    @Column(name = "seller_inspection_deadline")
    private LocalDateTime sellerInspectionDeadline;

    @Enumerated(EnumType.STRING)
    @Column(name = "condition_status", length = 30)
    private ReturnConditionStatus conditionStatus;

    @Column(name = "condition_note", columnDefinition = "TEXT")
    private String conditionNote;

    @Column(name = "seller_evidence_urls", columnDefinition = "TEXT")
    private String sellerEvidenceUrls;

    @Builder.Default
    @Column(name = "is_restocked", nullable = false)
    private Boolean isRestocked = false;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
