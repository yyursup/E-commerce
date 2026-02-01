package com.marketplace.ecommerce.platform.service.impl;

import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.platform.constant.PlatformConstant;
import com.marketplace.ecommerce.platform.dto.PlatformSettingResponse;
import com.marketplace.ecommerce.platform.entity.PlatformSetting;
import com.marketplace.ecommerce.platform.repository.PlatformSettingRepository;
import com.marketplace.ecommerce.platform.service.PlatformSettingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class PlatformSettingServiceImpl implements PlatformSettingService {

    private final PlatformSettingRepository repository;

    @Override
    @Transactional(readOnly = true)
    public PlatformSettingResponse getPlatformSetting() {
        return repository.findByKey(PlatformConstant.KEY_COMMISSION_RATE)
                .map(PlatformSettingResponse::from)
                .orElseThrow(() -> new CustomException(
                        "Platform setting not found: " + PlatformConstant.KEY_COMMISSION_RATE
                ));
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getCommissionRate() {
        return repository.findByKey(PlatformConstant.KEY_COMMISSION_RATE)
                .map(s -> {
                    try {
                        return new BigDecimal(s.getValue() != null ? s.getValue().trim() : "0");
                    } catch (NumberFormatException e) {
                        return BigDecimal.ZERO;
                    }
                })
                .orElse(BigDecimal.ZERO);
    }


    @Override
    @Transactional
    public PlatformSettingResponse setCommissionRate(BigDecimal rate) {
        if (rate == null || rate.compareTo(BigDecimal.ZERO) < 0 || rate.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new CustomException("Tỷ lệ hoa hồng phải từ 0 đến 100.");
        }
        PlatformSetting platformSetting = setValue(PlatformConstant.KEY_COMMISSION_RATE, rate.stripTrailingZeros().toPlainString());
        return PlatformSettingResponse.from(platformSetting);
    }

    @Override
    @Transactional(readOnly = true)
    public String getValue(String key) {
        return repository.findByKey(key).map(PlatformSetting::getValue).orElse(null);
    }

    @Override
    @Transactional
    public PlatformSetting setValue(String key, String value) {
        PlatformSetting setting = repository.findByKey(key).orElse(new PlatformSetting());
        setting.setKey(key);
        setting.setValue(value != null ? value : "");
        repository.save(setting);
        return setting;
    }
}
