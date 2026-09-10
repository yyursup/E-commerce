package com.marketplace.ecommerce.shop.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.entity.Seller;
import com.marketplace.ecommerce.request.valueObjects.BusinessType;
import com.marketplace.ecommerce.request.valueObjects.SellerType;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.shop.valueObjects.ShopStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ShopServiceImplTest {

    @Mock
    private ShopRepository shopRepository;

    @InjectMocks
    private ShopServiceImpl shopService;

    @Test
    @DisplayName("Tạo shop cho người bán Cá nhân (INDIVIDUAL)")
    void createShop_Individual_Success() {
        User user = new User();
        user.setId(UUID.randomUUID());

        Request req = Request.builder()
                .description("Shop Cá Nhân")
                .coverImageUrl("https://example.com/cover.jpg")
                .build();

        Seller seller = Seller.builder()
                .sellerType(SellerType.INDIVIDUAL)
                .shopName("Shop Cá Nhân")
                .shopPhone("0912345678")
                .shopEmail("individual@shop.com")
                .pickupAddress("Kho Lấy Hàng")
                .returnAddress("Kho Trả Hàng")
                .taxCode("0123456789")
                .invoiceEmail("invoice@individual.com")
                .bankName("Vietcombank")
                .bankAccountNumber("1234567890")
                .bankAccountName("NGUYEN VAN A")
                .build();

        when(shopRepository.save(any(Shop.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Shop result = shopService.createShop(user, "Shop Cá Nhân", req, seller);

        assertNotNull(result);
        assertEquals("Shop Cá Nhân", result.getName());
        assertEquals(ShopStatus.ACTIVE, result.getStatus());
        assertEquals(SellerType.INDIVIDUAL, result.getSellerType());
        assertEquals("0123456789", result.getTaxCode());
        assertEquals("Vietcombank", result.getBankName());
        assertEquals("1234567890", result.getBankAccountNumber());
        assertEquals("NGUYEN VAN A", result.getBankAccountName());

        ArgumentCaptor<Shop> captor = ArgumentCaptor.forClass(Shop.class);
        verify(shopRepository).save(captor.capture());
        assertEquals("Kho Lấy Hàng", captor.getValue().getPickupAddress());
        assertEquals("Kho Trả Hàng", captor.getValue().getReturnAddress());
    }

    @Test
    @DisplayName("Tạo shop cho người bán Doanh nghiệp (BUSINESS)")
    void createShop_Business_Success() {
        User user = new User();
        user.setId(UUID.randomUUID());

        Request req = Request.builder()
                .description("Shop Doanh Nghiệp")
                .coverImageUrl("https://example.com/cover.jpg")
                .build();

        Seller seller = Seller.builder()
                .sellerType(SellerType.BUSINESS)
                .businessType(BusinessType.ENTERPRISE)
                .businessName("Công Ty TNHH XYZ")
                .businessAddress("Số 1 Đại Cồ Việt, Hà Nội")
                .businessLicenseUrl("https://example.com/gpkd.pdf")
                .shopName("Shop Doanh Nghiệp")
                .shopPhone("0987654321")
                .shopEmail("business@shop.com")
                .pickupAddress("Kho Tổng Hà Nội")
                .returnAddress("Kho Tổng Hà Nội")
                .taxCode("0109998887")
                .bankName("Techcombank")
                .bankAccountNumber("9876543210")
                .bankAccountName("CONG TY TNHH XYZ")
                .build();

        when(shopRepository.save(any(Shop.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Shop result = shopService.createShop(user, "Shop Doanh Nghiệp", req, seller);

        assertNotNull(result);
        assertEquals("Shop Doanh Nghiệp", result.getName());
        assertEquals(ShopStatus.ACTIVE, result.getStatus());
        assertEquals(SellerType.BUSINESS, result.getSellerType());
        assertEquals(BusinessType.ENTERPRISE, result.getBusinessType());
        assertEquals("Công Ty TNHH XYZ", result.getBusinessName());
        assertEquals("https://example.com/gpkd.pdf", result.getBusinessLicenseUrl());
        assertEquals("0109998887", result.getTaxCode());
        assertEquals("Techcombank", result.getBankName());

        verify(shopRepository).save(any(Shop.class));
    }
}
