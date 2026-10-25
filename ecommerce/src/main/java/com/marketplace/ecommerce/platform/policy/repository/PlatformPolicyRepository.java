package com.marketplace.ecommerce.platform.policy.repository;

import com.marketplace.ecommerce.platform.policy.entity.PlatformPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PlatformPolicyRepository extends JpaRepository<PlatformPolicy, UUID> {

    Optional<PlatformPolicy> findByPolicyKey(String policyKey);

    boolean existsByPolicyKey(String policyKey);

    List<PlatformPolicy> findByIsActiveTrueOrderByDisplayOrderAscCreatedAtDesc();

    List<PlatformPolicy> findByIsActiveTrueAndTargetAudienceInOrderByDisplayOrderAscCreatedAtDesc(List<String> targetAudiences);

    List<PlatformPolicy> findByIsActiveTrueAndCategoryIgnoreCaseOrderByDisplayOrderAscCreatedAtDesc(String category);

    List<PlatformPolicy> findAllByOrderByDisplayOrderAscCreatedAtDesc();
}
