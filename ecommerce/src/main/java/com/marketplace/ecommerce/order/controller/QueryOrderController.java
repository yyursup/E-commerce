package com.marketplace.ecommerce.order.controller;

import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.config.CurrentUser;
import com.marketplace.ecommerce.order.dto.response.OrderResponse;
import com.marketplace.ecommerce.order.service.QueryOrderService;
import com.marketplace.ecommerce.shipping.valueObjects.OrderStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(version = "1", path = "/order")
@RequiredArgsConstructor
public class QueryOrderController {
    private final QueryOrderService queryOrderService;

    @GetMapping("/{orderId}/me")
    public ResponseEntity<OrderResponse> viewMyOrderDetails(
            @CurrentUser CurrentUserInfo c,
            @PathVariable UUID orderId
    ) {
        return ResponseEntity.ok(queryOrderService.getOrderForUser(orderId, c.getAccountId()));
    }

    @GetMapping("/me")
    public ResponseEntity<List<OrderResponse>> listMyOrders(
            @CurrentUser CurrentUserInfo c,
            @RequestParam(value = "status", required = false) OrderStatus status
    ) {
        return ResponseEntity.ok(queryOrderService.listOrdersForUser(c.getAccountId(), status));
    }

    @GetMapping("/shops/orders/{orderId}")
    public ResponseEntity<OrderResponse> getShopOrder(
            @CurrentUser CurrentUserInfo c,
            @PathVariable UUID orderId
    ) {
        return ResponseEntity.ok(queryOrderService.getOrderByIdAndShop(orderId, c.getAccountId()));
    }

    @GetMapping("/shops")
    public ResponseEntity<List<OrderResponse>> listShopOrders(
            @CurrentUser CurrentUserInfo c,
            @RequestParam(value = "status", required = false) OrderStatus status
    ) {
        return ResponseEntity.ok(queryOrderService.listOrdersForShop(c.getAccountId(), status));
    }

    @GetMapping("/{orderId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OrderResponse> adminGetOrder(
            @CurrentUser CurrentUserInfo c,
            @PathVariable UUID orderId
    ) {
        return ResponseEntity.ok(queryOrderService.adminGetOrder(orderId, c.getAccountId()));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<OrderResponse>> adminListOrders(
            @CurrentUser CurrentUserInfo c,
            @RequestParam(value = "status", required = false) OrderStatus status
    ) {
        return ResponseEntity.ok(queryOrderService.adminListOrders(c.getAccountId(), status));
    }

}
