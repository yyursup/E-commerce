package com.marketplace.ecommerce.marketplace.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "offer_images")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@Builder
public class OfferProductImage {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "offer_id", nullable = false)
    private OfferProduct offerProduct;

    @Column(name = "image_url", nullable = false, length = 255)
    private String imageUrl;

    @Column(name = "is_thumbnail", nullable = false)
    private Boolean isThumbnail = false;

    @Column(name = "display_order")
    private Integer displayOrder = 0; // Thứ tự hiển thị

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
