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
import com.marketplace.ecommerce.auth.valueObjects.GenderType;
import com.marketplace.ecommerce.cart.entity.Cart;
import com.marketplace.ecommerce.cart.repository.CartRepository;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.entity.ProductCategory;
import com.marketplace.ecommerce.product.entity.ProductImage;
import com.marketplace.ecommerce.product.repository.ProductCategoryRepository;
import com.marketplace.ecommerce.product.repository.ProductImageRepository;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.product.valueObjects.ProductStatus;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.shop.valueObjects.ShopStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

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

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Starting data initialization...");

        // Initialize Roles
        Role customerRole = initializeRole("CUSTOMER", "Khách hàng");
        Role businessRole = initializeRole("BUSINESS", "Doanh nghiệp");
        Role adminRole = initializeRole("ADMIN", "Quản trị viên");

        // Initialize Accounts and Users
        Account adminAccount = initializeAccount("admin", "admin@ecommerce.com", "0123456789", 
                "admin123@", adminRole);
        initializeUser(adminAccount, "Admin User", "admin@ecommerce.com", 
                "0123456789", LocalDate.of(1990, 1, 1), GenderType.MALE, "123456789012");

        Account businessAccount1 = initializeAccount("seller", "seller@gmail.com", "0987654321",
                "seller123@", businessRole);
        User businessUser1 = initializeUser(businessAccount1, "Nguyễn Văn Bán Hàng", "seller@gmail.com",
                "0987654321", LocalDate.of(1985, 5, 15), GenderType.MALE, "987654321012");

        Account customerAccount1 = initializeAccount("customer", "customer@gmail.com", "0901234567",
                "customer123@", customerRole);
        User customerUser1 = initializeUser(customerAccount1, "Lê Văn Mua Hàng", "customer@gmail.com",
                "0901234567", LocalDate.of(1995, 3, 10), GenderType.MALE, "223344556677");

        // Initialize Shops
        Shop shop1 = initializeShop(businessUser1, "Apple Store Vietnam", 
                "Chuyên bán các sản phẩm Apple chính hãng: AirPods, iPhone, MacBook", 
                "https://example.com/apple-store-logo.jpg", "https://example.com/apple-store-cover.jpg",
                "0987654321", "123 Đường Nguyễn Huệ, Quận 1", 1442, "1A0001", ShopStatus.ACTIVE);

        // Initialize Product Categories
        ProductCategory electronicsCategory = initializeCategory(null, "Điện Tử");
        ProductCategory audioCategory = initializeCategory(electronicsCategory, "Âm Thanh");
        ProductCategory headphonesCategory = initializeCategory(audioCategory, "Tai Nghe");
        ProductCategory airpodsCategory = initializeCategory(headphonesCategory, "AirPods");
        ProductCategory accessoriesCategory = initializeCategory(electronicsCategory, "Phụ Kiện");

        // Initialize Products - AirPods Series
        Product product1 = initializeProduct(shop1, airpodsCategory, "AirPods Pro (2nd generation)", 
                "AirPods Pro thế hệ 2 với chip H2, chống ồn chủ động, không gian âm thanh, chống nước IPX4. Pin sử dụng lên đến 6 giờ, hộp sạc MagSafe", 
                "AIRPODS-PRO-2", 100, new BigDecimal("6990000"), 56, ProductStatus.PUBLISHED);
        initializeProductImage(product1, "https://images.unsplash.com/photo-1587523459887-e669248cf666?w=800&h=800&fit=crop", true, 1);
        initializeProductImage(product1, "https://images.unsplash.com/photo-1606741965326-cb990ae01bb2?w=800&h=800&fit=crop", false, 2);
        initializeProductImage(product1, "https://images.unsplash.com/photo-1624258919367-5dc28f5dc293?w=800&h=800&fit=crop", false, 3);

        Product product2 = initializeProduct(shop1, airpodsCategory, "AirPods Max", 
                "Tai nghe over-ear cao cấp với chip H1, chống ồn chủ động, không gian âm thanh, pin 20 giờ. Thiết kế sang trọng với khung nhôm", 
                "AIRPODS-MAX", 50, new BigDecimal("12990000"), 384, ProductStatus.PUBLISHED);
        initializeProductImage(product2, "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop", true, 1);
        initializeProductImage(product2, "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop&q=80", false, 2);
        initializeProductImage(product2, "https://images.unsplash.com/photo-1611864583067-b002fdc4fa29?w=800&h=800&fit=crop", false, 3);

        Product product3 = initializeProduct(shop1, airpodsCategory, "AirPods (3rd generation)", 
                "AirPods thế hệ 3 với chip H1, chống nước IPX4, không gian âm thanh, pin 6 giờ. Thiết kế tinh tế, phù hợp mọi hoạt động", 
                "AIRPODS-3RD", 150, new BigDecimal("4990000"), 46, ProductStatus.PUBLISHED);
        initializeProductImage(product3, "https://images.unsplash.com/photo-1606741965326-cb990ae01bb2?w=800&h=800&fit=crop", true, 1);
        initializeProductImage(product3, "https://images.unsplash.com/photo-1628588287089-c2925c16c52b?w=800&h=800&fit=crop", false, 2);
        initializeProductImage(product3, "https://images.unsplash.com/photo-1682939960849-60f4098b4b39?w=800&h=800&fit=crop", false, 3);

        Product product4 = initializeProduct(shop1, airpodsCategory, "AirPods Pro (1st generation)", 
                "AirPods Pro thế hệ 1 với chip H1, chống ồn chủ động, chống nước IPX4. Giá tốt, chất lượng đảm bảo", 
                "AIRPODS-PRO-1", 80, new BigDecimal("5490000"), 56, ProductStatus.PUBLISHED);
        initializeProductImage(product4, "https://images.unsplash.com/photo-1587523459887-e669248cf666?w=800&h=800&fit=crop&q=80", true, 1);
        initializeProductImage(product4, "https://images.unsplash.com/photo-1606741965326-cb990ae01bb2?w=800&h=800&fit=crop&q=80", false, 2);

        Product product5 = initializeProduct(shop1, airpodsCategory, "AirPods (2nd generation)", 
                "AirPods thế hệ 2 với chip H1, hộp sạc không dây, pin 5 giờ. Thiết kế cổ điển, giá hợp lý", 
                "AIRPODS-2ND", 120, new BigDecimal("3990000"), 40, ProductStatus.PUBLISHED);
        initializeProductImage(product5, "https://images.unsplash.com/photo-1628588287089-c2925c16c52b?w=800&h=800&fit=crop", true, 1);
        initializeProductImage(product5, "https://images.unsplash.com/photo-1682939960849-60f4098b4b39?w=800&h=800&fit=crop", false, 2);

        Product product6 = initializeProduct(shop1, accessoriesCategory, "Hộp Sạc MagSafe cho AirPods", 
                "Hộp sạc MagSafe chính hãng Apple, sạc không dây tiện lợi cho AirPods Pro và AirPods 3rd gen", 
                "AIRPODS-MAGSAFE-CASE", 200, new BigDecimal("990000"), 38, ProductStatus.PUBLISHED);
        initializeProductImage(product6, "https://images.unsplash.com/photo-1611864583067-b002fdc4fa29?w=800&h=800&fit=crop", true, 1);
        initializeProductImage(product6, "https://images.unsplash.com/photo-1587523459887-e669248cf666?w=800&h=800&fit=crop&q=80", false, 2);

        Product product7 = initializeProduct(shop1, accessoriesCategory, "Ốp Bảo Vệ AirPods Pro", 
                "Ốp bảo vệ silicon cao cấp cho AirPods Pro, chống trầy xước, nhiều màu sắc", 
                "AIRPODS-PRO-CASE", 300, new BigDecimal("250000"), 15, ProductStatus.PUBLISHED);
        initializeProductImage(product7, "https://images.unsplash.com/photo-1611864583067-b002fdc4fa29?w=800&h=800&fit=crop&q=80", true, 1);
        initializeProductImage(product7, "https://images.unsplash.com/photo-1628588287089-c2925c16c52b?w=800&h=800&fit=crop&q=80", false, 2);

        // Initialize User Addresses
        initializeUserAddress(customerUser1, "Lê Văn Mua Hàng", "0901234567", 
                "123 Đường Nguyễn Huệ, Phường Bến Nghé", "Hồ Chí Minh", "Quận 1", "Phường Bến Nghé", 
                1442, "1A0001", true);

        initializeUserAddress(customerUser1, "Lê Văn Mua Hàng", "0901234567", 
                "456 Đường Lê Lợi, Phường Bến Thành", "Hồ Chí Minh", "Quận 1", "Phường Bến Thành", 
                1442, "1A0002", false);

        // Initialize Carts
        initializeCart(customerUser1);

        log.info("Data initialization completed successfully!");
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
                .filter(cat -> cat.getName().equals(name) && 
                        (parent == null ? cat.getParent() == null : cat.getParent() != null && cat.getParent().getId().equals(parent.getId())))
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
                .filter(p -> p.getSku().equals(sku) && !p.getDeleted())
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
        ProductImage image = ProductImage.builder()
                .product(product)
                .imageUrl(imageUrl)
                .isThumbnail(isThumbnail)
                .displayOrder(displayOrder)
                .build();
        ProductImage saved = productImageRepository.save(image);
        log.debug("Created product image: {} for product: {}", imageUrl, product.getName());
        return saved;
    }

    private UserAddress initializeUserAddress(User user, String receiverName, String receiverPhone,
                                             String addressLine, String city, String district, String ward,
                                             Integer districtId, String wardCode, Boolean isDefault) {
        // Check if address already exists
        var existingAddresses = userAddressRepository.findAllByUserIdAndDeletedFalseOrderByIsDefaultDescIdDesc(user.getId());
        var existing = existingAddresses.stream()
                .filter(addr -> addr.getAddressLine().equals(addressLine) && !addr.getDeleted())
                .findFirst();
        
        if (existing.isPresent()) {
            return existing.get();
        }
        
        // If setting as default, unset other default addresses
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
}
