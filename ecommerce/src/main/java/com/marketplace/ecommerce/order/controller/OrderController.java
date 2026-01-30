package com.marketplace.ecommerce.order.controller;


import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.config.CurrentUser;
import com.marketplace.ecommerce.order.dto.request.CreateOrderRequest;
import com.marketplace.ecommerce.order.dto.response.OrderResponse;
import com.marketplace.ecommerce.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping(version = "1", path = "/order")
@RequiredArgsConstructor
public class OrderController {
    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<OrderResponse> create(
            @CurrentUser CurrentUserInfo c,
            @RequestBody CreateOrderRequest request
    ) {
        return ResponseEntity.ok(orderService.convertCartToOrder(c.getAccountId(), request));
    }

    @PatchMapping("/{orderId}/status")
    public ResponseEntity<OrderResponse> updateStatus(
            @CurrentUser CurrentUserInfo c,
            @PathVariable UUID orderId,
            @RequestParam(value = "status") String status
    ) {
        return ResponseEntity.ok(orderService.updateOrderStatus(c.getAccountId(), orderId, status));
    }



}
