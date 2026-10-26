package com.marketplace.ecommerce.platform.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.entity.OrderItem;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.platform.dto.CommissionFilterRequest;
import com.marketplace.ecommerce.platform.dto.response.CommissionDetailResponse;
import com.marketplace.ecommerce.platform.dto.response.CommissionResponse;
import com.marketplace.ecommerce.platform.entity.Commission;
import com.marketplace.ecommerce.platform.repository.CommissionRepository;
import com.marketplace.ecommerce.platform.service.PlatformSettingService;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.shop.entity.Shop;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CommissionServiceImplTest {

    @Mock
    private CommissionRepository commissionRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private PlatformSettingService platformSettingService;

    @InjectMocks
    private CommissionServiceImpl commissionService;

    private UUID orderId;
    private UUID sellerId;
    private User sellerUser;
    private Shop shop;
    private Order order;

    @BeforeEach
    void setUp() {
        orderId = UUID.randomUUID();
        sellerId = UUID.randomUUID();

        sellerUser = new User();
        sellerUser.setId(sellerId);
        sellerUser.setFullName("Nguyen Van Seller");

        shop = new Shop();
        shop.setId(UUID.randomUUID());
        shop.setUser(sellerUser);

        Product product = Product.builder()
                .id(UUID.randomUUID())
                .name("iPad Air")
                .basePrice(BigDecimal.valueOf(15000000))
                .build();

        OrderItem item = OrderItem.builder()
                .id(UUID.randomUUID())
                .product(product)
                .productName(product.getName())
                .unitPrice(BigDecimal.valueOf(15000000))
                .quantity(1)
                .build();

        order = Order.builder()
                .id(orderId)
                .orderNumber("ORD-COM-01")
                .shop(shop)
                .items(new HashSet<>(List.of(item)))
                .status(OrderStatus.DELIVERED)
                .subtotal(BigDecimal.valueOf(15000000))
                .total(BigDecimal.valueOf(15000000))
                .commissionRate(5.0)
                .build();
    }

    @Test
    @DisplayName("getCommissions lọc danh sách hoa hồng và làm giàu tên người bán")
    void testGetCommissions() {
        Commission com = Commission.builder()
                .id(UUID.randomUUID())
                .orderId(orderId)
                .sellerId(sellerId)
                .orderAmount(BigDecimal.valueOf(15000000))
                .totalCommission(BigDecimal.valueOf(750000))
                .createdAt(LocalDateTime.now())
                .build();

        when(commissionRepository.findAll(any(Specification.class))).thenReturn(List.of(com));
        when(userRepository.findAllById(any())).thenReturn(List.of(sellerUser));

        CommissionFilterRequest filter = new CommissionFilterRequest();
        filter.setSellerName("Seller");

        List<CommissionResponse> list = commissionService.getCommissions(filter);
        assertEquals(1, list.size());
        assertEquals("Nguyen Van Seller", list.get(0).getSellerName());
        assertEquals(BigDecimal.valueOf(750000), list.get(0).getCommissionAmount());
    }

    @Test
    @DisplayName("createCommission tính và lưu hoa hồng đơn hàng DELIVERED thành công")
    void testCreateCommission_Success() {
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(commissionRepository.existsByOrderId(orderId)).thenReturn(false);

        commissionService.createCommission(orderId);
        verify(commissionRepository).save(any(Commission.class));
    }

    @Test
    @DisplayName("createCommission bỏ qua khi hoa hồng cho đơn hàng đã tồn tại")
    void testCreateCommission_AlreadyExists() {
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(commissionRepository.existsByOrderId(orderId)).thenReturn(true);

        commissionService.createCommission(orderId);
        verify(commissionRepository, never()).save(any());
    }

    @Test
    @DisplayName("createCommission ném ngoại lệ khi trạng thái đơn hàng không hợp lệ")
    void testCreateCommission_InvalidStatus() {
        order.setStatus(OrderStatus.CONFIRMED);
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        assertThrows(CustomException.class, () -> commissionService.createCommission(orderId));
    }

    @Test
    @DisplayName("getByOrderId lấy chi tiết hoa hồng thành công và ném lỗi khi không tìm thấy")
    void testGetByOrderId() {
        Commission com = Commission.builder()
                .id(UUID.randomUUID())
                .orderId(orderId)
                .sellerId(sellerId)
                .orderAmount(BigDecimal.valueOf(1000000))
                .totalCommission(BigDecimal.valueOf(50000))
                .items(new ArrayList<>())
                .createdAt(LocalDateTime.now())
                .build();

        when(commissionRepository.findByOrderId(orderId)).thenReturn(Optional.of(com));
        when(userRepository.findById(sellerId)).thenReturn(Optional.of(sellerUser));

        CommissionDetailResponse res = commissionService.getByOrderId(orderId);
        assertNotNull(res);
        assertEquals("Nguyen Van Seller", res.getSellerName());

        when(commissionRepository.findByOrderId(orderId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> commissionService.getByOrderId(orderId));
    }

    @Test
    @DisplayName("getTotalCommissionBySeller và getTotalNetIncomeBySeller bao phủ thành công, null và ngoại lệ")
    void testTotalsBySeller() {
        UUID accountId = UUID.randomUUID();

        // 1. User không tìm thấy
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> commissionService.getTotalCommissionBySeller(accountId));
        assertThrows(RuntimeException.class, () -> commissionService.getTotalNetIncomeBySeller(accountId));

        // 2. User tìm thấy, repository trả về số tiền
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sellerUser));
        when(commissionRepository.getTotalCommissionBySeller(sellerId)).thenReturn(BigDecimal.valueOf(500000));
        when(commissionRepository.getTotalNetIncomeBySeller(sellerId)).thenReturn(BigDecimal.valueOf(9500000));

        BigDecimal totalCom = commissionService.getTotalCommissionBySeller(accountId);
        BigDecimal totalNet = commissionService.getTotalNetIncomeBySeller(accountId);
        assertEquals(BigDecimal.valueOf(500000), totalCom);
        assertEquals(BigDecimal.valueOf(9500000), totalNet);

        // 3. User tìm thấy, repository trả về null (fallback BigDecimal.ZERO)
        when(commissionRepository.getTotalCommissionBySeller(sellerId)).thenReturn(null);
        when(commissionRepository.getTotalNetIncomeBySeller(sellerId)).thenReturn(null);

        assertEquals(BigDecimal.ZERO, commissionService.getTotalCommissionBySeller(accountId));
        assertEquals(BigDecimal.ZERO, commissionService.getTotalNetIncomeBySeller(accountId));
    }

    @Test
    @DisplayName("createCommission các nhánh ngoại lệ: không tìm thấy đơn, thiếu seller, thiếu items, fallback rate")
    void testCreateCommission_EdgeCases() {
        // 1. Order không tìm thấy
        when(orderRepository.findById(orderId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> commissionService.createCommission(orderId));

        // 2. Shop hoặc User của shop bị null
        Order orderNoSeller = Order.builder().id(orderId).status(OrderStatus.COMPLETED).shop(null).build();
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(orderNoSeller));
        assertThrows(CustomException.class, () -> commissionService.createCommission(orderId));

        // 3. Order items rỗng
        Order orderNoItems = Order.builder().id(orderId).status(OrderStatus.COMPLETED).shop(shop).items(null).build();
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(orderNoItems));
        assertThrows(CustomException.class, () -> commissionService.createCommission(orderId));

        // 4. Rate fallback: order commissionRate = null -> lấy từ PlatformSettingService
        order.setCommissionRate(null);
        order.setSubtotal(null); // subtotal null fallback ZERO
        OrderItem itemNoPrice = OrderItem.builder().id(UUID.randomUUID()).unitPrice(null).quantity(null).build();
        order.setItems(new HashSet<>(List.of(itemNoPrice)));

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(commissionRepository.existsByOrderId(orderId)).thenReturn(false);
        when(platformSettingService.getCommissionRate()).thenReturn(BigDecimal.valueOf(4.0));

        commissionService.createCommission(orderId);
        verify(commissionRepository, atLeastOnce()).save(any(Commission.class));

        // 5. Rate fallback null từ platform setting -> BigDecimal.ZERO
        when(platformSettingService.getCommissionRate()).thenReturn(null);
        commissionService.createCommission(orderId);
    }

    @Test
    @DisplayName("getCommissions với filter null hoặc tên người bán không khớp")
    void testGetCommissions_NullFilterAndNonMatch() {
        Commission com = Commission.builder()
                .id(UUID.randomUUID())
                .orderId(orderId)
                .sellerId(sellerId)
                .orderAmount(BigDecimal.valueOf(1000000))
                .totalCommission(BigDecimal.valueOf(50000))
                .createdAt(LocalDateTime.now())
                .build();

        when(commissionRepository.findAll(any(Specification.class))).thenReturn(List.of(com));
        when(userRepository.findAllById(any())).thenReturn(List.of(sellerUser));

        // Filter null
        List<CommissionResponse> listNull = commissionService.getCommissions(null);
        assertEquals(1, listNull.size());

        // Filter tên không khớp
        CommissionFilterRequest filterNonMatch = new CommissionFilterRequest();
        filterNonMatch.setSellerName("Tên Hoàn Toàn Khác Không Tồn Tại");
        List<CommissionResponse> listNonMatch = commissionService.getCommissions(filterNonMatch);
        assertTrue(listNonMatch.isEmpty());
    }

}
