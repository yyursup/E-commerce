package com.marketplace.ecommerce.shop.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.entity.Seller;
import com.marketplace.ecommerce.request.valueObjects.BusinessType;
import com.marketplace.ecommerce.request.valueObjects.SellerType;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.shop.valueObjects.ShopStatus;
import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.valueObjects.AccountStatus;
import com.marketplace.ecommerce.auth.valueObjects.DisciplineLevel;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.product.valueObjects.ProductStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ShopServiceImplTest {

    @Mock
    private ShopRepository shopRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private AccountRepository accountRepository;

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

    @Test
    @DisplayName("Tự động khôi phục Shop hết hạn 14 ngày đình chỉ sang WARNED và mở lại sản phẩm")
    void processExpiredSuspensions_Success() {
        UUID shopId = UUID.randomUUID();
        Account owner = Account.builder()
                .status(AccountStatus.SUSPENDED)
                .disciplineLevel(DisciplineLevel.SUSPENDED)
                .suspendedUntil(LocalDateTime.now().minusHours(1)) // User suspension cũng đã hết hạn
                .violationCount(5)
                .build();

        User user = new User();
        user.setAccount(owner);

        Shop suspendedShop = Shop.builder()
                .id(shopId)
                .name("Shop Đang Bị Đình Chỉ")
                .status(ShopStatus.SUSPENDED)
                .suspendedUntil(LocalDateTime.now().minusHours(1)) // Đã quá hạn 14 ngày
                .violationCount(5)
                .user(user)
                .build();

        when(shopRepository.findExpiredSuspensions(eq(ShopStatus.SUSPENDED), any(LocalDateTime.class)))
                .thenReturn(List.of(suspendedShop));
        when(shopRepository.findByIdForUpdate(shopId))
                .thenReturn(Optional.of(suspendedShop));

        shopService.processExpiredSuspensions();

        // 1. Shop phải chuyển sang WARNED và xóa suspendedUntil
        assertEquals(ShopStatus.WARNED, suspendedShop.getStatus());
        assertNull(suspendedShop.getSuspendedUntil());
        assertEquals(5, suspendedShop.getViolationCount()); // Số gậy vẫn được bảo lưu!

        // 2. Sản phẩm phải được mở lại PUBLISHED
        verify(productRepository).updateStatusByShopId(shopId, ProductStatus.PUBLISHED);

        // 3. Tài khoản chủ shop phải chuyển sang WARNED / ACTIVE
        assertEquals(DisciplineLevel.WARNED, owner.getDisciplineLevel());
        assertEquals(AccountStatus.ACTIVE, owner.getStatus());
        assertNull(owner.getSuspendedUntil());
        verify(accountRepository).save(owner);
        verify(shopRepository).save(suspendedShop);
    }

    @Test
    @DisplayName("Hết hạn đình chỉ Shop: Nếu chủ shop đang có án kỷ luật User riêng còn hiệu lực thì KHÔNG được xóa án User")
    void processExpiredSuspensions_PreservesActiveUserSuspension() {
        UUID shopId = UUID.randomUUID();
        LocalDateTime userSuspensionExpiry = LocalDateTime.now().plusDays(10); // User suspension còn 10 ngày
        Account owner = Account.builder()
                .status(AccountStatus.SUSPENDED)
                .disciplineLevel(DisciplineLevel.SUSPENDED)
                .suspendedUntil(userSuspensionExpiry)
                .violationCount(5)
                .build();

        User user = new User();
        user.setAccount(owner);

        Shop suspendedShop = Shop.builder()
                .id(shopId)
                .name("Shop Đang Bị Đình Chỉ")
                .status(ShopStatus.SUSPENDED)
                .suspendedUntil(LocalDateTime.now().minusHours(1)) // Shop đã hết hạn 14 ngày
                .violationCount(5)
                .user(user)
                .build();

        when(shopRepository.findExpiredSuspensions(eq(ShopStatus.SUSPENDED), any(LocalDateTime.class)))
                .thenReturn(List.of(suspendedShop));
        when(shopRepository.findByIdForUpdate(shopId))
                .thenReturn(Optional.of(suspendedShop));

        shopService.processExpiredSuspensions();

        // 1. Shop vẫn được mở lại bình thường
        assertEquals(ShopStatus.WARNED, suspendedShop.getStatus());
        assertNull(suspendedShop.getSuspendedUntil());
        verify(shopRepository).save(suspendedShop);

        // 2. NHƯNG tài khoản chủ shop PHẢI GIỮ NGUYÊN án kỷ luật User (SUSPENDED), không được save cập nhật
        assertEquals(DisciplineLevel.SUSPENDED, owner.getDisciplineLevel(), "DisciplineLevel của User phải giữ nguyên SUSPENDED");
        assertEquals(AccountStatus.SUSPENDED, owner.getStatus(), "Status của User phải giữ nguyên SUSPENDED");
        assertEquals(userSuspensionExpiry, owner.getSuspendedUntil(), "suspendedUntil của User phải giữ nguyên");
        verify(accountRepository, never()).save(owner);
    }

    @Test
    @DisplayName("Hết hạn đình chỉ Shop: Nếu chủ shop SUSPENDED với suspendedUntil == null (legacy) thì KHÔNG được tự ý gỡ")
    void processExpiredSuspensions_LegacyNullSuspendedUntil_PreservesSuspension() {
        UUID shopId = UUID.randomUUID();
        Account owner = Account.builder()
                .status(AccountStatus.SUSPENDED)
                .disciplineLevel(DisciplineLevel.SUSPENDED)
                .suspendedUntil(null) // Legacy null
                .violationCount(5)
                .build();

        User user = new User();
        user.setAccount(owner);

        Shop suspendedShop = Shop.builder()
                .id(shopId)
                .name("Shop Đang Bị Đình Chỉ")
                .status(ShopStatus.SUSPENDED)
                .suspendedUntil(LocalDateTime.now().minusHours(1))
                .user(user)
                .build();

        when(shopRepository.findExpiredSuspensions(eq(ShopStatus.SUSPENDED), any(LocalDateTime.class)))
                .thenReturn(List.of(suspendedShop));
        when(shopRepository.findByIdForUpdate(shopId))
                .thenReturn(Optional.of(suspendedShop));

        shopService.processExpiredSuspensions();

        assertEquals(ShopStatus.WARNED, suspendedShop.getStatus());
        assertEquals(AccountStatus.SUSPENDED, owner.getStatus(), "Owner có suspendedUntil=null không được tự ý mở khóa");
        verify(accountRepository, never()).save(owner);
    }

    @Test
    @DisplayName("Hết hạn đình chỉ Shop: Nếu chủ shop BANNED hoặc INACTIVE thì KHÔNG bao giờ bị kích hoạt lại")
    void processExpiredSuspensions_BannedOrInactiveOwner_NeverReactivated() {
        UUID shopId = UUID.randomUUID();
        Account owner = Account.builder()
                .status(AccountStatus.BANNED)
                .disciplineLevel(DisciplineLevel.BANNED)
                .suspendedUntil(LocalDateTime.now().minusDays(10))
                .isActive(false)
                .build();

        User user = new User();
        user.setAccount(owner);

        Shop suspendedShop = Shop.builder()
                .id(shopId)
                .name("Shop Đang Bị Đình Chỉ")
                .status(ShopStatus.SUSPENDED)
                .suspendedUntil(LocalDateTime.now().minusHours(1))
                .user(user)
                .build();

        when(shopRepository.findExpiredSuspensions(eq(ShopStatus.SUSPENDED), any(LocalDateTime.class)))
                .thenReturn(List.of(suspendedShop));
        when(shopRepository.findByIdForUpdate(shopId))
                .thenReturn(Optional.of(suspendedShop));

        shopService.processExpiredSuspensions();

        assertEquals(ShopStatus.WARNED, suspendedShop.getStatus());
        assertEquals(AccountStatus.BANNED, owner.getStatus(), "Owner BANNED không bao giờ được chuyển sang ACTIVE");
        verify(accountRepository, never()).save(owner);
    }
}
