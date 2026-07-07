package com.marketplace.ecommerce.config;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.entity.Role;
import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.entity.UserAddress;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.repository.RoleRepository;
import com.marketplace.ecommerce.auth.repository.UserAddressRepository;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.auth.valueObjects.AccountStatus;
import com.marketplace.ecommerce.auth.valueObjects.DisciplineLevel;
import com.marketplace.ecommerce.auth.valueObjects.GenderType;
import com.marketplace.ecommerce.cart.entity.Cart;
import com.marketplace.ecommerce.cart.repository.CartRepository;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.entity.OrderItem;
import com.marketplace.ecommerce.order.repository.OrderItemsRepository;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.platform.constant.PlatformConstant;
import com.marketplace.ecommerce.platform.entity.Commission;
import com.marketplace.ecommerce.platform.entity.CommissionItem;
import com.marketplace.ecommerce.platform.entity.PlatformSetting;
import com.marketplace.ecommerce.platform.repository.CommissionRepository;
import com.marketplace.ecommerce.platform.repository.PlatformSettingRepository;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.entity.ProductCategory;
import com.marketplace.ecommerce.product.entity.ProductImage;
import com.marketplace.ecommerce.product.repository.ProductCategoryRepository;
import com.marketplace.ecommerce.product.repository.ProductImageRepository;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.product.valueObjects.ProductStatus;
import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.repository.RequestRepository;
import com.marketplace.ecommerce.request.valueObjects.RequestStatus;
import com.marketplace.ecommerce.request.valueObjects.RequestType;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.shop.valueObjects.ShopStatus;
import com.marketplace.ecommerce.wallet.entity.Wallet;
import com.marketplace.ecommerce.wallet.repository.WalletRepository;
import com.marketplace.ecommerce.wallet.valueObjects.WalletType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private static final int TARGET_SHOP_COUNT = 1;
    private static final int MIN_PRODUCTS_PER_SHOP = 50;
    private static final int MAX_PRODUCTS_PER_SHOP = 75;
    private static final int TARGET_ORDER_COUNT = 150;
    private static final int TARGET_REQUEST_COUNT = 3;

    private final RoleRepository roleRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final UserAddressRepository userAddressRepository;
    private final ShopRepository shopRepository;
    private final ProductCategoryRepository productCategoryRepository;
    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final CartRepository cartRepository;
    private final PasswordEncoder passwordEncoder;
    private final WalletRepository walletRepository;
    private final PlatformSettingRepository platformSettingRepository;
    private final OrderRepository orderRepository;
    private final OrderItemsRepository orderItemsRepository;
    private final RequestRepository requestRepository;
    private final CommissionRepository commissionRepository;

    private final Random random = new Random();

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Starting data initialization...");

        // Roles
        Role customerRole = initializeRole("CUSTOMER", "Khách hàng");
        Role businessRole = initializeRole("BUSINESS", "Doanh nghiệp");
        Role adminRole = initializeRole("ADMIN", "Quản trị viên");

        // Admin
        Account adminAccount = initializeAccount("admin", "admin@ecommerce.com", "0123456789", "admin123@", adminRole);
        User adminUser = initializeUser(
                adminAccount,
                "Admin User",
                "admin@ecommerce.com",
                "0123456789",
                LocalDate.of(1990, 1, 1),
                GenderType.MALE,
                "123456789012");

        // Sellers
        User seller1 = initializeUser(
                initializeAccount("seller1", "seller1@gmail.com", "0987654321", "seller123@", businessRole),
                "Nguyễn Văn Seller 1",
                "seller1@gmail.com",
                "0987654321",
                LocalDate.of(1985, 5, 15),
                GenderType.MALE,
                "987654321012");

        // Customers
        User customer1 = initializeUser(
                initializeAccount("customer1", "customer1@gmail.com", "0901234567", "customer123@", customerRole),
                "Lê Văn Mua Hàng",
                "customer1@gmail.com",
                "0901234567",
                LocalDate.of(1995, 3, 10),
                GenderType.MALE,
                "223344556677");

        User customer2 = initializeUser(
                initializeAccount("customer2", "customer2@gmail.com", "0909876543", "customer123@", customerRole),
                "Phạm Thị Mua Sắm",
                "customer2@gmail.com",
                "0909876543",
                LocalDate.of(1992, 7, 25),
                GenderType.FEMALE,
                "334455667788");

        User customer3 = initializeUser(
                initializeAccount("customer3", "customer3@gmail.com", "0905555555", "customer123@", customerRole),
                "Nguyễn Khách 3",
                "customer3@gmail.com",
                "0905555555",
                LocalDate.of(1994, 4, 14),
                GenderType.MALE,
                "555666777888");

        User customer4 = initializeUser(
                initializeAccount("customer4", "customer4@gmail.com", "0906666666", "customer123@", customerRole),
                "Đỗ Khách 4",
                "customer4@gmail.com",
                "0906666666",
                LocalDate.of(1996, 12, 1),
                GenderType.FEMALE,
                "888777666555");

        User customer5 = initializeUser(
                initializeAccount("customer5", "customer5@gmail.com", "0907777777", "customer123@", customerRole),
                "Bùi Khách 5",
                "customer5@gmail.com",
                "0907777777",
                LocalDate.of(1993, 10, 30),
                GenderType.MALE,
                "111222333444");

        // Wallets
        initializeUserWallet(seller1);

        initializeUserWallet(customer1);
        initializeUserWallet(customer2);
        initializeUserWallet(customer3);
        initializeUserWallet(customer4);
        initializeUserWallet(customer5);

        initializeAdminEscrowWallet(adminUser);

        // Carts
        initializeCart(customer1);
        initializeCart(customer2);
        initializeCart(customer3);
        initializeCart(customer4);
        initializeCart(customer5);

        initializeCart(seller1);

        // Platform settings
        initializePlatformSetting(PlatformConstant.KEY_COMMISSION_RATE, "10");

        // Categories
        ProductCategory electronics = initializeCategory(null, "Điện Tử");
        ProductCategory audio = initializeCategory(electronics, "Âm Thanh");
        ProductCategory headphones = initializeCategory(audio, "Tai Nghe");
        ProductCategory accessories = initializeCategory(electronics, "Phụ Kiện");
        ProductCategory laptop = initializeCategory(electronics, "Laptop");
        ProductCategory smartphone = initializeCategory(electronics, "Điện Thoại");
        ProductCategory tablet = initializeCategory(electronics, "Máy Tính Bảng");
        ProductCategory smartwatch = initializeCategory(electronics, "Đồng Hồ Thông Minh");

        // Shops
        Shop shop1 = initializeShop(
                seller1,
                "Apple Store Vietnam",
                "Chuyên bán các sản phẩm Apple chính hãng: AirPods, iPhone, MacBook, phụ kiện",
                "https://example.com/apple-store-logo.jpg",
                "https://example.com/apple-store-cover.jpg",
                "0987654321",
                "123 Đường Nguyễn Huệ, Quận 1",
                1442,
                "21012",
                ShopStatus.ACTIVE);

        List<Shop> shops = List.of(shop1);
        List<ProductCategory> categories = List.of(
                headphones, accessories, laptop, smartphone, tablet, smartwatch, audio);

        seedProductsForShops(shops, categories);

        // Addresses
        initializeUserAddress(customer1, "Lê Văn Mua Hàng", "0901234567",
                "123 Đường Nguyễn Huệ, Phường Bến Nghé", "Hồ Chí Minh", "Quận 1", "Phường Bến Nghé",
                1442, "21012", true);

        initializeUserAddress(customer2, "Phạm Thị Mua Sắm", "0909876543",
                "456 Đường Lê Lợi, Phường Bến Thành", "Hồ Chí Minh", "Quận 1", "Phường Bến Thành",
                1442, "21012", true);

        initializeUserAddress(customer3, "Nguyễn Khách 3", "0905555555",
                "789 Đường Điện Biên Phủ, Phường 15", "Hồ Chí Minh", "Bình Thạnh", "Phường 15",
                1450, "21013", true);

        initializeUserAddress(customer4, "Đỗ Khách 4", "0906666666",
                "22 Đường Cách Mạng Tháng 8, Phường 6", "Hồ Chí Minh", "Quận 3", "Phường 6",
                1443, "21014", true);

        initializeUserAddress(customer5, "Bùi Khách 5", "0907777777",
                "101 Đường Phan Xích Long, Phường 2", "Hồ Chí Minh", "Phú Nhuận", "Phường 2",
                1448, "21015", true);

        // Requests
        seedRequests(adminAccount, customerRole);

        // Orders
        seedOrders(List.of(customer1, customer2, customer3, customer4, customer5), shops);

        log.info("Data initialization completed successfully!");
    }

    private void seedProductsForShops(List<Shop> shops, List<ProductCategory> categories) {
        for (int i = 0; i < shops.size(); i++) {
            Shop shop = shops.get(i);

            long existingProducts = productRepository.findAll().stream()
                    .filter(p -> p.getShop() != null
                            && p.getShop().getId().equals(shop.getId())
                            && !Boolean.TRUE.equals(p.getDeleted()))
                    .count();

            if (existingProducts >= MIN_PRODUCTS_PER_SHOP) {
                log.debug("Skip seed products for shop {} because already has {}", shop.getName(), existingProducts);
                continue;
            }

            int productCount = ThreadLocalRandom.current().nextInt(MIN_PRODUCTS_PER_SHOP, MAX_PRODUCTS_PER_SHOP + 1);

            for (int j = 1; j <= productCount; j++) {
                ProductCategory category = categories.get(random.nextInt(categories.size()));
                String sku = "SHOP" + (i + 1) + "-P" + j;

                Product product = initializeProduct(
                        shop,
                        category,
                        generateProductName(shop, category, j),
                        generateProductDescription(category, j),
                        sku,
                        ThreadLocalRandom.current().nextInt(20, 201),
                        randomPriceByCategory(category),
                        ThreadLocalRandom.current().nextInt(100, 3001),
                        ProductStatus.PUBLISHED);

                initializeProductImage(
                        product,
                        buildImageUrlForCategory(category, sku, 1),
                        true,
                        1);

                initializeProductImage(
                        product,
                        buildImageUrlForCategory(category, sku, 2),
                        false,
                        2);
            }
        }
    }

    private void seedOrders(List<User> customers, List<Shop> shops) {
        long existingOrderCount = orderRepository.count();

        if (existingOrderCount >= TARGET_ORDER_COUNT) {
            log.debug("Skip seed orders: already {} orders (target {})", existingOrderCount, TARGET_ORDER_COUNT);
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
            LocalDateTime createdAt = LocalDateTime.now().minusDays(ThreadLocalRandom.current().nextInt(1, 120));

            Order order = initializeOrder(
                    customer,
                    shop,
                    address,
                    status,
                    "Seed order demo #" + (i + 1),
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

                int quantity = ThreadLocalRandom.current().nextInt(1, 4);
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

        log.info("Seeded {} additional orders", needToCreate);
    }

    private void seedRequests(Account adminAccount, Role customerRole) {
        long existingRequestCount = requestRepository.count();
        if (existingRequestCount >= TARGET_REQUEST_COUNT) {
            log.debug("Skip seed requests: already {} requests", existingRequestCount);
            return;
        }

        Account customerAccount1 = accountRepository.findByUsername("customer1").orElse(null);
        Account customerAccount2 = accountRepository.findByUsername("customer2").orElse(null);
        Account customerAccount3 = accountRepository.findByUsername("customer3").orElse(null);

        if (customerAccount1 != null) {
            initializeRequest(
                    customerAccount1,
                    RequestType.SELLER_REGISTRATION,
                    RequestStatus.APPROVED,
                    "Tôi muốn đăng ký làm người bán để kinh doanh phụ kiện điện tử",
                    adminAccount,
                    LocalDateTime.now().minusDays(5),
                    "Yêu cầu hợp lệ, đã duyệt");
        }

        if (customerAccount2 != null) {
            initializeRequest(
                    customerAccount2,
                    RequestType.SELLER_REGISTRATION,
                    RequestStatus.PENDING,
                    "Tôi muốn đăng ký làm người bán để mở gian hàng công nghệ",
                    null,
                    null,
                    null);
        }

        if (customerAccount3 != null) {
            initializeRequest(
                    customerAccount3,
                    RequestType.SELLER_REGISTRATION,
                    RequestStatus.REJECTED,
                    "Tôi muốn đăng ký làm người bán",
                    adminAccount,
                    LocalDateTime.now().minusDays(10),
                    "Thiếu thông tin giấy phép kinh doanh");
        }
    }

    private String generateProductName(Shop shop, ProductCategory category, int index) {
        String categoryName = category.getName().toLowerCase();

        if (categoryName.contains("tai nghe")) {
            return "Tai nghe Bluetooth Pro " + index;
        }
        if (categoryName.contains("laptop")) {
            return "Laptop Ultra " + index;
        }
        if (categoryName.contains("điện thoại")) {
            return "Smartphone Flagship " + index;
        }
        if (categoryName.contains("phụ kiện")) {
            return "Phụ kiện công nghệ " + index;
        }
        if (categoryName.contains("máy tính bảng")) {
            return "Tablet Gen " + index;
        }
        if (categoryName.contains("đồng hồ")) {
            return "Smartwatch Series " + index;
        }
        if (categoryName.contains("âm thanh")) {
            return "Loa không dây " + index;
        }
        return shop.getName() + " Product " + index;
    }

    private String generateProductDescription(ProductCategory category, int index) {
        return "Mô tả demo cho sản phẩm " + index + " thuộc danh mục " + category.getName()
                + ", phù hợp để test product listing, cart, checkout, order history, seller dashboard và commission.";
    }

    private BigDecimal randomPriceByCategory(ProductCategory category) {
        String categoryName = category.getName().toLowerCase();

        if (categoryName.contains("laptop")) {
            return BigDecimal.valueOf(ThreadLocalRandom.current().nextLong(15_000_000, 55_000_001));
        }
        if (categoryName.contains("điện thoại")) {
            return BigDecimal.valueOf(ThreadLocalRandom.current().nextLong(6_000_000, 35_000_001));
        }
        if (categoryName.contains("tai nghe")) {
            return BigDecimal.valueOf(ThreadLocalRandom.current().nextLong(500_000, 15_000_001));
        }
        if (categoryName.contains("đồng hồ")) {
            return BigDecimal.valueOf(ThreadLocalRandom.current().nextLong(2_000_000, 18_000_001));
        }
        if (categoryName.contains("máy tính bảng")) {
            return BigDecimal.valueOf(ThreadLocalRandom.current().nextLong(5_000_000, 28_000_001));
        }
        if (categoryName.contains("âm thanh")) {
            return BigDecimal.valueOf(ThreadLocalRandom.current().nextLong(1_000_000, 12_000_001));
        }

        return BigDecimal.valueOf(ThreadLocalRandom.current().nextLong(100_000, 5_000_001));
    }

    private String buildImageUrlForCategory(ProductCategory category, String sku, int index) {
        String categoryName = category.getName().toLowerCase();

        if (categoryName.contains("laptop")) {
            return index == 1
                    ? "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=800&fit=crop&sig=" + sku
                    : "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&h=800&fit=crop&sig=" + sku
                            + "-2";
        }

        if (categoryName.contains("điện thoại")) {
            return index == 1
                    ? "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=800&fit=crop&sig=" + sku
                    : "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=800&fit=crop&sig=" + sku
                            + "-2";
        }

        if (categoryName.contains("tai nghe")) {
            return index == 1
                    ? "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop&sig=" + sku
                    : "https://images.unsplash.com/photo-1611864583067-b002fdc4fa29?w=800&h=800&fit=crop&sig=" + sku
                            + "-2";
        }

        if (categoryName.contains("đồng hồ")) {
            return index == 1
                    ? "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop&sig=" + sku
                    : "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&h=800&fit=crop&sig=" + sku
                            + "-2";
        }

        if (categoryName.contains("máy tính bảng")) {
            return index == 1
                    ? "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&h=800&fit=crop&sig=" + sku
                    : "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&h=800&fit=crop&sig=" + sku
                            + "-2";
        }

        return index == 1
                ? "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=800&fit=crop&sig=" + sku
                : "https://images.unsplash.com/photo-1601972602237-8c79241f5c9c?w=800&h=800&fit=crop&sig=" + sku + "-2";
    }

    private Wallet initializeUserWallet(User user) {
        return walletRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    LocalDateTime now = LocalDateTime.now();
                    Wallet w = Wallet.builder()
                            .user(user)
                            .currency("VND")
                            .availableBalance(BigDecimal.ZERO)
                            .lockedBalance(BigDecimal.ZERO)
                            .walletType(WalletType.USER)
                            .createdAt(now)
                            .build();

                    w.setCreatedAt(now);
                    w.setUpdatedAt(now);

                    Wallet saved = walletRepository.save(w);
                    log.info("Created USER wallet for user: {}", user.getFullName());
                    return saved;
                });
    }

    private Wallet initializeAdminEscrowWallet(User user) {
        return walletRepository.findByUserId(user.getId())
                .map(existing -> {
                    if (existing.getWalletType() != WalletType.ESCROW) {
                        throw new IllegalStateException("Admin user already has non-ESCROW wallet");
                    }
                    return existing;
                })
                .orElseGet(() -> {
                    LocalDateTime now = LocalDateTime.now();
                    Wallet w = Wallet.builder()
                            .user(user)
                            .currency("VND")
                            .availableBalance(BigDecimal.ZERO)
                            .lockedBalance(BigDecimal.ZERO)
                            .walletType(WalletType.ESCROW)
                            .createdAt(now)
                            .build();

                    w.setCreatedAt(now);
                    w.setUpdatedAt(now);

                    Wallet saved = walletRepository.save(w);
                    log.info("Created ESCROW wallet for admin: {}", user.getFullName());
                    return saved;
                });
    }

    private Role initializeRole(String roleName, String description) {
        return roleRepository.findByRoleName(roleName)
                .orElseGet(() -> {
                    Role role = Role.builder()
                            .roleName(roleName)
                            .description(description)
                            .build();
                    Role saved = roleRepository.save(role);
                    log.info("Created role: {}", roleName);
                    return saved;
                });
    }

    private Account initializeAccount(String username, String email, String phoneNumber,
            String password, Role role) {
        return accountRepository.findByUsername(username)
                .orElseGet(() -> {
                    Account account = Account.builder()
                            .username(username)
                            .email(email)
                            .phoneNumber(phoneNumber)
                            .passwordHash(passwordEncoder.encode(password))
                            .status(AccountStatus.ACTIVE)
                            .role(role)
                            .isActive(true)
                            .accountVerified(true)
                            .violationCount(0)
                            .disciplineLevel(DisciplineLevel.NONE)
                            .build();
                    Account saved = accountRepository.save(account);
                    log.info("Created account: {} with role: {}", username, role.getRoleName());
                    return saved;
                });
    }

    private User initializeUser(Account account, String fullName, String email, String phoneNumber,
            LocalDate dateOfBirth, GenderType gender, String identityCardNumber) {
        return userRepository.findByAccountId(account.getId())
                .orElseGet(() -> {
                    User user = User.builder()
                            .fullName(fullName)
                            .email(email)
                            .phoneNumber(phoneNumber)
                            .dateOfBirth(dateOfBirth)
                            .gender(gender)
                            .identityCardNumber(identityCardNumber)
                            .account(account)
                            .build();
                    User saved = userRepository.save(user);
                    log.info("Created user: {} for account: {}", fullName, account.getUsername());
                    return saved;
                });
    }

    private Shop initializeShop(User user, String name, String description, String logoUrl,
            String coverImageUrl, String phoneNumber, String address,
            Integer districtId, String wardCode, ShopStatus status) {
        return shopRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    LocalDateTime now = LocalDateTime.now();
                    Shop shop = Shop.builder()
                            .user(user)
                            .name(name)
                            .description(description)
                            .logoUrl(logoUrl)
                            .coverImageUrl(coverImageUrl)
                            .phoneNumber(phoneNumber)
                            .address(address)
                            .districtId(districtId)
                            .wardCode(wardCode)
                            .status(status)
                            .averageRating(0.0f)
                            .build();
                    shop.setCreatedAt(now);
                    shop.setUpdatedAt(now);
                    Shop saved = shopRepository.save(shop);
                    log.info("Created shop: {} for user: {}", name, user.getFullName());
                    return saved;
                });
    }

    private ProductCategory initializeCategory(ProductCategory parent, String name) {
        return productCategoryRepository.findAll().stream()
                .filter(cat -> cat.getName().equals(name)
                        && (parent == null
                                ? cat.getParent() == null
                                : cat.getParent() != null && cat.getParent().getId().equals(parent.getId())))
                .findFirst()
                .orElseGet(() -> {
                    ProductCategory category = new ProductCategory();
                    category.setParent(parent);
                    category.setName(name);
                    ProductCategory saved = productCategoryRepository.save(category);
                    log.info("Created category: {} (parent: {})", name, parent != null ? parent.getName() : "none");
                    return saved;
                });
    }

    private Product initializeProduct(Shop shop, ProductCategory category, String name,
            String description, String sku, Integer quantity,
            BigDecimal basePrice, Integer weight, ProductStatus status) {
        return productRepository.findAll().stream()
                .filter(p -> p.getSku().equals(sku) && !Boolean.TRUE.equals(p.getDeleted()))
                .findFirst()
                .orElseGet(() -> {
                    Product product = Product.builder()
                            .shop(shop)
                            .productCategory(category)
                            .name(name)
                            .description(description)
                            .sku(sku)
                            .quantity(quantity)
                            .basePrice(basePrice)
                            .weight(weight)
                            .status(status)
                            .deleted(false)
                            .images(new HashSet<>())
                            .build();
                    Product saved = productRepository.save(product);
                    log.info("Created product: {} (SKU: {})", name, sku);
                    return saved;
                });
    }

    private ProductImage initializeProductImage(Product product, String imageUrl,
            Boolean isThumbnail, Integer displayOrder) {
        return productImageRepository.findByProductAndImageUrl(product, imageUrl)
                .orElseGet(() -> {
                    ProductImage image = ProductImage.builder()
                            .product(product)
                            .imageUrl(imageUrl)
                            .isThumbnail(isThumbnail)
                            .displayOrder(displayOrder)
                            .build();
                    ProductImage saved = productImageRepository.save(image);
                    log.debug("Created product image: {} for product: {}", imageUrl, product.getName());
                    return saved;
                });
    }

    private UserAddress initializeUserAddress(User user, String receiverName, String receiverPhone,
            String addressLine, String city, String district, String ward,
            Integer districtId, String wardCode, Boolean isDefault) {
        var existingAddresses = userAddressRepository
                .findAllByUserIdAndDeletedFalseOrderByIsDefaultDescIdDesc(user.getId());
        var existing = existingAddresses.stream()
                .filter(addr -> addr.getAddressLine().equals(addressLine) && !Boolean.TRUE.equals(addr.getDeleted()))
                .findFirst();

        if (existing.isPresent()) {
            return existing.get();
        }

        if (isDefault && !existingAddresses.isEmpty()) {
            existingAddresses.stream()
                    .filter(addr -> addr.getIsDefault() != null && addr.getIsDefault())
                    .forEach(addr -> {
                        addr.setIsDefault(false);
                        userAddressRepository.save(addr);
                    });
        }

        UserAddress address = new UserAddress();
        address.setUser(user);
        address.setReceiverName(receiverName);
        address.setReceiverPhone(receiverPhone);
        address.setAddressLine(addressLine);
        address.setCity(city);
        address.setDistrict(district);
        address.setWard(ward);
        address.setDistrictId(districtId);
        address.setWardCode(wardCode);
        address.setIsDefault(isDefault);
        address.setDeleted(false);

        UserAddress saved = userAddressRepository.save(address);
        log.info("Created user address for user: {}", user.getFullName());
        return saved;
    }

    private Cart initializeCart(User user) {
        return cartRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    Cart cart = Cart.builder()
                            .user(user)
                            .items(new HashSet<>())
                            .build();
                    Cart saved = cartRepository.save(cart);
                    log.info("Created cart for user: {}", user.getFullName());
                    return saved;
                });
    }

    private PlatformSetting initializePlatformSetting(String key, String value) {
        return platformSettingRepository.findByKey(key)
                .orElseGet(() -> {
                    LocalDateTime now = LocalDateTime.now();
                    PlatformSetting setting = new PlatformSetting();
                    setting.setKey(key);
                    setting.setValue(value);
                    setting.setUpdatedAt(now);
                    PlatformSetting saved = platformSettingRepository.save(setting);
                    log.info("Created platform setting: {} = {}", key, value);
                    return saved;
                });
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

        if (status == OrderStatus.DELIVERED || status == OrderStatus.COMPLETED) {
            order.setDeliveredAt(createdAt.plusDays(ThreadLocalRandom.current().nextInt(1, 4)));
        }

        if (status == OrderStatus.COMPLETED) {
            order.setReceivedByBuyer(true);
            order.setReceivedAt(createdAt.plusDays(ThreadLocalRandom.current().nextInt(2, 6)));
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
        return BigDecimal.valueOf(ThreadLocalRandom.current().nextLong(15000, 50001));
    }

    private Request initializeRequest(Account account, RequestType type, RequestStatus status, String description) {
        return initializeRequest(account, type, status, description, null, null, null);
    }

    private Request initializeRequest(Account account, RequestType type, RequestStatus status,
            String description, Account reviewedBy, LocalDateTime reviewedAt, String response) {
        boolean alreadyExists = requestRepository.count() > 0 && requestRepository.findAll().stream()
                .anyMatch(r -> r.getAccount() != null
                        && r.getAccount().getId().equals(account.getId())
                        && r.getType() == type
                        && r.getStatus() == status);

        if (alreadyExists) {
            return requestRepository.findAll().stream()
                    .filter(r -> r.getAccount() != null
                            && r.getAccount().getId().equals(account.getId())
                            && r.getType() == type
                            && r.getStatus() == status)
                    .findFirst()
                    .orElseThrow();
        }

        LocalDateTime createdAt;
        if (reviewedAt != null) {
            createdAt = reviewedAt.minusDays(2);
        } else {
            createdAt = LocalDateTime.now().minusDays(1);
        }

        LocalDateTime updatedAt = reviewedAt != null ? reviewedAt : createdAt;

        Request request = Request.builder()
                .account(account)
                .type(type)
                .status(status)
                .description(description)
                .response(response)
                .reviewedBy(reviewedBy)
                .reviewedAt(reviewedAt)
                .createdAt(createdAt)
                .updatedAt(updatedAt)
                .build();

        Request saved = requestRepository.save(request);
        log.info("Created request: {} with status: {}", type, status);
        return saved;
    }

    private Commission initializeCommission(Order order) {
        if (order == null || order.getId() == null) {
            throw new IllegalArgumentException("Order is null");
        }

        return commissionRepository.findByOrderId(order.getId())
                .orElseGet(() -> {
                    if (order.getStatus() != OrderStatus.DELIVERED && order.getStatus() != OrderStatus.COMPLETED) {
                        throw new IllegalStateException("Order is not eligible for commission: " + order.getStatus());
                    }

                    if (order.getShop() == null || order.getShop().getUser() == null
                            || order.getShop().getUser().getId() == null) {
                        throw new IllegalStateException("Seller not found for order: " + order.getOrderNumber());
                    }

                    if (order.getItems() == null || order.getItems().isEmpty()) {
                        throw new IllegalStateException("Order items not found for order: " + order.getOrderNumber());
                    }

                    BigDecimal commissionRate = platformSettingRepository
                            .findByKey(PlatformConstant.KEY_COMMISSION_RATE)
                            .map(s -> new BigDecimal(s.getValue() != null ? s.getValue().trim() : "10"))
                            .orElse(new BigDecimal("10"));

                    BigDecimal orderAmount = order.getSubtotal() == null ? BigDecimal.ZERO : order.getSubtotal();

                    Commission commission = Commission.builder()
                            .orderId(order.getId())
                            .sellerId(order.getShop().getUser().getId())
                            .orderAmount(orderAmount)
                            .totalCommission(BigDecimal.ZERO)
                            .items(new ArrayList<>())
                            .build();

                    BigDecimal totalCommission = BigDecimal.ZERO;

                    for (OrderItem orderItem : order.getItems()) {
                        BigDecimal unitPrice = orderItem.getUnitPrice() == null ? BigDecimal.ZERO
                                : orderItem.getUnitPrice();
                        int quantity = orderItem.getQuantity() == null ? 0 : orderItem.getQuantity();

                        BigDecimal lineAmount = unitPrice.multiply(BigDecimal.valueOf(quantity));
                        BigDecimal commissionAmount = lineAmount
                                .multiply(commissionRate)
                                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);

                        CommissionItem commissionItem = CommissionItem.builder()
                                .commission(commission)
                                .orderItemId(orderItem.getId())
                                .productName(orderItem.getProductName())
                                .unitPrice(unitPrice)
                                .quantity(quantity)
                                .commissionRate(commissionRate)
                                .commissionAmount(commissionAmount)
                                .build();

                        commission.getItems().add(commissionItem);
                        totalCommission = totalCommission.add(commissionAmount);
                    }

                    commission.setTotalCommission(totalCommission);

                    Commission saved = commissionRepository.save(commission);
                    log.info("Created commission for order: {} with totalCommission={}",
                            order.getOrderNumber(), totalCommission);
                    return saved;
                });
    }
}