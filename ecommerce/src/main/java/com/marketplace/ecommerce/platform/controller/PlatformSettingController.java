package com.marketplace.ecommerce.platform.controller;

import com.marketplace.ecommerce.platform.dto.PlatformSettingResponse;
import com.marketplace.ecommerce.platform.dto.UpdateCommissionRateRequest;
import com.marketplace.ecommerce.platform.entity.PlatformSetting;
import com.marketplace.ecommerce.platform.service.PlatformSettingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(version = "1", path = "/platform")
@RequiredArgsConstructor
public class PlatformSettingController {

    private final PlatformSettingService platformSettingService;

    @GetMapping
    public ResponseEntity<PlatformSettingResponse> getPlatformSetting() {
        return ResponseEntity.ok(platformSettingService.getPlatformSetting());
    }

    @PatchMapping
    public ResponseEntity<PlatformSettingResponse> updateCommissionRate(
            @Valid @RequestBody UpdateCommissionRateRequest updateCommissionRateRequest
    ) {
        return ResponseEntity.ok(platformSettingService.setCommissionRate(updateCommissionRateRequest.getCommissionRate()));
    }
}
