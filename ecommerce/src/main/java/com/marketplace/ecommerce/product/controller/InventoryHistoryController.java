package com.marketplace.ecommerce.product.controller;


import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.product.dto.response.InventoryHistoryResponse;
import com.marketplace.ecommerce.product.service.InventoryHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/inventory-history")
@RequiredArgsConstructor
public class InventoryHistoryController {

    private final InventoryHistoryService inventoryHistoryService;

    @GetMapping("/shop")
    @PreAuthorize("hasRole('BUSINESS')")
    public ResponseEntity<Page<InventoryHistoryResponse>> getInventoryHistory(
            @com.marketplace.ecommerce.config.CurrentUser CurrentUserInfo u,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        UUID accountId = u.getAccountId();
        Page<InventoryHistoryResponse> response = inventoryHistoryService.getHistoryByShopId(accountId, page, size);
        return ResponseEntity.ok(response);
    }
}
