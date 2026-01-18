package com.marketplace.ecommerce.auth.entity;


import com.marketplace.ecommerce.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "roles")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Role extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "role_name", unique = true, length = 50)
    private String roleName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
}
