package com.marketplace.ecommerce.config.seed;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.entity.UserAddress;
import com.marketplace.ecommerce.auth.repository.UserAddressRepository;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.entity.OrderItem;
import com.marketplace.ecommerce.order.repository.OrderItemsRepository;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.platform.entity.Commission;
import com.marketplace.ecommerce.platform.entity.CommissionItem;
import com.marketplace.ecommerce.platform.repository.CommissionRepository;
import com.marketplace.ecommerce.platform.service.CommissionCalculationService;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.entity.ProductCategory;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.product.valueObjects.ConditionGrade;
import com.marketplace.ecommerce.product.valueObjects.ProductStatus;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.shop.valueObjects.ShopStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderSeeder {

    private static final int TARGET_ORDER_COUNT = 150;

    private final OrderRepository orderRepository;
    private final OrderItemsRepository orderItemsRepository;
    private final ProductRepository productRepository;
    private final ShopRepository shopRepository;
    private final UserRepository userRepository;
    private final UserAddressRepository userAddressRepository;
    private final CommissionRepository commissionRepository;
    private final CommissionCalculationService commissionCalculationService;

    private final Random random = new Random();

    public void seed() {
        log.info("Seeding multi-vendor orders...");

        long existingOrderCount = orderRepository.count();
        if (existingOrderCount >= TARGET_ORDER_COUNT) {
            log.debug("Skip seed orders: already {} orders (target {})", existingOrderCount, TARGET_ORDER_COUNT);
            return;
        }

        List<User> customers = userRepository.findAll().stream()
                .filter(u -> u.getAccount() != null && u.getAccount().getRole() != null
                        && "CUSTOMER".equalsIgnoreCase(u.getAccount().getRole().getRoleName()))
                .collect(Collectors.toList());

        List<Shop> shops = shopRepository.findAll().stream()
                .filter(s -> s.getStatus() == ShopStatus.ACTIVE)
                .collect(Collectors.toList());

        if (customers.isEmpty() || shops.isEmpty()) {
            log.warn("Cannot seed orders: Customers or active shops are missing.");
            return;
        }

        int needToCreate = (int) (TARGET_ORDER_COUNT - existingOrderCount);
        List<OrderStatus> statuses = List.of(
                OrderStatus.PENDING_PAYMENT,
                OrderStatus.CONFIRMED,
                OrderStatus.PROCESSING,
                OrderStatus.SHIPPING,
                OrderStatus.DELIVERED,
                OrderStatus.COMPLETED,
                OrderStatus.CANCELLED);

        for (int i = 0; i < needToCreate; i++) {
            User customer = customers.get(random.nextInt(customers.size()));
            Shop shop = shops.get(random.nextInt(shops.size()));

            UserAddress address = userAddressRepository
                    .findAllByUserIdAndDeletedFalseOrderByIsDefaultDescIdDesc(customer.getId())
                    .stream()
                    .findFirst()
                    .orElse(null);

            if (address == null) {
                log.warn("Skip order seed because customer {} has no address", customer.getFullName());
                continue;
            }

            List<Product> shopProducts = productRepository.findAll().stream()
                    .filter(p -> p.getShop() != null
                            && p.getShop().getId().equals(shop.getId())
                            && !Boolean.TRUE.equals(p.getDeleted())
                            && p.getStatus() == ProductStatus.PUBLISHED)
                    .collect(Collectors.toList());

            if (shopProducts.isEmpty()) {
                log.warn("Skip order seed because shop {} has no published products", shop.getName());
                continue;
            }

            OrderStatus status = statuses.get(random.nextInt(statuses.size()));
            LocalDateTime createdAt = LocalDateTime.now()
                    .minusDays(ThreadLocalRandom.current().nextInt(1, 120));

            Order order = initializeOrder(
                    customer,
                    shop,
                    address,
                    status,
                    "Đơn hàng demo đa shop #" + (i + 1),
                    createdAt);

            int itemCount = ThreadLocalRandom.current().nextInt(1, 4);
            HashSet<UUID> usedProductIds = new HashSet<>();
            int addedItems = 0;

            while (addedItems < itemCount && usedProductIds.size() < shopProducts.size()) {
                Product product = shopProducts.get(random.nextInt(shopProducts.size()));
                if (usedProductIds.contains(product.getId())) {
                    continue;
                }

                usedProductIds.add(product.getId());
                int quantity = ThreadLocalRandom.current().nextInt(1, 3);
                initializeOrderItem(order, product, quantity, product.getBasePrice());
                addedItems++;
            }

            if (status == OrderStatus.DELIVERED || status == OrderStatus.COMPLETED) {
                Commission commission = initializeCommission(order);
                if (commission != null) {
                    order.setPlatformCommission(commission.getTotalCommission());
                    if (commission.getItems() != null && !commission.getItems().isEmpty()) {
                        order.setCommissionRate(commission.getItems().get(0).getCommissionRate().doubleValue());
                    }
                    orderRepository.save(order);
                }
            }
        }

        log.info("Seeded {} additional multi-vendor orders", needToCreate);
    }

    private Order initializeOrder(User user, Shop shop, UserAddress address,
                                  OrderStatus status, String notes, LocalDateTime createdAt) {
        String orderNumber = "ORD-" + createdAt.format(DateTimeFormatter.ofPattern("yyyyMMdd"))
                + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        if (orderRepository.findByOrderNumber(orderNumber).isPresent()) {
            orderNumber = "ORD-" + System.currentTimeMillis() + "-"
                    + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        }

        Order order = Order.builder()
                .orderNumber(orderNumber)
                .user(user)
                .shop(shop)
                .status(status)
                .shippingName(address.getReceiverName())
                .shippingPhone(address.getReceiverPhone())
                .shippingAddress(address.getAddressLine())
                .shippingCity(address.getCity())
                .shippingDistrict(address.getDistrict())
                .shippingWard(address.getWard())
                .shippingDistrictId(address.getDistrictId())
                .shippingWardCode(address.getWardCode())
                .notes(notes)
                .subtotal(BigDecimal.ZERO)
                .shippingFee(randomShippingFee())
                .total(BigDecimal.ZERO)
                .receivedByBuyer(false)
                .stockDeducted(false)
                .items(new HashSet<>())
                .build();

        order.setCreatedAt(createdAt);
        order.setUpdatedAt(createdAt);

        boolean pastPayment = status != OrderStatus.PENDING_PAYMENT
                && status != OrderStatus.CANCELLED;

        order.setStockDeducted(pastPayment);

        if (status == OrderStatus.DELIVERED) {
            order.setDeliveredAt(LocalDateTime.now().minusHours(ThreadLocalRandom.current().nextInt(2, 48)));
            order.setReceivedByBuyer(false);
        } else if (status == OrderStatus.COMPLETED) {
            LocalDateTime delivered = createdAt.plusDays(ThreadLocalRandom.current().nextInt(1, 3));
            order.setDeliveredAt(delivered);
            order.setReceivedByBuyer(true);
            order.setReceivedAt(delivered.plusHours(ThreadLocalRandom.current().nextInt(1, 24)));
        }

        Order saved = orderRepository.save(order);
        log.info("Created order: {} with status: {}", orderNumber, status);
        return saved;
    }

    private OrderItem initializeOrderItem(Order order, Product product, Integer quantity, BigDecimal unitPrice) {
        OrderItem item = OrderItem.builder()
                .order(order)
                .product(product)
                .productName(product.getName())
                .quantity(quantity)
                .unitPrice(unitPrice)
                .totalPrice(BigDecimal.ZERO)
                .build();

        item.calculateTotalPrice();

        order.getItems().add(item);

        BigDecimal subtotal = order.getItems().stream()
                .map(OrderItem::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        order.setSubtotal(subtotal);
        order.calculateTotal();

        OrderItem saved = orderItemsRepository.save(item);
        orderRepository.save(order);

        log.info("Created order item: {} x{} for order: {}", product.getName(), quantity, order.getOrderNumber());
        return saved;
    }

    private BigDecimal randomShippingFee() {
        return BigDecimal.valueOf(ThreadLocalRandom.current().nextLong(16000, 42001));
    }

    private Commission initializeCommission(Order order) {
        if (order == null || order.getId() == null) {
            throw new IllegalArgumentException("Order is null");
        }

        return commissionRepository.findByOrderId(order.getId())
                .orElseGet(() -> {
                    if (order.getStatus() != OrderStatus.DELIVERED
                            && order.getStatus() != OrderStatus.COMPLETED) {
                        throw new IllegalStateException("Order is not eligible for commission: " + order.getStatus());
                    }

                    if (order.getShop() == null || order.getShop().getUser() == null
                            || order.getShop().getUser().getId() == null) {
                        throw new IllegalStateException("Seller not found for order: " + order.getOrderNumber());
                    }

                    if (order.getItems() == null || order.getItems().isEmpty()) {
                        throw new IllegalStateException("Order items not found for order: " + order.getOrderNumber());
                    }

                    BigDecimal orderAmount = order.getSubtotal() == null ? BigDecimal.ZERO : order.getSubtotal();

                    Commission commission = Commission.builder()
                            .orderId(order.getId())
                            .sellerId(order.getShop().getUser().getId())
                            .orderAmount(orderAmount)
                            .totalCommission(BigDecimal.ZERO)
                            .items(new ArrayList<>())
                            .build();

                    BigDecimal totalCommission = BigDecimal.ZERO;
                    BigDecimal lastEffectiveRate = BigDecimal.valueOf(5.0);

                    for (OrderItem orderItem : order.getItems()) {
                        BigDecimal unitPrice = orderItem.getUnitPrice() == null ? BigDecimal.ZERO : orderItem.getUnitPrice();
                        int quantity = orderItem.getQuantity() == null ? 0 : orderItem.getQuantity();

                        BigDecimal lineAmount = unitPrice.multiply(BigDecimal.valueOf(quantity));

                        ProductCategory itemCategory = orderItem.getProduct() != null
                                ? orderItem.getProduct().getProductCategory()
                                : null;
                        ConditionGrade itemCondition = orderItem.getProduct() != null
                                ? orderItem.getProduct().getConditionGrade()
                                : ConditionGrade.GRADE_NEW;

                        BigDecimal itemCommissionRate = commissionCalculationService.calculateFinalRate(
                                order.getShop(), itemCategory, itemCondition);
                        lastEffectiveRate = itemCommissionRate;

                        BigDecimal commissionAmount = lineAmount
                                .multiply(itemCommissionRate)
                                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

                        CommissionItem commissionItem = CommissionItem.builder()
                                .commission(commission)
                                .orderItemId(orderItem.getId())
                                .productName(orderItem.getProductName())
                                .unitPrice(unitPrice)
                                .quantity(quantity)
                                .commissionRate(itemCommissionRate)
                                .commissionAmount(commissionAmount)
                                .build();

                        commission.getItems().add(commissionItem);
                        totalCommission = totalCommission.add(commissionAmount);
                    }

                    commission.setTotalCommission(totalCommission);
                    order.setPlatformCommission(totalCommission);
                    order.setCommissionRate(lastEffectiveRate.doubleValue());

                    Commission saved = commissionRepository.save(commission);
                    log.info("Created dynamic commission for order: {} with totalCommission={}, effectiveRate={}%",
                            order.getOrderNumber(), totalCommission, lastEffectiveRate);
                    return saved;
                });
    }
}
