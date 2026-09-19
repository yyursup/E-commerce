package com.marketplace.ecommerce.order.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.entity.UserAddress;
import com.marketplace.ecommerce.auth.repository.UserAddressRepository;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.cart.entity.Cart;
import com.marketplace.ecommerce.cart.entity.CartItem;
import com.marketplace.ecommerce.cart.repository.CartItemRepository;
import com.marketplace.ecommerce.cart.repository.CartRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.dto.request.CreateOrderRequest;
import com.marketplace.ecommerce.order.dto.response.OrderResponse;
import com.marketplace.ecommerce.order.dto.response.ShopRankingItem;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.entity.OrderItem;
import com.marketplace.ecommerce.order.repository.OrderItemsRepository;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.service.OrderService;
import com.marketplace.ecommerce.payment.service.EscrowService;
import com.marketplace.ecommerce.payment.valueObjects.PaymentMethod;
import com.marketplace.ecommerce.platform.service.CommissionService;
import com.marketplace.ecommerce.platform.service.PlatformSettingService;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.entity.ProductVariant;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.product.repository.ProductVariantRepository;
import com.marketplace.ecommerce.shipping.dto.request.GHNCreateOrderRequest;
import com.marketplace.ecommerce.shipping.dto.response.GHNCreateOrderResponse;
import com.marketplace.ecommerce.shipping.service.ShippingService;
import com.marketplace.ecommerce.shipping.usecase.GHNClient;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.product.service.InventoryHistoryService;
import com.marketplace.ecommerce.product.valueObjects.InventoryActionType;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jetbrains.annotations.NotNull;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderServiceImpl implements OrderService {
    private final ShopRepository shopRepository;
    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final OrderItemsRepository orderItemsRepository;
    private final CartItemRepository cartItemRepository;
    private final GHNClient ghnClient;
    private final UserAddressRepository userAddressRepository;
    private final ShippingService shippingService;
    private final PlatformSettingService platformSettingService;
    private final EscrowService escrowService;
    private final CommissionService commissionService;
    private final com.marketplace.ecommerce.voucher.service.VoucherService voucherService;
    private final InventoryHistoryService inventoryHistoryService;

    @Override
    @Transactional
    public OrderResponse retryCreateGhnOrder(UUID orderId, UUID accountId) {

        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("User not found"));

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomException("Order not found"));

        if (!order.getShop().getUser().getId().equals(user.getId())) {
            throw new CustomException("You don't have any permissions");
        }
        if (order.getGhnOrderCode() != null && !order.getGhnOrderCode().isEmpty()) {
            throw new CustomException("Order already has a GHN tracking code:" + order.getGhnOrderCode());
        }
        OrderStatus s = order.getStatus();
        if (s != OrderStatus.CONFIRMED && s != OrderStatus.PROCESSING && s != OrderStatus.SHIPPING) {
            throw new CustomException(
                    "GHN shipping order can be created only when status is CONFIRMED/PROCESSING/SHIPPING.");
        }
        tryCreateGHNOrder(order);
        order = orderRepository.save(order);
        return OrderResponse.from(order);
    }

    @Override
    @Transactional
    public OrderResponse setGhnOrderCodeManually(UUID orderId, String ghnOrderCode, UUID accountId) {

        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("User not found"));

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomException("Order not found"));

        if (!order.getShop().getUser().getId().equals(user.getId())) {
            throw new CustomException("You don't have permission to update this order.");
        }
        if (ghnOrderCode == null || ghnOrderCode.isBlank()) {
            throw new CustomException("GHN tracking code must not be empty");
        }
        order.setGhnOrderCode(ghnOrderCode.trim());
        order = orderRepository.save(order);
        log.info("Seller đã nhập mã GHN thủ công: order {} -> ghnOrderCode={}", order.getOrderNumber(),
                ghnOrderCode.trim());
        return OrderResponse.from(order);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void autoReceiveAndRelease(UUID orderId) {
        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new CustomException("Order not found"));

        if (order.isReceivedByBuyer())
            return;
        if (order.getStatus() != OrderStatus.DELIVERED) {
            return;
        }

        order.setReceivedByBuyer(true);
        order.setReceivedAt(LocalDateTime.now());
        orderRepository.save(order);
        escrowService.releaseByOrder(order.getId());

        log.info("Auto received + released order {}", order.getOrderNumber());
    }

    @Transactional
    @Scheduled(cron = "0 0 * * * *")
    public void autoMarkReceivedOrders() {

        LocalDateTime threshold = LocalDateTime.now().minusDays(3);

        List<UUID> orderIds = orderRepository
                .findIdsByStatusAndReceivedByBuyerFalseAndDeliveredAtBefore(
                        OrderStatus.DELIVERED,
                        threshold);

        for (UUID orderId : orderIds) {
            try {
                autoReceiveAndRelease(orderId);
            } catch (Exception e) {
                log.warn("Auto receive failed for orderId={}", orderId, e);
            }
        }
    }

    @Override
    @Transactional
    public void markReceivedByBuyer(UUID orderId, UUID accountId) {
        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("User not found"));

        Order order = orderRepository.findByIdAndUserId(orderId, user.getId())
                .orElseThrow(() -> new CustomException("Order not found"));

        if (!user.getId().equals(order.getUser().getId())) {
            throw new CustomException("You don't have permission to update this order.");
        }

        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new CustomException("Make receive when the order were delivered");
        }

        if (order.isReceivedByBuyer()) {
            throw new CustomException("Order is already received");
        }

        order.setReceivedByBuyer(true);
        order.setReceivedAt(LocalDateTime.now());
        escrowService.releaseByOrder(order.getId());
        order.setStatus(OrderStatus.COMPLETED);

        orderRepository.save(order);
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(UUID accountId, UUID orderId, String status) {
        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("User not found"));

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomException("Order not found"));

        if (!order.getShop().getUser().getId().equals(user.getId())) {
            throw new CustomException("You don't have any permission to update this order");
        }

        OrderStatus currentStatus = order.getStatus();
        OrderStatus newStatus;
        try {
            newStatus = OrderStatus.valueOf(status);
        } catch (Exception e) {
            throw new CustomException("Invalid status: " + status);
        }

        if (newStatus == OrderStatus.CANCELLED &&
                currentStatus != OrderStatus.PENDING_PAYMENT && currentStatus != OrderStatus.CONFIRMED) {
            throw new CustomException("Can not cancelOrder with status " + currentStatus);
        }

        if (newStatus == OrderStatus.CANCELLED) {

            if (order.getPaymentMethod() == PaymentMethod.COD) {
                escrowService.cancelCodEscrow(order);
            }

            voucherService.rollbackVoucherUsage(order);

            if (order.isStockDeducted()) {
                for (OrderItem item : order.getItems()) {
                    if (item.getProduct() != null) {
                        Product p = item.getProduct();
                        if (p.getQuantity() != null) {
                            int oldQ = p.getQuantity();
                            p.setQuantity(p.getQuantity() + item.getQuantity());
                            productRepository.save(p);
                            inventoryHistoryService.logInventoryChange(order.getShop(), p, null, oldQ, p.getQuantity(), InventoryActionType.ORDER_CANCELLED, order.getOrderNumber(), "Hủy đơn hàng: " + order.getOrderNumber());
                        }
                    }
                    if (item.getVariantId() != null) {
                        java.util.Optional<com.marketplace.ecommerce.product.entity.ProductVariant> optVariant = productVariantRepository.findById(item.getVariantId());
                        if (optVariant.isPresent()) {
                            com.marketplace.ecommerce.product.entity.ProductVariant variant = optVariant.get();
                            int currentStock = variant.getStock() != null ? variant.getStock() : 0;
                            variant.setStock(currentStock + item.getQuantity());
                            productVariantRepository.save(variant);
                            inventoryHistoryService.logInventoryChange(order.getShop(), item.getProduct(), variant, currentStock, variant.getStock(), InventoryActionType.ORDER_CANCELLED, order.getOrderNumber(), "Hủy đơn hàng: " + order.getOrderNumber());
                        }
                    }
                }
                order.setStockDeducted(false);
            }

            if (order.getGhnOrderCode() != null && !order.getGhnOrderCode().isEmpty()) {
                try {
                    ghnClient.cancelOrder(order.getGhnOrderCode());
                    log.info("Đã hủy đơn GHN: {}", order.getGhnOrderCode());
                } catch (Exception e) {
                    log.error("Lỗi khi hủy đơn GHN: {}", e.getMessage());
                }
            }
        }
        validateSellerTransition(currentStatus, newStatus);
        order.setStatus(newStatus);
        order = orderRepository.save(order);

        if (newStatus == OrderStatus.DELIVERED) {

            commissionService.createCommission(order.getId());
        }

        return OrderResponse.from(order);
    }

    private void validateSellerTransition(OrderStatus currentStatus, OrderStatus newStatus) {
        boolean valid = switch (currentStatus) {
            case CONFIRMED -> newStatus == OrderStatus.PROCESSING ||
                    newStatus == OrderStatus.CANCELLED;

            case PROCESSING -> newStatus == OrderStatus.SHIPPING;

            case SHIPPING -> newStatus == OrderStatus.DELIVERED;

            default -> false;
        };

        if (!valid) {
            throw new CustomException("Invalid transition: " + currentStatus + " -> " + newStatus);
        }
    }

    public void tryCreateGHNOrder(Order order) {
        if (order.getGhnOrderCode() == null || order.getGhnOrderCode().isEmpty()) {
            try {
                GHNCreateOrderRequest ghnRequest = shippingService.build(order);
                GHNCreateOrderResponse ghnResponse = ghnClient.createOrder(ghnRequest);
                order.setGhnOrderCode(ghnResponse.getOrderCode());
            } catch (Exception e) {
                log.error("Error when create GHN order order {}: {} (district_id={}, ward_code={})",
                        order.getOrderNumber(), e.getMessage(),
                        order.getShippingDistrictId(), order.getShippingWardCode());
            }
        }
    }

    @Override
    @Transactional
    public OrderResponse convertCartToOrder(UUID accountId, CreateOrderRequest request) {
        Shop shop = shopRepository.findById(request.getShopId())
                .orElseThrow(() -> new CustomException("Shop not found."));

        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("User not found."));

        UserAddress addr = userAddressRepository
                .findByIdAndUserIdAndDeletedFalse(request.getAddressId(), user.getId())
                .orElseThrow(() -> new CustomException("Address not found."));

        Cart cart = cartRepository.findByUserIdWithItems(user.getId())
                .orElseThrow(() -> new CustomException("Cart not found."));

        List<CartItem> cartItems = findActiveItemByProduct(cart, shop.getId());

        if (cartItems.isEmpty()) {
            throw new CustomException("There's no items in this cart from the shop.");
        }

        PaymentMethod paymentMethod = PaymentMethod.COD;
        if (request.getPaymentMethod() != null && !request.getPaymentMethod().isBlank()) {
            try {
                paymentMethod = PaymentMethod.valueOf(request.getPaymentMethod().trim().toUpperCase());
            } catch (Exception e) {
                log.warn("Invalid payment method: {}, defaulting to COD", request.getPaymentMethod());
            }
        }

        BigDecimal subtotal = getBigDecimal(cartItems);

        BigDecimal shippingFee = shippingService.quoteFee(
                shop, cartItems, addr.getDistrictId(), addr.getWardCode());

        String orderNumber = generateOrderNumber();

        Order order = new Order();
        order.setOrderNumber(orderNumber);
        order.setUser(user);
        order.setShop(shop);
        order.setPaymentMethod(paymentMethod);
        if (paymentMethod == PaymentMethod.COD) {
            order.setStatus(OrderStatus.CONFIRMED);
        } else {
            order.setStatus(OrderStatus.PENDING_PAYMENT);
        }
        order.setShippingName(addr.getReceiverName());
        order.setShippingPhone(addr.getReceiverPhone());
        order.setShippingAddress(addr.getAddressLine());
        order.setShippingCity(addr.getCity());
        order.setShippingDistrict(addr.getDistrict());
        order.setShippingWard(addr.getWard());
        order.setShippingDistrictId(addr.getDistrictId());
        order.setShippingWardCode(addr.getWardCode());
        order.setCreatedAt(LocalDateTime.now());

        order.setNotes(request.getNotes());
        order.setSubtotal(subtotal);
        order.setShippingFee(shippingFee);
        BigDecimal commissionRate = platformSettingService.getCommissionRate();
        BigDecimal platformCommission = subtotal.multiply(commissionRate).divide(BigDecimal.valueOf(100), 2,
                RoundingMode.HALF_UP);
        order.setPlatformCommission(platformCommission);
        order.setCommissionRate(commissionRate.doubleValue());
        order.calculateTotal();

        // 1. Persist Order first to avoid TransientPropertyValueException when
        // UserVoucher references it
        order = orderRepository.save(order);

        // 2. Apply Vouchers and recalculate total
        if (request.getShopVoucherCode() != null || request.getPlatformVoucherCode() != null) {
            voucherService.applyVouchersToOrder(order, request.getShopVoucherCode(), request.getPlatformVoucherCode());
        } else if (request.getVoucherCode() != null && !request.getVoucherCode().isBlank()) {
            voucherService.applyVoucherToOrder(order, request.getVoucherCode());
        }

        order.calculateTotal();
        order = orderRepository.save(order);

        for (CartItem cartItem : cartItems) {
            Product product = cartItem.getProduct();
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setProductName(product.getName());
            orderItem.setQuantity(cartItem.getQuantity());

            BigDecimal unitPrice = product.getBasePrice();
            if (cartItem.getVariantId() != null) {
                ProductVariant variant = productVariantRepository.findById(cartItem.getVariantId())
                        .filter(v -> !Boolean.TRUE.equals(v.getDeleted()))
                        .orElseThrow(() -> new CustomException("Biến thể sản phẩm không tồn tại: " + product.getName()));
                if (variant.getStock() != null && variant.getStock() < cartItem.getQuantity()) {
                    throw new CustomException("Biến thể (" + (variant.getColor() != null ? variant.getColor() : "")
                            + (variant.getSize() != null ? " " + variant.getSize() : "") + ") không đủ số lượng.");
                }
                int oldVStock = variant.getStock() != null ? variant.getStock() : 0;
                variant.setStock(variant.getStock() - cartItem.getQuantity());
                variant.setSold((variant.getSold() != null ? variant.getSold() : 0) + cartItem.getQuantity());
                productVariantRepository.save(variant);
                inventoryHistoryService.logInventoryChange(shop, product, variant, oldVStock, variant.getStock(), InventoryActionType.ORDER_PLACED, orderNumber, "Khách đặt đơn hàng: " + orderNumber);

                orderItem.setVariantId(variant.getId());
                orderItem.setVariantColor(variant.getColor());
                orderItem.setVariantSize(variant.getSize());
                if (variant.getPrice() != null) {
                    unitPrice = variant.getPrice();
                }
            }

            if (product.getQuantity() != null) {
                int oldPStock = product.getQuantity();
                product.setQuantity(Math.max(0, product.getQuantity() - cartItem.getQuantity()));
                inventoryHistoryService.logInventoryChange(shop, product, null, oldPStock, product.getQuantity(), InventoryActionType.ORDER_PLACED, orderNumber, "Khách đặt đơn hàng: " + orderNumber);
            }
            product.setSold((product.getSold() != null ? product.getSold() : 0) + cartItem.getQuantity());
            productRepository.save(product);

            orderItem.setUnitPrice(unitPrice);
            orderItem.calculateTotalPrice();
            orderItem.setCreatedAt(LocalDateTime.now());
            order.getItems().add(orderItem);
            orderItemsRepository.save(orderItem);
        }

        order.setStockDeducted(true);
        order = orderRepository.save(order);

        for (CartItem cartItem : cartItems) {
            cartItem.setDeleted(true);
            cartItemRepository.save(cartItem);
        }

        if (paymentMethod == PaymentMethod.COD) {
            escrowService.recordCodEscrow(order);
            tryCreateGHNOrder(order);
            order = orderRepository.save(order);
        }

        return OrderResponse.from(order);
    }

    @NotNull
    private BigDecimal getBigDecimal(List<CartItem> cartItems) {
        BigDecimal subtotal = BigDecimal.ZERO;

        for (CartItem cartItem : cartItems) {
            Product product = cartItem.getProduct();

            if (cartItem.getVariantId() != null) {
                ProductVariant variant = productVariantRepository.findById(cartItem.getVariantId())
                        .filter(v -> !Boolean.TRUE.equals(v.getDeleted()))
                        .orElseThrow(() -> new CustomException("Biến thể sản phẩm không tồn tại: " + product.getName()));
                if (variant.getStock() != null && variant.getStock() < cartItem.getQuantity()) {
                    throw new CustomException("Biến thể (" + (variant.getColor() != null ? variant.getColor() : "")
                            + (variant.getSize() != null ? " " + variant.getSize() : "") + ") của sản phẩm "
                            + product.getName() + " không đủ số lượng. Còn lại: " + variant.getStock());
                }
                BigDecimal unitPrice = variant.getPrice() != null ? variant.getPrice() : product.getBasePrice();
                subtotal = subtotal.add(unitPrice.multiply(BigDecimal.valueOf(cartItem.getQuantity())));
            } else {
                if (product.getQuantity() != null && product.getQuantity() < cartItem.getQuantity()) {
                    throw new CustomException(
                            "Sản phẩm " + product.getName()
                                    + " không đủ số lượng. Còn lại: " + product.getQuantity());
                }

                BigDecimal unitPrice = cartItem.getUnitPrice() != null ? cartItem.getUnitPrice() : product.getBasePrice();
                subtotal = subtotal.add(unitPrice.multiply(BigDecimal.valueOf(cartItem.getQuantity())));
            }
        }
        return subtotal;
    }

    private List<CartItem> findActiveItemByProduct(Cart cart, UUID shopId) {
        return cart.getActiveCartDetails().stream()
                .filter(i -> i.getProduct().getShop().getId().equals(shopId))
                .toList();
    }

    private String generateOrderNumber() {
        String datePrefix = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String baseNumber = "ORD-" + datePrefix + "-";
        int sequence = 1;
        String orderNumber = baseNumber + String.format("%04d", sequence);

        while (orderRepository.findByOrderNumber(orderNumber).isPresent()) {
            sequence++;
            orderNumber = baseNumber + String.format("%04d", sequence);
        }
        return orderNumber;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ShopRankingItem> getShopRanking() {
        List<Object[]> rows = orderRepository.getShopRankingByRevenue();
        List<ShopRankingItem> result = new ArrayList<>();
        int rank = 1;
        for (Object[] row : rows) {
            UUID shopId = (UUID) row[0];
            String shopName = (String) row[1];
            BigDecimal totalRevenue = row[2] != null ? (BigDecimal) row[2] : BigDecimal.ZERO;
            long orderCount = row[3] != null ? ((Number) row[3]).longValue() : 0L;
            result.add(ShopRankingItem.builder()
                    .rank(rank++)
                    .shopId(shopId)
                    .shopName(shopName)
                    .totalRevenue(totalRevenue)
                    .orderCount(orderCount)
                    .build());
        }
        return result;
    }
}
