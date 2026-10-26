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
import com.marketplace.ecommerce.payment.entity.Escrow;
import com.marketplace.ecommerce.payment.entity.Payment;
import com.marketplace.ecommerce.payment.repository.EscrowRepository;
import com.marketplace.ecommerce.payment.repository.PaymentRepository;
import com.marketplace.ecommerce.payment.valueObjects.EscrowStatus;
import com.marketplace.ecommerce.payment.valueObjects.PaymentMethod;
import com.marketplace.ecommerce.payment.valueObjects.PaymentStatus;
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
import com.marketplace.ecommerce.wallet.entity.Wallet;
import com.marketplace.ecommerce.wallet.repository.WalletRepository;
import com.marketplace.ecommerce.wallet.valueObjects.WalletType;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderSeeder {

    private static final int TARGET_ORDER_COUNT = 242;

    private final OrderRepository orderRepository;
    private final OrderItemsRepository orderItemsRepository;
    private final ProductRepository productRepository;
    private final ShopRepository shopRepository;
    private final UserRepository userRepository;
    private final UserAddressRepository userAddressRepository;
    private final CommissionRepository commissionRepository;
    private final CommissionCalculationService commissionCalculationService;
    private final EscrowRepository escrowRepository;
    private final PaymentRepository paymentRepository;
    private final WalletRepository walletRepository;
    private final JdbcTemplate jdbcTemplate;
    private final EntityManager entityManager;

    private final Random random = new Random();

    public void seed() {
        log.info("Starting progressive multi-vendor order seeding (14-day backwards distribution)...");

        // 1. Chuẩn hóa và đồng bộ các đơn hàng đã tồn tại (nếu có từ trước mà bị lệch ngày hoặc chưa đủ)
        normalizeExistingOrders();

        long currentCount = orderRepository.count();
        if (currentCount >= TARGET_ORDER_COUNT) {
            log.info("Order seed satisfied: {} orders present (target: {})", currentCount, TARGET_ORDER_COUNT);
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

        // Cache products theo từng shop để tối ưu tốc độ seeding
        Map<UUID, List<Product>> shopProductsMap = new HashMap<>();
        for (Shop s : shops) {
            List<Product> prods = productRepository.findAll().stream()
                    .filter(p -> p.getShop() != null
                            && p.getShop().getId().equals(s.getId())
                            && !Boolean.TRUE.equals(p.getDeleted())
                            && p.getStatus() == ProductStatus.PUBLISHED)
                    .collect(Collectors.toList());
            if (!prods.isEmpty()) {
                shopProductsMap.put(s.getId(), prods);
            }
        }

        List<Shop> availableShops = shops.stream()
                .filter(s -> shopProductsMap.containsKey(s.getId()))
                .collect(Collectors.toList());

        if (availableShops.isEmpty()) {
            log.warn("No shops with published products available for order seeding.");
            return;
        }

        int disputedOrdersRemaining = 2; // Gắn 2 đơn tranh chấp mẫu trên dashboard

        // 2. Chạy từ 28 ngày trước trở ngược về thời điểm chạy dự án hiện tại (Day 0)
        // Trong đó 14 ngày gần nhất (Day 0 -> Day 14) được ưu tiên tối đa với nhiều đơn hoàn thành (COMPLETED)
        for (int daysAgo = 28; daysAgo >= 0; daysAgo--) {
            int ordersToCreateToday = getTargetOrdersForDay(daysAgo);

            for (int orderIdx = 0; orderIdx < ordersToCreateToday; orderIdx++) {
                User customer = customers.get(random.nextInt(customers.size()));
                Shop shop = availableShops.get(random.nextInt(availableShops.size()));

                UserAddress address = userAddressRepository
                        .findAllByUserIdAndDeletedFalseOrderByIsDefaultDescIdDesc(customer.getId())
                        .stream()
                        .findFirst()
                        .orElse(null);

                if (address == null) {
                    continue;
                }

                List<Product> shopProducts = shopProductsMap.get(shop.getId());
                if (shopProducts == null || shopProducts.isEmpty()) {
                    continue;
                }

                // Thời điểm tạo đơn: lùi về đúng ngày daysAgo
                LocalDateTime createdAt = buildRealisticTimestamp(daysAgo);

                // Trạng thái đơn hàng: đa số là COMPLETED theo yêu cầu "thêm nhiều đơn đã hoàn thành"
                OrderStatus status = determineStatusForDay(daysAgo, orderIdx);

                boolean isDisputed = false;
                if (disputedOrdersRemaining > 0 && (daysAgo == 2 || daysAgo == 3) && status == OrderStatus.DELIVERED) {
                    isDisputed = true;
                    disputedOrdersRemaining--;
                }

                Order order = initializeOrder(
                        customer,
                        shop,
                        address,
                        status,
                        "Đơn hàng #" + (orderIdx + 1),
                        createdAt);

                // Thêm 1 - 3 sản phẩm điện tử
                int itemCount = ThreadLocalRandom.current().nextInt(1, 3);
                Set<UUID> usedIds = new HashSet<>();
                int added = 0;
                while (added < itemCount && usedIds.size() < shopProducts.size()) {
                    Product p = shopProducts.get(random.nextInt(shopProducts.size()));
                    if (!usedIds.contains(p.getId())) {
                        usedIds.add(p.getId());
                        int qty = (p.getBasePrice() != null && p.getBasePrice().compareTo(BigDecimal.valueOf(10_000_000)) > 0)
                                ? 1
                                : ThreadLocalRandom.current().nextInt(1, 3);
                        initializeOrderItem(order, p, qty, p.getBasePrice());
                        added++;
                    }
                }

                // 3. Tính toán hoa hồng sàn cho đơn DELIVERED & COMPLETED
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

                // 4. Khởi tạo Payment và Escrow
                initializePaymentAndEscrow(order, isDisputed);

                // Bắt buộc flush Hibernate Session để ghi nhận row trước khi dùng JDBC trực tiếp
                orderRepository.flush();

                // 5. Ghi đè chính xác ngày giờ vào PostgreSQL bằng JDBC (bỏ qua JPA Auditing và updatable=false)
                syncOrderTimestampsDirectly(order, createdAt, status);
            }
        }

        log.info("Progressive order seeding complete. Total orders in system: {}", orderRepository.count());
    }

    /**
     * Chuẩn hóa và đồng bộ các đơn hàng đã tồn tại:
     * - Nếu phát hiện các đơn hàng bị dồn cục vào 1 ngày (do lỗi JPA Auditing ghi đè ngày chạy dự án),
     *   tự động phân bổ đều ngược về 14 ngày trước và cập nhật lại timestamp thực tế.
     * - Đảm bảo đơn cũ có trạng thái COMPLETED (thêm nhiều đơn hoàn thành) và có đầy đủ Payment/Escrow/Commission.
     */
    private void normalizeExistingOrders() {
        List<Order> allOrders = orderRepository.findAll();
        if (allOrders.isEmpty()) return;

        Map<LocalDate, Long> countByDate = allOrders.stream()
                .filter(o -> o.getCreatedAt() != null)
                .collect(Collectors.groupingBy(o -> o.getCreatedAt().toLocalDate(), Collectors.counting()));

        long maxCountOnDate = countByDate.values().stream().mapToLong(Long::longValue).max().orElse(0L);
        boolean isClustered = maxCountOnDate > (allOrders.size() * 0.35);

        if (isClustered) {
            log.info("Detected {}/{} orders clustered on a single date. Auto-redistributing across 14-day timeline...",
                    maxCountOnDate, allOrders.size());
            for (int i = 0; i < allOrders.size(); i++) {
                Order o = allOrders.get(i);
                int daysAgo = (i % 15); // Rải đều 0 -> 14 ngày trước
                LocalDateTime createdAt = buildRealisticTimestamp(daysAgo);
                OrderStatus status = determineStatusForDay(daysAgo, i);

                o.setStatus(status);
                o.setReceivedByBuyer(status == OrderStatus.COMPLETED);
                orderRepository.save(o);

                if (status == OrderStatus.DELIVERED || status == OrderStatus.COMPLETED) {
                    Commission c = initializeCommission(o);
                    if (c != null) {
                        o.setPlatformCommission(c.getTotalCommission());
                        orderRepository.save(o);
                    }
                }
                if (status != OrderStatus.PENDING_PAYMENT && status != OrderStatus.CANCELLED) {
                    initializePaymentAndEscrow(o, false);
                }

                orderRepository.flush();
                syncOrderTimestampsDirectly(o, createdAt, status);
            }
            log.info("Successfully redistributed {} existing orders across 14 days backwards.", allOrders.size());
        }
    }

    /**
     * Số lượng đơn mục tiêu phân bổ ngược về 14 ngày trước:
     * - Day 0 (Hôm nay): 14 đơn
     * - Day 1 (Hôm qua): 15 đơn
     * - Day 2: 14 đơn
     * - Day 3: 14 đơn
     * - Day 4 -> Day 14 (11 ngày): 13 đơn/ngày (~143 đơn)
     * => Tổng cộng 14 ngày gần nhất có ~200 đơn với hơn 150 đơn COMPLETED!
     * - Day 15 -> Day 28: 3 đơn/ngày (~42 đơn dữ liệu lịch sử)
     */
    private int getTargetOrdersForDay(int daysAgo) {
        if (daysAgo == 0) return 14;
        if (daysAgo == 1) return 15;
        if (daysAgo == 2) return 14;
        if (daysAgo == 3) return 14;
        if (daysAgo <= 14) return 13;
        if (daysAgo <= 28) return 3;
        return 0;
    }

    /**
     * Xác định trạng thái đơn hàng theo số ngày tuổi (tối ưu số đơn COMPLETED):
     * - >= 4 ngày trước: 88% COMPLETED, 6% CANCELLED, 6% REFUNDED.
     * - 3 ngày trước: 85% COMPLETED, 10% DELIVERED, 5% CANCELLED.
     * - 2 ngày trước: 75% COMPLETED, 15% DELIVERED, 10% SHIPPING.
     * - 1 ngày trước: 60% COMPLETED, 20% DELIVERED, 15% SHIPPING, 5% PROCESSING.
     * - Hôm nay (0 ngày): 35% COMPLETED (hỏa tốc), 25% DELIVERED, 25% SHIPPING, 15% CONFIRMED.
     */
    private OrderStatus determineStatusForDay(int daysAgo, int orderIdx) {
        if (daysAgo >= 4) {
            int r = (orderIdx * 19 + daysAgo * 7) % 100;
            if (r < 88) return OrderStatus.COMPLETED;
            if (r < 94) return OrderStatus.CANCELLED;
            return OrderStatus.REFUNDED;
        } else if (daysAgo == 3) {
            int r = (orderIdx * 23) % 100;
            if (r < 85) return OrderStatus.COMPLETED;
            if (r < 95) return OrderStatus.DELIVERED;
            return OrderStatus.CANCELLED;
        } else if (daysAgo == 2) {
            int r = (orderIdx * 31) % 100;
            if (r < 75) return OrderStatus.COMPLETED;
            if (r < 90) return OrderStatus.DELIVERED;
            return OrderStatus.SHIPPING;
        } else if (daysAgo == 1) {
            int r = (orderIdx * 37) % 100;
            if (r < 60) return OrderStatus.COMPLETED;
            if (r < 80) return OrderStatus.DELIVERED;
            if (r < 95) return OrderStatus.SHIPPING;
            return OrderStatus.PROCESSING;
        } else {
            int r = (orderIdx * 41) % 100;
            if (r < 35) return OrderStatus.COMPLETED;
            if (r < 60) return OrderStatus.DELIVERED;
            if (r < 85) return OrderStatus.SHIPPING;
            return OrderStatus.CONFIRMED;
        }
    }

    private LocalDateTime buildRealisticTimestamp(int daysAgo) {
        LocalDate date = LocalDate.now().minusDays(daysAgo);

        int hour;
        if (daysAgo == 0) {
            int currentHour = LocalDateTime.now().getHour();
            int maxHour = Math.max(8, Math.min(currentHour, 22));
            int minHour = Math.min(8, maxHour);
            hour = ThreadLocalRandom.current().nextInt(minHour, maxHour + 1);
        } else {
            int[] peakHours = {8, 9, 10, 11, 13, 14, 15, 16, 17, 19, 20, 21, 22};
            hour = peakHours[random.nextInt(peakHours.length)];
        }

        int minute = ThreadLocalRandom.current().nextInt(0, 60);
        int second = ThreadLocalRandom.current().nextInt(0, 60);

        LocalDateTime ldt = date.atTime(hour, minute, second);
        if (ldt.isAfter(LocalDateTime.now())) {
            ldt = LocalDateTime.now().minusMinutes(ThreadLocalRandom.current().nextInt(5, 30));
        }
        return ldt;
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
                .receivedByBuyer(status == OrderStatus.COMPLETED)
                .stockDeducted(status != OrderStatus.PENDING_PAYMENT && status != OrderStatus.CANCELLED)
                .items(new HashSet<>())
                .build();

        order.setCreatedAt(createdAt);
        order.setUpdatedAt(createdAt);

        return orderRepository.save(order);
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

        return saved;
    }

    private BigDecimal randomShippingFee() {
        return BigDecimal.valueOf(ThreadLocalRandom.current().nextLong(16000, 42001));
    }

    private void initializePaymentAndEscrow(Order order, boolean isDisputed) {
        if (order == null || order.getId() == null) return;
        if (order.getStatus() == OrderStatus.PENDING_PAYMENT || order.getStatus() == OrderStatus.CANCELLED) {
            return;
        }

        User customer = order.getUser();
        Shop shop = order.getShop();
        if (customer == null || shop == null || shop.getUser() == null) {
            return;
        }

        // 1. Payment Record
        Payment payment = paymentRepository.findByOrderId(order.getId())
                .orElseGet(() -> {
                    PaymentMethod method = (order.getId().hashCode() % 2 == 0)
                            ? PaymentMethod.WALLET
                            : PaymentMethod.VNPAY;
                    LocalDateTime payTime = order.getCreatedAt() != null
                            ? order.getCreatedAt().plusMinutes(ThreadLocalRandom.current().nextInt(2, 12))
                            : LocalDateTime.now();

                    Payment p = Payment.builder()
                            .order(order)
                            .amount(order.getTotal())
                            .method(method)
                            .status(PaymentStatus.SUCCESS)
                            .txnRef("PAY-" + order.getOrderNumber())
                            .providerTxnNo("TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                            .createdAt(payTime)
                            .build();
                    p.setCreatedAt(payTime);
                    p.setUpdatedAt(payTime);
                    return paymentRepository.save(p);
                });

        // 2. Escrow Record
        escrowRepository.findByOrderId(order.getId())
                .orElseGet(() -> {
                    Wallet buyerWallet = walletRepository.findByUserId(customer.getId()).orElse(null);
                    Wallet sellerWallet = walletRepository.findByUserId(shop.getUser().getId()).orElse(null);
                    Wallet escrowWallet = walletRepository.findByWalletType(WalletType.ESCROW).orElse(null);

                    if (buyerWallet == null || escrowWallet == null) {
                        return null;
                    }

                    EscrowStatus escrowStatus;
                    if (isDisputed) {
                        escrowStatus = EscrowStatus.DISPUTED;
                    } else if (order.getStatus() == OrderStatus.COMPLETED) {
                        escrowStatus = EscrowStatus.RELEASED;
                    } else if (order.getStatus() == OrderStatus.REFUNDED) {
                        escrowStatus = EscrowStatus.REFUNDED;
                    } else {
                        escrowStatus = EscrowStatus.HELD;
                    }

                    LocalDateTime escrowTime = payment != null && payment.getCreatedAt() != null
                            ? payment.getCreatedAt()
                            : order.getCreatedAt();

                    Escrow e = Escrow.builder()
                            .order(order)
                            .buyerWallet(buyerWallet)
                            .sellerWallet(sellerWallet)
                            .escrowWallet(escrowWallet)
                            .amount(order.getTotal())
                            .status(escrowStatus)
                            .createdAt(escrowTime)
                            .build();
                    e.setCreatedAt(escrowTime);
                    e.setUpdatedAt(order.getUpdatedAt() != null ? order.getUpdatedAt() : escrowTime);
                    return escrowRepository.save(e);
                });
    }

    private Commission initializeCommission(Order order) {
        if (order == null || order.getId() == null) {
            return null;
        }

        return commissionRepository.findByOrderId(order.getId())
                .orElseGet(() -> {
                    if (order.getStatus() != OrderStatus.DELIVERED
                            && order.getStatus() != OrderStatus.COMPLETED) {
                        return null;
                    }

                    if (order.getShop() == null || order.getShop().getUser() == null
                            || order.getShop().getUser().getId() == null) {
                        return null;
                    }

                    if (order.getItems() == null || order.getItems().isEmpty()) {
                        return null;
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

                    return commissionRepository.save(commission);
                });
    }

    /**
     * Bỏ qua cơ chế JPA Auditing (@CreatedDate và updatable=false) để ghi thẳng các mốc thời gian
     * quá khứ từ 14 ngày trước vào PostgreSQL. Đảm bảo toàn bộ Order, Payment, Escrow, Commission
     * và OrderItems có thời điểm diễn ra khớp hoàn hảo theo dòng thời gian thực tế.
     */
    private void syncOrderTimestampsDirectly(Order order, LocalDateTime createdAt, OrderStatus status) {
        if (order == null || order.getId() == null) return;

        LocalDateTime deliveredAt = null;
        LocalDateTime receivedAt = null;
        LocalDateTime updatedAt = null;

        if (status == OrderStatus.COMPLETED) {
            deliveredAt = createdAt.plusHours(ThreadLocalRandom.current().nextInt(12, 36));
            if (deliveredAt.isAfter(LocalDateTime.now())) {
                deliveredAt = LocalDateTime.now().minusMinutes(ThreadLocalRandom.current().nextInt(10, 30));
            }
            receivedAt = deliveredAt.plusHours(ThreadLocalRandom.current().nextInt(2, 8));
            if (receivedAt.isAfter(LocalDateTime.now())) {
                receivedAt = LocalDateTime.now().minusMinutes(ThreadLocalRandom.current().nextInt(1, 5));
            }
            updatedAt = receivedAt;
        } else if (status == OrderStatus.DELIVERED) {
            deliveredAt = createdAt.plusHours(ThreadLocalRandom.current().nextInt(12, 36));
            if (deliveredAt.isAfter(LocalDateTime.now())) {
                deliveredAt = LocalDateTime.now().minusMinutes(ThreadLocalRandom.current().nextInt(10, 30));
            }
            updatedAt = deliveredAt;
        } else if (status == OrderStatus.CANCELLED) {
            updatedAt = createdAt.plusHours(ThreadLocalRandom.current().nextInt(1, 4));
            if (updatedAt.isAfter(LocalDateTime.now())) {
                updatedAt = LocalDateTime.now().minusMinutes(ThreadLocalRandom.current().nextInt(5, 20));
            }
        } else if (status == OrderStatus.REFUNDED) {
            deliveredAt = createdAt.plusHours(ThreadLocalRandom.current().nextInt(12, 36));
            if (deliveredAt.isAfter(LocalDateTime.now())) {
                deliveredAt = LocalDateTime.now().minusMinutes(ThreadLocalRandom.current().nextInt(10, 30));
            }
            receivedAt = deliveredAt.plusHours(ThreadLocalRandom.current().nextInt(2, 8));
            if (receivedAt.isAfter(LocalDateTime.now())) {
                receivedAt = LocalDateTime.now().minusMinutes(ThreadLocalRandom.current().nextInt(1, 5));
            }
            updatedAt = receivedAt.plusDays(1);
            if (updatedAt.isAfter(LocalDateTime.now())) {
                updatedAt = LocalDateTime.now();
            }
        } else {
            updatedAt = createdAt.plusMinutes(ThreadLocalRandom.current().nextInt(15, 60));
            if (updatedAt.isAfter(LocalDateTime.now())) {
                updatedAt = LocalDateTime.now();
            }
        }

        Timestamp createdTs = Timestamp.valueOf(createdAt);
        Timestamp updatedTs = Timestamp.valueOf(updatedAt);
        Timestamp deliveredTs = deliveredAt != null ? Timestamp.valueOf(deliveredAt) : null;
        Timestamp receivedTs = receivedAt != null ? Timestamp.valueOf(receivedAt) : null;

        // 1. Cập nhật Orders
        jdbcTemplate.update("""
            UPDATE orders
            SET created_at = ?, updated_at = ?, delivered_at = ?, received_at = ?
            WHERE id = ?
        """, createdTs, updatedTs, deliveredTs, receivedTs, order.getId());

        // 2. Cập nhật OrderItems
        jdbcTemplate.update("""
            UPDATE order_items
            SET created_at = ?, updated_at = ?
            WHERE order_id = ?
        """, createdTs, updatedTs, order.getId());

        // 3. Cập nhật Payments
        LocalDateTime payTime = createdAt.plusMinutes(ThreadLocalRandom.current().nextInt(2, 10));
        Timestamp payTs = Timestamp.valueOf(payTime);
        jdbcTemplate.update("""
            UPDATE payments
            SET created_at = ?, updated_at = ?
            WHERE order_id = ?
        """, payTs, payTs, order.getId());

        // 4. Cập nhật Escrows
        Timestamp escrowUpdatedTs = (status == OrderStatus.COMPLETED && receivedTs != null) ? receivedTs : payTs;
        jdbcTemplate.update("""
            UPDATE escrows
            SET created_at = ?, updated_at = ?
            WHERE order_id = ?
        """, payTs, escrowUpdatedTs, order.getId());

        // 5. Cập nhật Commissions
        jdbcTemplate.update("""
            UPDATE commissions
            SET created_at = ?
            WHERE order_id = ?
        """, updatedTs, order.getId());
    }
}
