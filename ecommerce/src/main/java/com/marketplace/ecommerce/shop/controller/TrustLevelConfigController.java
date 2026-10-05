package com.marketplace.ecommerce.shop.controller;

import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.config.CurrentUser;
import com.marketplace.ecommerce.shop.dto.request.TrustLevelConfigRequest;
import com.marketplace.ecommerce.shop.dto.response.TrustLevelConfigResponse;
import com.marketplace.ecommerce.shop.service.TrustLevelConfigService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(version = "1", path = "/trust-levels")
@RequiredArgsConstructor
public class TrustLevelConfigController {

    private final TrustLevelConfigService trustLevelConfigService;

    @GetMapping
    public ResponseEntity<List<TrustLevelConfigResponse>> getActiveTrustLevels() {
        return ResponseEntity.ok(trustLevelConfigService.getActiveConfigs());
    }

    @GetMapping("/admin")
    public ResponseEntity<List<TrustLevelConfigResponse>> getAllTrustLevelsForAdmin(@CurrentUser CurrentUserInfo currentUser) {
        if (currentUser == null || !"ADMIN".equalsIgnoreCase(currentUser.getRole())) {
            throw new CustomException("Chỉ Quản trị viên sàn mới có quyền truy cập cấu hình bậc sao");
        }
        return ResponseEntity.ok(trustLevelConfigService.getAllConfigs());
    }

    @PutMapping("/admin/{starLevel}")
    public ResponseEntity<TrustLevelConfigResponse> updateTrustLevel(
            @PathVariable Integer starLevel,
            @Valid @RequestBody TrustLevelConfigRequest request,
            @CurrentUser CurrentUserInfo currentUser
    ) {
        if (currentUser == null || !"ADMIN".equalsIgnoreCase(currentUser.getRole())) {
            throw new CustomException("Chỉ Quản trị viên sàn mới có quyền chỉnh sửa cấu hình bậc sao");
        }
        return ResponseEntity.ok(trustLevelConfigService.updateConfig(starLevel, request, currentUser.getAccountId()));
    }

    @PostMapping("/admin/reset-defaults")
    public ResponseEntity<List<TrustLevelConfigResponse>> resetDefaultTrustLevels(@CurrentUser CurrentUserInfo currentUser) {
        if (currentUser == null || !"ADMIN".equalsIgnoreCase(currentUser.getRole())) {
            throw new CustomException("Chỉ Quản trị viên sàn mới có quyền khôi phục cấu hình bậc sao mặc định");
        }
        return ResponseEntity.ok(trustLevelConfigService.resetDefaultConfigs(currentUser.getAccountId()));
    }
}
