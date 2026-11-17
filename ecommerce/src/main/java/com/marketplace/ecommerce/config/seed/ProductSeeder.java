package com.marketplace.ecommerce.config.seed;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.entity.ProductCategory;
import com.marketplace.ecommerce.product.entity.ProductImage;
import com.marketplace.ecommerce.product.repository.ProductCategoryRepository;
import com.marketplace.ecommerce.product.repository.ProductImageRepository;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.product.valueObjects.ConditionGrade;
import com.marketplace.ecommerce.product.valueObjects.ProductStatus;
import com.marketplace.ecommerce.product.valueObjects.WarrantyType;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProductSeeder {

    private static final int MIN_PRODUCTS_PER_SHOP = 10;
    private static final int MAX_PRODUCTS_PER_SHOP = 20;

    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final ProductCategoryRepository productCategoryRepository;
    private final ShopRepository shopRepository;

    public void seed() {
        log.info("Seeding realistic tech products for verified shops...");

        Map<String, Shop> shopMap = shopRepository.findAll().stream()
                .collect(Collectors.toMap(Shop::getName, Function.identity(), (a, b) -> a));

        List<ProductCategory> allCategories = productCategoryRepository.findAll();
        if (allCategories.isEmpty()) {
            log.warn("Cannot seed products: No categories found in database.");
            return;
        }

        // 1. Seed 60 authentic products from scraped JSON data (iPhone, Apple Watch, AirPods & Accessories)
        seedRealProductsFromJson(shopMap, allCategories);

        // 2. Seed other verified brand shops
        seedShopByName(shopMap, "Samsung Experience Store", allCategories, "SAMSUNG");
        seedShopByName(shopMap, "GearVN PC & Gaming Hub", allCategories, "GEARVN");
        seedShopByName(shopMap, "Sony Electronics Flagship", allCategories, "SONY");
        seedShopByName(shopMap, "Anker & Baseus Flagship Store", allCategories, "ANKER");
        seedShopByName(shopMap, "Xiaomi Smart Ecosystem VN", allCategories, "XIAOMI");

        log.info("Product seeding completed successfully.");
    }

    private void seedShopByName(Map<String, Shop> shopMap, String shopName, List<ProductCategory> categories, String domain) {
        Shop shop = shopMap.get(shopName);
        if (shop == null) {
            log.warn("Shop '{}' not found in database, skipping product seeding.", shopName);
            return;
        }
        seedShopProducts(shop, categories, domain);
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
            log.debug("Skip seed products for shop {} because already has {}", shop.getName(), existingProducts);
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

        // Map keyword variations to real category names
        String searchKey = keyword.trim();
        if (searchKey.equalsIgnoreCase("Tablet")) {
            searchKey = "Điện Thoại & Tablet";
        } else if (searchKey.equalsIgnoreCase("Âm Thanh")) {
            searchKey = "Tai Nghe & Soundbar";
        } else if (searchKey.equalsIgnoreCase("Laptop")) {
            searchKey = "Laptop";
        }

        final String finalKey = searchKey.toLowerCase();
        // Prefer leaf categories (categories with parent)
        return categories.stream()
                .filter(c -> c.getParent() != null && c.getName().toLowerCase().contains(finalKey))
                .findFirst()
                .or(() -> categories.stream().filter(c -> c.getName().toLowerCase().contains(finalKey)).findFirst())
                .orElse(categories.get(0));
    }

    private Product initializeProduct(Shop shop, ProductCategory category, String name,
                                      String description, String sku, Integer quantity,
                                      BigDecimal basePrice, Integer weight, ProductStatus status) {
        return productRepository.findAll().stream()
                .filter(p -> p.getSku() != null && p.getSku().equals(sku) && !Boolean.TRUE.equals(p.getDeleted()))
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
                list.add(new ProductCatalogItem("Tai nghe Apple AirPods Pro (Gen 2) Type-C MagSafe", "Tai Nghe & Soundbar",
                        5690000L, 250,
                        "Chip H2 mang đến khả năng chống ồn chủ động (ANC) gấp 2 lần, tính năng Adaptive Audio tự động điều chỉnh theo môi trường, cổng sạc Type-C hiện đại và khả năng kháng bụi nước IP54.",
                        "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Tai nghe Chụp Tai Apple AirPods Max Wireless ANC", "Tai Nghe & Soundbar",
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
                list.add(new ProductCatalogItem("MacBook Pro 14 inch M3 Pro (18GB RAM / 512GB SSD) Space Black", "Laptop",
                        46990000L, 1600,
                        "Chip M3 Pro 11 nhân CPU, 14 nhân GPU cùng 18GB bộ nhớ thống nhất, màn hình Liquid Retina XDR 14.2 inch 120Hz độ sáng tối đa 1600 nits. Có 3 cổng Thunderbolt 4, HDMI, khe thẻ SDXC và MagSafe 3, pin xem video tới khoảng 18 giờ. Hàng chính hãng Apple Việt Nam.",
                        "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/m/a/macbook-pro-14-inch-m3-pro-2023_1_.png",
                        "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/m/a/macbook-pro-14-inch-m3-pro-2023_4_.png"));
                list.add(new ProductCatalogItem("Mac mini M2 8GB/256GB Bản Chính Hãng VN/A", "PC Đồng Bộ",
                        14999000L, 1180,
                        "Mac mini chip M2 (8 nhân CPU, 10 nhân GPU), RAM 8GB, SSD 256GB, thân máy nhỏ gọn nặng khoảng 1.18kg. Đủ cổng cho bàn làm việc: 2 Thunderbolt 4, 2 USB-A, HDMI, Gigabit Ethernet và giắc tai nghe 3.5mm.",
                        "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/m/a/mac-mini-3_1.jpg",
                        "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/m/a/mac-mini-3_1.jpg"));
                list.add(new ProductCatalogItem("Dây Đeo Apple Watch Sport Band Silicone Chính Hãng 45mm", "Phụ Kiện Đồng Hồ",
                        990000L, 40,
                        "Dây Sport Band chính hãng Apple làm từ fluoroelastomer mềm, dễ lau chùi, khóa cài chốt gọn. Dùng được cho Apple Watch vỏ 42/44/45/49mm, phù hợp tập luyện hằng ngày.",
                        "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/MJUH4ref?wid=1144&hei=1144&fmt=jpeg&qlt=90&.v=TzNIWFZDMnpUWHFJbFZYS21OMUR5ZjFlc25WOEVLY1JSWC9IQlNRYUMrbUNXVjk0TzYwS3Q2V3VwaTE1bnFMYUUzd2tseHhQOFVXNytOVXJ6WTZISlE",
                        "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/MJUH4ref_AV1?wid=2000&hei=2000&fmt=jpeg&qlt=90&.v=RnBEVlFtNU00UTZlOURPQzRXNzZWL1Y1N2w2YnRDOUU3NzYxVzNjaDM5cStpNFY0WVMxUVlnblJXSGt4T2pKc1hESGQ3VHhoaGRlRDg1c3luR1hFRnc"));
                list.add(new ProductCatalogItem("Dây Đeo Apple Watch Alpine Loop 44/45/46/49mm", "Phụ Kiện Đồng Hồ",
                        2900000L, 60,
                        "Dây dệt hai lớp từ polyester và spandex tái chế, móc chữ G bằng titan tái chế, ôm cổ tay chắc cho các hoạt động ngoài trời. Tương thích Apple Watch 44/45/46/49mm, có nhiều cỡ và màu.",
                        "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/g/r/group_647_85__3.png",
                        "https://cdn2.cellphones.com.vn/insecure/rs:fill:0:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/g/r/group_647_84__3.png"));
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
                list.add(new ProductCatalogItem("Tai Nghe Samsung Galaxy Buds2 Pro Âm Thanh 24bit Hi-Fi", "Tai Nghe & Soundbar",
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
                list.add(new ProductCatalogItem("Dây Đeo Silicone Sport Band Samsung Galaxy Watch6 40/43mm", "Phụ Kiện Đồng Hồ",
                        1460000L, 23,
                        "Dây Sport Band chính hãng Samsung bằng fluoroelastomer chống mồ hôi, thay dây chỉ cần một nút bấm. Dùng cho Galaxy Watch6 và Watch6 Classic, nặng khoảng 23g.",
                        "https://cdn2.fptshop.com.vn/unsafe/384x0/filters:format(webp):quality(75)/7317_Vang_760277178216_day_deo_dong_ho_samsung_galaxy_watch6_40_43mm_sport_band_vang_mo_et_sfr93soegww_56_0c7e3938ab.png",
                        "https://cdn2.fptshop.com.vn/unsafe/384x0/filters:format(webp):quality(75)/2023_8_2_638265672399277264_day-deo-dong-ho-samsung-galaxy-watch6-40-43mm-sport-band-vang-4.jpg"));
                list.add(new ProductCatalogItem("Dây Đeo Eco-Leather Samsung Galaxy Watch6 40/43mm", "Phụ Kiện Đồng Hồ",
                        2440000L, 30,
                        "Dây Eco-Leather chính hãng Samsung có khóa nam châm, chỉnh độ rộng nhanh và vừa cổ tay. Kiểu dáng lịch sự, hợp mang đi làm và dự tiệc với Galaxy Watch6.",
                        "https://cdn2.fptshop.com.vn/unsafe/384x0/filters:format(webp):quality(75)/7322_Xanh_760277179521_day_deo_dong_ho_samsung_galaxy_watch6_40_43mm_eco_leather_band_et_shr93slegww_61_b354b7e1f5.png",
                        "https://cdn2.fptshop.com.vn/unsafe/384x0/filters:format(webp):quality(75)/2023_8_2_638265664365141764_day-deo-dong-ho-samsung-galaxy-watch6-40-43mm-eco-leather-band-xanh-1.jpg"));
            }
            case "GEARVN" -> {
                list.add(new ProductCatalogItem("Laptop Gaming ASUS ROG Strix G16 G614JVR (i9-14900HX / RTX 4080)", "Laptop",
                        54990000L, 4200,
                        "Quái thú gaming cấu hình khủng: Intel Core i9-14900HX, NVIDIA GeForce RTX 4080 12GB GDDR6, 32GB DDR5 5600MHz, màn hình ROG Nebula 2.5K 240Hz 100% DCI-P3 chuẩn màu đồ họa.",
                        "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Card Màn Hình ASUS TUF Gaming GeForce RTX 4080 Super 16GB", "Linh Kiện PC",
                        29990000L, 2500,
                        "Kiến trúc Ada Lovelace với nhân Ray Tracing thế hệ 3, DLSS 3.5 AI Frame Generation mượt mà ở độ phân giải 4K, 3 quạt tản nhiệt vòng bi kép Axial-tech siêu mát và bền bỉ.",
                        "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Bộ Vi Xử Lý CPU Intel Core i9-14900K Box Chính Hãng", "Linh Kiện PC",
                        14490000L, 350,
                        "24 nhân 32 luồng (8 P-Core + 16 E-Core), xung nhịp tối đa lên tới 6.0 GHz nhờ công nghệ Intel Thermal Velocity Boost, đáp ứng hoàn hảo render 3D và stream game đỉnh cao.",
                        "https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("RAM Corsair Vengeance RGB 32GB (2x16GB) DDR5 6000MHz", "Linh Kiện PC",
                        3290000L, 200,
                        "Tản nhiệt nhôm nguyên khối anodized, dải LED RGB 10 vùng siêu sáng tương thích phần mềm iCUE, hỗ trợ Intel XMP 3.0 ép xung ổn định bằng một cú click chuột.",
                        "https://images.unsplash.com/photo-1562976540-1502c2145186?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Ổ Cứng SSD Samsung 990 Pro 2TB PCIe Gen 4.0 x4 NVMe M.2", "Linh Kiện PC",
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
                list.add(new ProductCatalogItem("Nguồn Máy Tính Corsair RM850e 850W 80 Plus Gold ATX 3.0", "Linh Kiện PC",
                        3190000L, 2800,
                        "Đạt chứng nhận 80 Plus Gold và chuẩn ATX 3.0 kèm cáp nguồn PCIe 5.0 12VHPWR cho card đồ họa RTX series, tụ điện Nhật Bản 105 độ C vận hành êm ái không tiếng ồn.",
                        "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Tản Nhiệt Nước AIO DeepCool LT720 ARGB 360mm", "Linh Kiện PC",
                        3150000L, 2500,
                        "Bơm thế hệ thứ 4 với động cơ 3 pha 3100 RPM, mặt pump khối vô cực đa chiều hiệu ứng gương 3D huyền ảo, 3 quạt FK120 PWM áp suất gió cao làm mát CPU tối đa.",
                        "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Màn Hình Gaming LG UltraGear 27GR95QE-B 27 inch 2K OLED 240Hz", "PC Đồng Bộ",
                        19900000L, 7500,
                        "Tấm nền OLED đỉnh cao với độ tương phản vô cực, tần số quét 240Hz thời gian phản hồi thần tốc 0.03ms (GtG), hỗ trợ NVIDIA G-SYNC Compatible và AMD FreeSync Premium.",
                        "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Laptop Gaming Lenovo Legion Pro 5 16IRX9 83DF0047VN (i9-14900HX / RTX 4060 / 32GB / 1TB)", "Laptop",
                        43890000L, 2500,
                        "Core i9-14900HX, RTX 4060 8GB, RAM 32GB DDR5 và SSD 1TB. Màn hình 16 inch WQXGA 240Hz phủ 100% DCI-P3, tản nhiệt ColdFront 5.0 hai quạt giữ máy mát khi chơi game dài. Bảo hành chính hãng Lenovo Việt Nam.",
                        "https://anphat.com.vn/media/product/47463_laptop_lenovo_legion_pro_5_16irx9_83df0047vn__intel_core_i9_14900hx__4_.jpg",
                        "https://anphat.com.vn/media/product/47463_laptop_lenovo_legion_pro_5_16irx9_83df0047vn__intel_core_i9_14900hx__1_.jpg"));
                list.add(new ProductCatalogItem("Laptop Dell XPS 13 9340 HXRGT (Ultra 7 155H / 16GB / 1TB / 13.4 inch QHD+ Cảm Ứng)", "Laptop",
                        54990000L, 1210,
                        "Vỏ nhôm nguyên khối nặng khoảng 1.21kg, chip Intel Core Ultra 7 155H (16 nhân, 22 luồng), RAM 16GB LPDDR5X, SSD 1TB và màn hình cảm ứng 13.4 inch QHD+ 120Hz. Có 2 cổng Thunderbolt 4, hợp với người dùng văn phòng hay di chuyển.",
                        "https://anphat.com.vn/media/product/49378_laptop_dell_xps_13_9340_hxrgt_anphatcomputer_1.jpg",
                        "https://anphat.com.vn/media/product/49378_laptop_dell_xps_13_9340_hxrgt__2_.jpg"));
                list.add(new ProductCatalogItem("PC GVN Intel i7-14700F / VGA RTX 4070 Super", "PC Đồng Bộ",
                        38990000L, 12000,
                        "Bộ PC lắp sẵn của GearVN với Core i7-14700F (20 nhân, 28 luồng, xung tối đa 5.4GHz), card RTX 4070 Super, RAM 16GB và SSD NVMe PCIe Gen 4. Chơi tốt game AAA ở độ phân giải 2K. Linh kiện bảo hành tại GearVN.",
                        "https://cdn.hstatic.net/products/200000722513/web__4_of_101__732d6c0359294ef6968130c276f51f50_large.jpg",
                        "https://cdn.hstatic.net/products/200000722513/web__14_of_101__6f8a489d0d374db697099a982e557ca5_large.jpg"));
                list.add(new ProductCatalogItem("PC GVN x MSI Dragon X (Intel Core Ultra 7 265K / VGA RTX 4070 Super)", "PC Đồng Bộ",
                        54990000L, 12000,
                        "Bộ PC phối hợp giữa GearVN và MSI với CPU Core Ultra 7 265K cùng card RTX 4070 Super, đủ mạnh cho game nặng, dựng video và render. Lắp ráp, kiểm tra sẵn, cắm điện là dùng.",
                        "https://cdn.hstatic.net/products/200000722513/pc_khach_rtx_5090_msi-02261_03cddd72f4164a5d8a0b3b9d717715fc_large.jpg",
                        "https://product.hstatic.net/200000722513/product/artboard_2_copy_c0584cdc76304664a24e92cde2f41eb2_large.png"));
                list.add(new ProductCatalogItem("Microphone Thu Âm USB HyperX QuadCast S RGB Chống Rung", "Thu Âm",
                        3290000L, 600,
                        "Micro condenser USB với 4 kiểu thu âm, giá treo giảm rung đi kèm, cảm ứng chạm trên đỉnh để tắt tiếng và đèn RGB chỉnh qua phần mềm NGENUITY. Hợp với streamer và người làm podcast.",
                        "https://row.hyperx.com/cdn/shop/files/hyperx_quadcast_s_1_front.jpg?v=1793386382",
                        "https://row.hyperx.com/cdn/shop/files/ai-quadcast-s-1-2000x2000.jpg?v=1793386381"));
            }
            case "SONY" -> {
                list.add(new ProductCatalogItem("Tai Nghe Chống Ồn Flagship Sony WH-1000XM5 Hi-Res", "Tai Nghe & Soundbar",
                        7990000L, 700,
                        "Bộ xử lý tích hợp V1 kết hợp bộ xử lý chống ồn chuyên dụng HD QN1, màng loa 30mm gia cố bằng sợi carbon nhẹ cứng, hỗ trợ codec âm thanh độ phân giải cao LDAC và thời lượng pin 30 giờ.",
                        "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Tai Nghe True Wireless Chống Ồn Sony WF-1000XM5", "Tai Nghe & Soundbar",
                        5490000L, 250,
                        "Màng loa Dynamic Driver X tái tạo âm trầm sâu lắng và giọng hát chi tiết, 3 micro trên mỗi tai nghe lọc gió khử ồn vượt bậc, sạc không dây chuẩn Qi và kháng nước IPX4.",
                        "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Loa Di Động Sony SRS-XG300 Extra Bass Chống Nước IP67", "Loa, Tai Nghe",
                        5990000L, 3500,
                        "Công nghệ củ loa X-Balanced tái tạo áp suất âm thanh mạnh mẽ hạn chế méo tiếng, pin 25 giờ kèm sạc nhanh 10 phút dùng 70 phút, dải đèn LED phát sáng theo điệu nhạc.",
                        "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Loa Soundbar Sony HT-A5000 5.1.2 Kênh Dolby Atmos 450W", "Loa, Tai Nghe",
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
                list.add(new ProductCatalogItem("Microphone Không Dây Kép Sony ECM-W2BT Thu Âm Studio", "Thu Âm",
                        4990000L, 350,
                        "Kết nối kỹ thuật số qua ngàm MI Shoe không suy giảm tín hiệu âm thanh, khoảng cách truyền tải ổn định lên tới 200m, hỗ trợ 3 chế độ thu âm MIC, MIX và RCVR linh hoạt.",
                        "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Loa Tiệc Tùng Di Động Sony SRS-XV800 Đèn Led Party Pin 25H", "Loa, Tai Nghe",
                        11990000L, 19500,
                        "Âm thanh tiệc đa hướng Omni-directional Party Sound lan tỏa khắp không gian, bánh xe và tay kéo di chuyển linh hoạt, hỗ trợ cổng cắm micro karaoke và guitar biểu diễn sống động.",
                        "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Tai Nghe Chơi Game Không Dây Sony INZONE H9 Chống Ồn ANC", "Tai Nghe & Soundbar",
                        5990000L, 650,
                        "Công nghệ 360 Spatial Sound for Gaming xác định chính xác vị trí bước chân đối thủ, khử tiếng ồn chủ động kép, micro cần gạt tắt tiếng tiện lợi và kết nối 2.4GHz không độ trễ.",
                        "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Camera Hành Trình Sony FDR-X3000 Action Cam 4K Chống Rung Quang Học", "Action Camera",
                        9990000L, 116,
                        "Quay 4K 30p bitrate 100Mbps, chống rung quang học Balanced Optical SteadyShot, ống kính ZEISS Tessar. Có Wi-Fi và GPS, kèm vỏ chống nước dùng được tới độ sâu 60m.",
                        "https://channel.vcmedia.vn/thumb_w/640/prupload/441/2016/11/img20161107140820701.jpg",
                        "https://channel.vcmedia.vn/thumb_w/640/prupload/441/2016/11/img20161107140820701.jpg"));
                list.add(new ProductCatalogItem("Máy Quay Hành Động Sony RX0 II Siêu Nhỏ Chống Nước 10m", "Action Camera",
                        15990000L, 132,
                        "Máy ảnh siêu nhỏ cảm biến 1 inch 15.3MP, ống kính ZEISS Tessar T* 24mm f/4, quay 4K nội bộ XAVC S. Thân máy chống nước, chống va đập và chống nghiền, cổng micro HDMI và jack mic 3.5mm.",
                        "https://tientranmobile.com/wp-content/uploads/2026/03/sony-rx0-ii-4-510x510.jpg",
                        "https://tientranmobile.com/wp-content/uploads/2026/03/sony-rx0-ii-6-510x310.jpg"));
                list.add(new ProductCatalogItem("Gimbal Chống Rung Zhiyun Weebill 3S Cho Máy Ảnh Mirrorless", "Gimbal",
                        8490000L, 1055,
                        "Gimbal 3 trục tải tối đa 3kg, đèn trợ sáng 1000 lux, màn hình cảm ứng 0.96 inch, pin dùng đến 11.5 giờ và sạc nhanh PD. Hỗ trợ chuyển ngang dọc nhanh, tương thích nhiều dòng mirrorless của Sony, Canon, Nikon, Panasonic và Fujifilm.",
                        "https://mayanh24h.com/upload/assets/thumb/2023/0916/ar/weebill-3s-1.jpg",
                        "https://product.hstatic.net/200000349155/product/logo2_e781c261495740579781b41ae7279d64.jpg"));
            }
            case "ANKER" -> {
                list.add(new ProductCatalogItem("Trạm Sạc Để Bàn Anker Prime 6 Trong 1 GaN 200W USB-C", "Cáp Sạc",
                        2390000L, 550,
                        "Tổng công suất 200W với 4 cổng Type-C và 2 cổng USB-A, hỗ trợ sạc nhanh cùng lúc 2 laptop công suất 100W mỗi cổng, chip GaN thế hệ mới bảo vệ quá nhiệt ActiveShield 2.0.",
                        "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Pin Sạc Dự Phòng Anker 737 Power Bank (PowerCore 24K) 140W", "Cáp Sạc",
                        2890000L, 750,
                        "Dung lượng 24.000mAh chuẩn sạc PD 3.1 140W nạp pin siêu tốc cho MacBook Pro 16 inch, màn hình màu thông minh hiển thị chi tiết công suất sạc theo thời gian thực.",
                        "https://images.unsplash.com/photo-1609592426815-f55a16d80d29?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Củ Sạc Nhanh Baseus GaN5 Pro Fast Charger 65W 3 Cổng", "Cáp Sạc",
                        490000L, 180,
                        "Kích thước nhỏ hơn 55% so với củ sạc thông thường, trang bị 2 cổng Type-C và 1 cổng USB-A sạc đồng thời điện thoại, máy tính bảng và tai nghe tiện lợi khi du lịch.",
                        "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Hub Chuyển Đổi Baseus Metal Gleam Series 9-in-1 Type-C 4K 60Hz", "Cáp Chuyển Đổi",
                        890000L, 250,
                        "Vỏ hợp kim nhôm tản nhiệt nhanh, trang bị cổng HDMI 4K 60Hz sắc nét, cổng mạng LAN Gigabit RJ45 1000Mbps, khe thẻ nhớ SD/TF và hỗ trợ sạc xuyên qua PD 100W.",
                        "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Cáp Sạc Baseus Tungsten Gold Type-C to Type-C 100W 1.5m Bện Dù", "Cáp Sạc",
                        159000L, 80,
                        "Đầu cắm phủ hợp kim kẽm đen bóng chống oxy hóa gỉ sét, dây bện dù nylon mật độ cao chống gập gãy trên 10.000 lần uốn cong, hỗ trợ dòng điện tối đa 5A chuẩn E-Marker.",
                        "https://images.unsplash.com/photo-1609081219090-a6d8173087ec?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Sạc Dự Phòng MagSafe Baseus Magnetic 10000mAh 20W LED", "Cáp Sạc",
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
                list.add(new ProductCatalogItem("Giá Đỡ Điện Thoại Baseus Halo Tự Kẹp Kiêm Sạc Không Dây 15W", "Cáp Sạc",
                        450000L, 320,
                        "Cảm biến hồng ngoại nhận diện điện thoại tự động kẹp giữ chắc chắn, sạc nhanh không dây chuẩn Qi 15W tản nhiệt quạt mini giúp điện thoại không nóng khi chạy bản đồ định vị GPS.",
                        "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Tai Nghe Chống Ồn Soundcore Space One by Anker Adaptive ANC", "Tai Nghe & Soundbar",
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
                list.add(new ProductCatalogItem("Vòng Đeo Tay Thông Minh Xiaomi Smart Band 8 Màn Hình AMOLED 60Hz", "Smartband",
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
                list.add(new ProductCatalogItem("Flycam FIMI X8 SE 2022 V2 Camera 4K Truyền Hình Ảnh 10km", "Flycam",
                        11490000L, 768,
                        "Cảm biến Sony 1/2 inch khẩu f/1.6 quay 4K HDR, gimbal 3 trục, bay tối đa khoảng 35 phút, truyền hình ảnh xa 10km. Thân gập gọn khoảng 768g, định vị GPS, GLONASS và BeiDou.",
                        "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Flycam DJI Mini 3 (+ DJI RC-N1) Dưới 249g Camera 4K HDR", "Flycam",
                        13499000L, 249,
                        "Drone DJI Mini 3 nặng dưới 249g, cảm biến 1/1.3 inch 12MP, quay 4K HDR, bay 38 đến 51 phút tùy loại pin. Có quay dọc, QuickShot và Panorama, kèm tay điều khiển RC-N1.",
                        "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Combo Xiaomi Mi Action Camera 4K + Tay Cầm Chống Rung", "Action Camera",
                        3490000L, 99,
                        "Camera hành động Xiaomi quay 4K 30fps góc rộng 145 độ, chống rung điện tử 6 trục, màn hình cảm ứng 2.4 inch, nặng khoảng 99g, kết nối Wi-Fi và Bluetooth. Đi kèm tay cầm chống rung.",
                        "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Máy Đọc Sách Amazon Kindle Paperwhite 6 16GB (Bản Không Quảng Cáo)", "Máy Đọc Sách",
                        6390000L, 211,
                        "Màn hình E Ink 7 inch 300ppi chống chói với đèn nền chỉnh được, bộ nhớ 16GB, chống nước IPX8, sạc USB-C và pin dùng đến khoảng 12 tuần. Bản không quảng cáo.",
                        "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Máy Đọc Sách Kobo Clara BW 6 inch 16GB Chống Nước", "Máy Đọc Sách",
                        5299000L, 174,
                        "Máy đọc sách 6 inch màn hình E Ink Carta 1300 độ phân giải 1072x1448, bộ nhớ 16GB, chống nước IPX8, sạc USB-C, đèn ComfortLight PRO và chế độ nền tối. Đọc được EPUB, PDF và nhiều định dạng khác.",
                        "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Camera An Ninh Ngoài Trời Xiaomi Outdoor Camera CW300 2.5K", "Camera An Ninh",
                        990000L, 330,
                        "Camera ngoài trời 4MP (2560x1440) chống nước bụi IP66, gimbal xoay hai trục, hồng ngoại ban đêm và chế độ đêm có màu. Có đèn và còi báo động, đàm thoại hai chiều, hỗ trợ Wi-Fi lẫn cổng LAN.",
                        "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=800&fit=crop"));
                list.add(new ProductCatalogItem("Camera An Ninh Xiaomi Smart Camera C200 1080P Xoay 360", "Camera An Ninh",
                        510000L, 260,
                        "Camera trong nhà Full HD 1080p xoay ngang 360 độ và dọc 106 độ, hồng ngoại 940nm không đèn đỏ khi quay đêm, nhận diện người bằng AI, lưu thẻ microSD đến 256GB và chuẩn nén H.265.",
                        "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=800&fit=crop"));
            }
            default -> {
                list.add(new ProductCatalogItem("Cáp Sạc Đa Năng 3 Trong 1 Type-C Micro Lightning 100W", "Cáp Sạc",
                        120000L, 80,
                        "Dây bện dù chống rối gãy gập, hỗ trợ sạc nhanh cho mọi thiết bị di động, chiều dài 1.2m tiện dụng.",
                        "https://images.unsplash.com/photo-1609081219090-a6d8173087ec?w=800&h=800&fit=crop",
                        "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&h=800&fit=crop"));
            }
        }
        return list;
    }

    private void seedRealProductsFromJson(Map<String, Shop> shopMap, List<ProductCategory> allCategories) {
        String[] jsonFiles = {
                "seed/data/seed_iphone.json",
                "seed/data/seed_apple_watch.json",
                "seed/data/seed_airpods_accessories.json"
        };

        ObjectMapper mapper = new ObjectMapper();
        int totalSeeded = 0;

        for (String jsonPath : jsonFiles) {
            try {
                ClassPathResource resource = new ClassPathResource(jsonPath);
                if (!resource.exists()) {
                    log.warn("Seed resource file not found: {}", jsonPath);
                    continue;
                }

                try (InputStream is = resource.getInputStream()) {
                    List<SeedProductJsonDto> items = mapper.readValue(
                            is,
                            new TypeReference<List<SeedProductJsonDto>>() {}
                    );

                    for (SeedProductJsonDto item : items) {
                        Shop targetShop = shopMap.get(item.getShop());
                        if (targetShop == null) {
                            targetShop = shopMap.get("Apple Authorised Reseller");
                        }
                        if (targetShop == null && !shopMap.isEmpty()) {
                            targetShop = shopMap.values().iterator().next();
                        }

                        ProductCategory targetCat = findMatchingCategory(allCategories, item.getCategory());

                        Product product = initializeRealProduct(targetShop, targetCat, item);
                        if (product != null && item.getImages() != null && !item.getImages().isEmpty()) {
                            for (int i = 0; i < item.getImages().size(); i++) {
                                String imgUrl = item.getImages().get(i);
                                initializeProductImage(product, imgUrl, i == 0, i + 1);
                            }
                        }
                        totalSeeded++;
                    }
                }
            } catch (Exception e) {
                log.error("Error reading seed JSON file {}: {}", jsonPath, e.getMessage(), e);
            }
        }
        log.info("Total real products seeded from JSON: {}", totalSeeded);
    }

    private Product initializeRealProduct(Shop shop, ProductCategory category, SeedProductJsonDto item) {
        final String sku = item.getSku() != null ? item.getSku() : ("APL-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        final ConditionGrade grade = parseConditionGrade(item.getConditionGrade());
        final WarrantyType wType = "SHOP".equalsIgnoreCase(item.getWarrantyType()) ? WarrantyType.SHOP : WarrantyType.OFFICIAL;

        return productRepository.findBySkuAndDeletedFalse(sku)
                .or(() -> productRepository.findAll().stream()
                        .filter(p -> p.getName() != null && p.getName().equalsIgnoreCase(item.getName()) && !Boolean.TRUE.equals(p.getDeleted()))
                        .findFirst())
                .map(existing -> {
                    boolean changed = false;
                    if ((existing.getDescription() == null || existing.getDescription().isBlank()) && item.getDescription() != null) {
                        existing.setDescription(item.getDescription());
                        changed = true;
                    }
                    if ((existing.getSpecifications() == null || existing.getSpecifications().isBlank()) && item.getSpecifications() != null) {
                        existing.setSpecifications(item.getSpecifications());
                        changed = true;
                    }
                    if (changed) {
                        return productRepository.save(existing);
                    }
                    return existing;
                })
                .orElseGet(() -> {
                    Product product = Product.builder()
                            .shop(shop)
                            .productCategory(category)
                            .name(item.getName())
                            .description(item.getDescription())
                            .specifications(item.getSpecifications())
                            .sku(sku)
                            .quantity(item.getQuantity() != null ? item.getQuantity() : 50)
                            .basePrice(item.getPrice())
                            .weight(item.getWeight() != null ? item.getWeight() : 450)
                            .status(ProductStatus.PUBLISHED)
                            .conditionGrade(grade)
                            .warrantyType(wType)
                            .warrantyMonths(item.getWarrantyMonths() != null ? item.getWarrantyMonths() : 12)
                            .batteryHealth(item.getBatteryHealth())
                            .featured(Boolean.TRUE.equals(item.getFeatured()))
                            .deleted(false)
                            .images(new HashSet<>())
                            .build();
                    Product saved = productRepository.save(product);
                    log.info("Created authentic product: {} (SKU: {}, Price: {} VND, Shop: {})",
                            item.getName(), sku, item.getPrice(), shop.getName());
                    return saved;
                });
    }

    private ConditionGrade parseConditionGrade(String conditionGrade) {
        if (conditionGrade == null) {
            return ConditionGrade.GRADE_NEW;
        }
        return switch (conditionGrade.toUpperCase()) {
            case "GRADE_LIKE_NEW", "GRADE_A" -> ConditionGrade.GRADE_LIKE_NEW;
            case "GRADE_FAIR", "GRADE_B" -> ConditionGrade.GRADE_FAIR;
            case "GRADE_OPEN_BOX", "GRADE_C" -> ConditionGrade.GRADE_OPEN_BOX;
            case "GRADE_AS_IS" -> ConditionGrade.GRADE_AS_IS;
            default -> ConditionGrade.GRADE_NEW;
        };
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SeedProductJsonDto {
        private String name;
        private String sku;
        private String category;
        private String shop;
        private BigDecimal price;
        private BigDecimal originalPrice;
        private String conditionGrade;
        private String warrantyType;
        private Integer warrantyMonths;
        private Integer batteryHealth;
        private Integer weight;
        private Integer quantity;
        private String status;
        private Boolean featured;
        private String specifications;
        private String description;
        private List<String> images;
    }
}
