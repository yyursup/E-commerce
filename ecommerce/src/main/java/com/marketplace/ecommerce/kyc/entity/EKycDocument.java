package com.marketplace.ecommerce.kyc.entity;

import com.marketplace.ecommerce.common.BaseEntity;
import com.marketplace.ecommerce.kyc.valueObjects.KycDocumentType;
import jakarta.persistence.*;
import lombok.Data;

import java.util.UUID;

@Data
@Entity
@Table(name = "ekyc_document")

public class EKycDocument extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(nullable = false)
    private UUID sessionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private KycDocumentType type;

//    @Column(nullable = false)
//    private UUID fileId;

    private String fileHash;

}
