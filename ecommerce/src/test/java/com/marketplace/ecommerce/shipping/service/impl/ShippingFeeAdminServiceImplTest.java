package com.marketplace.ecommerce.shipping.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.entity.OrderReturn;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.repository.OrderReturnRepository;
import com.marketplace.ecommerce.payment.repository.TransactionRepository;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.order.valueObjects.ReturnStatus;
import com.marketplace.ecommerce.shipping.dto.response.ShippingFeeRecordResponse;
import com.marketplace.ecommerce.shipping.dto.response.ShippingFeeSummaryResponse;
import com.marketplace.ecommerce.shop.entity.Shop;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ShippingFeeAdminServiceImplTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private OrderReturnRepository orderReturnRepository;
    @Mock
    private TransactionRepository transactionRepository;

    @InjectMocks
    private ShippingFeeAdminServiceImpl service;

    private Order order;
    private OrderReturn orderReturn;
    private final Pageable pageable = PageRequest.of(0, 10);

    @BeforeEach
    void setUp() {
        User buyer = new User();
        buyer.setFullName("Nguyễn Văn Mua");
        Shop shop = Shop.builder().id(UUID.randomUUID()).name("Shop ABC").build();

        order = Order.builder()
                .id(UUID.randomUUID())
                .orderNumber("ORD-1")
                .user(buyer)
                .shop(shop)
                .status(OrderStatus.DELIVERED)
                .shippingFee(new BigDecimal("30000"))
                .ghnOrderCode("GHN-OUT-1")
                .createdAt(LocalDateTime.of(2026, 11, 1, 10, 0))
                .build();

        orderReturn = OrderReturn.builder()
                .id(UUID.randomUUID())
                .order(order)
                .status(ReturnStatus.SHIPPED)
                .returnTrackingCode("GHN-RET-1")
                .shippingFee(new BigDecimal("25000"))
                .buyerShippedAt(LocalDateTime.of(2026, 11, 5, 9, 0))
                .build();
        orderReturn.setIsReturnShippingDeducted(true);

        when(orderRepository.findByGhnOrderCodeIsNotNull(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(order)));
        when(orderReturnRepository.findByBuyerShippedAtIsNotNull(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(orderReturn)));
    }

    @Test
    @DisplayName("Chiều đi: shop tạo đơn GHN, phí do người mua đã trả")
    void outbound_ShopCreatedBuyerPaid() {
        Page<ShippingFeeRecordResponse> page = service.list("outbound", pageable);

        assertEquals(1, page.getTotalElements());
        ShippingFeeRecordResponse r = page.getContent().get(0);
        assertEquals("OUTBOUND", r.getDirection());
        assertEquals("SHOP", r.getCreatedBy());
        assertEquals("BUYER", r.getPayer());
        assertEquals("GHN-OUT-1", r.getTrackingCode());
        assertEquals(new BigDecimal("30000"), r.getFee());
        assertEquals("ORD-1", r.getOrderNumber());
        assertEquals("Shop ABC", r.getShopName());
        assertEquals("Nguyễn Văn Mua", r.getBuyerName());
        assertEquals("DELIVERED", r.getStatus());
        assertFalse(r.isDeductedFromShopFund());
    }

    @Test
    @DisplayName("Chiều về: người mua tạo đơn trả hàng, cước trích từ quỹ ký quỹ shop")
    void return_BuyerCreatedShopFundPays() {
        Page<ShippingFeeRecordResponse> page = service.list("RETURN", pageable);

        ShippingFeeRecordResponse r = page.getContent().get(0);
        assertEquals("RETURN", r.getDirection());
        assertEquals("BUYER", r.getCreatedBy());
        assertEquals("SHOP_FUND", r.getPayer());
        assertTrue(r.isDeductedFromShopFund());
        assertEquals(new BigDecimal("25000"), r.getFee());
        assertEquals("GHN-RET-1", r.getTrackingCode());
        assertEquals("GHN", r.getCarrier());
        assertEquals("SHIPPED", r.getStatus());
        assertEquals(LocalDateTime.of(2026, 11, 5, 9, 0), r.getCreatedAt());
    }

    @Test
    @DisplayName("Không chọn chiều: gộp cả hai chiều, mới nhất trước")
    void bothDirections_MergedNewestFirst() {
        Page<ShippingFeeRecordResponse> page = service.list(null, pageable);

        assertEquals(2, page.getTotalElements());
        assertEquals("RETURN", page.getContent().get(0).getDirection());
        assertEquals("OUTBOUND", page.getContent().get(1).getDirection());
    }

    @Test
    @DisplayName("Phân trang khi gộp hai chiều: trang quá lớn trả về rỗng nhưng vẫn đúng tổng")
    void bothDirections_PagingBeyondEnd() {
        Page<ShippingFeeRecordResponse> page = service.list("", PageRequest.of(3, 10));

        assertTrue(page.getContent().isEmpty());
        assertEquals(2, page.getTotalElements());
    }

    @Test
    @DisplayName("Phí rỗng được coi là 0đ, chiều về có tên hãng thì hiển thị đúng tên hãng")
    void nullFeeIsZero() {
        order.setShippingFee(null);
        orderReturn.setShippingFee(null);
        orderReturn.setCarrierName("GHN Express");

        List<ShippingFeeRecordResponse> all = service.list(null, pageable).getContent();

        assertTrue(all.stream().allMatch(r -> r.getFee().signum() == 0));
        assertTrue(all.stream().anyMatch(r -> "GHN Express".equals(r.getCarrier())));
    }

    @Test
    @DisplayName("Chiều về: người mua không khai cước (hoặc khai 0) thì tính bằng cước chiều đi, đúng như khi trích quỹ shop")
    void returnFeeFallsBackToOutboundFee() {
        orderReturn.setShippingFee(null);
        assertEquals(new BigDecimal("30000"), service.list("RETURN", pageable).getContent().get(0).getFee());

        orderReturn.setShippingFee(BigDecimal.ZERO);
        assertEquals(new BigDecimal("30000"), service.list("RETURN", pageable).getContent().get(0).getFee());

        orderReturn.setShippingFee(new BigDecimal("22000"));
        assertEquals(new BigDecimal("22000"), service.list("RETURN", pageable).getContent().get(0).getFee());
    }

    @Test
    @DisplayName("Chiều không hợp lệ bị từ chối")
    void invalidDirection() {
        assertThrows(CustomException.class, () -> service.list("SIDEWAYS", pageable));
    }

    @Test
    @DisplayName("summary: tổng phí hai chiều và số lần giao; dữ liệu trống là 0")
    void summary_TotalsAndEmpty() {
        when(orderRepository.sumShippingFeeOfGhnOrders()).thenReturn(new BigDecimal("90000"));
        when(orderRepository.countByGhnOrderCodeIsNotNull()).thenReturn(3L);
        when(orderReturnRepository.sumShippingFeeOfReturnShipments()).thenReturn(new BigDecimal("25000"));
        when(orderReturnRepository.countByBuyerShippedAtIsNotNull()).thenReturn(1L);

        ShippingFeeSummaryResponse s = service.summary();

        assertEquals(3L, s.getOutboundCount());
        assertEquals(new BigDecimal("90000"), s.getOutboundTotal());
        assertEquals(1L, s.getReturnCount());
        assertEquals(new BigDecimal("25000"), s.getReturnTotal());
        assertEquals(new BigDecimal("115000"), s.getGrandTotal());

        when(orderRepository.sumShippingFeeOfGhnOrders()).thenReturn(null);
        when(orderReturnRepository.sumShippingFeeOfReturnShipments()).thenReturn(null);
        assertEquals(0, service.summary().getGrandTotal().signum());
    }

    @Test
    @DisplayName("Chiều đi: hoàn tiền không cần trả hàng đã trích quỹ ký quỹ -> Shop chịu")
    void outbound_RefundOnlyChargedToShopFund() {
        when(transactionRepository.existsByDedupeKey("COMPENSATION:OUTBOUND_SHIPPING:" + order.getId())).thenReturn(true);

        ShippingFeeRecordResponse r = service.list("OUTBOUND", pageable).getContent().get(0);

        assertEquals("SHOP_FUND", r.getPayer());
        assertTrue(r.isDeductedFromShopFund());
    }

    @Test
    @DisplayName("Chiều đi: kiện trả hàng đã trích cước hai chiều -> Shop chịu cả chiều đi")
    void outbound_ReturnCompletedChargedToShopFund() {
        when(orderReturnRepository.findByOrderId(order.getId())).thenReturn(java.util.Optional.of(orderReturn));

        ShippingFeeRecordResponse r = service.list("OUTBOUND", pageable).getContent().get(0);

        assertEquals("SHOP_FUND", r.getPayer());
        assertTrue(r.isDeductedFromShopFund());
    }
}
