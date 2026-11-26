package com.marketplace.ecommerce.order.controller;

import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.config.CurrentUser;
import com.marketplace.ecommerce.order.dto.response.OrderResponse;
import com.marketplace.ecommerce.order.dto.response.OrderStatusSummary;
import com.marketplace.ecommerce.order.dto.response.ShopRankingItem;
import com.marketplace.ecommerce.order.service.OrderService;
import com.marketplace.ecommerce.order.service.QueryOrderService;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
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
    private final OrderService orderService;

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

    @GetMapping("/me/paged")
    public ResponseEntity<Page<OrderResponse>> pageMyOrders(
            @CurrentUser CurrentUserInfo c,
            @RequestParam(value = "status", required = false) List<OrderStatus> statuses,
            @RequestParam(value = "q", required = false) String q,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(queryOrderService.pageOrdersForUser(c.getAccountId(), statuses, q, pageable));
    }

    @GetMapping("/me/summary")
    public ResponseEntity<List<OrderStatusSummary>> summarizeMyOrders(@CurrentUser CurrentUserInfo c) {
        return ResponseEntity.ok(queryOrderService.summarizeForUser(c.getAccountId()));
    }

    @GetMapping("/shops/paged")
    public ResponseEntity<Page<OrderResponse>> pageShopOrders(
            @CurrentUser CurrentUserInfo c,
            @RequestParam(value = "status", required = false) List<OrderStatus> statuses,
            @RequestParam(value = "q", required = false) String q,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(queryOrderService.pageOrdersForShop(c.getAccountId(), statuses, q, pageable));
    }

    @GetMapping("/shops/summary")
    public ResponseEntity<List<OrderStatusSummary>> summarizeShopOrders(@CurrentUser CurrentUserInfo c) {
        return ResponseEntity.ok(queryOrderService.summarizeForShop(c.getAccountId()));
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

    @GetMapping("/shop-ranking")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ShopRankingItem>> getShopRanking() {
        return ResponseEntity.ok(orderService.getShopRanking());
    }

    @GetMapping("/{orderId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OrderResponse> adminGetOrder(
            @CurrentUser CurrentUserInfo c,
            @PathVariable UUID orderId
    ) {
        return ResponseEntity.ok(queryOrderService.adminGetOrder(orderId, c.getAccountId()));
    }

    @GetMapping("/paged")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<OrderResponse>> adminPageOrders(
            @CurrentUser CurrentUserInfo c,
            @RequestParam(value = "status", required = false) List<OrderStatus> statuses,
            @RequestParam(value = "shopId", required = false) UUID shopId,
            @RequestParam(value = "q", required = false) String q,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(queryOrderService.adminPageOrders(c.getAccountId(), statuses, shopId, q, pageable));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<OrderResponse>> adminListOrders(
            @CurrentUser CurrentUserInfo c,
            @RequestParam(value = "status", required = false) OrderStatus status,
            @RequestParam(value = "shopId", required = false) UUID shopId
    ) {
        return ResponseEntity.ok(queryOrderService.adminListOrders(c.getAccountId(), status, shopId));
    }

}
