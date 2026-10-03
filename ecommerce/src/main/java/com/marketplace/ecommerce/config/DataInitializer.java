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
import com.marketplace.ecommerce.request.entity.Seller;
import com.marketplace.ecommerce.request.repository.RequestRepository;
import com.marketplace.ecommerce.request.repository.SellerRepository;
import com.marketplace.ecommerce.request.valueObjects.BusinessType;
import com.marketplace.ecommerce.request.valueObjects.RequestStatus;
import com.marketplace.ecommerce.request.valueObjects.RequestType;
import com.marketplace.ecommerce.request.valueObjects.SellerType;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.shop.valueObjects.ShopStatus;
import com.marketplace.ecommerce.wallet.entity.Wallet;
import com.marketplace.ecommerce.wallet.repository.WalletRepository;
import com.marketplace.ecommerce.wallet.valueObjects.WalletType;
import com.marketplace.ecommerce.voucher.entity.Voucher;
import com.marketplace.ecommerce.voucher.repository.VoucherRepository;
import com.marketplace.ecommerce.voucher.valueObjects.VoucherScope;
import com.marketplace.ecommerce.voucher.valueObjects.VoucherStatus;
import com.marketplace.ecommerce.voucher.valueObjects.VoucherType;
import com.marketplace.ecommerce.review.dto.projection.ShopReviewStatsProjection;
import com.marketplace.ecommerce.review.entity.Reply;
import com.marketplace.ecommerce.review.entity.Review;
import com.marketplace.ecommerce.review.entity.ReviewImage;
import com.marketplace.ecommerce.review.repository.ReplyRepository;
import com.marketplace.ecommerce.review.repository.ReviewRepository;
import com.marketplace.ecommerce.review.valueObjects.ReviewStatus;
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
        private final SellerRepository sellerRepository;
        private final CommissionRepository commissionRepository;
        private final VoucherRepository voucherRepository;
        private final ReviewRepository reviewRepository;
        private final ReplyRepository replyRepository;

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
                Account adminAccount = initializeAccount("admin", "admin@ecommerce.vn", "0123456789", "admin123@",
                                adminRole);
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
                                initializeAccount("seller1", "apple.reseller@gmail.com", "0987654321", "seller123@",
                                                businessRole),
                                "Nguyễn Thành Đạt (Apple Official)",
                                "apple.reseller@gmail.com",
                                "0987654321",
                                LocalDate.of(1988, 5, 15),
                                GenderType.MALE,
                                "987654321012");

                User seller2 = initializeUser(
                                initializeAccount("seller2", "samsung.official@gmail.com", "0987654322", "seller123@",
                                                businessRole),
                                "Trần Quang Huy (Samsung Experience)",
                                "samsung.official@gmail.com",
                                "0987654322",
                                LocalDate.of(1990, 8, 20),
                                GenderType.MALE,
                                "987654321013");

                User seller3 = initializeUser(
                                initializeAccount("seller3", "gearvn.hub@gmail.com", "0987654323", "seller123@",
                                                businessRole),
                                "Lê Minh Tuấn (GearVN Gaming)",
                                "gearvn.hub@gmail.com",
                                "0987654323",
                                LocalDate.of(1989, 11, 12),
                                GenderType.MALE,
                                "987654321014");

                User seller4 = initializeUser(
                                initializeAccount("seller4", "sony.flagship@gmail.com", "0987654324",
                                                "seller123@", businessRole),
                                "Phạm Gia Long (Sony Official)",
                                "sony.flagship@gmail.com",
                                "0987654324",
                                LocalDate.of(1987, 4, 18),
                                GenderType.MALE,
                                "987654321015");

                User seller5 = initializeUser(
                                initializeAccount("seller5", "anker.baseus.vn@gmail.com", "0987654325", "seller123@",
                                                businessRole),
                                "Ngô Hoàng Bách (Anker & Baseus)",
                                "anker.baseus.vn@gmail.com",
                                "0987654325",
                                LocalDate.of(1994, 9, 25),
                                GenderType.MALE,
                                "987654321016");

                User seller6 = initializeUser(
                                initializeAccount("seller6", "xiaomi.ecosystem@gmail.com", "0987654326", "seller123@",
                                                businessRole),
                                "Vũ Đình Nam (Xiaomi Official)",
                                "xiaomi.ecosystem@gmail.com",
                                "0987654326",
                                LocalDate.of(1991, 2, 10),
                                GenderType.MALE,
                                "987654321017");

                // 4. Customers
                User customer1 = initializeUser(
                                initializeAccount("customer1", "customer1@gmail.com", "0901234567", "customer123@",
                                                customerRole),
                                "Lê Văn Mua Hàng",
                                "customer1@gmail.com",
                                "0901234567",
                                LocalDate.of(1995, 3, 10),
                                GenderType.MALE,
                                "223344556677");

                User customer2 = initializeUser(
                                initializeAccount("customer2", "customer2@gmail.com", "0909876543", "customer123@",
                                                customerRole),
                                "Phạm Thị Mua Sắm",
                                "customer2@gmail.com",
                                "0909876543",
                                LocalDate.of(1992, 7, 25),
                                GenderType.FEMALE,
                                "334455667788");

                User customer3 = initializeUser(
                                initializeAccount("customer3", "customer3@gmail.com", "0905555555", "customer123@",
                                                customerRole),
                                "Nguyễn Văn An",
                                "customer3@gmail.com",
                                "0905555555",
                                LocalDate.of(1994, 4, 14),
                                GenderType.MALE,
                                "555666777888");

                User customer4 = initializeUser(
                                initializeAccount("customer4", "customer4@gmail.com", "0906666666", "customer123@",
                                                customerRole),
                                "Đỗ Thùy Trang",
                                "customer4@gmail.com",
                                "0906666666",
                                LocalDate.of(1996, 12, 1),
                                GenderType.FEMALE,
                                "888777666555");

                User customer5 = initializeUser(
                                initializeAccount("customer5", "customer5@gmail.com", "0907777777", "customer123@",
                                                customerRole),
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

                // 8. Comprehensive Electronics & Tech Category Hierarchy (8 Major Categories + Subcategories)
                // Group 1: Điện Thoại & Máy Tính Bảng
                ProductCategory phonesAndTablets = initializeCategory(null, "Điện Thoại & Máy Tính Bảng");
                ProductCategory smartphones = initializeCategory(phonesAndTablets, "Điện Thoại Thông Minh");
                ProductCategory tablets = initializeCategory(phonesAndTablets, "Máy Tính Bảng");
                ProductCategory ereaders = initializeCategory(phonesAndTablets, "Máy Đọc Sách & Phụ Kiện");

                // Group 2: Laptop & Máy Tính Để Bàn
                ProductCategory computers = initializeCategory(null, "Laptop & Máy Tính Để Bàn");
                ProductCategory gamingLaptops = initializeCategory(computers, "Laptop Gaming & Đồ Họa");
                ProductCategory ultrabooks = initializeCategory(computers, "Laptop Văn Phòng & Mỏng Nhẹ");
                ProductCategory pcWorkstations = initializeCategory(computers, "PC Đồng Bộ & Máy Trạm");

                // Group 3: Linh Kiện Máy Tính & PC Build
                ProductCategory components = initializeCategory(null, "Linh Kiện Máy Tính & PC Build");
                ProductCategory cpuGpu = initializeCategory(components, "CPU & Card Đồ Họa (VGA)");
                ProductCategory ramSsd = initializeCategory(components, "RAM, Ổ Cứng SSD & HDD");
                ProductCategory motherboardPsu = initializeCategory(components, "Bo Mạch Chủ & Nguồn Máy Tính");
                ProductCategory casesCooling = initializeCategory(components, "Vỏ Case & Tản Nhiệt PC");

                // Group 4: Thiết Bị Âm Thanh
                ProductCategory audio = initializeCategory(null, "Thiết Bị Âm Thanh");
                ProductCategory headphones = initializeCategory(audio, "Tai Nghe True Wireless & Chụp Tai");
                ProductCategory speakers = initializeCategory(audio, "Loa Bluetooth & Soundbar");
                ProductCategory audioStudio = initializeCategory(audio, "Microphone & Soundcard Thu Âm");

                // Group 5: Phụ Kiện Điện Tử & Gaming Gear
                ProductCategory accessories = initializeCategory(null, "Phụ Kiện Điện Tử & Gaming Gear");
                ProductCategory chargingPacks = initializeCategory(accessories, "Củ Cáp Sạc & Sạc Dự Phòng");
                ProductCategory gearPeripherals = initializeCategory(accessories, "Bàn Phím Cơ & Chuột Gaming");
                ProductCategory hubsCables = initializeCategory(accessories, "Cáp Chuyển Đổi & Hub Type-C");

                // Group 6: Thiết Bị Đeo & Đồng Hồ Thông Minh
                ProductCategory wearables = initializeCategory(null, "Thiết Bị Đeo & Đồng Hồ Thông Minh");
                ProductCategory smartwatches = initializeCategory(wearables, "Đồng Hồ Thông Minh (Smartwatch)");
                ProductCategory smartbands = initializeCategory(wearables, "Vòng Đeo Tay Thể Thao (Smartband)");
                ProductCategory wearableAccessories = initializeCategory(wearables, "Dây Đeo & Phụ Kiện Smartwatch");

                // Group 7: Thiết Bị Nhà Thông Minh & IoT
                ProductCategory smartHome = initializeCategory(null, "Thiết Bị Nhà Thông Minh & IoT");
                ProductCategory securityCameras = initializeCategory(smartHome, "Camera An Ninh & Giám Sát");
                ProductCategory robotVacuums = initializeCategory(smartHome, "Robot Hút Bụi & Lau Nhà");
                ProductCategory smartLightingControls = initializeCategory(smartHome, "Khóa Cửa & Đèn Thông Minh");

                // Group 8: Máy Ảnh & Thiết Bị Quay Phim
                ProductCategory cameras = initializeCategory(null, "Máy Ảnh & Thiết Bị Quay Phim");
                ProductCategory dslrMirrorless = initializeCategory(cameras, "Máy Ảnh Mirrorless & DSLR");
                ProductCategory dronesActionCam = initializeCategory(cameras, "Flycam Drone & Action Cam");
                ProductCategory lensesGimbals = initializeCategory(cameras, "Ống Kính (Lens) & Gimbal Chống Rung");

                // 9. Multi-vendor Electronics Shops with Verified eKYC and Real Addresses (HN, HCM, DN)
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
                                4.9f,
                                SellerType.BUSINESS,
                                BusinessType.ENTERPRISE,
                                "Công Ty TNHH Apple Việt Nam",
                                "Tầng 1, TTTM Vincom Center Đồng Khởi, 72 Lê Thánh Tôn, Bến Nghé, Quận 1, TP.HCM",
                                "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c",
                                "0316888999",
                                "invoice@apple-reseller.vn",
                                "Vietcombank",
                                "0071001234567",
                                "CONG TY TNHH APPLE VIET NAM",
                                "Tầng 1, TTTM Vincom Center Đồng Khởi, 72 Lê Thánh Tôn, Bến Nghé, Quận 1, TP.HCM",
                                "Kho Apple Logistics, 10 Mai Chí Thọ, TP Thủ Đức, TP.HCM");

                Shop shop2 = initializeShop(
                                seller2,
                                "Samsung Experience Store",
                                "Gian hàng chính hãng Samsung Flagship phân phối dòng Galaxy S, Galaxy Z Fold/Flip, Galaxy Tab, Galaxy Watch và hệ sinh thái Galaxy AI.",
                                "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=300&h=300&fit=crop",
                                "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&h=400&fit=crop",
                                "0987654322",
                                "245 Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy",
                                1542, // Cầu Giấy, Hà Nội
                                "1B1507",
                                ShopStatus.ACTIVE,
                                4.9f,
                                SellerType.BUSINESS,
                                BusinessType.ENTERPRISE,
                                "Công Ty TNHH Điện Tử Samsung Vina",
                                "245 Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội",
                                "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c",
                                "0301119988",
                                "support.samsung@samsung-vina.com.vn",
                                "Techcombank",
                                "19034567890011",
                                "CONG TY TNHH DIEN TU SAMSUNG VINA",
                                "245 Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội",
                                "Tổng kho Samsung Logistics, KCN Yên Phong, Bắc Ninh");

                Shop shop3 = initializeShop(
                                seller3,
                                "GearVN PC & Gaming Hub",
                                "Chuyên cung cấp laptop gaming cao cấp, linh kiện PC build chuyên nghiệp (RTX, Core i9, Ryzen), bàn phím cơ và gear thể thao điện tử.",
                                "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=300&h=300&fit=crop",
                                "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=400&fit=crop",
                                "0987654323",
                                "59 Đỗ Quang, Phường Trung Hòa, Quận Cầu Giấy",
                                1542, // Cầu Giấy, Hà Nội
                                "1B1507",
                                ShopStatus.ACTIVE,
                                4.9f,
                                SellerType.BUSINESS,
                                BusinessType.ENTERPRISE,
                                "Công Ty Cổ Phần Công Nghệ GearVN",
                                "59 Đỗ Quang, Phường Trung Hòa, Quận Cầu Giấy, Hà Nội",
                                "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c",
                                "0314889966",
                                "cskh@gearvn.com",
                                "MB Bank",
                                "0888999888",
                                "CONG TY CO PHAN CONG NGHE GEARVN",
                                "59 Đỗ Quang, Phường Trung Hòa, Quận Cầu Giấy, Hà Nội",
                                "Kho GearVN Hub, 78 Hoàng Hoa Thám, Phường 12, Tân Bình, TP.HCM");

                Shop shop4 = initializeShop(
                                seller4,
                                "Sony Electronics Flagship",
                                "Nhà phân phối chính thức thiết bị âm thanh đỉnh cao (WH-1000XM5, Soundbar), máy ảnh Sony Alpha và phụ kiện quay chụp chuyên nghiệp.",
                                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop",
                                "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&h=400&fit=crop",
                                "0987654324",
                                "182 Bạch Đằng, Phường Hải Châu 1, Quận Hải Châu",
                                1530, // Hải Châu, Đà Nẵng
                                "40101",
                                ShopStatus.ACTIVE,
                                4.9f,
                                SellerType.BUSINESS,
                                BusinessType.ENTERPRISE,
                                "Công Ty TNHH Sony Electronics Việt Nam",
                                "182 Bạch Đằng, Phường Hải Châu 1, Quận Hải Châu, Đà Nẵng",
                                "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c",
                                "0401889977",
                                "sony.vietnam@sony.com.vn",
                                "BIDV",
                                "6868686868",
                                "CONG TY TNHH SONY ELECTRONICS VIET NAM",
                                "182 Bạch Đằng, Phường Hải Châu 1, Quận Hải Châu, Đà Nẵng",
                                "Kho Sony miền Trung, KCN Hòa Cầm, Cẩm Lệ, Đà Nẵng");

                Shop shop5 = initializeShop(
                                seller5,
                                "Anker & Baseus Flagship Store",
                                "Thương hiệu phụ kiện sạc nhanh GaN, pin sạc dự phòng, dock hub USB-C và cáp kết nối công nghệ cao tiêu chuẩn quốc tế.",
                                "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=300&h=300&fit=crop",
                                "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=400&fit=crop",
                                "0987654325",
                                "68 Phan Đăng Lưu, Phường 5, Quận Phú Nhuận",
                                1448, // Phú Nhuận, TP.HCM
                                "21015",
                                ShopStatus.ACTIVE,
                                4.8f,
                                SellerType.BUSINESS,
                                BusinessType.ENTERPRISE,
                                "Công Ty TNHH Phụ Kiện Công Nghệ Anker Baseus VN",
                                "68 Phan Đăng Lưu, Phường 5, Quận Phú Nhuận, TP.HCM",
                                "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c",
                                "0317894561",
                                "contact@anker-baseus.vn",
                                "ACB",
                                "2345678901",
                                "CONG TY TNHH PHU KIEN CONG NGHE ANKER BASEUS VN",
                                "68 Phan Đăng Lưu, Phường 5, Quận Phú Nhuận, TP.HCM",
                                "Kho Anker Logistics, 55 Song Hành, An Phú, TP Thủ Đức, TP.HCM");

                Shop shop6 = initializeShop(
                                seller6,
                                "Xiaomi Smart Ecosystem VN",
                                "Hệ sinh thái nhà thông minh và IoT Xiaomi chính hãng: Robot hút bụi, Camera an ninh, Máy lọc không khí, Smartband và thiết bị gia dụng thông minh.",
                                "https://images.unsplash.com/photo-1558002038-1055907df827?w=300&h=300&fit=crop",
                                "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=400&fit=crop",
                                "0987654326",
                                "72A Nguyễn Trãi, Phường Thượng Đình, Quận Thanh Xuân",
                                1493, // Thanh Xuân, Hà Nội
                                "1A0711",
                                ShopStatus.ACTIVE,
                                4.9f,
                                SellerType.BUSINESS,
                                BusinessType.ENTERPRISE,
                                "Công Ty TNHH Phân Phối Xiaomi Việt Nam",
                                "72A Nguyễn Trãi, Phường Thượng Đình, Quận Thanh Xuân, Hà Nội",
                                "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c",
                                "0107654321",
                                "xiaomi.official@dgw.com.vn",
                                "Vietcombank",
                                "0011009876543",
                                "CONG TY TNHH PHAN PHOI XIAOMI VIET NAM",
                                "72A Nguyễn Trãi, Phường Thượng Đình, Quận Thanh Xuân, Hà Nội",
                                "Kho Digiworld - Xiaomi, KCN Tân Bình, Tây Thạnh, Tân Phú, TP.HCM");

                // 10. Seed Realistic Products for Each Shop and Category
                seedShopProducts(shop1, List.of(smartphones, tablets, ultrabooks, headphones, smartwatches, chargingPacks), "APPLE");
                seedShopProducts(shop2, List.of(smartphones, tablets, smartwatches, headphones, chargingPacks), "SAMSUNG");
                seedShopProducts(shop3, List.of(gamingLaptops, pcWorkstations, cpuGpu, ramSsd, motherboardPsu, casesCooling, gearPeripherals), "GEARVN");
                seedShopProducts(shop4, List.of(headphones, speakers, audioStudio, dslrMirrorless, lensesGimbals), "SONY");
                seedShopProducts(shop5, List.of(chargingPacks, hubsCables, gearPeripherals, headphones), "ANKER");
                seedShopProducts(shop6, List.of(securityCameras, robotVacuums, smartLightingControls, smartbands), "XIAOMI");

                // 11. Seed Realistic Vouchers (Platform Vouchers + Shop Vouchers)
                initializeVouchers(shop1, shop2, shop3, shop4, phonesAndTablets, computers, components, audio);

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
                                1489, "1A0218", true);

                initializeUserAddress(customer5, "Bùi Minh Quân", "0907777777",
                                "101 Đường Nguyễn Văn Linh, Phường Nam Dương", "Đà Nẵng", "Hải Châu",
                                "Phường Nam Dương",
                                1530, "40102", true);

                // 12. Seed Requests
                seedRequests(adminAccount, customerRole);

                // 13. Seed Multi-vendor Orders
                List<Shop> allShops = List.of(shop1, shop2, shop3, shop4, shop5, shop6);
                seedOrders(List.of(customer1, customer2, customer3, customer4, customer5), allShops);

                // 14. Seed Reviews (Verified Purchases from Completed Orders)
                seedReviews(allShops);

                log.info("Comprehensive multi-vendor marketplace initialization finished successfully!");
        }

        private void seedShopProducts(Shop shop, List<ProductCategory> categories, String domain) {
                // Soft-delete legacy non-tech products for this shop if they exist from earlier runs
                productRepository.findAll().stream()
                                .filter(p -> p.getShop() != null
                                                && p.getShop().getId().equals(shop.getId())
                                                && !Boolean.TRUE.equals(p.getDeleted()))
                                .filter(p -> p.getSku() != null && (
                                                p.getSku().startsWith("FASHION-")
                                                || p.getSku().startsWith("BOOK-")
                                                || p.getSku().startsWith("HOME-")
                                                || p.getSku().startsWith("BEAUTY-")
                                                || p.getSku().startsWith("SPORT-")
                                ))
                                .forEach(p -> {
                                        p.setDeleted(true);
                                        productRepository.save(p);
                                        log.info("Soft-deleted legacy non-tech product: {} for shop: {}", p.getName(), shop.getName());
                                });

                long existingProducts = productRepository.findAll().stream()
                                .filter(p -> p.getShop() != null
                                                && p.getShop().getId().equals(shop.getId())
                                                && !Boolean.TRUE.equals(p.getDeleted()))
                                .count();

                if (existingProducts >= MIN_PRODUCTS_PER_SHOP) {
                        log.debug("Skip seed products for shop {} because already has {}", shop.getName(),
                                        existingProducts);
                        return;
                }

                List<ProductCatalogItem> catalog = getCatalogTemplate(domain);
                int productCount = Math.min(catalog.size(), MAX_PRODUCTS_PER_SHOP);

                for (int i = 0; i < productCount; i++) {
                        ProductCatalogItem item = catalog.get(i);
                        ProductCategory targetCategory = findMatchingCategory(categories, item.categoryKeyword);
                        String sku = domain + "-" + (i + 1) + "-"
                                        + UUID.randomUUID().toString().substring(0, 4).toUpperCase();

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
                        case "APPLE", "TECH" -> {
                                list.add(new ProductCatalogItem("iPhone 15 Pro Max 256GB Titan Tự Nhiên VN/A", "Điện Thoại",
                                                29490000L, 450,
                                                "Thiết kế khung viền Titan chuẩn hàng không vũ trụ, chip Apple A17 Pro tiến trình 3nm cân mọi tựa game, camera telephoto 5x zoom quang học sắc nét. Bảo hành chính hãng 12 tháng tại các trung tâm Apple AASP toàn quốc.",
                                                "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("MacBook Air M3 13.6 inch (16GB RAM / 256GB SSD)", "Laptop",
                                                27990000L, 1600,
                                                "Trang bị vi xử lý Apple M3 thế hệ mới hỗ trợ Ray Tracing, thời lượng pin ấn tượng lên đến 18 tiếng, màn hình Liquid Retina 500 nits sống động cùng thiết kế nhôm nguyên khối siêu mỏng 11.3mm.",
                                                "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("iPad Pro 11 inch M4 Wi-Fi 256GB Space Black", "Tablet",
                                                27990000L, 780,
                                                "Màn hình Ultra Retina XDR công nghệ Tandem OLED đột phá, chip Apple M4 xử lý AI vượt trội, độ mỏng kinh ngạc chỉ 5.3mm. Hỗ trợ Apple Pencil Pro và Magic Keyboard chuyên nghiệp.",
                                                "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("iPad Air 6 M2 11 inch Wi-Fi 128GB Starlight", "Tablet",
                                                16490000L, 750,
                                                "Hiệu năng đột phá với chip Apple M2, màn hình Liquid Retina chống chói, camera trước Ultra Wide đặt ở cạnh ngang tối ưu cho gọi video và học tập trực tuyến.",
                                                "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Tai nghe Apple AirPods Pro (Gen 2) Type-C MagSafe", "Âm Thanh",
                                                5690000L, 250,
                                                "Chip H2 mang đến khả năng chống ồn chủ động (ANC) gấp 2 lần, tính năng Adaptive Audio tự động điều chỉnh theo môi trường, cổng sạc Type-C hiện đại và khả năng kháng bụi nước IP54.",
                                                "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Tai nghe Chụp Tai Apple AirPods Max Wireless ANC", "Âm Thanh",
                                                12990000L, 600,
                                                "Chất lượng âm thanh trung thực Hi-Fi độ méo cực thấp, đệm tai dạng lưới thoáng khí bằng vải dệt kỹ thuật số, núm xoay Digital Crown điều khiển âm lượng và bài hát mượt mà.",
                                                "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Apple Watch Series 9 GPS 41mm Viền Nhôm Dây Thể Thao", "Smartwatch",
                                                8990000L, 200,
                                                "Vi xử lý S9 SiP với thao tác chạm hai ngón tay Double Tap độc đáo, màn hình sáng 2000 nits, theo dõi nồng độ oxy SpO2 và điện tâm đồ ECG chính xác.",
                                                "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Củ Sạc Nhanh Apple 20W USB-C Power Adapter", "Sạc",
                                                520000L, 100,
                                                "Củ sạc chính hãng Apple chuẩn kết nối Type-C hỗ trợ sạc nhanh Power Delivery an toàn tuyệt đối cho iPhone, iPad và Apple Watch.",
                                                "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Bàn Phím Apple Magic Keyboard Touch ID Kèm Phím Số", "Bàn Phím",
                                                3490000L, 450,
                                                "Tích hợp cảm biến vân tay Touch ID đăng nhập xác thực bảo mật một chạm, bố cục đầy đủ phím số thuận tiện kế toán và lập trình, pin dùng liên tục hàng tháng.",
                                                "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Chuột Không Dây Apple Magic Mouse 2 Black", "Chuột",
                                                2190000L, 250,
                                                "Bề mặt cảm ứng Multi-Touch phẳng liền mạch cho phép cuộn trang, chuyển đổi màn hình máy Mac siêu tiện lợi, thiết kế chân đế tối ưu trơn tru trên mọi mặt bàn.",
                                                "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&h=800&fit=crop"));
                        }
                        case "SAMSUNG" -> {
                                list.add(new ProductCatalogItem("Samsung Galaxy S24 Ultra 5G 12GB/256GB Titan Xám", "Điện Thoại",
                                                28990000L, 480,
                                                "Tích hợp quyền năng Galaxy AI dịch thuật trực tiếp cuộc gọi, khoanh vùng tìm kiếm đa năng, khung viền Titanium bền bỉ, màn hình Dynamic AMOLED 2X 2600 nits kèm bút S-Pen tích hợp.",
                                                "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Samsung Galaxy Z Fold5 5G 12GB/512GB Phantom Black", "Điện Thoại",
                                                34990000L, 520,
                                                "Điện thoại gập đỉnh cao mở ra không gian 7.6 inch như máy tính bảng, bản lề Flex gập không khe hở, vi xử lý Snapdragon 8 Gen 2 for Galaxy đa nhiệm mượt mà cùng lúc 3 ứng dụng.",
                                                "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Samsung Galaxy Z Flip5 5G 8GB/256GB Mint Xanh", "Điện Thoại",
                                                17990000L, 380,
                                                "Màn hình ngoài Flex Window 3.4 inch hiển thị thông báo và widget tiện dụng không cần mở máy, thiết kế gập nhỏ gọn bỏ túi thời trang, chụp ảnh rảnh tay FlexCam sắc nét.",
                                                "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Máy Tính Bảng Samsung Galaxy Tab S9 Ultra 14.6 inch 12GB/256GB", "Tablet",
                                                25990000L, 1100,
                                                "Màn hình khổng lồ Dynamic AMOLED 2X 120Hz chuẩn rạp chiếu phim, chuẩn chống bụi nước IP68 đầu tiên trên tablet cao cấp, kèm bút S-Pen có độ trễ siêu thấp 2.8ms.",
                                                "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Đồng Hồ Thông Minh Samsung Galaxy Watch6 Classic 47mm LTE", "Smartwatch",
                                                7490000L, 250,
                                                "Viền bezel xoay vật lý trứ danh, mặt kính Sapphire nguyên khối sang trọng, đo huyết áp, điện tâm đồ ECG và phân tích thành phần cơ thể BIA chuyên sâu.",
                                                "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Tai Nghe Samsung Galaxy Buds2 Pro Âm Thanh 24bit Hi-Fi", "Âm Thanh",
                                                3290000L, 200,
                                                "Âm thanh vòm 360 độ chuẩn phòng thu, công nghệ khử tiếng ồn thông minh ANC 3 micro độ nhạy cao, thiết kế công thái học ôm khít vành tai không cấn đau.",
                                                "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Củ Sạc Nhanh Siêu Tốc Samsung 45W Type-C Kèm Cáp 5A", "Sạc",
                                                690000L, 160,
                                                "Công nghệ Super Fast Charging 2.0 chuẩn PD 3.0 PPS sạc đầy Galaxy S24 Ultra từ 0 lên 70% chỉ trong 30 phút, mạch bảo vệ quá áp quá nhiệt chứng nhận an toàn quốc tế.",
                                                "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Đế Sạc Đôi Không Dây Samsung Wireless Charger Duo 15W", "Sạc",
                                                1190000L, 280,
                                                "Hỗ trợ sạc đồng thời 2 thiết bị cùng lúc (Điện thoại Galaxy + Đồng hồ Galaxy Watch hoặc Tai nghe Buds), quạt tản nhiệt tích hợp giữ pin luôn mát mẻ.",
                                                "https://images.unsplash.com/photo-1622445262464-84b1456045b6?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Samsung Galaxy S23 FE 5G 8GB/128GB Xanh Mint", "Điện Thoại",
                                                11490000L, 420,
                                                "Flagship cho Fan với cụm camera 50MP chuyên nghiệp chụp đêm Nightography, màn hình Dynamic AMOLED 2X 120Hz mượt mà, khung viền kim loại cứng cáp.",
                                                "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Bút Cảm Ứng Samsung S-Pen Creator Edition Chuyên Dụng", "Tablet",
                                                1490000L, 90,
                                                "Thiết kế thân bút dày cầm chắc tay, nhận diện 4096 mức cảm ứng lực và độ nghiêng bút hoàn hảo cho đồ họa kỹ thuật số và vẽ sketch chuyên nghiệp.",
                                                "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&h=800&fit=crop"));
                        }
                        case "GEARVN" -> {
                                list.add(new ProductCatalogItem("Laptop Gaming ASUS ROG Strix G16 G614JVR (i9-14900HX / RTX 4080)", "Laptop",
                                                54990000L, 4200,
                                                "Quái thú gaming cấu hình khủng: Intel Core i9-14900HX, NVIDIA GeForce RTX 4080 12GB GDDR6, 32GB DDR5 5600MHz, màn hình ROG Nebula 2.5K 240Hz 100% DCI-P3 chuẩn màu đồ họa.",
                                                "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Card Màn Hình ASUS TUF Gaming GeForce RTX 4080 Super 16GB", "CPU & Card",
                                                29990000L, 2500,
                                                "Kiến trúc Ada Lovelace với nhân Ray Tracing thế hệ 3, DLSS 3.5 AI Frame Generation mượt mà ở độ phân giải 4K, 3 quạt tản nhiệt vòng bi kép Axial-tech siêu mát và bền bỉ.",
                                                "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Bộ Vi Xử Lý CPU Intel Core i9-14900K Box Chính Hãng", "CPU & Card",
                                                14490000L, 350,
                                                "24 nhân 32 luồng (8 P-Core + 16 E-Core), xung nhịp tối đa lên tới 6.0 GHz nhờ công nghệ Intel Thermal Velocity Boost, đáp ứng hoàn hảo render 3D và stream game đỉnh cao.",
                                                "https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("RAM Corsair Vengeance RGB 32GB (2x16GB) DDR5 6000MHz", "RAM",
                                                3290000L, 200,
                                                "Tản nhiệt nhôm nguyên khối anodized, dải LED RGB 10 vùng siêu sáng tương thích phần mềm iCUE, hỗ trợ Intel XMP 3.0 ép xung ổn định bằng một cú click chuột.",
                                                "https://images.unsplash.com/photo-1562976540-1502c2145186?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Ổ Cứng SSD Samsung 990 Pro 2TB PCIe Gen 4.0 x4 NVMe M.2", "RAM",
                                                4690000L, 150,
                                                "Tốc độ đọc/ghi tuần tự đỉnh cao lên tới 7.450 / 6.900 MB/s, bộ điều khiển phủ niken kiểm soát nhiệt độ thông minh tránh sụt giảm hiệu năng khi tải nặng kéo dài.",
                                                "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Bàn Phím Cơ Không Dây AKKO 5075B Plus RGB Gasket Mount", "Bàn Phím",
                                                1890000L, 1200,
                                                "Cấu trúc Gasket Mount êm ái, switch AKKO V3 Cream Yellow Pro gõ cực mượt, 3 chế độ kết nối (Bluetooth 5.0, Wireless 2.4Ghz, Type-C) và keycap PBT Doubleshot bền bỉ.",
                                                "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Chuột Gaming Không Dây Siêu Nhẹ Razer DeathAdder V3 Pro", "Bàn Phím",
                                                3290000L, 300,
                                                "Trọng lượng siêu nhẹ chỉ 63g, cảm biến quang học Focus Pro 30K DPI chính xác 99.8%, switch quang học Gen-3 phản hồi 0.2ms không lo bị double click.",
                                                "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Nguồn Máy Tính Corsair RM850e 850W 80 Plus Gold ATX 3.0", "Bo Mạch",
                                                3190000L, 2800,
                                                "Đạt chứng nhận 80 Plus Gold và chuẩn ATX 3.0 kèm cáp nguồn PCIe 5.0 12VHPWR cho card đồ họa RTX series, tụ điện Nhật Bản 105 độ C vận hành êm ái không tiếng ồn.",
                                                "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Tản Nhiệt Nước AIO DeepCool LT720 ARGB 360mm", "Vỏ Case",
                                                3150000L, 2500,
                                                "Bơm thế hệ thứ 4 với động cơ 3 pha 3100 RPM, mặt pump khối vô cực đa chiều hiệu ứng gương 3D huyền ảo, 3 quạt FK120 PWM áp suất gió cao làm mát CPU tối đa.",
                                                "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Màn Hình Gaming LG UltraGear 27GR95QE-B 27 inch 2K OLED 240Hz", "Laptop",
                                                19900000L, 7500,
                                                "Tấm nền OLED đỉnh cao với độ tương phản vô cực, tần số quét 240Hz thời gian phản hồi thần tốc 0.03ms (GtG), hỗ trợ NVIDIA G-SYNC Compatible và AMD FreeSync Premium.",
                                                "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=800&fit=crop"));
                        }
                        case "SONY" -> {
                                list.add(new ProductCatalogItem("Tai Nghe Chống Ồn Flagship Sony WH-1000XM5 Hi-Res", "Tai Nghe",
                                                7990000L, 700,
                                                "Bộ xử lý tích hợp V1 kết hợp bộ xử lý chống ồn chuyên dụng HD QN1, màng loa 30mm gia cố bằng sợi carbon nhẹ cứng, hỗ trợ codec âm thanh độ phân giải cao LDAC và thời lượng pin 30 giờ.",
                                                "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Tai Nghe True Wireless Chống Ồn Sony WF-1000XM5", "Tai Nghe",
                                                5490000L, 250,
                                                "Màng loa Dynamic Driver X tái tạo âm trầm sâu lắng và giọng hát chi tiết, 3 micro trên mỗi tai nghe lọc gió khử ồn vượt bậc, sạc không dây chuẩn Qi và kháng nước IPX4.",
                                                "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Loa Di Động Sony SRS-XG300 Extra Bass Chống Nước IP67", "Loa",
                                                5990000L, 3500,
                                                "Công nghệ củ loa X-Balanced tái tạo áp suất âm thanh mạnh mẽ hạn chế méo tiếng, pin 25 giờ kèm sạc nhanh 10 phút dùng 70 phút, dải đèn LED phát sáng theo điệu nhạc.",
                                                "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Loa Soundbar Sony HT-A5000 5.1.2 Kênh Dolby Atmos 450W", "Loa",
                                                17990000L, 9000,
                                                "Công nghệ âm thanh vòm 360 Spatial Sound Mapping định vị âm thanh theo từng góc phòng, củ loa đánh trần hướng lên và loa tweeter chùm tái hiện âm thanh phim chiếu rạp chân thực.",
                                                "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Máy Ảnh Mirrorless Full-frame Sony Alpha A7 Mark IV (ILCE-7M4)", "Máy Ảnh",
                                                49990000L, 1200,
                                                "Cảm biến Exmor R CMOS 33.0 megapixel chiếu sáng sau, bộ xử lý hình ảnh BIONZ XR tốc độ xử lý gấp 8 lần, quay video 4K 60p 10-bit 4:2:2 All-Intra và hệ thống lấy nét AI 759 điểm.",
                                                "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Ống Kính Sony FE 24-70mm F2.8 GM II (SEL2470GM2)", "Ống Kính",
                                                48990000L, 1100,
                                                "Ống kính zoom tiêu chuẩn ngàm E-mount dòng G-Master khẩu độ không đổi F2.8 toàn dải, nhẹ hơn 22% so với thế hệ trước, 4 mô-tơ tuyến tính XD lấy nét siêu êm và chính xác.",
                                                "https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Máy Ảnh Vlog Sony ZV-E10 Kèm Lens Kit 16-50mm", "Máy Ảnh",
                                                14990000L, 800,
                                                "Màn hình LCD xoay lật đa góc hỗ trợ selfie, tính năng Product Showcase lấy nét tự động chuyển vật thể siêu mượt, micro 3 đầu thu định hướng kèm đầu lọc gió khử tạp âm ngoài trời.",
                                                "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Microphone Không Dây Kép Sony ECM-W2BT Thu Âm Studio", "Microphone",
                                                4990000L, 350,
                                                "Kết nối kỹ thuật số qua ngàm MI Shoe không suy giảm tín hiệu âm thanh, khoảng cách truyền tải ổn định lên tới 200m, hỗ trợ 3 chế độ thu âm MIC, MIX và RCVR linh hoạt.",
                                                "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Loa Tiệc Tùng Di Động Sony SRS-XV800 Đèn Led Party Pin 25H", "Loa",
                                                11990000L, 19500,
                                                "Âm thanh tiệc đa hướng Omni-directional Party Sound lan tỏa khắp không gian, bánh xe và tay kéo di chuyển linh hoạt, hỗ trợ cổng cắm micro karaoke và guitar biểu diễn sống động.",
                                                "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Tai Nghe Chơi Game Không Dây Sony INZONE H9 Chống Ồn ANC", "Tai Nghe",
                                                5990000L, 650,
                                                "Công nghệ 360 Spatial Sound for Gaming xác định chính xác vị trí bước chân đối thủ, khử tiếng ồn chủ động kép, micro cần gạt tắt tiếng tiện lợi và kết nối 2.4GHz không độ trễ.",
                                                "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop"));
                        }
                        case "ANKER" -> {
                                list.add(new ProductCatalogItem("Trạm Sạc Để Bàn Anker Prime 6 Trong 1 GaN 200W USB-C", "Củ Cáp Sạc",
                                                2390000L, 550,
                                                "Tổng công suất 200W với 4 cổng Type-C và 2 cổng USB-A, hỗ trợ sạc nhanh cùng lúc 2 laptop công suất 100W mỗi cổng, chip GaN thế hệ mới bảo vệ quá nhiệt ActiveShield 2.0.",
                                                "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Pin Sạc Dự Phòng Anker 737 Power Bank (PowerCore 24K) 140W", "Củ Cáp Sạc",
                                                2890000L, 750,
                                                "Dung lượng 24.000mAh chuẩn sạc PD 3.1 140W nạp pin siêu tốc cho MacBook Pro 16 inch, màn hình màu thông minh hiển thị chi tiết công suất sạc theo thời gian thực.",
                                                "https://images.unsplash.com/photo-1609592426815-f55a16d80d29?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Củ Sạc Nhanh Baseus GaN5 Pro Fast Charger 65W 3 Cổng", "Củ Cáp Sạc",
                                                490000L, 180,
                                                "Kích thước nhỏ hơn 55% so với củ sạc thông thường, trang bị 2 cổng Type-C và 1 cổng USB-A sạc đồng thời điện thoại, máy tính bảng và tai nghe tiện lợi khi du lịch.",
                                                "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Hub Chuyển Đổi Baseus Metal Gleam Series 9-in-1 Type-C 4K 60Hz", "Hub Chuyển Đổi",
                                                890000L, 250,
                                                "Vỏ hợp kim nhôm tản nhiệt nhanh, trang bị cổng HDMI 4K 60Hz sắc nét, cổng mạng LAN Gigabit RJ45 1000Mbps, khe thẻ nhớ SD/TF và hỗ trợ sạc xuyên qua PD 100W.",
                                                "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Cáp Sạc Baseus Tungsten Gold Type-C to Type-C 100W 1.5m Bện Dù", "Củ Cáp Sạc",
                                                159000L, 80,
                                                "Đầu cắm phủ hợp kim kẽm đen bóng chống oxy hóa gỉ sét, dây bện dù nylon mật độ cao chống gập gãy trên 10.000 lần uốn cong, hỗ trợ dòng điện tối đa 5A chuẩn E-Marker.",
                                                "https://images.unsplash.com/photo-1609081219090-a6d8173087ec?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Sạc Dự Phòng MagSafe Baseus Magnetic 10000mAh 20W LED", "Củ Cáp Sạc",
                                                590000L, 280,
                                                "Lực hít nam châm từ tính mạnh mẽ chuẩn MagSafe cho iPhone 12/13/14/15 series không rơi rớt, sạc không dây 15W kết hợp sạc có dây Type-C 20W tiện lợi.",
                                                "https://images.unsplash.com/photo-1609592426815-f55a16d80d29?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Chuột Công Thái Học Không Dây Anker Ergonomic 2.4GHz", "Bàn Phím",
                                                490000L, 200,
                                                "Thiết kế dạng đứng công thái học tự nhiên giữ cổ tay và cánh tay ở tư thế trung tính, hạn chế tối đa hội chứng ống cổ tay khi làm việc văn phòng máy tính suốt ngày dài.",
                                                "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Bàn Phím Không Dây Baseus K01B Tri-Mode Bluetooth 5.0 + 2.4G", "Bàn Phím",
                                                390000L, 450,
                                                "Bố cục phím bấm dạng cắt kéo Scissor êm ái phản hồi nhanh, kết nối chuyển đổi mượt mà giữa 3 thiết bị cùng lúc tương thích hoàn hảo Windows, macOS, iOS và Android.",
                                                "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Giá Đỡ Điện Thoại Baseus Halo Tự Kẹp Kiêm Sạc Không Dây 15W", "Củ Cáp Sạc",
                                                450000L, 320,
                                                "Cảm biến hồng ngoại nhận diện điện thoại tự động kẹp giữ chắc chắn, sạc nhanh không dây chuẩn Qi 15W tản nhiệt quạt mini giúp điện thoại không nóng khi chạy bản đồ định vị GPS.",
                                                "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Tai Nghe Chống Ồn Soundcore Space One by Anker Adaptive ANC", "Tai Nghe",
                                                1990000L, 400,
                                                "Khử tiếng ồn thích ứng loại bỏ 98% tiếng ồn xung quanh, driver âm thanh 40mm hỗ trợ Hi-Res Wireless qua codec LDAC, thời gian nghe nhạc liên tục lên tới 55 giờ.",
                                                "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop"));
                        }
                        case "XIAOMI" -> {
                                list.add(new ProductCatalogItem("Robot Hút Bụi Lau Nhà Xiaomi Dreame L10s Ultra Giặt Giẻ Tự Động", "Robot Hút Bụi",
                                                14990000L, 13500,
                                                "Trạm sạc All-in-one tự động đổ rác, tự giặt và sấy khô giẻ lau bằng khí nóng, lực hút siêu mạnh 5300Pa, hệ thống định vị camera AI Action tránh chướng ngại vật thông minh.",
                                                "https://images.unsplash.com/photo-1558002038-1055907df827?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Camera An Ninh 360 Độ Xiaomi Smart Camera C400 2.5K AI", "Camera An Ninh",
                                                890000L, 400,
                                                "Góc quay toàn cảnh 360 độ độ phân giải siêu nét 2.5K (2560x1440), đàm thoại 2 chiều lọc tiếng ồn, đèn hồng ngoại ban đêm rõ nét và trí tuệ nhân tạo nhận diện chuyển động người chính xác.",
                                                "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Máy Lọc Không Khí Xiaomi Smart Air Purifier 4 Pro Lõi Lọc HEPA", "Khóa Cửa & Đèn",
                                                4490000L, 7800,
                                                "Hiệu suất lọc bụi CADR hạt lên tới 500m3/h thích hợp phòng 60m2, loại bỏ 99.97% bụi mịn PM2.5, phấn hoa và khói thuốc, cảm biến laser kép đo chất lượng không khí thời gian thực.",
                                                "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Khóa Cửa Thông Minh Vân Tay Bán Dẫn Xiaomi Smart Door Lock E10", "Khóa Cửa & Đèn",
                                                2890000L, 3500,
                                                "Hỗ trợ 6 phương thức mở khóa (vân tay sinh trắc học, mật mã, NFC, Bluetooth, chìa cơ, mật khẩu tạm thời), chuông cửa thông minh tích hợp và cảnh báo phá khóa về điện thoại.",
                                                "https://images.unsplash.com/photo-1558002038-1055907df827?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Vòng Đeo Tay Thông Minh Xiaomi Smart Band 8 Màn Hình AMOLED 60Hz", "Vòng Đeo Tay",
                                                790000L, 120,
                                                "Màn hình AMOLED 1.62 inch tần số quét 60Hz mượt mà tự động chỉnh độ sáng, hơn 150 chế độ thể thao, theo dõi giấc ngủ và nhịp tim liên tục 24/7, thời lượng pin 16 ngày.",
                                                "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Đèn Bàn LED Thông Minh Chống Cận Xiaomi Mi Smart Desk Lamp 1S", "Khóa Cửa & Đèn",
                                                720000L, 1100,
                                                "Đạt tiêu chuẩn chiếu sáng cấp A của quốc gia không gây lóa mắt, chỉ số hoàn màu Ra90 chân thực, điều khiển nhiệt độ màu và độ sáng mượt mà qua núm xoay hoặc app Mi Home.",
                                                "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Cân Sức Khỏe Đo 25 Chỉ Số Cơ Thể Xiaomi Body Composition Scale S400", "Khóa Cửa & Đèn",
                                                420000L, 1600,
                                                "Sử dụng công nghệ đo trở kháng điện sinh học tần số kép đo chính xác lượng mỡ, khối lượng cơ, lượng nước cơ thể và mỡ nội tạng, đồng bộ dữ liệu biểu đồ qua Mi Fitness.",
                                                "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Nồi Chiên Không Dầu Thông Minh Xiaomi Smart Air Fryer Pro 4L Wi-Fi", "Robot Hút Bụi",
                                                1490000L, 4800,
                                                "Cửa sổ quan sát cách nhiệt 3 lớp trực quan nhìn rõ thức ăn chín, dải nhiệt độ rộng 40-200 độ C vừa nướng giòn vừa làm sữa chua sấy hoa quả, điều khiển giọng nói qua Google Assistant.",
                                                "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Máy Tạo Độ Ẩm Siêu Âm Kháng Khuẩn Xiaomi Humidifier 2 Lite 4L", "Khóa Cửa & Đèn",
                                                490000L, 1700,
                                                "Dung tích bình chứa nước lớn 4L cấp ẩm liên tục đến 30 giờ, công nghệ ion bạc kháng khuẩn 99.9%, vòi phun xoay 360 độ tỏa sương mịn màng không đọng nước lên đồ đạc.",
                                                "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=800&fit=crop"));
                                list.add(new ProductCatalogItem("Quạt Tháp Thông Minh Không Cánh Xiaomi Smart Tower Fan Cực Êm", "Khóa Cửa & Đèn",
                                                1890000L, 5200,
                                                "Luồng gió tự nhiên dịu mát êm ái góc quay siêu rộng 150 độ, động cơ biến tần DC tiết kiệm điện độ ồn chỉ 34.6dB, lồng bảo vệ khe hẹp 6.9mm an toàn tuyệt đối cho trẻ nhỏ.",
                                                "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=800&fit=crop"));
                        }
                        default -> {
                                list.add(new ProductCatalogItem("Cáp Sạc Đa Năng 3 Trong 1 Type-C Micro Lightning 100W", "Phụ Kiện",
                                                120000L, 80,
                                                "Dây bện dù chống rối gãy gập, hỗ trợ sạc nhanh cho mọi thiết bị di động, chiều dài 1.2m tiện dụng.",
                                                "https://images.unsplash.com/photo-1609081219090-a6d8173087ec?w=800&h=800&fit=crop",
                                                "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&h=800&fit=crop"));
                        }
                }
                return list;
        }

        private void seedOrders(List<User> customers, List<Shop> shops) {
                long existingOrderCount = orderRepository.count();
                if (existingOrderCount >= TARGET_ORDER_COUNT) {
                        log.debug("Skip seed orders: already {} orders (target {})", existingOrderCount,
                                        TARGET_ORDER_COUNT);
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
                                                order.setCommissionRate(commission.getItems().get(0).getCommissionRate()
                                                                .doubleValue());
                                        }
                                        orderRepository.save(order);
                                }
                        }
                }

                log.info("Seeded {} additional multi-vendor orders", needToCreate);
        }

        private void seedReviews(List<Shop> shops) {
                long existingReviewCount = reviewRepository.count();
                if (existingReviewCount >= 50) {
                        log.debug("Skip seed reviews: already {} reviews present", existingReviewCount);
                        return;
                }

                log.info("Seeding verified purchase reviews for multi-vendor shops...");

                // 1. Ensure all shops have enough COMPLETED orders with receivedByBuyer = true
                for (Shop shop : shops) {
                        long completedOrders = orderRepository.findAll().stream()
                                        .filter(o -> o.getShop() != null
                                                        && o.getShop().getId().equals(shop.getId())
                                                        && o.getStatus() == OrderStatus.COMPLETED
                                                        && o.isReceivedByBuyer())
                                        .count();

                        if (completedOrders < 8) {
                                List<Order> candidates = orderRepository.findAll().stream()
                                                .filter(o -> o.getShop() != null
                                                                && o.getShop().getId().equals(shop.getId())
                                                                && o.getStatus() != OrderStatus.COMPLETED
                                                                && o.getStatus() != OrderStatus.CANCELLED)
                                                .limit(8 - completedOrders)
                                                .collect(Collectors.toList());

                                for (Order ord : candidates) {
                                        ord.setStatus(OrderStatus.COMPLETED);
                                        ord.setReceivedByBuyer(true);
                                        LocalDateTime del = ord.getCreatedAt().plusDays(2);
                                        ord.setDeliveredAt(del);
                                        ord.setReceivedAt(del.plusHours(6));
                                        orderRepository.save(ord);
                                }
                        }
                }

                // 2. Fetch all COMPLETED orders that were received by buyer
                List<Order> completedOrders = orderRepository.findAll().stream()
                                .filter(o -> o.getStatus() == OrderStatus.COMPLETED && o.isReceivedByBuyer())
                                .collect(Collectors.toList());

                int createdReviewsCount = 0;

                for (Order order : completedOrders) {
                        User buyer = order.getUser();
                        Shop shop = order.getShop();
                        if (buyer == null || shop == null || order.getItems() == null || order.getItems().isEmpty()) {
                                continue;
                        }

                        for (OrderItem item : order.getItems()) {
                                Product product = item.getProduct();
                                if (product == null) {
                                        continue;
                                }

                                boolean alreadyReviewed = reviewRepository.existsByUserIdAndProductIdAndSubOrderIdAndStatus(
                                                buyer.getId(), product.getId(), order.getId(), ReviewStatus.ACTIVE);
                                if (alreadyReviewed) {
                                        continue;
                                }

                                // 85% 5 stars, 15% 4 stars (average ~4.85)
                                int rating = random.nextInt(100) < 85 ? 5 : 4;
                                String comment = getRealisticReviewComment(shop.getName(), product.getName(), rating);

                                LocalDateTime reviewTime = order.getReceivedAt() != null
                                                ? order.getReceivedAt().plusHours(ThreadLocalRandom.current().nextInt(2, 48))
                                                : order.getCreatedAt().plusDays(3);
                                if (reviewTime.isAfter(LocalDateTime.now())) {
                                        reviewTime = LocalDateTime.now().minusHours(ThreadLocalRandom.current().nextInt(1, 24));
                                }

                                Review review = Review.builder()
                                                .user(buyer)
                                                .product(product)
                                                .subOrderId(order.getId())
                                                .status(ReviewStatus.ACTIVE)
                                                .rating(rating)
                                                .comment(comment)
                                                .images(new ArrayList<>())
                                                .build();
                                review.setCreatedAt(reviewTime);
                                review.setUpdatedAt(reviewTime);

                                if (product.getImages() != null && !product.getImages().isEmpty() && random.nextBoolean()) {
                                        ProductImage firstImg = product.getImages().iterator().next();
                                        ReviewImage rImg = ReviewImage.builder()
                                                        .review(review)
                                                        .imageUrl(firstImg.getImageUrl())
                                                        .displayOrder(0)
                                                        .build();
                                        rImg.setCreatedAt(reviewTime);
                                        review.getImages().add(rImg);
                                }

                                Review savedReview = reviewRepository.save(review);
                                createdReviewsCount++;

                                if (random.nextInt(100) < 35) {
                                        Reply reply = Reply.builder()
                                                        .review(savedReview)
                                                        .reply(getRealisticSellerReply(shop.getName()))
                                                        .build();
                                        reply.setRepliedAt(reviewTime.plusHours(ThreadLocalRandom.current().nextInt(1, 12)));
                                        replyRepository.save(reply);
                                }
                        }
                }

                // 3. Update average_rating in shops table based on verified reviews
                for (Shop shop : shops) {
                        ShopReviewStatsProjection stats = reviewRepository.getShopStats(shop.getId(), ReviewStatus.ACTIVE);
                        if (stats != null && stats.getTotalReviews() != null && stats.getTotalReviews() > 0 && stats.getAvgRating() != null) {
                                float realAvg = (float) (Math.round(stats.getAvgRating() * 10.0) / 10.0);
                                shop.setAverageRating(realAvg);
                                shopRepository.save(shop);
                                log.info("Updated shop '{}' averageRating to {} (from {} verified reviews)",
                                                shop.getName(), realAvg, stats.getTotalReviews());
                        }
                }

                log.info("Successfully seeded {} verified purchase reviews across all shops", createdReviewsCount);
        }

        private String getRealisticReviewComment(String shopName, String productName, int rating) {
                String sName = shopName != null ? shopName.toLowerCase() : "";
                String pName = productName != null ? productName.toLowerCase() : "";

                List<String> options = new ArrayList<>();
                if (sName.contains("apple") || pName.contains("iphone") || pName.contains("macbook") || pName.contains("airpods") || pName.contains("ipad")) {
                        options.add("Máy mới 100% nguyên seal VN/A, kích hoạt bảo hành điện tử chính hãng chuẩn chỉ. Đóng gói rất cẩn thận nhiều lớp chống sốc, giao hàng siêu nhanh. 5 sao cho shop!");
                        options.add("Sản phẩm chính hãng Apple dùng cực kỳ mượt mà, pin trâu, màn hình sắc nét không một vết xước. Shop tư vấn rất có tâm.");
                        options.add("Hàng chuẩn xịn Apple, nguyên đai nguyên kiện, phụ kiện theo máy đầy đủ. Dùng rất sướng, xứng đáng từng đồng.");
                        options.add("Giao hàng siêu tốc trong ngày, đóng gói cẩn thận có tem niêm phong. Mua hàng của E-Mall rất yên tâm về nguồn gốc.");
                        options.add("Tai nghe / máy dùng âm thanh đỉnh cao, kết nối iPhone tích tắc. Rất hài lòng với chất lượng dịch vụ của cửa hàng.");
                } else if (sName.contains("samsung") || pName.contains("galaxy") || pName.contains("fold") || pName.contains("flip")) {
                        options.add("Samsung Galaxy chính hãng mới 100% nguyên seal, màn hình Dynamic AMOLED 2X hiển thị ngoài trời nắng cực nét. Galaxy AI dùng rất tiện lợi!");
                        options.add("Máy chụp ảnh sắc nét từng chi tiết, zoom 100x đỉnh cao. Đóng gói hộp chắc chắn, kích hoạt bảo hành điện tử Samsung Care+ thành công ngay.");
                        options.add("Hàng chính hãng phân phối Samsung Vina, bút S-Pen viết vẽ cực êm không có độ trễ. Giao hàng hỏa tốc trong 24h.");
                        options.add("Đồng hồ / điện thoại Galaxy thiết kế sang trọng, pin dùng thoải mái cả ngày. Shop hỗ trợ kỹ thuật cài đặt rất nhiệt tình.");
                } else if (sName.contains("gearvn") || pName.contains("rtx") || pName.contains("intel") || pName.contains("rog") || pName.contains("gaming")) {
                        options.add("Linh kiện PC đóng gói bóng khí chống sốc 5 lớp rất an tâm, tem bảo hành chính hãng đầy đủ. Test benchmark hiệu năng cực cao và mát mẻ!");
                        options.add("Laptop gaming Asus ROG chiến mượt mà mọi tựa game AAA ở thiết lập đồ họa Ultra, màn hình 240Hz siêu nhạy không bóng mờ.");
                        options.add("Card đồ họa chạy cực êm không bị coil whine, nhiệt độ mát mẻ dưới 65 độ C khi render video. GearVN uy tín số 1!");
                        options.add("Bàn phím cơ gõ âm đầm chắc, switch mượt mà, layout đẹp xuất sắc. Rất hài lòng về thời gian giao hàng và chất lượng dịch vụ.");
                } else if (sName.contains("sony") || pName.contains("wh-1000") || pName.contains("wf-1000") || pName.contains("alpha") || pName.contains("lens")) {
                        options.add("Khả năng chống ồn chủ động ANC đỉnh chóp của Sony, cách ly tiếng ồn đường phố hoàn hảo. Âm bass sâu chắc, dải mid trong trẻo chuẩn Hi-Res.");
                        options.add("Máy ảnh Sony Alpha lấy nét theo mắt người và động vật siêu nhanh, quay video 4K 10-bit màu sắc chân thực. Hàng chính hãng Sony VN bảo hành 2 năm.");
                        options.add("Loa Bluetooth âm lượng to khủng, chống nước chuẩn IP67 mang đi du lịch dã ngoại cực đã. Pin trâu dùng cả ngày không hết.");
                        options.add("Micro không dây bắt sóng cực xa và ổn định, lọc gió ngoài trời rất tốt, cắm vào máy ảnh nhận ngay không cần cài đặt rườm rà.");
                } else if (sName.contains("anker") || sName.contains("baseus") || pName.contains("sạc") || pName.contains("cáp") || pName.contains("hub")) {
                        options.add("Củ sạc GaN công suất cao sạc cùng lúc cả MacBook và iPhone không hề bị nóng, kích thước nhỏ gọn tiện lợi bỏ balo.");
                        options.add("Pin sạc dự phòng sạc siêu nhanh chuẩn PD, màn hình hiển thị công suất chính xác từng watt. Dung lượng chuẩn không ảo.");
                        options.add("Dây cáp bện dù siêu bền chống gập gãy, đầu cắm mạ kim loại chắc chắn cắm khít cổng sạc. Truyền dữ liệu tốc độ cao mượt mà.");
                        options.add("Hub Type-C xuất màn hình ngoài 4K 60Hz không giật lag hay chập chờn, cổng mạng LAN cắm nhận luôn mạng dây tốc độ gigabit.");
                } else if (sName.contains("xiaomi") || pName.contains("robot") || pName.contains("camera") || pName.contains("purifier") || pName.contains("smart")) {
                        options.add("Robot hút bụi lau nhà tự động lập bản đồ phòng rất thông minh, tự giặt và sấy khô giẻ lau sạch sẽ giúp tiết kiệm bao nhiêu thời gian.");
                        options.add("Camera an ninh hình ảnh 2.5K rõ nét cả ban đêm có màu, đàm thoại 2 chiều to rõ, kết nối ứng dụng Mi Home quản lý từ xa rất mượt.");
                        options.add("Máy lọc không khí hoạt động êm ái ban đêm không nghe tiếng động, đo bụi mịn PM2.5 nhạy, không khí phòng ngủ thoáng mát hơn hẳn.");
                        options.add("Smartband đo bước chân và nhịp tim liên tục chuẩn xác, pin trâu dùng gần 2 tuần mới phải sạc lại. Rất đáng đồng tiền bát gạo!");
                } else {
                        options.add("Sản phẩm điện tử chính hãng chuẩn xịn, tem bảo hành đầy đủ, đóng gói chống sốc nhiều lớp. Shop giao hàng cực nhanh!");
                        options.add("Hàng chuẩn mô tả 100%, kết nối nhanh chóng mượt mà, đầy đủ phụ kiện theo hộp. Đánh giá 5 sao cho chất lượng dịch vụ!");
                        options.add("Thiết bị công nghệ hoạt động ổn định, giá cả hợp lý so với các trung tâm điện máy. Sẽ tiếp tục ủng hộ shop các đơn sau!");
                }

                if (rating == 4) {
                        return options.get(random.nextInt(options.size())).replace("5 sao", "4 sao")
                                + " (Giao hàng hơi lâu hơn dự kiến một chút nhưng bù lại hàng rất tốt).";
                }
                return options.get(random.nextInt(options.size()));
        }

        private String getRealisticSellerReply(String shopName) {
                List<String> replies = List.of(
                        "Dạ " + shopName + " chân thành cảm ơn bạn đã tin tưởng và ủng hộ sản phẩm! Nếu trong quá trình sử dụng có bất kỳ thắc mắc nào, bạn cứ nhắn tin cho shop hỗ trợ ngay nhé ạ. Chúc bạn có những trải nghiệm thật tuyệt vời!",
                        "Cảm ơn bạn rất nhiều vì đã dành thời gian đánh giá 5 sao cho shop! Sự hài lòng của bạn là động lực to lớn để shop không ngừng hoàn thiện chất lượng và dịch vụ hơn nữa ạ. Chúc bạn một ngày ngập tràn niềm vui!",
                        "Dạ shop cảm ơn phản hồi tích cực từ bạn ạ! Cần tư vấn thêm về cách sử dụng hay chính sách bảo hành, bạn cứ liên hệ với shop bất cứ lúc nào nhé. Rất mong được tiếp tục phục vụ bạn ở những đơn hàng tới ạ!"
                );
                return replies.get(random.nextInt(replies.size()));
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
                        Request req1 = initializeRequest(
                                        customerAccount1,
                                        RequestType.SELLER_REGISTRATION,
                                        RequestStatus.REJECTED,
                                        "Đăng ký mở gian hàng linh kiện PC & Gaming Gear nhập khẩu",
                                        adminAccount,
                                        LocalDateTime.now().minusDays(5),
                                        "Từ chối: Giấy phép kinh doanh thiết bị CNTT chưa chứng thực và thông tin MST doanh nghiệp không khớp trên cổng Thuế.");
                        initializeSellerDetail(req1, customerAccount1, SellerType.BUSINESS, BusinessType.ENTERPRISE,
                                        "Công Ty TNHH Công Nghệ GearTech Việt Nam",
                                        "123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM",
                                        "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c",
                                        "GearTech PC Official", "0901234567", "customer1@gmail.com",
                                        "123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM",
                                        "123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM",
                                        "0319881122", "geartech.corp@gmail.com",
                                        "Vietcombank", "0071008899001", "CONG TY TNHH CONG NGHE GEARTECH");
                }

                if (customerAccount2 != null) {
                        Request req2 = initializeRequest(
                                        customerAccount2,
                                        RequestType.SELLER_REGISTRATION,
                                        RequestStatus.PENDING,
                                        "Đăng ký mở gian hàng thiết bị âm thanh Hi-Res & Studio Audio chính hãng",
                                        null,
                                        null,
                                        null);
                        initializeSellerDetail(req2, customerAccount2, SellerType.BUSINESS, BusinessType.HOUSEHOLD,
                                        "Hộ Kinh Doanh Âm Thanh Số AudioTech",
                                        "456 Đường Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM",
                                        "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c",
                                        "AudioTech Sound Studio", "0909876543", "customer2@gmail.com",
                                        "456 Đường Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM",
                                        "456 Đường Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM",
                                        "0319887766", "audiotech@gmail.com",
                                        "Techcombank", "190333222111", "PHAM THI MUA SAM");
                }

                if (customerAccount3 != null) {
                        Request req3 = initializeRequest(
                                        customerAccount3,
                                        RequestType.SELLER_REGISTRATION,
                                        RequestStatus.REJECTED,
                                        "Đăng ký kinh doanh thiết bị bay không người lái (Flycam/Drone) và thiết bị thu phát vô tuyến",
                                        adminAccount,
                                        LocalDateTime.now().minusDays(10),
                                        "Từ chối: Mặt hàng thiết bị bay flycam và phát sóng vô tuyến yêu cầu chứng nhận hợp quy ICT/CR của Cục Viễn Thông (Bộ TT&TT) và giấy phép kiểm soát bay theo quy định an ninh hàng không.");
                        initializeSellerDetail(req3, customerAccount3, SellerType.INDIVIDUAL, null, null, null, null,
                                        "Flycam Drone Pro Store", "0905555555", "customer3@gmail.com",
                                        "789 Đường Điện Biên Phủ, Phường 15, Bình Thạnh, TP.HCM",
                                        "789 Đường Điện Biên Phủ, Phường 15, Bình Thạnh, TP.HCM",
                                        "8999888777", "customer3@gmail.com",
                                        "VPBank", "999888777666", "NGUYEN VAN AN");
                }
        }

        private Seller initializeSellerDetail(Request request, Account account,
                        SellerType sellerType, BusinessType businessType,
                        String businessName, String businessAddress, String businessLicenseUrl,
                        String shopName, String shopPhone, String shopEmail,
                        String pickupAddress, String returnAddress,
                        String taxCode, String invoiceEmail,
                        String bankName, String bankAccountNumber, String bankAccountName) {
                if (request == null)
                        return null;
                Seller existing = sellerRepository.findByRequestId(request.getId());
                if (existing != null) {
                        return existing;
                }

                Seller seller = Seller.builder()
                                .request(request)
                                .sellerType(sellerType)
                                .businessType(businessType)
                                .businessName(businessName)
                                .businessAddress(businessAddress)
                                .businessLicenseUrl(businessLicenseUrl)
                                .shopName(shopName)
                                .shopPhone(shopPhone)
                                .shopEmail(shopEmail)
                                .address(pickupAddress)
                                .pickupAddress(pickupAddress)
                                .returnAddress(returnAddress)
                                .taxCode(taxCode)
                                .invoiceEmail(invoiceEmail)
                                .bankName(bankName)
                                .bankAccountNumber(bankAccountNumber)
                                .bankAccountName(bankAccountName)
                                .build();
                Seller saved = sellerRepository.save(seller);
                log.info("Created seller detail for request ID: {}", request.getId());
                return saved;
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
                                                throw new IllegalStateException(
                                                                "Admin user already has non-ESCROW wallet");
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
                        Integer districtId, String wardCode, ShopStatus status, Float rating,
                        SellerType sellerType, BusinessType businessType, String businessName,
                        String businessAddress, String businessLicenseUrl,
                        String taxCode, String invoiceEmail,
                        String bankName, String bankAccountNumber, String bankAccountName,
                        String pickupAddress, String returnAddress) {
                return shopRepository.findByUserId(user.getId())
                                .map(existing -> {
                                        existing.setName(name);
                                        existing.setDescription(description);
                                        existing.setLogoUrl(logoUrl);
                                        existing.setCoverImageUrl(coverImageUrl);
                                        existing.setPhoneNumber(phoneNumber);
                                        existing.setAddress(address);
                                        existing.setDistrictId(districtId);
                                        existing.setWardCode(wardCode);
                                        existing.setStatus(status);
                                        if (rating != null) {
                                                existing.setAverageRating(rating);
                                        }
                                        existing.setSellerType(sellerType);
                                        existing.setBusinessType(businessType);
                                        existing.setBusinessName(businessName);
                                        existing.setBusinessAddress(businessAddress);
                                        existing.setBusinessLicenseUrl(businessLicenseUrl);
                                        existing.setTaxCode(taxCode);
                                        existing.setInvoiceEmail(invoiceEmail);
                                        existing.setBankName(bankName);
                                        existing.setBankAccountNumber(bankAccountNumber);
                                        existing.setBankAccountName(bankAccountName);
                                        existing.setPickupAddress(pickupAddress);
                                        existing.setReturnAddress(returnAddress);
                                        existing.setUpdatedAt(LocalDateTime.now());
                                        return shopRepository.save(existing);
                                })
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
                                                        .sellerType(sellerType)
                                                        .businessType(businessType)
                                                        .businessName(businessName)
                                                        .businessAddress(businessAddress)
                                                        .businessLicenseUrl(businessLicenseUrl)
                                                        .taxCode(taxCode)
                                                        .invoiceEmail(invoiceEmail)
                                                        .bankName(bankName)
                                                        .bankAccountNumber(bankAccountNumber)
                                                        .bankAccountName(bankAccountName)
                                                        .pickupAddress(pickupAddress)
                                                        .returnAddress(returnAddress)
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
                                                                : cat.getParent() != null && cat.getParent().getId()
                                                                                .equals(parent.getId())))
                                .findFirst()
                                .orElseGet(() -> {
                                        ProductCategory category = new ProductCategory();
                                        category.setParent(parent);
                                        category.setName(name);
                                        ProductCategory saved = productCategoryRepository.save(category);
                                        log.info("Created category: {} (parent: {})", name,
                                                        parent != null ? parent.getName() : "none");
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
                                        log.debug("Created product image: {} for product: {}", imageUrl,
                                                        product.getName());
                                        return saved;
                                });
        }

        private UserAddress initializeUserAddress(User user, String receiverName, String receiverPhone,
                        String addressLine, String city, String district, String ward,
                        Integer districtId, String wardCode, Boolean isDefault) {
                var existingAddresses = userAddressRepository
                                .findAllByUserIdAndDeletedFalseOrderByIsDefaultDescIdDesc(user.getId());
                var existing = existingAddresses.stream()
                                .filter(addr -> addr.getAddressLine().equals(addressLine)
                                                && !Boolean.TRUE.equals(addr.getDeleted()))
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

                log.info("Created order item: {} x{} for order: {}", product.getName(), quantity,
                                order.getOrderNumber());
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

                LocalDateTime createdAt = reviewedAt != null ? reviewedAt.minusDays(2)
                                : LocalDateTime.now().minusDays(1);
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
                                        if (order.getStatus() != OrderStatus.DELIVERED
                                                        && order.getStatus() != OrderStatus.COMPLETED) {
                                                throw new IllegalStateException("Order is not eligible for commission: "
                                                                + order.getStatus());
                                        }

                                        if (order.getShop() == null || order.getShop().getUser() == null
                                                        || order.getShop().getUser().getId() == null) {
                                                throw new IllegalStateException("Seller not found for order: "
                                                                + order.getOrderNumber());
                                        }

                                        if (order.getItems() == null || order.getItems().isEmpty()) {
                                                throw new IllegalStateException("Order items not found for order: "
                                                                + order.getOrderNumber());
                                        }

                                        BigDecimal commissionRate = platformSettingRepository
                                                        .findByKey(PlatformConstant.KEY_COMMISSION_RATE)
                                                        .map(s -> new BigDecimal(
                                                                        s.getValue() != null ? s.getValue().trim()
                                                                                        : "10"))
                                                        .orElse(new BigDecimal("10"));

                                        BigDecimal orderAmount = order.getSubtotal() == null ? BigDecimal.ZERO
                                                        : order.getSubtotal();

                                        Commission commission = Commission.builder()
                                                        .orderId(order.getId())
                                                        .sellerId(order.getShop().getUser().getId())
                                                        .orderAmount(orderAmount)
                                                        .totalCommission(BigDecimal.ZERO)
                                                        .items(new ArrayList<>())
                                                        .build();

                                        BigDecimal totalCommission = BigDecimal.ZERO;

                                        for (OrderItem orderItem : order.getItems()) {
                                                BigDecimal unitPrice = orderItem.getUnitPrice() == null
                                                                ? BigDecimal.ZERO
                                                                : orderItem.getUnitPrice();
                                                int quantity = orderItem.getQuantity() == null ? 0
                                                                : orderItem.getQuantity();

                                                BigDecimal lineAmount = unitPrice
                                                                .multiply(BigDecimal.valueOf(quantity));
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

        private void initializeVouchers(
                        Shop shop1, Shop shop2, Shop shop3, Shop shop4,
                        ProductCategory phonesAndTablets, ProductCategory computers,
                        ProductCategory components, ProductCategory audio) {
                log.info("Initializing specialized electronics system & shop vouchers...");

                // Expire legacy non-tech vouchers if they exist from earlier runs
                List.of("FASHION30", "TRENDY10", "NHANAM20K", "SUNHOUSE50K").forEach(code -> {
                        voucherRepository.findByCodeIgnoreCase(code).ifPresent(v -> {
                                v.setStatus(VoucherStatus.EXPIRED);
                                voucherRepository.save(v);
                        });
                });

                // 1. FREESHIP50 (Platform)
                initializeOrUpdateVoucher(
                                "FREESHIP50",
                                "Miễn Phí Vận Chuyển GHN 50K",
                                "Giảm tối đa 50.000đ cước giao hàng GHN cho đơn hàng công nghệ từ 250.000đ áp dụng toàn sàn",
                                VoucherType.FREE_SHIPPING,
                                BigDecimal.valueOf(50000),
                                null,
                                BigDecimal.valueOf(250000),
                                1000,
                                2,
                                VoucherScope.PLATFORM,
                                null,
                                null,
                                false
                );

                // 2. ECOMNEW15 (Platform - First order only)
                initializeOrUpdateVoucher(
                                "ECOMNEW15",
                                "Giảm 15% Thiết Bị Đầu Tiên",
                                "Giảm 15% tối đa 150.000đ cho đơn hàng thiết bị điện tử từ 200.000đ (Chỉ áp dụng cho tài khoản đăng ký mới)",
                                VoucherType.PERCENTAGE,
                                BigDecimal.valueOf(15),
                                BigDecimal.valueOf(150000),
                                BigDecimal.valueOf(200000),
                                500,
                                1,
                                VoucherScope.PLATFORM,
                                null,
                                null,
                                true
                );

                // 3. TECHMEGA1M (Platform - Category: Điện Thoại & Máy Tính Bảng)
                initializeOrUpdateVoucher(
                                "TECHMEGA1M",
                                "Mega Voucher 1 Triệu - Điện Thoại & Tablet",
                                "Giảm ngay 1.000.000đ cho đơn hàng từ 15.000.000đ áp dụng cho Điện Thoại & Máy Tính Bảng chính hãng",
                                VoucherType.FIXED_AMOUNT,
                                BigDecimal.valueOf(1000000),
                                null,
                                BigDecimal.valueOf(15000000),
                                100,
                                1,
                                VoucherScope.PLATFORM,
                                null,
                                phonesAndTablets,
                                false
                );

                // 4. LAPTOP500K (Platform - Category: Laptop & Máy Tính)
                initializeOrUpdateVoucher(
                                "LAPTOP500K",
                                "Giảm 500K Laptop & Máy Tính Để Bàn",
                                "Giảm ngay 500.000đ cho đơn hàng từ 10.000.000đ thuộc ngành Laptop Gaming, Văn Phòng & Máy Trạm",
                                VoucherType.FIXED_AMOUNT,
                                BigDecimal.valueOf(500000),
                                null,
                                BigDecimal.valueOf(10000000),
                                200,
                                1,
                                VoucherScope.PLATFORM,
                                null,
                                computers,
                                false
                );

                // 5. AUDIO150K (Platform - Category: Thiết Bị Âm Thanh)
                initializeOrUpdateVoucher(
                                "AUDIO150K",
                                "Giảm 150K Thiết Bị Âm Thanh & Studio",
                                "Giảm ngay 150.000đ cho đơn hàng từ 1.500.000đ mua Tai Nghe, Loa Bluetooth hoặc Soundcard thu âm",
                                VoucherType.FIXED_AMOUNT,
                                BigDecimal.valueOf(150000),
                                null,
                                BigDecimal.valueOf(1500000),
                                300,
                                1,
                                VoucherScope.PLATFORM,
                                null,
                                audio,
                                false
                );

                // 6. BUILDPC200K (Platform - Category: Linh Kiện Máy Tính & PC Build)
                initializeOrUpdateVoucher(
                                "BUILDPC200K",
                                "Giảm 200K Linh Kiện PC & Build Máy",
                                "Giảm ngay 200.000đ cho đơn hàng từ 2.500.000đ mua CPU, VGA, RAM, SSD, Nguồn hoặc Bo Mạch Chủ",
                                VoucherType.FIXED_AMOUNT,
                                BigDecimal.valueOf(200000),
                                null,
                                BigDecimal.valueOf(2500000),
                                250,
                                1,
                                VoucherScope.PLATFORM,
                                null,
                                components,
                                false
                );

                // 7. APPLE500K (Shop 1 - Apple Authorised Reseller)
                if (shop1 != null) {
                        initializeOrUpdateVoucher(
                                        "APPLE500K",
                                        "Giảm 500K Gian Hàng Apple Authorised Reseller",
                                        "Giảm ngay 500.000đ cho đơn hàng từ 10.000.000đ mua iPhone, iPad, MacBook tại gian hàng Apple Reseller",
                                        VoucherType.FIXED_AMOUNT,
                                        BigDecimal.valueOf(500000),
                                        null,
                                        BigDecimal.valueOf(10000000),
                                        100,
                                        1,
                                        VoucherScope.SHOP,
                                        shop1,
                                        null,
                                        false
                        );
                }

                // 8. SAM300K (Shop 2 - Samsung Experience Store)
                if (shop2 != null) {
                        initializeOrUpdateVoucher(
                                        "SAM300K",
                                        "Giảm 300K Gian Hàng Samsung Official",
                                        "Giảm ngay 300.000đ cho hóa đơn từ 6.000.000đ mua Galaxy S, Z Fold, Tab S tại Samsung Experience Store",
                                        VoucherType.FIXED_AMOUNT,
                                        BigDecimal.valueOf(300000),
                                        null,
                                        BigDecimal.valueOf(6000000),
                                        120,
                                        1,
                                        VoucherScope.SHOP,
                                        shop2,
                                        null,
                                        false
                        );
                }

                // 9. GEARVN200K (Shop 3 - GearVN Gaming Hub)
                if (shop3 != null) {
                        initializeOrUpdateVoucher(
                                        "GEARVN200K",
                                        "Giảm 200K Gian Hàng GearVN Gaming Hub",
                                        "Giảm 200.000đ cho đơn hàng từ 3.000.000đ mua Laptop Gaming, Bàn Phím Cơ, VGA tại GearVN",
                                        VoucherType.FIXED_AMOUNT,
                                        BigDecimal.valueOf(200000),
                                        null,
                                        BigDecimal.valueOf(3000000),
                                        150,
                                        1,
                                        VoucherScope.SHOP,
                                        shop3,
                                        null,
                                        false
                        );
                }

                // 10. SONY150K (Shop 4 - Sony Official Store VN)
                if (shop4 != null) {
                        initializeOrUpdateVoucher(
                                        "SONY150K",
                                        "Giảm 150K Gian Hàng Sony Official Store",
                                        "Giảm 150.000đ cho đơn hàng từ 2.000.000đ mua Tai Nghe Chống Ồn, Loa hoặc Máy Ảnh Sony Alpha",
                                        VoucherType.FIXED_AMOUNT,
                                        BigDecimal.valueOf(150000),
                                        null,
                                        BigDecimal.valueOf(2000000),
                                        100,
                                        1,
                                        VoucherScope.SHOP,
                                        shop4,
                                        null,
                                        false
                        );
                }

                log.info("Initialized and synced default vouchers successfully.");
        }

        private void initializeOrUpdateVoucher(
                        String code, String title, String description,
                        VoucherType voucherType, BigDecimal discountValue, BigDecimal maxDiscountAmount,
                        BigDecimal minOrderValue, int usageLimit, int userUsageLimit,
                        VoucherScope scope, Shop shop, ProductCategory category, boolean isFirstOrderOnly) {
                Voucher voucher = voucherRepository.findByCodeIgnoreCase(code)
                                .orElseGet(() -> Voucher.builder()
                                                .code(code)
                                                .usedCount(0)
                                                .startDate(LocalDateTime.now().minusDays(1))
                                                .endDate(LocalDateTime.now().plusMonths(3))
                                                .status(VoucherStatus.ACTIVE)
                                                .build());

                voucher.setTitle(title);
                voucher.setDescription(description);
                voucher.setVoucherType(voucherType);
                voucher.setDiscountValue(discountValue);
                voucher.setMaxDiscountAmount(maxDiscountAmount);
                voucher.setMinOrderValue(minOrderValue);
                voucher.setUsageLimit(usageLimit);
                voucher.setUserUsageLimit(userUsageLimit);
                voucher.setScope(scope);
                voucher.setShop(shop);
                voucher.setCategory(category);
                voucher.setIsFirstOrderOnly(isFirstOrderOnly);
                if (voucher.getStatus() == null) {
                        voucher.setStatus(VoucherStatus.ACTIVE);
                }
                if (voucher.getStartDate() == null) {
                        voucher.setStartDate(LocalDateTime.now().minusDays(1));
                }
                if (voucher.getEndDate() == null) {
                        voucher.setEndDate(LocalDateTime.now().plusMonths(3));
                }

                voucherRepository.save(voucher);
        }
}