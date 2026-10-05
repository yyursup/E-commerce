package com.marketplace.ecommerce.shop.service;

import com.marketplace.ecommerce.shop.dto.request.TrustLevelConfigRequest;
import com.marketplace.ecommerce.shop.dto.response.TrustLevelConfigResponse;
import com.marketplace.ecommerce.shop.entity.TrustLevelConfig;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface TrustLevelConfigService {

    List<TrustLevelConfigResponse> getAllConfigs();

    List<TrustLevelConfigResponse> getActiveConfigs();

    TrustLevelConfigResponse updateConfig(Integer starLevel, TrustLevelConfigRequest request, UUID adminId);

    TrustLevelConfig getConfigByStarLevel(Integer starLevel);

    int resolveTrustLevel(BigDecimal depositAmount);

    List<TrustLevelConfigResponse> resetDefaultConfigs(UUID adminId);
}
