package com.marketplace.ecommerce.platform.controller;

import com.marketplace.ecommerce.platform.dto.CommissionRateBreakdown;
import com.marketplace.ecommerce.platform.dto.PlatformSettingResponse;
import com.marketplace.ecommerce.platform.dto.UpdateCommissionRateRequest;
import com.marketplace.ecommerce.platform.service.CommissionCalculationService;
import com.marketplace.ecommerce.platform.service.PlatformSettingService;
import com.marketplace.ecommerce.product.entity.ProductCategory;
import com.marketplace.ecommerce.product.repository.ProductCategoryRepository;
import com.marketplace.ecommerce.product.valueObjects.ConditionGrade;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping(version = "1", path = "/platform")
@RequiredArgsConstructor
public class PlatformSettingController {

    private final PlatformSettingService platformSettingService;
    private final CommissionCalculationService commissionCalculationService;
    private final ShopRepository shopRepository;
    private final ProductCategoryRepository productCategoryRepository;

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

    @GetMapping("/commission/calculate-preview")
    public ResponseEntity<CommissionRateBreakdown> calculateCommissionPreview(
            @RequestParam(required = false) UUID shopId,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) ConditionGrade conditionGrade
    ) {
        Shop shop = shopId != null ? shopRepository.findById(shopId).orElse(null) : null;
        ProductCategory category = categoryId != null ? productCategoryRepository.findById(categoryId).orElse(null) : null;
        return ResponseEntity.ok(commissionCalculationService.calculateRateBreakdown(shop, category, conditionGrade));
    }
}
