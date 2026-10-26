package com.marketplace.ecommerce.config.seed;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.entity.ShopEscrowFund;
import com.marketplace.ecommerce.shop.repository.ShopEscrowFundRepository;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.shop.valueObjects.EscrowFundStatus;
import com.marketplace.ecommerce.shop.valueObjects.ShopStatus;
import com.marketplace.ecommerce.request.valueObjects.BusinessType;
import com.marketplace.ecommerce.request.valueObjects.SellerType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class ShopSeeder {

    private final ShopRepository shopRepository;
    private final ShopEscrowFundRepository shopEscrowFundRepository;
    private final UserRepository userRepository;

    public void seed() {
        log.info("Seeding shops with verified profiles and realistic escrow deposits...");

        Map<String, User> userMap = userRepository.findAll().stream()
                .collect(Collectors.toMap(u -> u.getAccount().getUsername(), Function.identity()));

        User seller1 = userMap.get("seller1");
        User seller2 = userMap.get("seller2");
        User seller3 = userMap.get("seller3");
        User seller4 = userMap.get("seller4");
        User seller5 = userMap.get("seller5");
        User seller6 = userMap.get("seller6");

        // Shop 1 - Apple Authorised Reseller
        Shop shop1 = initializeShop(
                seller1,
                "Apple Authorised Reseller",
                "Gian hàng chính hãng phân phối ủy quyền các sản phẩm Apple: iPhone, iPad, MacBook, Apple Watch, AirPods chính hãng VN/A với chế độ bảo hành 12 tháng chuẩn Apple toàn cầu.",
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
                "Trung tâm phân phối Apple Logistics, Lô E2-E3 KCN Cát Lái 2, Thạnh Mỹ Lợi, TP Thủ Đức, TP.HCM");

        // Shop 2 - Samsung Experience Store
        Shop shop2 = initializeShop(
                seller2,
                "Samsung Experience Store",
                "Gian hàng chính hãng Samsung Flagship phân phối dòng Galaxy S Ultra, Z Fold, Z Flip, Galaxy Tab và thiết bị gia dụng thông minh SmartThings tích hợp AI toàn diện.",
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
                "Số 2 Hải Triều, Bến Nghé, Quận 1, TP.HCM",
                "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c",
                "0301119988",
                "support@samsung.vn",
                "Techcombank",
                "19034567890011",
                "CONG TY TNHH DIEN TU SAMSUNG VINA",
                "245 Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội",
                "Kho tổng Samsung Electronics, Lô I-1, Đường D1, KCNC Tăng Nhơn Phú B, TP Thủ Đức, TP.HCM");

        // Shop 3 - GearVN PC & Gaming Hub
        Shop shop3 = initializeShop(
                seller3,
                "GearVN PC & Gaming Hub",
                "Chuyên cung cấp laptop gaming cao cấp, linh kiện PC build (CPU, VGA RTX 40-series, RAM, SSD), màn hình 144Hz - 240Hz, ghế công thái học và gaming gear chuyên nghiệp.",
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
                "78-80-82 Hoàng Hoa Thám, Phường 12, Quận Tân Bình, TP.HCM",
                "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c",
                "0314889966",
                "cskh@gearvn.com",
                "MB Bank",
                "0888999888",
                "CONG TY CP CONG NGHE GEARVN",
                "59 Đỗ Quang, Phường Trung Hòa, Quận Cầu Giấy, Hà Nội",
                "Kho tổng GearVN Express, 78 Hoàng Hoa Thám, Phường 12, Quận Tân Bình, TP.HCM");

        // Shop 4 - Sony Electronics Flagship
        Shop shop4 = initializeShop(
                seller4,
                "Sony Electronics Flagship",
                "Nhà phân phối chính thức thiết bị âm thanh đỉnh cao: Tai nghe chống ồn WH-1000XM5, WF-1000XM5, Loa không dây Bluetooth, Máy ảnh Alpha Mirrorless và Phụ kiện cao cấp.",
                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop",
                "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&h=400&fit=crop",
                "0987654324",
                "182 Bạch Đằng, Phường Hải Châu 1, Quận Hải Châu",
                1530, // Hải Châu, Đà Nẵng
                "40101",
                ShopStatus.ACTIVE,
                4.9f,
                SellerType.BUSINESS,
                BusinessType.ENTERPRISE,
                "Công Ty TNHH Sony Electronics Việt Nam",
                "Tầng 6, Tòa nhà President Place, 93 Nguyễn Du, Bến Nghé, Quận 1, TP.HCM",
                "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c",
                "0401889977",
                "sony.vietnam@sony.com.vn",
                "BIDV",
                "6868686868",
                "CONG TY TNHH SONY ELECTRONICS VIET NAM",
                "182 Bạch Đằng, Phường Hải Châu 1, Quận Hải Châu, Đà Nẵng",
                "Kho Sony miền Trung, KCN Hòa Cầm, Cẩm Lệ, Đà Nẵng");

        // Shop 5 - Anker & Baseus Flagship Store
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

        // Shop 6 - Xiaomi Smart Ecosystem VN
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

        // Initialize Realistic Escrow Deposits & Historical Seniority for Shops
        initializeShopEscrowAndSeniority(shop1, new BigDecimal("50000000"), 15, 5); // Apple: 50tr, 15 tháng, 5⭐
        initializeShopEscrowAndSeniority(shop2, new BigDecimal("30000000"), 10, 4); // Samsung: 30tr, 10 tháng, 4⭐
        initializeShopEscrowAndSeniority(shop3, new BigDecimal("30000000"), 8, 4);  // GearVN: 30tr, 8 tháng, 4⭐
        initializeShopEscrowAndSeniority(shop4, new BigDecimal("10000000"), 4, 3);  // Sony: 10tr, 4 tháng, 3⭐
        initializeShopEscrowAndSeniority(shop5, new BigDecimal("5000000"), 2, 2);   // Anker: 5tr, 2 tháng, 2⭐
        initializeShopEscrowAndSeniority(shop6, BigDecimal.ZERO, 1, 1);             // Xiaomi: 0đ, 1 tháng, 1⭐

        log.info("Shops seeded successfully with realistic escrow deposits and seniority.");
    }

    private Shop initializeShop(User user, String name, String description, String logoUrl,
            String coverImageUrl, String phoneNumber, String address,
            Integer districtId, String wardCode, ShopStatus status, Float rating,
            SellerType sellerType, BusinessType businessType, String businessName,
            String businessAddress, String businessLicenseUrl,
            String taxCode, String invoiceEmail,
            String bankName, String bankAccountNumber, String bankAccountName,
            String pickupAddress, String returnAddress) {

        if (user == null) return null;

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

    private void initializeShopEscrowAndSeniority(Shop shop, BigDecimal depositAmount, int activeMonthsAgo, int trustStar) {
        if (shop == null) return;
        LocalDateTime pastDate = LocalDateTime.now().minusMonths(activeMonthsAgo);
        shop.setCreatedAt(pastDate);
        shop.setDepositBalance(depositAmount);
        shop.setTrustLevel(trustStar);
        shopRepository.save(shop);

        shopEscrowFundRepository.findByShopId(shop.getId())
                .map(fund -> {
                    fund.setBalance(depositAmount);
                    fund.setCurrentTrustLevel(trustStar);
                    return shopEscrowFundRepository.save(fund);
                })
                .orElseGet(() -> {
                    ShopEscrowFund fund = ShopEscrowFund.builder()
                            .shop(shop)
                            .balance(depositAmount)
                            .committedAmount(BigDecimal.ZERO)
                            .currentTrustLevel(trustStar)
                            .isDeficit(false)
                            .deficitAmount(BigDecimal.ZERO)
                            .status(EscrowFundStatus.ACTIVE)
                            .build();
                    return shopEscrowFundRepository.save(fund);
                });
        log.info("Initialized escrow fund: {} VND, trust level: {} star, active: {} months for shop: {}",
                depositAmount, trustStar, activeMonthsAgo, shop.getName());
    }

    public List<Shop> getAll() {
        return shopRepository.findAll();
    }
}
