package com.marketplace.ecommerce.platform.repository;

import com.marketplace.ecommerce.platform.entity.PlatformSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PlatformSettingRepository extends JpaRepository<PlatformSetting, UUID> {

    Optional<PlatformSetting> findByKey(String key);

    boolean existsByKey(String key);
}
