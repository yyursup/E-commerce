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
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private static final int MIN_PRODUCTS_PER_SHOP = 10;
    private static final int MAX_PRODUCTS_PER_SHOP = 15;
    private static final int TARGET_ORDER_COUNT = 150;
    private static final int TARGET_REQUEST_COUNT = 5;

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
        log.info("Starting comprehensive multi-vendor marketplace data initialization...");

        // 1. Roles
        Role customerRole = initializeRole("CUSTOMER", "Khách hàng");
        Role businessRole = initializeRole("BUSINESS", "Doanh nghiệp / Người bán");
        Role adminRole = initializeRole("ADMIN", "Quản trị viên sàn");

        // 2. Admin
        Account adminAccount = initializeAccount("admin", "admin@ecommerce.vn", "0123456789", "admin123@", adminRole);
        User adminUser = initializeUser(
                adminAccount,
                "Quản Trị Viên Sàn E-commerce",
                "admin@ecommerce.vn",
                "0123456789",
                LocalDate.of(1990, 1, 1),
                GenderType.MALE,
                "123456789012");

        // 3. Multi-vendor Sellers
        User seller1 = initializeUser(
                initializeAccount("seller1", "apple.reseller@gmail.com", "0987654321", "seller123@", businessRole),
                "Nguyễn Thành Đạt (Apple Official)",
                "apple.reseller@gmail.com",
                "0987654321",
                LocalDate.of(1988, 5, 15),
                GenderType.MALE,
                "987654321012");

        User seller2 = initializeUser(
                initializeAccount("seller2", "trendy.fashion@gmail.com", "0987654322", "seller123@", businessRole),
                "Trần Thị Mai (Trendy Fashion)",
                "trendy.fashion@gmail.com",
                "0987654322",
                LocalDate.of(1992, 8, 20),
                GenderType.FEMALE,
                "987654321013");

        User seller3 = initializeUser(
                initializeAccount("seller3", "nhanam.books@gmail.com", "0987654323", "seller123@", businessRole),
                "Lê Tri Thức (Nhã Nam Books)",
                "nhanam.books@gmail.com",
                "0987654323",
                LocalDate.of(1985, 11, 12),
                GenderType.MALE,
                "987654321014");

        User seller4 = initializeUser(
                initializeAccount("seller4", "sunhouse.appliances@gmail.com", "0987654324", "seller123@", businessRole),
                "Phạm Hoàng Gia (Sunhouse Official)",
                "sunhouse.appliances@gmail.com",
                "0987654324",
                LocalDate.of(1987, 4, 18),
                GenderType.MALE,
                "987654321015");

        User seller5 = initializeUser(
                initializeAccount("seller5", "innisfree.beauty@gmail.com", "0987654325", "seller123@", businessRole),
                "Hoàng Thảo My (Beauty Hub)",
                "innisfree.beauty@gmail.com",
                "0987654325",
                LocalDate.of(1994, 9, 25),
                GenderType.FEMALE,
                "987654321016");

        User seller6 = initializeUser(
                initializeAccount("seller6", "decathlon.sports@gmail.com", "0987654326", "seller123@", businessRole),
                "Vũ Quốc Dũng (Decathlon Sports)",
                "decathlon.sports@gmail.com",
                "0987654326",
                LocalDate.of(1991, 2, 10),
                GenderType.MALE,
                "987654321017");

        // 4. Customers
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
                "Nguyễn Văn An",
                "customer3@gmail.com",
                "0905555555",
                LocalDate.of(1994, 4, 14),
                GenderType.MALE,
                "555666777888");

        User customer4 = initializeUser(
                initializeAccount("customer4", "customer4@gmail.com", "0906666666", "customer123@", customerRole),
                "Đỗ Thùy Trang",
                "customer4@gmail.com",
                "0906666666",
                LocalDate.of(1996, 12, 1),
                GenderType.FEMALE,
                "888777666555");

        User customer5 = initializeUser(
                initializeAccount("customer5", "customer5@gmail.com", "0907777777", "customer123@", customerRole),
                "Bùi Minh Quân",
                "customer5@gmail.com",
                "0907777777",
                LocalDate.of(1993, 10, 30),
                GenderType.MALE,
                "111222333444");

        // 5. Wallets
        initializeUserWallet(seller1);
        initializeUserWallet(seller2);
        initializeUserWallet(seller3);
        initializeUserWallet(seller4);
        initializeUserWallet(seller5);
        initializeUserWallet(seller6);

        initializeUserWallet(customer1);
        initializeUserWallet(customer2);
        initializeUserWallet(customer3);
        initializeUserWallet(customer4);
        initializeUserWallet(customer5);

        initializeAdminEscrowWallet(adminUser);

        // 6. Carts
        initializeCart(customer1);
        initializeCart(customer2);
        initializeCart(customer3);
        initializeCart(customer4);
        initializeCart(customer5);
        initializeCart(seller1);

        // 7. Platform settings
        initializePlatformSetting(PlatformConstant.KEY_COMMISSION_RATE, "10");

        // 8. Comprehensive Category Hierarchy (8 Major Categories + Subcategories)
        // Group 1: Điện Tử & Công Nghệ
        ProductCategory electronics = initializeCategory(null, "Điện Tử & Công Nghệ");
        ProductCategory smartphone = initializeCategory(electronics, "Điện Thoại & Tablet");
        ProductCategory laptop = initializeCategory(electronics, "Laptop & Máy Tính");
        ProductCategory audio = initializeCategory(electronics, "Thiết Bị Âm Thanh");
        ProductCategory accessories = initializeCategory(electronics, "Phụ Kiện Điện Tử");

        // Group 2: Thời Trang & Phụ Kiện
        ProductCategory fashion = initializeCategory(null, "Thời Trang & Phụ Kiện");
        ProductCategory menFashion = initializeCategory(fashion, "Thời Trang Nam");
        ProductCategory womenFashion = initializeCategory(fashion, "Thời Trang Nữ");
        ProductCategory shoesBags = initializeCategory(fashion, "Giày Dép & Túi Ví");
        ProductCategory watches = initializeCategory(fashion, "Đồng Hồ & Trang Sức");

        // Group 3: Sách & Văn Phòng Phẩm
        ProductCategory books = initializeCategory(null, "Sách & Văn Phòng Phẩm");
        ProductCategory literature = initializeCategory(books, "Văn Học & Tiểu Thuyết");
        ProductCategory businessBooks = initializeCategory(books, "Kinh Tế & Kỹ Năng Sống");
        ProductCategory stationery = initializeCategory(books, "Dụng Cụ Học Tập & Văn Phòng");

        // Group 4: Điện Gia Dụng & Đời Sống
        ProductCategory homeLiving = initializeCategory(null, "Nhà Cửa & Đời Sống");
        ProductCategory kitchenware = initializeCategory(homeLiving, "Dụng Cụ Nhà Bếp");
        ProductCategory appliances = initializeCategory(homeLiving, "Thiết Bị Gia Dụng");
        ProductCategory homeDecor = initializeCategory(homeLiving, "Nội Thất & Trang Trí");

        // Group 5: Sức Khỏe & Sắc Đẹp
        ProductCategory beauty = initializeCategory(null, "Sức Khỏe & Sắc Đẹp");
        ProductCategory skincare = initializeCategory(beauty, "Chăm Sóc Da");
        ProductCategory makeup = initializeCategory(beauty, "Trang Điểm & Son Môi");
        ProductCategory personalCare = initializeCategory(beauty, "Chăm Sóc Cá Nhân");

        // Group 6: Thể Thao & Dã Ngoại
        ProductCategory sports = initializeCategory(null, "Thể Thao & Dã Ngoại");
        ProductCategory sportswear = initializeCategory(sports, "Quần Áo Thể Thao");
        ProductCategory gymYoga = initializeCategory(sports, "Dụng Cụ Gym & Yoga");
        ProductCategory outdoorCamping = initializeCategory(sports, "Dã Ngoại & Cắm Trại");

        // Group 7: Mẹ & Bé
        ProductCategory momBaby = initializeCategory(null, "Mẹ & Bé");
        initializeCategory(momBaby, "Sữa & Dinh Dưỡng Cho Bé");
        initializeCategory(momBaby, "Đồ Chơi & Giáo Dục");

        // Group 8: Bách Hóa Online
        ProductCategory grocery = initializeCategory(null, "Bách Hóa Online");
        initializeCategory(grocery, "Bánh Kẹo & Đồ Ăn Vặt");
        initializeCategory(grocery, "Trà, Cà Phê & Đồ Uống");

        // 9. Multi-vendor Shops with Verified eKYC and Real Addresses (HN, HCM, DN)
        Shop shop1 = initializeShop(
                seller1,
                "Apple Authorised Reseller",
                "Gian hàng chính hãng phân phối ủy quyền các sản phẩm Apple: iPhone, MacBook, iPad, AirPods và phụ kiện chính hãng.",
                "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=300&h=300&fit=crop",
                "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=400&fit=crop",
                "0987654321",
                "Tầng 1, TTTM Vincom Center Đồng Khởi, 72 Lê Thánh Tôn, Bến Nghé",
                1442, // Quận 1, TP.HCM
                "21012",
                ShopStatus.ACTIVE,
                4.9f);

        Shop shop2 = initializeShop(
                seller2,
                "Trendy Fashion Studio",
                "Thương hiệu thời trang giới trẻ phong cách streetwear hiện đại, tối giản và thời thượng. Cam kết chất vải cao cấp.",
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop",
                "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop",
                "0987654322",
                "245 Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy",
                1542, // Cầu Giấy, Hà Nội
                "1B1507",
                ShopStatus.ACTIVE,
                4.8f);

        Shop shop3 = initializeShop(
                seller3,
                "Nhã Nam Books & Stationery",
                "Nhà sách phát hành các tác phẩm văn học, kinh tế, tâm lý học và dụng cụ văn phòng phẩm nhập khẩu cao cấp.",
                "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300&h=300&fit=crop",
                "https://images.unsplash.com/photo-1507842229451-7f01be837453?w=1200&h=400&fit=crop",
                "0987654323",
                "59 Đỗ Quang, Phường Trung Hòa, Quận Cầu Giấy",
                1542, // Cầu Giấy, Hà Nội
                "1B1507",
                ShopStatus.ACTIVE,
                4.9f);

        Shop shop4 = initializeShop(
                seller4,
                "Sunhouse Home Official",
                "Thiết bị gia dụng và đồ dùng nhà bếp thông minh hàng đầu Việt Nam. Nồi chiên, máy xay, chảo chống dính chuẩn chất lượng.",
                "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=300&h=300&fit=crop",
                "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=1200&h=400&fit=crop",
                "0987654324",
                "182 Bạch Đằng, Phường Hải Châu 1, Quận Hải Châu",
                1530, // Hải Châu, Đà Nẵng
                "40101",
                ShopStatus.ACTIVE,
                4.7f);

        Shop shop5 = initializeShop(
                seller5,
                "Beauty Garden Cosmetics",
                "Thiên đường mỹ phẩm và chăm sóc sắc đẹp chính hãng Hàn Quốc, Nhật Bản, Âu Mỹ. 100% hóa đơn chứng từ xác thực eKYC.",
                "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&h=300&fit=crop",
                "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200&h=400&fit=crop",
                "0987654325",
                "68 Phan Đăng Lưu, Phường 5, Quận Phú Nhuận",
                1448, // Phú Nhuận, TP.HCM
                "21015",
                ShopStatus.ACTIVE,
                4.8f);

        Shop shop6 = initializeShop(
                seller6,
                "Decathlon Sports Hub",
                "Cửa hàng thể thao đa năng: Trang phục thể thao, thiết bị tập gym, yoga, dã ngoại và leo núi chuyên nghiệp.",
                "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=300&h=300&fit=crop",
                "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&h=400&fit=crop",
                "0987654326",
                "72A Nguyễn Trãi, Phường Thượng Đình, Quận Thanh Xuân",
                1490, // Thanh Xuân, Hà Nội
                "100201",
                ShopStatus.ACTIVE,
                4.8f);

        // 10. Seed Realistic Products for Each Shop and Category
        seedShopProducts(shop1, List.of(smartphone, laptop, audio, accessories), "TECH");
        seedShopProducts(shop2, List.of(menFashion, womenFashion, shoesBags, watches), "FASHION");
        seedShopProducts(shop3, List.of(literature, businessBooks, stationery), "BOOK");
        seedShopProducts(shop4, List.of(appliances, kitchenware, homeDecor), "HOME");
        seedShopProducts(shop5, List.of(skincare, makeup, personalCare), "BEAUTY");
        seedShopProducts(shop6, List.of(sportswear, gymYoga, outdoorCamping), "SPORT");

        // 11. Realistic Addresses for Customers
        initializeUserAddress(customer1, "Lê Văn Mua Hàng", "0901234567",
                "123 Đường Nguyễn Huệ, Phường Bến Nghé", "Hồ Chí Minh", "Quận 1", "Phường Bến Nghé",
                1442, "21012", true);

        initializeUserAddress(customer2, "Phạm Thị Mua Sắm", "0909876543",
                "456 Đường Lê Lợi, Phường Bến Thành", "Hồ Chí Minh", "Quận 1", "Phường Bến Thành",
                1442, "21012", true);

        initializeUserAddress(customer3, "Nguyễn Văn An", "0905555555",
                "789 Đường Điện Biên Phủ, Phường 15", "Hồ Chí Minh", "Bình Thạnh", "Phường 15",
                1450, "21013", true);

        initializeUserAddress(customer4, "Đỗ Thùy Trang", "0906666666",
                "22 Phố Bà Triệu, Phường Tràng Tiền", "Hà Nội", "Hoàn Kiếm", "Phường Tràng Tiền",
                1482, "10001", true);

        initializeUserAddress(customer5, "Bùi Minh Quân", "0907777777",
                "101 Đường Nguyễn Văn Linh, Phường Nam Dương", "Đà Nẵng", "Hải Châu", "Phường Nam Dương",
                1530, "40102", true);

        // 12. Seed Requests
        seedRequests(adminAccount, customerRole);

        // 13. Seed Multi-vendor Orders
        List<Shop> allShops = List.of(shop1, shop2, shop3, shop4, shop5, shop6);
        seedOrders(List.of(customer1, customer2, customer3, customer4, customer5), allShops);

        log.info("Comprehensive multi-vendor marketplace initialization finished successfully!");
    }

    private void seedShopProducts(Shop shop, List<ProductCategory> categories, String domain) {
        long existingProducts = productRepository.findAll().stream()
                .filter(p -> p.getShop() != null
                        && p.getShop().getId().equals(shop.getId())
                        && !Boolean.TRUE.equals(p.getDeleted()))
                .count();

        if (existingProducts >= MIN_PRODUCTS_PER_SHOP) {
            log.debug("Skip seed products for shop {} because already has {}", shop.getName(), existingProducts);
            return;
        }

        List<ProductCatalogItem> catalog = getCatalogTemplate(domain);
        int productCount = Math.min(catalog.size(), MAX_PRODUCTS_PER_SHOP);

        for (int i = 0; i < productCount; i++) {
            ProductCatalogItem item = catalog.get(i);
            ProductCategory targetCategory = findMatchingCategory(categories, item.categoryKeyword);
            String sku = domain + "-" + (i + 1) + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();

            Product product = initializeProduct(
                    shop,
                    targetCategory,
                    item.name,
                    item.description,
                    sku,
                    ThreadLocalRandom.current().nextInt(25, 250),
                    item.price,
                    item.weight,
                    ProductStatus.PUBLISHED);

            initializeProductImage(product, item.primaryImage, true, 1);
            if (item.secondaryImage != null && !item.secondaryImage.isBlank()) {
                initializeProductImage(product, item.secondaryImage, false, 2);
            }
        }
        log.info("Seeded {} products for shop {}", productCount, shop.getName());
    }

    private ProductCategory findMatchingCategory(List<ProductCategory> categories, String keyword) {
        if (categories == null || categories.isEmpty()) {
            return productCategoryRepository.findAll().get(0);
        }
        return categories.stream()
                .filter(c -> c.getName().toLowerCase().contains(keyword.toLowerCase()))
                .findFirst()
                .orElse(categories.get(0));
    }

    private static class ProductCatalogItem {
        String name;
        String categoryKeyword;
        BigDecimal price;
        Integer weight;
        String description;
        String primaryImage;
        String secondaryImage;

        ProductCatalogItem(String name, String categoryKeyword, long priceVnd, int weight,
                           String description, String primaryImage, String secondaryImage) {
            this.name = name;
            this.categoryKeyword = categoryKeyword;
            this.price = BigDecimal.valueOf(priceVnd);
            this.weight = weight;
            this.description = description;
            this.primaryImage = primaryImage;
            this.secondaryImage = secondaryImage;
        }
    }

    private List<ProductCatalogItem> getCatalogTemplate(String domain) {
        List<ProductCatalogItem> list = new ArrayList<>();
        switch (domain) {
            case "TECH" -> {
                list.add(new ProductCatalogItem("iPhone 15 Pro Max 256GB Chính Hãng VN/A", "Điện Thoại", 29490000L, 450,
                        "Thiết kế Titan bền nhẹ, chip A17 Pro mạnh mẽ, camera tiềm vọng 5x đỉnh cao. Bảo hành 12 tháng tại các trung tâm bảo hành ủy quyền Apple toàn quốc.",
                        "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("MacBook Air M3 13.6 inch (16GB / 256GB SSD)", "Laptop", 27990000L, 1600,
                        "Hiệu năng đột phá từ vi xử lý Apple M3, thiết kế mỏng nhẹ sang trọng, pin lên đến 18 giờ liên tục, màn hình Liquid Retina sắc nét.",
                        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Tai nghe Apple AirPods Pro (Gen 2) cổng Type-C", "Âm Thanh", 5690000L, 250,
                        "Khử tiếng ồn chủ động (ANC) tốt gấp 2 lần, Adaptive Audio thông minh, cổng sạc Type-C tiện lợi, chuẩn kháng nước bụi IP54.",
                        "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Apple Watch Series 9 GPS 41mm Viền Nhôm", "Phụ Kiện", 8990000L, 200,
                        "Màn hình sáng gấp đôi, thao tác chạm đúp Double Tap ma thuật, đo nồng độ oxy trong máu và điện tâm đồ chuẩn xác.",
                        "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("iPad Air 6 M2 11 inch Wi-Fi 128GB", "Điện Thoại", 16490000L, 750,
                        "Thiết kế siêu mỏng, chip Apple M2 hỗ trợ AI tiên tiến, hỗ trợ Apple Pencil Pro và Magic Keyboard chuyên nghiệp.",
                        "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Củ Sạc Nhanh Apple 20W USB-C Power Adapter", "Phụ Kiện", 520000L, 100,
                        "Củ sạc chính hãng Apple hỗ trợ sạc nhanh Power Delivery chuẩn cho iPhone, iPad và AirPods an toàn tuyệt đối.",
                        "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Chuột Không Dây Apple Magic Mouse 2 Black", "Phụ Kiện", 2190000L, 250,
                        "Bề mặt cảm ứng Multi-Touch hỗ trợ vuốt chạm chuyển trang siêu mượt mà, cổng sạc pin sạc lại dùng cả tháng.",
                        "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Bàn Phím Không Dây Apple Magic Keyboard Touch ID", "Phụ Kiện", 3490000L, 400,
                        "Tích hợp cảm biến vân tay Touch ID đăng nhập bảo mật nhanh chóng, trải nghiệm gõ êm ái, pin bền bỉ.",
                        "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Tai nghe Chụp Tai Apple AirPods Max Wireless", "Âm Thanh", 12990000L, 600,
                        "Âm thanh Hi-Fi độ chi tiết đỉnh cao, chống ồn chủ động xuất sắc, đệm tai dạng lưới thoáng khí êm ái.",
                        "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Dây Cáp Sạc Bện Dù Apple USB-C to USB-C (1m)", "Phụ Kiện", 490000L, 80,
                        "Chất liệu bện dù chống đứt gãy, hỗ trợ sạc nhanh công suất cao và truyền tải dữ liệu ổn định.",
                        "https://images.unsplash.com/photo-1609081219090-a6d8173087ec?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&h=800&fit=crop"));
            }
            case "FASHION" -> {
                list.add(new ProductCatalogItem("Áo Thun Nam Cotton 100% Co Giãn 4 Chiều Basic", "Thời Trang Nam", 189000L, 200,
                        "Chất liệu cotton tự nhiên mềm mại, thoáng mát thấm hút mồ hôi tối đa, form dáng regular-fit trẻ trung dễ phối đồ.",
                        "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Quần Jean Nam Ống Suông Slimfit Cao Cấp", "Thời Trang Nam", 399000L, 500,
                        "Vải denim cao cấp bền màu, độ co giãn nhẹ tạo cảm giác thoải mái khi vận động cả ngày dài.",
                        "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Đầm Nữ Dáng Xòe Voan Hoa Nhí Vintage", "Thời Trang Nữ", 320000L, 300,
                        "Họa tiết hoa nhí nữ tính nhẹ nhàng, chất voan tơ 2 lớp mềm mại, phù hợp đi làm, đi chơi và dự tiệc.",
                        "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Áo Khoác Bomber Unisex Phong Cách Hàn Quốc", "Thời Trang Nam", 450000L, 450,
                        "Vải dù gió 2 lớp cản gió chống thấm nước nhẹ, lót dù êm ái, bo thun cổ và cổ tay năng động.",
                        "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Giày Sneaker Cổ Thấp Canvas Màu Trắng Classic", "Giày Dép", 280000L, 700,
                        "Đế cao su lưu hóa đúc nguyên khối êm chân, vải canvas bền bỉ thoáng khí, thiết kế basic bất hủ.",
                        "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Túi Xách Nữ Đeo Chéo Da PU Trơn Khóa Bấm", "Giày Dép", 249000L, 350,
                        "Chất da PU mềm mịn chống thấm nước, form dáng hộp hiện đại, đường may tỉ mỉ, nhiều ngăn chứa tiện lợi.",
                        "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Đồng Hồ Nam Dây Da Tối Giản Chống Nước 3ATM", "Đồng Hồ", 590000L, 150,
                        "Mặt kính khoáng cường lực chống trầy xước, bộ máy Quartz Nhật Bản vận hành chuẩn xác từng giây.",
                        "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Áo Polo Nam Vải Pique Mắt Chim Cao Cấp", "Thời Trang Nam", 239000L, 250,
                        "Công nghệ dệt mắt chim thoáng khí, bo cổ dệt cao cấp không bai nhão qua nhiều lần giặt.",
                        "https://images.unsplash.com/photo-1625910513413-7d1c68e1c64a?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Chân Váy Chữ A Công Sở Dáng Dài Tôn Dáng", "Thời Trang Nữ", 269000L, 280,
                        "Vải tuyết mưa đứng form cao cấp, cạp cao giấu bụng hoàn hảo, đường may chuẩn chỉnh từng đường kim.",
                        "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Ví Nam Da Bò Thật Dáng Ngang Nhỏ Gọn", "Giày Dép", 199000L, 120,
                        "100% da bò lớp đầu tiên thật mềm mại càng dùng càng bóng đẹp, kích thước nhỏ gọn vừa vặn túi quần.",
                        "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop"));
            }
            case "BOOK" -> {
                list.add(new ProductCatalogItem("Sách Đắc Nhân Tâm (Khổ Lớn Tái Bản Mới)", "Văn Học", 98000L, 350,
                        "Tác phẩm kinh điển dạy nghệ thuật ứng xử và thấu hiểu lòng người của Dale Carnegie, cuốn sách bán chạy nhất mọi thời đại.",
                        "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Sách Nhà Giả Kim - Paulo Coelho", "Văn Học", 79000L, 250,
                        "Câu chuyện hành trình đi tìm kho báu và sứ mệnh cuộc đời chạm đến trái tim hàng triệu độc giả khắp thế giới.",
                        "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1495640388908-05fa85288e61?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Sách Tâm Lý Học Tội Phạm - Phác Họa Chân Dung", "Kinh Tế", 145000L, 400,
                        "Những cuộc giải mã tâm lý học tội phạm ly kỳ và khoa học hành vi chân thực từ các chuyên gia điều tra hàng đầu.",
                        "https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Sách Nghĩ Giàu Làm Giàu (Think and Grow Rich)", "Kinh Tế", 110000L, 380,
                        "Bí quyết xây dựng tư duy thịnh vượng tài chính và tự do cá nhân được đúc kết từ 500 nhân vật kiệt xuất nhất nước Mỹ.",
                        "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Sách Tuổi Trẻ Đáng Giá Bao Nhiêu - Rosie Nguyễn", "Kinh Tế", 85000L, 280,
                        "Cuốn sách truyền cảm hứng sống đẹp, học tập, trải nghiệm và rèn luyện bản lĩnh cho các bạn trẻ Việt Nam.",
                        "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Hộp 12 Bút Gel Mực Đen Ngòi 0.5mm Chống Tắc Mực", "Dụng Cụ", 45000L, 150,
                        "Ngòi kim 0.5mm mực trơn êm đều màu, không lem khi gặp nước, cầm êm tay không mỏi suốt nhiều giờ viết.",
                        "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1585336261026-7782b5424df9?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Sổ Tay Bìa Da PU Cao Cấp Ruột Kẻ Ngang A5", "Dụng Cụ", 89000L, 300,
                        "Giấy dầy định lượng 100gsm chống thấm mực sang trang sau, bìa da may viền chỉ sắc sảo, dập chìm sang trọng.",
                        "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1517842645767-c639042777db?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Bộ Bút Màu Nước 24 Cây Vẽ Minh Họa Cao Cấp", "Dụng Cụ", 125000L, 250,
                        "Đầu cọ 2 chiều linh hoạt, màu sắc tươi sáng chuyển màu mượt mà, an toàn tuyệt đối cho người sử dụng.",
                        "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1502691876148-a84978e59af8?w=800&h=800&fit=crop"));
            }
            case "HOME" -> {
                list.add(new ProductCatalogItem("Nồi Chiên Không Dầu Điện Tử Sunhouse 6.0L", "Thiết Bị", 1490000L, 5500,
                        "Công nghệ Rapid Air giảm 85% chất béo, bảng điều khiển cảm ứng điện tử 8 chế độ tự động, lòng nồi chống dính kép.",
                        "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Máy Xay Sinh Tố Đa Năng 3 Cối Thủy Tinh Cao Cấp", "Thiết Bị", 690000L, 3200,
                        "Lưỡi dao thép không gỉ 6 cánh xay nhuyễn đá trong tích tắc, cối thủy tinh chịu lực an toàn vệ sinh thực phẩm.",
                        "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Bộ 3 Chảo Chống Dính Vân Đá Đáy Từ Bếp Từ", "Dụng Cụ", 480000L, 2100,
                        "Lớp chống dính phủ đá hoa cương siêu bền, bắt từ cực nhạy tiết kiệm điện, tay cầm cách nhiệt êm ái.",
                        "https://images.unsplash.com/photo-1584990347449-389369d72728?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Nồi Cơm Điện Tử Lòng Niêu Sunhouse 1.8L", "Thiết Bị", 920000L, 4000,
                        "Lòng nồi niêu bo tròn tạo dòng sôi tuần hoàn nấu cơm chín đều thơm dẻo, giữ ấm tự động đến 24 giờ.",
                        "https://images.unsplash.com/photo-1544233726-9f1d2b27be8b?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Ấm Siêu Tốc Thủy Tinh 1.8L Đèn LED Tự Ngắt", "Thiết Bị", 270000L, 1200,
                        "Thân thủy tinh Borosilicate chịu sốc nhiệt, đèn LED xanh dịu mắt khi đun, tự ngắt điện an toàn khi sôi cạn nước.",
                        "https://images.unsplash.com/photo-1594213114663-dd95639f727c?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Đèn Bàn LED Chống Cận Thị 3 Cấp Độ Sáng", "Nội Thất", 199000L, 800,
                        "Ánh sáng liên tục không nhấp nháy bảo vệ mắt tối ưu, tích hợp pin sạc dự phòng dùng được khi mất điện.",
                        "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Bình Giữ Nhiệt Inox 304 Dung Tích 800ml", "Dụng Cụ", 175000L, 450,
                        "Cách nhiệt chân không 2 lớp giữ nóng 12h giữ lạnh 24h, nắp đậy roong silicone kín chống tràn tuyệt đối.",
                        "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1577937927133-66ef06acdf18?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Bộ Dao Bếp Nhật Bản Thép Nguyên Khối 6 Món", "Dụng Cụ", 389000L, 1500,
                        "Lưỡi dao tôi nhiệt sắc bén lâu cùn, phủ lớp chống bám dính kháng khuẩn, đế cắm dao sang trọng cho gian bếp.",
                        "https://images.unsplash.com/photo-1593618998160-e34014e67546?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?w=800&h=800&fit=crop"));
            }
            case "BEAUTY" -> {
                list.add(new ProductCatalogItem("Serum Cấp Ẩm Phục Hồi Da Hyaluronic B5 30ml", "Chăm Sóc Da", 289000L, 120,
                        "Công thức phân tử HA đa tầng thẩm thấu sâu hạ bì, kết hợp Vitamin B5 làm dịu mát kích ứng, phục hồi hàng rào ẩm.",
                        "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1608248597359-5f21e5364177?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Kem Chống Nắng Nâng Tông Tự Nhiên SPF50+ PA++++", "Chăm Sóc Da", 245000L, 150,
                        "Màng lọc chống nắng quang phổ rộng bảo vệ da toàn diện trước tia UVA/UVB, nâng tông trắng hồng rạng rỡ kiềm dầu.",
                        "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Son Kem Lì Lâu Trôi Mịn Môi Velvet Tint", "Trang Điểm", 179000L, 80,
                        "Chất son xốp mịn lướt nhẹ trên môi, chuẩn sắc ngay từ lần quẹt đầu tiên, bền màu suốt 8 tiếng không khô môi.",
                        "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Nước Tẩy Trang Dịu Nhẹ Micellar Water 400ml", "Chăm Sóc Da", 165000L, 450,
                        "Công nghệ hạt Micelle hút sạch bụi mịn và lớp trang điểm chống trôi mà không cần chà xát mạnh, không cồn hương liệu.",
                        "https://images.unsplash.com/photo-1556228722-d0b71941d6dc?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Sữa Rửa Mặt Tạo Bọt Chiết Xuất Trà Xanh 150ml", "Chăm Sóc Da", 135000L, 200,
                        "Chiết xuất lá trà xanh nguyên chất giàu chất chống oxy hóa, làm sạch sâu lỗ chân lông ngăn ngừa mụn hiệu quả.",
                        "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Nước Hoa Nữ Mini Eau De Parfum Lưu Hương 12H 20ml", "Chăm Sóc", 320000L, 100,
                        "Hương hoa cỏ ngọt ngào thanh lịch, 3 tầng hương quyến rũ tinh tế, thiết kế nhỏ gọn tiện lợi mang theo túi xách.",
                        "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Kem Dưỡng Ẩm Trắng Da Ban Đêm Collagen 50g", "Chăm Sóc Da", 299000L, 180,
                        "Bổ sung Collagen thủy phân và Niacinamide dưỡng da căng mọng, mờ thâm nám và ngừa lão hóa sớm sau 4 tuần.",
                        "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1608248597359-5f21e5364177?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Bảng Phấn Mắt 9 Ô Tone Cam Đào Nhũ Lấp Lánh", "Trang Điểm", 159000L, 120,
                        "Hạt phấn nhuyễn mịn bám màu tốt không rơi bụi, phối sẵn các tone màu matte và nhũ kim tuyến bắt sáng cuốn hút.",
                        "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=800&fit=crop"));
            }
            case "SPORT" -> {
                list.add(new ProductCatalogItem("Thảm Tập Yoga Định Tuyến Chống Trượt TPE 8mm", "Dụng Cụ", 260000L, 1100,
                        "Chất liệu TPE sinh thái đàn hồi êm ái bảo vệ khớp xương gối, kẻ sẵn đường định tuyến hỗ trợ tư thế chuẩn xác.",
                        "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Bộ 2 Tạ Tay Bọc Cao Su Cao Cấp 5kg Mỗi Bên", "Dụng Cụ", 340000L, 10500,
                        "Lõi gang đúc bọc cao su dày chống va đập vỡ sàn, tay cầm vân kim cương chống trượt an toàn khi nâng tạ nặng.",
                        "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Lều Cắm Trại Dã Ngoại Tự Bung Chống Mưa 4 Người", "Dã Ngoại", 780000L, 3800,
                        "Cơ chế lò xo tự bung mở lều trong 3 giây, vải Oxford 210D phủ bạc chống nắng UV50+ và chống mưa to 3000mm.",
                        "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Bình Nước Thể Thao Dung Tích 1500ml Kèm Ống Hút", "Dụng Cụ", 139000L, 300,
                        "Nhựa Tritan không chứa BPA an toàn sức khỏe, nắp mở một chạm có khóa an toàn chống bật đổ nước khi chạy bộ.",
                        "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Áo Thể Thao Nam Thun Lạnh Co Giãn Chạy Bộ", "Quần Áo", 149000L, 180,
                        "Vải thun mè thể thao siêu nhẹ, công nghệ Dry-fit thoát mồ hôi siêu tốc giữ cơ thể luôn khô ráo thoáng mát.",
                        "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Bộ Dây Kháng Lực Đàn Hồi Tập Mông Đùi 5 Cấp Độ", "Dụng Cụ", 119000L, 200,
                        "Dây cao su tự nhiên độ đàn hồi cao không dão, hỗ trợ tập luyện squat, yoga, phục hồi chức năng toàn diện.",
                        "https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Túi Trống Thể Thao Tập Gym Có Ngăn Để Giày Riêng", "Dã Ngoại", 199000L, 450,
                        "Vải Polyester chống thấm nước, quai đeo đệm vai êm ái, ngăn để giày thông thoáng có lỗ thoát khí riêng biệt.",
                        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Ghế Xếp Dã Ngoại Khung Nhôm Gấp Gọn Siêu Nhẹ", "Dã Ngoại", 299000L, 1200,
                        "Khung hợp kim nhôm hàng không chịu tải 150kg, vải lưới thoáng lưng, gấp gọn bỏ túi tiện lợi khi đi cắm trại câu cá.",
                        "https://images.unsplash.com/photo-1470246973918-29a93221c455?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&h=800&fit=crop"));
            }
        }
        return list;
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
                    "Đăng ký mở gian hàng thời trang & phụ kiện thiết kế chính hãng",
                    adminAccount,
                    LocalDateTime.now().minusDays(5),
                    "Hồ sơ pháp lý hợp lệ, CCCD và chân dung eKYC trùng khớp 100%. Đã phê duyệt.");
        }

        if (customerAccount2 != null) {
            initializeRequest(
                    customerAccount2,
                    RequestType.SELLER_REGISTRATION,
                    RequestStatus.PENDING,
                    "Đăng ký mở gian hàng thiết bị nhà bếp thông minh và đồ gia dụng",
                    null,
                    null,
                    null);
        }

        if (customerAccount3 != null) {
            initializeRequest(
                    customerAccount3,
                    RequestType.SELLER_REGISTRATION,
                    RequestStatus.REJECTED,
                    "Đăng ký kinh doanh thực phẩm chức năng xách tay",
                    adminAccount,
                    LocalDateTime.now().minusDays(10),
                    "Từ chối: Mặt hàng yêu cầu giấy phép công bố sản phẩm và an toàn vệ sinh thực phẩm.");
        }
    }

    private Wallet initializeUserWallet(User user) {
        return walletRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    LocalDateTime now = LocalDateTime.now();
                    Wallet w = Wallet.builder()
                            .user(user)
                            .currency("VND")
                            .availableBalance(BigDecimal.valueOf(1000000))
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
                                Integer districtId, String wardCode, ShopStatus status, Float rating) {
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
                            .averageRating(rating != null ? rating : 4.8f)
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
        return BigDecimal.valueOf(ThreadLocalRandom.current().nextLong(16000, 42001));
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

        LocalDateTime createdAt = reviewedAt != null ? reviewedAt.minusDays(2) : LocalDateTime.now().minusDays(1);
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