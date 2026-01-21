package com.marketplace.ecommerce.kyc.entity;

import com.marketplace.ecommerce.common.BaseEntity;
import com.marketplace.ecommerce.kyc.valueObjects.KycStatus;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;
@Data
@Entity
@Table(name = "sessions")
public class EKycSession extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(nullable = false)
    private UUID accountId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private KycStatus status = KycStatus.DRAFT;

    private UUID frontFileId;
    private UUID backFileId;
    private UUID selfieFileId;

    private String frontHash;
    private String backHash;
    private String selfieHash;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "JSONB")
    private String providerTrace;
}
