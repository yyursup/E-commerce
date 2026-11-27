package com.marketplace.ecommerce.order.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.dto.response.OrderResponse;
import com.marketplace.ecommerce.order.dto.response.OrderStatusSummary;
import com.marketplace.ecommerce.order.entity.OrderItem;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.service.QueryOrderService;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.request.service.OrderDisputeService;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.order.repository.OrderReturnRepository;
import com.marketplace.ecommerce.order.dto.response.OrderReturnResponse;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QueryOrderServiceImpl implements QueryOrderService {
    private final OrderRepository orderRepository;
    private final ShopRepository shopRepository;
    private final UserRepository userRepository;
    private final OrderDisputeService orderDisputeService;
    private final OrderReturnRepository orderReturnRepository;

    @Override
    public OrderResponse adminGetOrder(UUID orderId, UUID accountId) {
        requireUserByAccountId(accountId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomException("Không tìm thấy đơn hàng."));

        return OrderResponse.from(order, orderDisputeService.getDisputeInfo(order.getId()),
                getReturnInfo(order.getId()));
    }

    @Override
    public List<OrderResponse> adminListOrders(UUID accountId, OrderStatus statusOpt) {
        return adminListOrders(accountId, statusOpt, null);
    }

    @Override
    public List<OrderResponse> adminListOrders(UUID accountId, OrderStatus statusOpt, UUID shopId) {
        requireUserByAccountId(accountId);

        List<Order> orders;
        if (shopId != null) {
            orders = (statusOpt == null)
                    ? orderRepository.findByShopIdOrderByCreatedAtDesc(shopId)
                    : orderRepository.findByShopIdAndStatusOrderByCreatedAtDesc(shopId, statusOpt);
        } else {
            orders = (statusOpt == null)
                    ? orderRepository.findAllByOrderByCreatedAtDesc()
                    : orderRepository.findByStatusOrderByCreatedAtDesc(statusOpt);
        }

        List<UUID> ids = orders.stream().map(Order::getId).toList();
        var disputeMap = orderDisputeService.getDisputeInfoBatch(ids);
        var returnMap = getReturnInfoBatch(ids);
        return orders.stream().map(o -> OrderResponse.from(o, disputeMap.get(o.getId()), returnMap.get(o.getId())))
                .toList();
    }

    @Override
    public OrderResponse getOrderForUser(UUID orderId, UUID accountId) {
        User user = requireUserByAccountId(accountId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomException("Không tìm thấy đơn hàng."));

        if (order.getUser() == null || !order.getUser().getId().equals(user.getId())) {
            throw new CustomException("Bạn không có quyền truy cập");
        }

        return OrderResponse.from(order, orderDisputeService.getDisputeInfo(order.getId()),
                getReturnInfo(order.getId()));
    }

    @Override
    public OrderResponse getOrderByIdAndShop(UUID orderId, UUID accountShopId) {
        User seller = requireUserByAccountId(accountShopId);
        Shop shop = requireOwnedShop(seller);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomException("Không tìm thấy đơn hàng."));

        if (order.getShop() == null || !order.getShop().getId().equals(shop.getId())) {
            throw new CustomException("Không tìm thấy đơn hàng.");
        }

        return OrderResponse.from(order, orderDisputeService.getDisputeInfo(order.getId()),
                getReturnInfo(order.getId()));
    }

    @Override
    public List<OrderResponse> listOrdersForUser(UUID accountId, OrderStatus status) {
        User user = requireUserByAccountId(accountId);

        List<Order> orders = (status == null)
                ? orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                : orderRepository.findByUserIdAndStatusOrderByCreatedAtDesc(user.getId(), status);

        List<UUID> ids = orders.stream().map(Order::getId).toList();
        var disputeMap = orderDisputeService.getDisputeInfoBatch(ids);
        var returnMap = getReturnInfoBatch(ids);
        return orders.stream().map(o -> OrderResponse.from(o, disputeMap.get(o.getId()), returnMap.get(o.getId())))
                .toList();
    }

    @Override
    public List<OrderResponse> listOrdersForShop(UUID accountShopId, OrderStatus status) {
        User seller = requireUserByAccountId(accountShopId);
        Shop shop = requireOwnedShop(seller);

        List<Order> orders = (status == null)
                ? orderRepository.findByShopIdOrderByCreatedAtDesc(shop.getId())
                : orderRepository.findByShopIdAndStatusOrderByCreatedAtDesc(shop.getId(), status);

        List<UUID> ids = orders.stream().map(Order::getId).toList();
        var disputeMap = orderDisputeService.getDisputeInfoBatch(ids);
        var returnMap = getReturnInfoBatch(ids);
        return orders.stream().map(o -> OrderResponse.from(o, disputeMap.get(o.getId()), returnMap.get(o.getId())))
                .toList();
    }

    @Override
    public Page<OrderResponse> pageOrdersForUser(UUID accountId, List<OrderStatus> statuses, String q, Pageable pageable) {
        User user = requireUserByAccountId(accountId);
        return toResponsePage(orderRepository.findAll(filter(user.getId(), null, statuses, q), safePageable(pageable)));
    }

    @Override
    public Page<OrderResponse> pageOrdersForShop(UUID accountShopId, List<OrderStatus> statuses, String q, Pageable pageable) {
        Shop shop = requireOwnedShop(requireUserByAccountId(accountShopId));
        return toResponsePage(orderRepository.findAll(filter(null, shop.getId(), statuses, q), safePageable(pageable)));
    }

    @Override
    public Page<OrderResponse> adminPageOrders(UUID accountId, List<OrderStatus> statuses, UUID shopId, String q, Pageable pageable) {
        requireUserByAccountId(accountId);
        return toResponsePage(orderRepository.findAll(filter(null, shopId, statuses, q), safePageable(pageable)));
    }

    @Override
    public List<OrderStatusSummary> summarizeForUser(UUID accountId) {
        return orderRepository.summarizeByUserId(requireUserByAccountId(accountId).getId());
    }

    @Override
    public List<OrderStatusSummary> summarizeForShop(UUID accountShopId) {
        return orderRepository.summarizeByShopId(requireOwnedShop(requireUserByAccountId(accountShopId)).getId());
    }

    private static final Set<String> SORTABLE = Set.of("createdAt", "total");

    // Chỉ cho sắp xếp theo cột đã biết, tránh lỗi 500 khi client gửi sort lạ
    static Pageable safePageable(Pageable pageable) {
        Sort sort = Sort.by(pageable.getSort().stream()
                .filter(o -> SORTABLE.contains(o.getProperty()))
                .toList());
        if (sort.isUnsorted()) sort = Sort.by(Sort.Direction.DESC, "createdAt");
        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);
    }

    static Specification<Order> filter(UUID userId, UUID shopId, List<OrderStatus> statuses, String q) {
        return (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            if (userId != null) ps.add(cb.equal(root.get("user").get("id"), userId));
            if (shopId != null) ps.add(cb.equal(root.get("shop").get("id"), shopId));
            if (statuses != null && !statuses.isEmpty()) ps.add(root.get("status").in(statuses));
            if (q != null && !q.isBlank()) {
                String like = "%" + q.trim().toLowerCase()
                        .replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
                Subquery<UUID> itemMatch = query.subquery(UUID.class);
                Root<OrderItem> item = itemMatch.from(OrderItem.class);
                itemMatch.select(item.get("order").get("id"))
                        .where(cb.like(cb.lower(item.get("productName")), like, '\\'));
                ps.add(cb.or(
                        cb.like(cb.lower(root.get("orderNumber")), like, '\\'),
                        cb.like(cb.lower(root.get("shippingName")), like, '\\'),
                        cb.like(cb.lower(root.get("shippingPhone")), like, '\\'),
                        cb.like(cb.lower(root.get("ghnOrderCode")), like, '\\'),
                        root.get("id").in(itemMatch)));
            }
            return cb.and(ps.toArray(new Predicate[0]));
        };
    }

    private Page<OrderResponse> toResponsePage(Page<Order> page) {
        List<UUID> ids = page.getContent().stream().map(Order::getId).toList();
        var disputeMap = orderDisputeService.getDisputeInfoBatch(ids);
        var returnMap = getReturnInfoBatch(ids);
        List<OrderResponse> content = page.getContent().stream()
                .map(o -> OrderResponse.from(o, disputeMap.get(o.getId()), returnMap.get(o.getId())))
                .toList();
        return new PageImpl<>(content, page.getPageable(), page.getTotalElements());
    }

    private Map<UUID, OrderReturnResponse> getReturnInfoBatch(List<UUID> orderIds) {
        if (orderIds == null || orderIds.isEmpty()) {
            return Map.of();
        }
        return orderReturnRepository.findByOrderIdIn(orderIds).stream()
                .filter(r -> r.getOrder() != null && r.getOrder().getId() != null)
                .collect(Collectors.toMap(
                        r -> r.getOrder().getId(),
                        OrderReturnResponse::from,
                        (a, b) -> a));
    }

    private OrderReturnResponse getReturnInfo(UUID orderId) {
        return orderReturnRepository.findByOrderId(orderId)
                .map(OrderReturnResponse::from)
                .orElse(null);
    }

    private User requireUserByAccountId(UUID accountId) {
        return userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("Không tìm thấy người dùng."));
    }

    private Shop requireShop(User user) {
        return shopRepository.findByUserId(user.getId())
                .orElseThrow(() -> new CustomException("Không tìm thấy gian hàng."));
    }

    private Shop requireOwnedShop(User seller) {
        Shop shop = requireShop(seller);

        if (shop.getUser() == null || !shop.getUser().getId().equals(seller.getId())) {
            throw new CustomException("Bạn không có quyền truy cập");
        }
        return shop;
    }
}
