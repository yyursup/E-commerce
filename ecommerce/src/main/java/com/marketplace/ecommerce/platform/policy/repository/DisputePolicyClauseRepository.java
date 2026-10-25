package com.marketplace.ecommerce.platform.policy.repository;

import com.marketplace.ecommerce.platform.policy.entity.DisputePolicyClauseEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DisputePolicyClauseRepository extends JpaRepository<DisputePolicyClauseEntity, UUID> {

    Optional<DisputePolicyClauseEntity> findByCode(String code);

    boolean existsByCode(String code);

    List<DisputePolicyClauseEntity> findByIsActiveTrueOrderByDisplayOrderAscCreatedAtAsc();

    List<DisputePolicyClauseEntity> findByIsActiveTrueAndCategoryIgnoreCaseOrderByDisplayOrderAscCreatedAtAsc(String category);

    List<DisputePolicyClauseEntity> findAllByOrderByDisplayOrderAscCreatedAtAsc();
}
