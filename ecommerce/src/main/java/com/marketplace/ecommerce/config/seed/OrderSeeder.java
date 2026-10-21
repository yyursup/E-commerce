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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class OrderSeeder {

    private static final int TARGET_ORDER_COUNT = 260;

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

    private final Random random = new Random();

    public void seed() {
        log.info("Starting progressive multi-vendor order seeding...");

        // 1. Chuẩn hóa và đồng bộ các đơn hàng đã tồn tại (nếu có từ lần seed trước)
        normalizeExistingOrders();

        long currentCount = orderRepository.count();
        if (currentCount >= TARGET_ORDER_COUNT) {
            log.info("Order seed already satisfied: {} orders present (target: {})", currentCount, TARGET_ORDER_COUNT);
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

        // Cache products by shop to avoid querying inside tight loops
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

        int disputedOrdersRemaining = 2; // Tạo 2 đơn tranh chấp mẫu trên dashboard

        // 2. Tạo đơn hàng trải dài theo dòng thời gian từ 75 ngày trước đến hôm nay
        // Phân bổ mật độ hình phễu tăng trưởng (Growth Curve)
        for (int daysAgo = 75; daysAgo >= 0; daysAgo--) {
            if (orderRepository.count() >= TARGET_ORDER_COUNT) {
                break;
            }

            int ordersToCreateToday = getTargetOrdersForDay(daysAgo);

            for (int orderIdx = 0; orderIdx < ordersToCreateToday; orderIdx++) {
                if (orderRepository.count() >= TARGET_ORDER_COUNT) {
                    break;
                }

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

                // Thời điểm tạo đơn: rải đều trong các khung giờ mua sắm cao điểm
                LocalDateTime createdAt = buildRealisticTimestamp(daysAgo);

                // Trạng thái đơn hàng phù hợp hoàn hảo với độ tuổi của đơn
                OrderStatus status = determineStatusForDay(daysAgo, orderIdx);

                boolean isDisputed = false;
                if (disputedOrdersRemaining > 0 && (daysAgo == 1 || daysAgo == 2) && status == OrderStatus.DELIVERED) {
                    isDisputed = true;
                    disputedOrdersRemaining--;
                }

                Order order = initializeOrder(
                        customer,
                        shop,
                        address,
                        status,
                        "Đơn hàng công nghệ #" + (orderIdx + 1),
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
            }
        }

        log.info("Progressive order seeding complete. Total orders in system: {}", orderRepository.count());
    }

    /**
     * Chuẩn hóa và đồng bộ các đơn hàng cũ nếu đã tồn tại từ các đợt seed trước:
     * - Chuyển các đơn > 7 ngày cũ đang bị kẹt ở SHIPPING/PROCESSING sang COMPLETED
     * - Bổ sung Payment & Escrow còn thiếu để dữ liệu kế toán và thống kê khớp 100%
     */
    private void normalizeExistingOrders() {
        List<Order> allOrders = orderRepository.findAll();
        if (allOrders.isEmpty()) return;

        LocalDateTime now = LocalDateTime.now();
        int fixedCount = 0;

        for (Order o : allOrders) {
            long daysAgo = o.getCreatedAt() != null ? ChronoUnit.DAYS.between(o.getCreatedAt(), now) : 0;

            // Đơn > 7 ngày không thể còn SHIPPING hoặc PROCESSING
            if (daysAgo > 7) {
                if (o.getStatus() == OrderStatus.SHIPPING || o.getStatus() == OrderStatus.PROCESSING
                        || o.getStatus() == OrderStatus.CONFIRMED) {
                    o.setStatus(OrderStatus.COMPLETED);
                    o.setReceivedByBuyer(true);
                    LocalDateTime del = o.getCreatedAt().plusDays(2);
                    o.setDeliveredAt(del);
                    o.setReceivedAt(del.plusHours(6));
                    orderRepository.save(o);
                    fixedCount++;
                } else if (o.getStatus() == OrderStatus.PENDING_PAYMENT) {
                    o.setStatus(OrderStatus.CANCELLED);
                    orderRepository.save(o);
                    fixedCount++;
                }
            }

            // Đảm bảo đơn DELIVERED / COMPLETED có Commission
            if (o.getStatus() == OrderStatus.DELIVERED || o.getStatus() == OrderStatus.COMPLETED) {
                if (o.getPlatformCommission() == null || o.getPlatformCommission().compareTo(BigDecimal.ZERO) <= 0) {
                    Commission c = initializeCommission(o);
                    if (c != null) {
                        o.setPlatformCommission(c.getTotalCommission());
                        orderRepository.save(o);
                    }
                }
            }

            // Đảm bảo các đơn đã thanh toán đều có Payment và Escrow
            if (o.getStatus() != OrderStatus.PENDING_PAYMENT && o.getStatus() != OrderStatus.CANCELLED) {
                initializePaymentAndEscrow(o, false);
            }
        }

        if (fixedCount > 0) {
            log.info("Normalized {} legacy orders to realistic completed statuses", fixedCount);
        }
    }

    /**
     * Số lượng đơn mục tiêu theo từng ngày:
     * - 14 ngày gần nhất: 6 - 12 đơn/ngày (để biểu đồ luôn đầy đủ và sinh động)
     * - 15 - 30 ngày trước: 4 đơn/ngày
     * - 31 - 75 ngày trước: 1 - 2 đơn/ngày
     */
    private int getTargetOrdersForDay(int daysAgo) {
        if (daysAgo == 0) return 12;
        if (daysAgo == 1) return 12;
        if (daysAgo <= 3) return 10;
        if (daysAgo <= 7) return 9;
        if (daysAgo <= 14) return 7;
        if (daysAgo <= 30) return 4;
        return (daysAgo % 2 == 0) ? 2 : 1;
    }

    /**
     * Xác định trạng thái đơn hàng dựa trên tuổi của đơn theo logic TMĐT thực tế:
     */
    private OrderStatus determineStatusForDay(int daysAgo, int orderIdx) {
        if (daysAgo >= 14) {
            // Lịch sử xa: 88% Hoàn thành, 7% Hủy, 5% Trả hàng hoàn tiền
            int r = (orderIdx * 17 + daysAgo) % 100;
            if (r < 88) return OrderStatus.COMPLETED;
            if (r < 95) return OrderStatus.CANCELLED;
            return OrderStatus.REFUNDED;
        } else if (daysAgo >= 4) {
            // 4 - 13 ngày trước: 80% Hoàn thành, 10% Vừa giao (DELIVERED), 5% Hủy, 5% Hoàn tiền
            int r = (orderIdx * 19 + daysAgo) % 100;
            if (r < 80) return OrderStatus.COMPLETED;
            if (r < 90) return OrderStatus.DELIVERED;
            if (r < 95) return OrderStatus.CANCELLED;
            return OrderStatus.REFUNDED;
        } else if (daysAgo >= 2) {
            // 2 - 3 ngày trước: Đang giao hoặc vừa đến nơi đang đợi 72h nghiệm thu
            int r = (orderIdx * 23 + daysAgo) % 100;
            if (r < 40) return OrderStatus.DELIVERED;
            if (r < 75) return OrderStatus.SHIPPING;
            if (r < 90) return OrderStatus.COMPLETED;
            return OrderStatus.CANCELLED;
        } else if (daysAgo == 1) {
            // Hôm qua: Đang bưu tá giao GHN hoặc shop đang chuẩn bị
            int r = (orderIdx * 29) % 100;
            if (r < 50) return OrderStatus.SHIPPING;
            if (r < 80) return OrderStatus.PROCESSING;
            if (r < 90) return OrderStatus.CONFIRMED;
            return OrderStatus.CANCELLED;
        } else {
            // Hôm nay: Mới đặt, đang xác nhận hoặc vừa lấy hàng
            int r = (orderIdx * 31) % 100;
            if (r < 35) return OrderStatus.CONFIRMED;
            if (r < 70) return OrderStatus.PROCESSING;
            if (r < 85) return OrderStatus.SHIPPING;
            return OrderStatus.PENDING_PAYMENT;
        }
    }

    private LocalDateTime buildRealisticTimestamp(int daysAgo) {
        LocalDate date = LocalDate.now().minusDays(daysAgo);

        int hour;
        if (daysAgo == 0) {
            int maxHour = Math.max(9, LocalDateTime.now().getHour());
            hour = ThreadLocalRandom.current().nextInt(8, maxHour + 1);
        } else {
            // Khung giờ mua sắm cao điểm
            int[] peakHours = {9, 10, 11, 14, 15, 16, 19, 20, 21, 22};
            hour = peakHours[random.nextInt(peakHours.length)];
        }

        int minute = ThreadLocalRandom.current().nextInt(0, 60);
        int second = ThreadLocalRandom.current().nextInt(0, 60);

        return date.atTime(hour, minute, second);
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
        } else if (status == OrderStatus.REFUNDED) {
            LocalDateTime delivered = createdAt.plusDays(ThreadLocalRandom.current().nextInt(1, 3));
            order.setDeliveredAt(delivered);
            order.setReceivedByBuyer(true);
            order.setReceivedAt(delivered.plusHours(ThreadLocalRandom.current().nextInt(1, 12)));
        }

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
        if (order == null || order.getId() == null || order.getTotal() == null) return;
        if (order.getStatus() == OrderStatus.PENDING_PAYMENT || order.getStatus() == OrderStatus.CANCELLED) return;

        User customer = order.getUser();
        Shop shop = order.getShop();
        if (customer == null || shop == null || shop.getUser() == null) return;

        // 1. Payment Record
        Payment payment = paymentRepository.findByOrderId(order.getId())
                .orElseGet(() -> {
                    PaymentMethod method = (order.getId().hashCode() % 3 == 0)
                            ? PaymentMethod.WALLET
                            : PaymentMethod.VNPAY;
                    LocalDateTime payTime = order.getCreatedAt().plusMinutes(ThreadLocalRandom.current().nextInt(2, 12));

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
}
