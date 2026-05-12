package com.marketplace.ecommerce.marketplace.entity;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.marketplace.valueObject.ExchangeType;
import com.marketplace.ecommerce.product.entity.ProductCategory;
import com.marketplace.ecommerce.product.entity.ProductImage;
import com.marketplace.ecommerce.product.valueObjects.ProductStatus;
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
@Table(name = "products_marketplace")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@Builder
public class ProductMarketplace {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private ProductCategory productCategory;

    @Column(name = "accpeted_offer_id")
    private UUID acceptedOfferId;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "item_condition", columnDefinition = "TEXT")
    private String condition;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "desired_description", columnDefinition = "TEXT")
    private String desiredDescription;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private ProductStatus status = ProductStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 50)
    private ExchangeType type;

    @OneToMany(mappedBy = "productMarketplace", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Set<OfferProduct> offers = new HashSet<>();

    @Builder.Default
    @OneToMany(mappedBy = "productMarketplace", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Set<ProductImageMarketplace> images = new HashSet<>();

    @Column(name = "deleted", nullable = false)
    private Boolean deleted = false;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
