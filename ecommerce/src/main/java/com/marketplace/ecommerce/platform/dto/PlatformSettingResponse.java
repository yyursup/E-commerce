package com.marketplace.ecommerce.platform.dto;

import com.marketplace.ecommerce.platform.entity.PlatformSetting;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlatformSettingResponse {
    private UUID id;
    private String key;
    private String value;
    private LocalDateTime updatedAt;

    public static PlatformSettingResponse from(PlatformSetting platformSetting) {
        return PlatformSettingResponse.builder()
                .id(platformSetting.getId())
                .key(platformSetting.getKey())
                .value(platformSetting.getValue())
                .updatedAt(platformSetting.getUpdatedAt())
                .build();
    }
}

