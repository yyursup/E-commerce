package com.marketplace.ecommerce.platform.controller;

import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.config.CurrentUser;
import com.marketplace.ecommerce.platform.dto.response.SellerStatisticsResponse;
import com.marketplace.ecommerce.platform.service.CommissionService;
import com.marketplace.ecommerce.platform.service.CommissionStatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping(version = "1", path = "/statistics")
@PreAuthorize("hasAnyRole('BUSINESS', 'ADMIN')")
@RequiredArgsConstructor
public class SellerStatisticsController {
    private final CommissionStatisticsService commissionStatisticsService;

    @GetMapping
    public ResponseEntity<SellerStatisticsResponse> getStatistics(
            @CurrentUser CurrentUserInfo currentUser
    ) {
        return ResponseEntity.ok(
                commissionStatisticsService.getStatistics(currentUser.getAccountId())
        );
    }

}
