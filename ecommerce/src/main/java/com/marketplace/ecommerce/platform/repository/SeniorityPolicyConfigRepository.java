package com.marketplace.ecommerce.platform.repository;

import com.marketplace.ecommerce.platform.entity.SeniorityPolicyConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SeniorityPolicyConfigRepository extends JpaRepository<SeniorityPolicyConfig, UUID> {

    List<SeniorityPolicyConfig> findAllByOrderByMinMonthsAsc();

    List<SeniorityPolicyConfig> findAllByIsActiveTrueOrderByMinMonthsDesc();

    Optional<SeniorityPolicyConfig> findByMinMonths(Integer minMonths);
}
