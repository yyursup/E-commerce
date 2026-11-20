package com.marketplace.ecommerce.config.seed;

import com.marketplace.ecommerce.product.entity.ProductCategory;
import com.marketplace.ecommerce.product.repository.ProductCategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class CategorySeeder {

    private final ProductCategoryRepository categoryRepository;

    // Store references for other seeders
    private final Map<String, ProductCategory> categoryMap = new HashMap<>();

    public void seed() {
        log.info("Seeding streamlined electronic categories...");

        // 1. Điện Thoại & Máy Tính Bảng (3.5%)
        ProductCategory mobile = initializeCategory(null, "Điện Thoại & Máy Tính Bảng", new BigDecimal("3.50"));
        categoryMap.put("mobile", mobile);
        categoryMap.put("smartphones", initializeCategory(mobile, "Điện Thoại & Tablet"));
        categoryMap.put("ereaders", initializeCategory(mobile, "Máy Đọc Sách & Phụ Kiện Khác"));

        // 2. Laptop & PC (4.0%)
        ProductCategory computer = initializeCategory(null, "Laptop & Máy Tính PC", new BigDecimal("4.00"));
        categoryMap.put("computer", computer);
        categoryMap.put("laptops", initializeCategory(computer, "Laptop Các Loại (Gaming, Văn Phòng)"));
        categoryMap.put("pcs", initializeCategory(computer, "PC Đồng Bộ & Máy Trạm"));

        // 3. Linh Kiện & Gaming Gear (5.0%)
        ProductCategory hardware = initializeCategory(null, "Linh Kiện & Gaming Gear", new BigDecimal("5.00"));
        categoryMap.put("hardware", hardware);
        categoryMap.put("pcComponents", initializeCategory(hardware, "Linh Kiện PC (CPU, VGA, RAM, Main...)"));
        categoryMap.put("gamingGear", initializeCategory(hardware, "Gaming Gear (Bàn Phím, Chuột, Tai Nghe)"));

        // 4. Âm Thanh & Giải Trí (6.0%)
        ProductCategory audio = initializeCategory(null, "Thiết Bị Âm Thanh & Giải Trí", new BigDecimal("6.00"));
        categoryMap.put("audio", audio);
        categoryMap.put("speakersHeadphones", initializeCategory(audio, "Loa, Tai Nghe & Soundbar"));
        categoryMap.put("audioStudio", initializeCategory(audio, "Thiết Bị Thu Âm & Livestream"));

        // 5. Phụ Kiện Điện Tử (8.5%)
        ProductCategory accessories = initializeCategory(null, "Phụ Kiện Điện Tử", new BigDecimal("8.50"));
        categoryMap.put("accessories", accessories);
        categoryMap.put("powerAndCables", initializeCategory(accessories, "Củ, Cáp Sạc & Sạc Dự Phòng"));
        categoryMap.put("protectiveCases", initializeCategory(accessories, "Ốp Lưng, Bao Da & Cáp Chuyển Đổi"));

        // 6. Đồng Hồ & Thiết Bị Đeo (6.5%)
        ProductCategory wearables = initializeCategory(null, "Đồng Hồ & Thiết Bị Đeo", new BigDecimal("6.50"));
        categoryMap.put("wearables", wearables);
        categoryMap.put("smartwatches", initializeCategory(wearables, "Smartwatch & Smartband"));
        categoryMap.put("wearableAccessories", initializeCategory(wearables, "Phụ Kiện Đồng Hồ Đeo Tay"));

        // 7. Smart Home & Camera (5.5%)
        ProductCategory smartHome = initializeCategory(null, "Smart Home & Camera", new BigDecimal("5.50"));
        categoryMap.put("smartHome", smartHome);
        categoryMap.put("cameras", initializeCategory(smartHome, "Camera An Ninh & Giám Sát"));
        categoryMap.put("smartDevices", initializeCategory(smartHome, "Robot Hút Bụi, Khóa Cửa & Đèn Thông Minh"));

        // 8. Máy Ảnh & Quay Phim (5.0%)
        ProductCategory cameras = initializeCategory(null, "Máy Ảnh & Quay Phim", new BigDecimal("5.00"));
        categoryMap.put("camerasAndDrones", cameras);
        categoryMap.put("camerasGear", initializeCategory(cameras, "Máy Ảnh, Ống Kính & Gimbal"));
        categoryMap.put("dronesAction", initializeCategory(cameras, "Flycam Drone & Action Camera"));

        log.info("Streamlined categories seeded successfully.");
    }

    private ProductCategory initializeCategory(ProductCategory parent, String name) {
        return initializeCategory(parent, name, null);
    }

    private ProductCategory initializeCategory(ProductCategory parent, String name, BigDecimal commissionRate) {
        return categoryRepository.findAll().stream()
                .filter(cat -> cat.getName().equals(name)
                        && (parent == null
                                ? cat.getParent() == null
                                : cat.getParent() != null && cat.getParent().getId().equals(parent.getId())))
                .findFirst()
                .map(existingCat -> {
                    if (commissionRate != null && existingCat.getCommissionRate() == null) {
                        existingCat.setCommissionRate(commissionRate);
                        return categoryRepository.save(existingCat);
                    }
                    return existingCat;
                })
                .orElseGet(() -> {
                    ProductCategory category = new ProductCategory();
                    category.setParent(parent);
                    category.setName(name);
                    category.setCommissionRate(commissionRate);
                    return categoryRepository.save(category);
                });
    }

    public ProductCategory get(String key) {
        return categoryMap.get(key);
    }

    public List<ProductCategory> getAll() {
        return categoryRepository.findAll();
    }
}
