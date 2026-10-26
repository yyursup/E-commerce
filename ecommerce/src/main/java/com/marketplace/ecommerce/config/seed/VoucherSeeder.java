package com.marketplace.ecommerce.config.seed;

import com.marketplace.ecommerce.product.entity.ProductCategory;
import com.marketplace.ecommerce.product.repository.ProductCategoryRepository;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.voucher.entity.Voucher;
import com.marketplace.ecommerce.voucher.repository.VoucherRepository;
import com.marketplace.ecommerce.voucher.valueObjects.VoucherScope;
import com.marketplace.ecommerce.voucher.valueObjects.VoucherStatus;
import com.marketplace.ecommerce.voucher.valueObjects.VoucherType;
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
public class VoucherSeeder {

    private final VoucherRepository voucherRepository;
    private final ShopRepository shopRepository;
    private final ProductCategoryRepository categoryRepository;

    public void seed() {
        log.info("Initializing specialized electronics system & shop vouchers...");

        // Expire legacy non-tech vouchers if they exist from earlier runs
        List.of("FASHION30", "TRENDY10", "NHANAM20K", "SUNHOUSE50K").forEach(code -> {
            voucherRepository.findByCodeIgnoreCase(code).ifPresent(v -> {
                v.setStatus(VoucherStatus.EXPIRED);
                voucherRepository.save(v);
            });
        });

        Map<String, Shop> shopMap = shopRepository.findAll().stream()
                .collect(Collectors.toMap(Shop::getName, Function.identity(), (a, b) -> a));

        Shop shop1 = shopMap.get("Apple Authorised Reseller");
        Shop shop2 = shopMap.get("Samsung Experience Store");
        Shop shop3 = shopMap.get("GearVN PC & Gaming Hub");
        Shop shop4 = shopMap.get("Sony Electronics Flagship");

        List<ProductCategory> allCategories = categoryRepository.findAll();
        ProductCategory phonesAndTablets = findCategory(allCategories, "Điện Thoại & Máy Tính Bảng");
        ProductCategory computers = findCategory(allCategories, "Laptop & Máy Tính Để Bàn");
        ProductCategory components = findCategory(allCategories, "Linh Kiện Máy Tính & PC Build");
        ProductCategory audio = findCategory(allCategories, "Thiết Bị Âm Thanh");

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
                BigDecimal.valueOf(50000),
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

    private ProductCategory findCategory(List<ProductCategory> categories, String name) {
        return categories.stream()
                .filter(c -> c.getName().equalsIgnoreCase(name))
                .findFirst()
                .orElse(null);
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
