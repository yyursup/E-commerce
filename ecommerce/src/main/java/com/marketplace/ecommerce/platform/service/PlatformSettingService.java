package com.marketplace.ecommerce.platform.service;

import com.marketplace.ecommerce.platform.dto.PlatformSettingResponse;
import com.marketplace.ecommerce.platform.entity.PlatformSetting;

import java.math.BigDecimal;

public interface PlatformSettingService {


    PlatformSettingResponse getPlatformSetting();

    PlatformSettingResponse setCommissionRate(BigDecimal rate);

    String getValue(String key);

    PlatformSetting setValue(String key, String value);

    BigDecimal getCommissionRate();
}
