package com.marketplace.ecommerce.config.seed;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import java.io.InputStream;
import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Product Seeder Real Data Integrity Tests")
class ProductSeederRealDataTest {

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    @DisplayName("Verify seed_iphone.json has 20 authentic iPhone products with valid prices and images")
    void testIphoneJsonIntegrity() throws Exception {
        ClassPathResource resource = new ClassPathResource("seed/data/seed_iphone.json");
        assertTrue(resource.exists(), "seed_iphone.json must exist in classpath");

        try (InputStream is = resource.getInputStream()) {
            List<ProductSeeder.SeedProductJsonDto> list = mapper.readValue(
                    is,
                    new TypeReference<List<ProductSeeder.SeedProductJsonDto>>() {}
            );
            assertEquals(20, list.size(), "Should have exactly 20 iPhone products");

            for (ProductSeeder.SeedProductJsonDto p : list) {
                assertNotNull(p.getName(), "Product name must not be null");
                assertNotNull(p.getSku(), "SKU must not be null");
                assertEquals("Điện Thoại Thông Minh", p.getCategory());
                assertEquals("Apple Authorised Reseller", p.getShop());
                assertTrue(p.getPrice().compareTo(BigDecimal.valueOf(10000000L)) > 0, "iPhone price should be > 10M VND");
                assertFalse(p.getImages().isEmpty(), "Product should have at least one image");
                assertNotNull(p.getDescription(), "Description must not be null");
            }
        }
    }

    @Test
    @DisplayName("Verify seed_apple_watch.json has 20 authentic Apple Watch products")
    void testAppleWatchJsonIntegrity() throws Exception {
        ClassPathResource resource = new ClassPathResource("seed/data/seed_apple_watch.json");
        assertTrue(resource.exists(), "seed_apple_watch.json must exist in classpath");

        try (InputStream is = resource.getInputStream()) {
            List<ProductSeeder.SeedProductJsonDto> list = mapper.readValue(
                    is,
                    new TypeReference<List<ProductSeeder.SeedProductJsonDto>>() {}
            );
            assertEquals(20, list.size(), "Should have exactly 20 Apple Watch products");

            for (ProductSeeder.SeedProductJsonDto p : list) {
                assertNotNull(p.getName());
                assertNotNull(p.getSku());
                assertEquals("Đồng Hồ Thông Minh (Smartwatch)", p.getCategory());
                assertEquals("Apple Authorised Reseller", p.getShop());
                assertTrue(p.getPrice().compareTo(BigDecimal.valueOf(5000000L)) > 0, "Apple Watch price should be > 5M VND");
                assertFalse(p.getImages().isEmpty());
            }
        }
    }

    @Test
    @DisplayName("Verify seed_airpods_accessories.json has 20 authentic AirPods & Accessories")
    void testAirpodsAccessoriesJsonIntegrity() throws Exception {
        ClassPathResource resource = new ClassPathResource("seed/data/seed_airpods_accessories.json");
        assertTrue(resource.exists(), "seed_airpods_accessories.json must exist in classpath");

        try (InputStream is = resource.getInputStream()) {
            List<ProductSeeder.SeedProductJsonDto> list = mapper.readValue(
                    is,
                    new TypeReference<List<ProductSeeder.SeedProductJsonDto>>() {}
            );
            assertEquals(20, list.size(), "Should have exactly 20 AirPods & Accessories products");

            for (ProductSeeder.SeedProductJsonDto p : list) {
                assertNotNull(p.getName());
                assertNotNull(p.getSku());
                assertTrue(p.getPrice().compareTo(BigDecimal.valueOf(100000L)) > 0);
                assertFalse(p.getImages().isEmpty());
                assertTrue(p.getShop().equals("Apple Authorised Reseller") || p.getShop().equals("Anker & Baseus Flagship Store"));
            }
        }
    }
}

