package com.marketplace.ecommerce.order.service.impl;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.dto.response.OrderResponse;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.repository.OrderReturnRepository;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.request.service.OrderDisputeService;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.order.dto.response.OrderStatusSummary;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Root;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.mockito.Answers;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class QueryOrderServiceImplTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private ShopRepository shopRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private OrderDisputeService orderDisputeService;
    @Mock
    private OrderReturnRepository orderReturnRepository;

    @InjectMocks
    private QueryOrderServiceImpl queryOrderService;

    private UUID accountId;
    private User sampleUser;
    private Shop sampleShop;
    private Order sampleOrder;

    @BeforeEach
    void setUp() {
        accountId = UUID.randomUUID();

        Account acc = new Account();
        acc.setId(accountId);

        sampleUser = new User();
        sampleUser.setId(UUID.randomUUID());
        sampleUser.setAccount(acc);

        sampleShop = new Shop();
        sampleShop.setId(UUID.randomUUID());
        sampleShop.setName("Game Store");
        sampleShop.setUser(sampleUser);

        sampleOrder = new Order();
        sampleOrder.setId(UUID.randomUUID());
        sampleOrder.setOrderNumber("ORD-Q-100");
        sampleOrder.setUser(sampleUser);
        sampleOrder.setShop(sampleShop);
        sampleOrder.setStatus(OrderStatus.DELIVERED);
        sampleOrder.setItems(new HashSet<>());
        sampleOrder.setSubtotal(BigDecimal.valueOf(1000000));
        sampleOrder.setTotal(BigDecimal.valueOf(1000000));
    }

    @Test
    @DisplayName("adminGetOrder và adminListOrders lấy đơn hàng cho quản trị viên")
    void testAdminGetAndList() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(orderRepository.findById(sampleOrder.getId())).thenReturn(Optional.of(sampleOrder));
        when(orderDisputeService.getDisputeInfo(sampleOrder.getId())).thenReturn(null);
        when(orderReturnRepository.findByOrderId(sampleOrder.getId())).thenReturn(Optional.empty());

        OrderResponse res = queryOrderService.adminGetOrder(sampleOrder.getId(), accountId);
        assertNotNull(res);
        assertEquals("ORD-Q-100", res.getOrderNumber());

        when(orderRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(sampleOrder));
        when(orderDisputeService.getDisputeInfoBatch(any())).thenReturn(Map.of());
        when(orderReturnRepository.findByOrderIdIn(any())).thenReturn(List.of());

        List<OrderResponse> list = queryOrderService.adminListOrders(accountId, null);
        assertEquals(1, list.size());
    }

    @Test
    @DisplayName("getOrderForUser và listOrdersForUser lấy danh sách đơn của người mua")
    void testBuyerOrders() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(orderRepository.findById(sampleOrder.getId())).thenReturn(Optional.of(sampleOrder));

        OrderResponse res = queryOrderService.getOrderForUser(sampleOrder.getId(), accountId);
        assertNotNull(res);
        assertEquals(sampleOrder.getId(), res.getId());

        when(orderRepository.findByUserIdOrderByCreatedAtDesc(sampleUser.getId())).thenReturn(List.of(sampleOrder));
        when(orderDisputeService.getDisputeInfoBatch(any())).thenReturn(Map.of());
        when(orderReturnRepository.findByOrderIdIn(any())).thenReturn(List.of());

        List<OrderResponse> list = queryOrderService.listOrdersForUser(accountId, null);
        assertEquals(1, list.size());
    }

    @Test
    @DisplayName("getOrderByIdAndShop và listOrdersForShop lấy danh sách đơn của shop")
    void testShopOrders() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.of(sampleShop));
        when(orderRepository.findById(sampleOrder.getId())).thenReturn(Optional.of(sampleOrder));

        OrderResponse res = queryOrderService.getOrderByIdAndShop(sampleOrder.getId(), accountId);
        assertNotNull(res);
        assertEquals(sampleShop.getName(), res.getShopName());

        when(orderRepository.findByShopIdOrderByCreatedAtDesc(sampleShop.getId())).thenReturn(List.of(sampleOrder));
        when(orderDisputeService.getDisputeInfoBatch(any())).thenReturn(Map.of());
        when(orderReturnRepository.findByOrderIdIn(any())).thenReturn(List.of());

        List<OrderResponse> list = queryOrderService.listOrdersForShop(accountId, null);
        assertEquals(1, list.size());
    }

    @Test
    @DisplayName("getOrderForUser ném lỗi Forbidden khi đơn hàng không thuộc về người dùng")
    void testGetOrderForUser_Forbidden() {
        User otherUser = new User();
        otherUser.setId(UUID.randomUUID());
        sampleOrder.setUser(otherUser);

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(orderRepository.findById(sampleOrder.getId())).thenReturn(Optional.of(sampleOrder));

        assertThrows(CustomException.class, () -> queryOrderService.getOrderForUser(sampleOrder.getId(), accountId));
    }

    @Test
    @DisplayName("QueryOrderService cac nhanh tim kiem theo status va loi not found")
    void testQueryOrderService_MoreBranches() {
        // 1. adminListOrders with status
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(orderRepository.findByStatusOrderByCreatedAtDesc(OrderStatus.DELIVERED)).thenReturn(List.of(sampleOrder));
        when(orderDisputeService.getDisputeInfoBatch(any())).thenReturn(Map.of());
        when(orderReturnRepository.findByOrderIdIn(any())).thenReturn(List.of());

        List<OrderResponse> adminList = queryOrderService.adminListOrders(accountId, OrderStatus.DELIVERED);
        assertEquals(1, adminList.size());

        // 2. listOrdersForUser with status
        when(orderRepository.findByUserIdAndStatusOrderByCreatedAtDesc(sampleUser.getId(), OrderStatus.DELIVERED))
                .thenReturn(List.of(sampleOrder));
        List<OrderResponse> userList = queryOrderService.listOrdersForUser(accountId, OrderStatus.DELIVERED);
        assertEquals(1, userList.size());

        // 3. listOrdersForShop with status
        when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.of(sampleShop));
        when(orderRepository.findByShopIdAndStatusOrderByCreatedAtDesc(sampleShop.getId(), OrderStatus.DELIVERED))
                .thenReturn(List.of(sampleOrder));
        List<OrderResponse> shopList = queryOrderService.listOrdersForShop(accountId, OrderStatus.DELIVERED);
        assertEquals(1, shopList.size());

        // 4. getOrderByIdAndShop not owned by shop -> throws
        Shop otherShop = new Shop();
        otherShop.setId(UUID.randomUUID());
        sampleOrder.setShop(otherShop);
        assertThrows(CustomException.class, () -> queryOrderService.getOrderByIdAndShop(sampleOrder.getId(), accountId));

        // 5. adminGetOrder not found
        when(orderRepository.findById(sampleOrder.getId())).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> queryOrderService.adminGetOrder(sampleOrder.getId(), accountId));

        // 6. user not found
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> queryOrderService.adminListOrders(accountId, null));

        // 7. shop not found
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> queryOrderService.listOrdersForShop(accountId, null));

        // 8. requireOwnedShop: shop.getUser() == null or mismatch
        Shop unownedShop = new Shop();
        unownedShop.setId(UUID.randomUUID());
        unownedShop.setUser(null);
        when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.of(unownedShop));
        assertThrows(CustomException.class, () -> queryOrderService.listOrdersForShop(accountId, null));

        User anotherSeller = new User();
        anotherSeller.setId(UUID.randomUUID());
        unownedShop.setUser(anotherSeller);
        assertThrows(CustomException.class, () -> queryOrderService.listOrdersForShop(accountId, null));

        // 9. getReturnInfoBatch: empty list and non-empty OrderReturn list (with duplicate and null order)
        when(orderRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of());
        assertTrue(queryOrderService.adminListOrders(accountId, null).isEmpty());

        com.marketplace.ecommerce.order.entity.OrderReturn ret1 = new com.marketplace.ecommerce.order.entity.OrderReturn();
        ret1.setId(UUID.randomUUID());
        ret1.setOrder(sampleOrder);
        com.marketplace.ecommerce.order.entity.OrderReturn ret2 = new com.marketplace.ecommerce.order.entity.OrderReturn();
        ret2.setId(UUID.randomUUID());
        ret2.setOrder(sampleOrder);
        com.marketplace.ecommerce.order.entity.OrderReturn retNullOrder = new com.marketplace.ecommerce.order.entity.OrderReturn();
        retNullOrder.setId(UUID.randomUUID());
        retNullOrder.setOrder(null);

        when(orderRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(sampleOrder));
        when(orderReturnRepository.findByOrderIdIn(any())).thenReturn(List.of(ret1, ret2, retNullOrder));
        assertEquals(1, queryOrderService.adminListOrders(accountId, null).size());

        // 10. getOrderForUser & getOrderByIdAndShop not found / null user / null shop
        when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.of(sampleShop));
        when(orderRepository.findById(sampleOrder.getId())).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> queryOrderService.getOrderForUser(sampleOrder.getId(), accountId));
        assertThrows(CustomException.class, () -> queryOrderService.getOrderByIdAndShop(sampleOrder.getId(), accountId));

        sampleOrder.setUser(null);
        sampleOrder.setShop(null);
        when(orderRepository.findById(sampleOrder.getId())).thenReturn(Optional.of(sampleOrder));
        assertThrows(CustomException.class, () -> queryOrderService.getOrderForUser(sampleOrder.getId(), accountId));
        assertThrows(CustomException.class, () -> queryOrderService.getOrderByIdAndShop(sampleOrder.getId(), accountId));

        // 11. adminListOrders with shopId != null
        when(orderRepository.findByShopIdOrderByCreatedAtDesc(sampleShop.getId())).thenReturn(List.of(sampleOrder));
        assertEquals(1, queryOrderService.adminListOrders(accountId, null, sampleShop.getId()).size());

        when(orderRepository.findByShopIdAndStatusOrderByCreatedAtDesc(sampleShop.getId(), OrderStatus.DELIVERED)).thenReturn(List.of(sampleOrder));
        assertEquals(1, queryOrderService.adminListOrders(accountId, OrderStatus.DELIVERED, sampleShop.getId()).size());

        when(orderRepository.findByStatusOrderByCreatedAtDesc(OrderStatus.DELIVERED)).thenReturn(List.of(sampleOrder));
        assertEquals(1, queryOrderService.adminListOrders(accountId, OrderStatus.DELIVERED).size());
    }

    @Test
    @DisplayName("pageOrdersForShop chỉ lấy đơn của shop sở hữu và giữ nguyên tổng số bản ghi")
    @SuppressWarnings("unchecked")
    void pageOrdersForShop_mapsPageAndKeepsTotal() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.of(sampleShop));
        when(orderRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sampleOrder), PageRequest.of(2, 1), 25));

        Page<OrderResponse> page = queryOrderService.pageOrdersForShop(accountId,
                List.of(OrderStatus.DELIVERED), null, PageRequest.of(2, 1));

        assertEquals(1, page.getContent().size());
        assertEquals("ORD-Q-100", page.getContent().get(0).getOrderNumber());
        assertEquals(25, page.getTotalElements());
        assertEquals(2, page.getNumber());
        verify(orderDisputeService).getDisputeInfoBatch(List.of(sampleOrder.getId()));
    }

    @Test
    @DisplayName("pageOrdersForShop từ chối khi tài khoản không có gian hàng")
    void pageOrdersForShop_noShop_throws() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.empty());
        assertThrows(CustomException.class,
                () -> queryOrderService.pageOrdersForShop(accountId, null, null, PageRequest.of(0, 10)));
    }

    @Test
    @DisplayName("safePageable bỏ cột sort lạ, mặc định createdAt giảm dần")
    void safePageable_whitelistsSort() {
        Pageable bad = PageRequest.of(1, 5, Sort.by("password"));
        Pageable fixed = QueryOrderServiceImpl.safePageable(bad);
        assertEquals(Sort.by(Sort.Direction.DESC, "createdAt"), fixed.getSort());
        assertEquals(1, fixed.getPageNumber());
        assertEquals(5, fixed.getPageSize());

        Pageable ok = QueryOrderServiceImpl.safePageable(PageRequest.of(0, 10, Sort.by(Sort.Direction.ASC, "total")));
        assertEquals(Sort.by(Sort.Direction.ASC, "total"), ok.getSort());
    }

    @Test
    @DisplayName("filter escape ký tự đặc biệt của LIKE trong từ khóa tìm kiếm")
    @SuppressWarnings("unchecked")
    void filter_escapesLikeWildcards() {
        Root<Order> root = mock(Root.class, Answers.RETURNS_DEEP_STUBS);
        CriteriaQuery<?> query = mock(CriteriaQuery.class, Answers.RETURNS_DEEP_STUBS);
        CriteriaBuilder cb = mock(CriteriaBuilder.class, Answers.RETURNS_DEEP_STUBS);

        QueryOrderServiceImpl.filter(null, null, null, " 50%_OFF ").toPredicate(root, query, cb);

        verify(cb, atLeastOnce()).like(any(), eq("%50\\%\\_off%"), eq('\\'));
    }

    @Test
    @DisplayName("summarizeForUser trả về thống kê theo trạng thái của người mua")
    void summarizeForUser_delegates() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        List<OrderStatusSummary> rows = List.of(new OrderStatusSummary(OrderStatus.DELIVERED, 2L, null));
        when(orderRepository.summarizeByUserId(sampleUser.getId())).thenReturn(rows);

        List<OrderStatusSummary> result = queryOrderService.summarizeForUser(accountId);
        assertEquals(BigDecimal.ZERO, result.get(0).total());
        assertEquals(2L, result.get(0).count());
    }
}
