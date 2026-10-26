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
        log.info("Seeding categories...");

        // Group 1: Điện Thoại & Máy Tính Bảng (3.5%)
        ProductCategory phonesAndTablets = initializeCategory(null, "Điện Thoại & Máy Tính Bảng", new BigDecimal("3.50"));
        categoryMap.put("phonesAndTablets", phonesAndTablets);
        categoryMap.put("smartphones", initializeCategory(phonesAndTablets, "Điện Thoại Thông Minh"));
        categoryMap.put("tablets", initializeCategory(phonesAndTablets, "Máy Tính Bảng"));
        categoryMap.put("ereaders", initializeCategory(phonesAndTablets, "Máy Đọc Sách & Phụ Kiện"));

        // Group 2: Laptop & Máy Tính Để Bàn (4.0%)
        ProductCategory computers = initializeCategory(null, "Laptop & Máy Tính Để Bàn", new BigDecimal("4.00"));
        categoryMap.put("computers", computers);
        categoryMap.put("gamingLaptops", initializeCategory(computers, "Laptop Gaming & Đồ Họa"));
        categoryMap.put("ultrabooks", initializeCategory(computers, "Laptop Văn Phòng & Mỏng Nhẹ"));
        categoryMap.put("pcWorkstations", initializeCategory(computers, "PC Đồng Bộ & Máy Trạm"));

        // Group 3: Linh Kiện Máy Tính & PC Build (4.5%)
        ProductCategory components = initializeCategory(null, "Linh Kiện Máy Tính & PC Build", new BigDecimal("4.50"));
        categoryMap.put("components", components);
        categoryMap.put("cpuGpu", initializeCategory(components, "CPU & Card Đồ Họa (VGA)"));
        categoryMap.put("ramSsd", initializeCategory(components, "RAM, Ổ Cứng SSD & HDD"));
        categoryMap.put("motherboardPsu", initializeCategory(components, "Bo Mạch Chủ & Nguồn Máy Tính"));
        categoryMap.put("casesCooling", initializeCategory(components, "Vỏ Case & Tản Nhiệt PC"));

        // Group 4: Thiết Bị Âm Thanh (6.0%)
        ProductCategory audio = initializeCategory(null, "Thiết Bị Âm Thanh", new BigDecimal("6.00"));
        categoryMap.put("audio", audio);
        categoryMap.put("headphones", initializeCategory(audio, "Tai Nghe True Wireless & Chụp Tai"));
        categoryMap.put("speakers", initializeCategory(audio, "Loa Bluetooth & Soundbar"));
        categoryMap.put("audioStudio", initializeCategory(audio, "Microphone & Soundcard Thu Âm"));

        // Group 5: Phụ Kiện Điện Tử & Gaming Gear (8.5%)
        ProductCategory accessories = initializeCategory(null, "Phụ Kiện Điện Tử & Gaming Gear", new BigDecimal("8.50"));
        categoryMap.put("accessories", accessories);
        categoryMap.put("chargingPacks", initializeCategory(accessories, "Củ Cáp Sạc & Sạc Dự Phòng"));
        categoryMap.put("gearPeripherals", initializeCategory(accessories, "Bàn Phím Cơ & Chuột Gaming"));
        categoryMap.put("hubsCables", initializeCategory(accessories, "Cáp Chuyển Đổi & Hub Type-C"));

        // Group 6: Thiết Bị Đeo & Đồng Hồ Thông Minh (6.5%)
        ProductCategory wearables = initializeCategory(null, "Thiết Bị Đeo & Đồng Hồ Thông Minh", new BigDecimal("6.50"));
        categoryMap.put("wearables", wearables);
        categoryMap.put("smartwatches", initializeCategory(wearables, "Đồng Hồ Thông Minh (Smartwatch)"));
        categoryMap.put("smartbands", initializeCategory(wearables, "Vòng Đeo Tay Thể Thao (Smartband)"));
        categoryMap.put("wearableAccessories", initializeCategory(wearables, "Dây Đeo & Phụ Kiện Smartwatch"));

        // Group 7: Thiết Bị Nhà Thông Minh & IoT (5.5%)
        ProductCategory smartHome = initializeCategory(null, "Thiết Bị Nhà Thông Minh & IoT", new BigDecimal("5.50"));
        categoryMap.put("smartHome", smartHome);
        categoryMap.put("securityCameras", initializeCategory(smartHome, "Camera An Ninh & Giám Sát"));
        categoryMap.put("robotVacuums", initializeCategory(smartHome, "Robot Hút Bụi & Lau Nhà"));
        categoryMap.put("smartLightingControls", initializeCategory(smartHome, "Khóa Cửa & Đèn Thông Minh"));

        // Group 8: Máy Ảnh & Thiết Bị Quay Phim (5.0%)
        ProductCategory cameras = initializeCategory(null, "Máy Ảnh & Thiết Bị Quay Phim", new BigDecimal("5.00"));
        categoryMap.put("cameras", cameras);
        categoryMap.put("dslrMirrorless", initializeCategory(cameras, "Máy Ảnh Mirrorless & DSLR"));
        categoryMap.put("dronesActionCam", initializeCategory(cameras, "Flycam Drone & Action Cam"));
        categoryMap.put("lensesGimbals", initializeCategory(cameras, "Ống Kính (Lens) & Gimbal Chống Rung"));

        log.info("Categories seeded successfully.");
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
