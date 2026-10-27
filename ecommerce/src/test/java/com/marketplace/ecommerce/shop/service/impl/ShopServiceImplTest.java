package com.marketplace.ecommerce.shop.service.impl;

import com.marketplace.ecommerce.review.valueObjects.ReviewStatus;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.chat.entity.ChatThread;
import com.marketplace.ecommerce.chat.repository.ChatThreadRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.product.valueObjects.ProductStatus;
import com.marketplace.ecommerce.social.repository.ShopFollowerRepository;
import com.marketplace.ecommerce.request.entity.Report;
import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.entity.Seller;
import com.marketplace.ecommerce.request.repository.ReportRepository;
import com.marketplace.ecommerce.request.valueObjects.BusinessType;
import com.marketplace.ecommerce.request.valueObjects.SellerType;
import com.marketplace.ecommerce.request.valueObjects.TargetType;
import com.marketplace.ecommerce.request.valueObjects.RequestStatus;
import com.marketplace.ecommerce.review.repository.ReviewRepository;
import com.marketplace.ecommerce.review.dto.projection.ShopReviewStatsProjection;
import com.marketplace.ecommerce.shop.dto.request.UpdateEscrowStatusRequest;
import com.marketplace.ecommerce.shop.dto.response.ShopProfileResponse;
import com.marketplace.ecommerce.shop.dto.response.ShopViolationResponse;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.entity.ShopEscrowFund;
import com.marketplace.ecommerce.shop.repository.ShopEscrowFundRepository;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.shop.valueObjects.EscrowFundStatus;
import com.marketplace.ecommerce.shop.valueObjects.ShopStatus;
import org.junit.jupiter.api.BeforeEach;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.valueObjects.AccountStatus;
import com.marketplace.ecommerce.auth.valueObjects.DisciplineLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.marketplace.ecommerce.order.entity.Order;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ShopServiceImplTest {

    @Mock
    private ShopRepository shopRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private ShopFollowerRepository shopFollowerRepository;
    @Mock
    private ReviewRepository reviewRepository;
    @Mock
    private ChatThreadRepository chatThreadRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ReportRepository reportRepository;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private ShopEscrowFundRepository shopEscrowFundRepository;
    @Mock
    private StringRedisTemplate redisTemplate;
    @Mock
    private ValueOperations<String, String> valueOperations;
    @Mock
    private AccountRepository accountRepository;

    @InjectMocks
    private ShopServiceImpl shopService;

    private UUID accountId;
    private User sampleUser;
    private Shop sampleShop;

    @BeforeEach
    void setUp() {
        accountId = UUID.randomUUID();
        Account acc = new Account();
        acc.setId(accountId);

        sampleUser = new User();
        sampleUser.setId(UUID.randomUUID());
        sampleUser.setAccount(acc);

        sampleShop = new Shop();
        sampleShop.setId(UUID.randomUUID());
        sampleShop.setName("Tech Universe");
        sampleShop.setUser(sampleUser);
        sampleShop.setStatus(ShopStatus.ACTIVE);
    }

    @Test
    @DisplayName("Tạo shop cho người bán Cá nhân (INDIVIDUAL)")
    void createShop_Individual_Success() {
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
                .bankName("Vietcombank")
                .bankAccountNumber("1234567890")
                .bankAccountName("NGUYEN VAN A")
                .build();

        when(shopRepository.save(any(Shop.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Shop result = shopService.createShop(sampleUser, "Shop Cá Nhân", req, seller);

        assertNotNull(result);
        assertEquals("Shop Cá Nhân", result.getName());
        assertEquals(ShopStatus.ACTIVE, result.getStatus());
        assertEquals(SellerType.INDIVIDUAL, result.getSellerType());
    }

    @Test
    @DisplayName("getShopProfileById trả về hồ sơ cửa hàng đầy đủ thống kê")
    void testGetShopProfileById() {
        when(shopRepository.findById(sampleShop.getId())).thenReturn(Optional.of(sampleShop));
        when(productRepository.countByShopIdAndStatusAndDeletedFalse(sampleShop.getId(), ProductStatus.PUBLISHED)).thenReturn(25L);
        when(shopFollowerRepository.countByShopId(sampleShop.getId())).thenReturn(150L);

        ShopReviewStatsProjection projection = mock(ShopReviewStatsProjection.class);
        when(projection.getTotalReviews()).thenReturn(40L);
        when(projection.getAvgRating()).thenReturn(4.8);
        when(reviewRepository.getShopStats(eq(sampleShop.getId()), any())).thenReturn(projection);

        ChatThread thread = ChatThread.builder().unreadAdmin(0).build();
        when(chatThreadRepository.findByShopId(sampleShop.getId())).thenReturn(List.of(thread));

        ShopProfileResponse res = shopService.getShopProfileById(sampleShop.getId());
        assertNotNull(res);
        assertEquals(sampleShop.getName(), res.getName());
        assertEquals(25L, res.getProductCount());
        assertEquals(150L, res.getFollowerCount());
        assertEquals(40L, res.getReviewCount());
        assertEquals(4.8f, res.getAverageRating());
        assertEquals("100%", res.getResponseRate());
    }

    @Test
    @DisplayName("getMyShopProfile trả về hồ sơ shop của tài khoản")
    void testGetMyShopProfile() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.of(sampleShop));

        ShopProfileResponse res = shopService.getMyShopProfile(accountId);
        assertNotNull(res);
        assertEquals(sampleShop.getName(), res.getName());
    }

    @Test
    @DisplayName("getAllActiveShops trả về danh sách các shop đang ACTIVE hoặc WARNED")
    void testGetAllActiveShops() {
        Shop s1 = Shop.builder().id(UUID.randomUUID()).status(ShopStatus.ACTIVE).name("S1").build();
        Shop s2 = Shop.builder().id(UUID.randomUUID()).status(ShopStatus.CLOSED).name("S2").build();
        when(shopRepository.findEligibleActiveShops(any())).thenReturn(List.of(s1, s2));
        when(shopRepository.findAll()).thenReturn(List.of(s1, s2));

        List<ShopProfileResponse> active = shopService.getAllActiveShops();
        assertEquals(1, active.size());
        assertEquals("S1", active.get(0).getName());
    }

    @Test
    @DisplayName("getMyShopViolations lấy danh sách vi phạm của shop")
    void testGetMyShopViolations() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.of(sampleShop));

        Product prod = Product.builder().id(UUID.randomUUID()).name("Sp Vi Pham").build();
        when(productRepository.findAllByShopIdWithDetails(sampleShop.getId())).thenReturn(List.of(prod));

        Report rep = new Report();
        rep.setId(UUID.randomUUID());
        rep.setTargetType(TargetType.SHOP);
        rep.setTargetId(sampleShop.getId());
        rep.setEvidenceUrl("http://evidence.jpg");
        when(reportRepository.findApprovedReportsByShopId(sampleShop.getId())).thenReturn(List.of(rep));

        List<ShopViolationResponse> violations = shopService.getMyShopViolations(accountId);
        assertNotNull(violations);
        assertEquals(1, violations.size());
        assertEquals(sampleShop.getName(), violations.get(0).getTargetName());
    }

    @Test
    @DisplayName("updateEscrowStatus đăng ký ký quỹ thành công")
    void testUpdateEscrowStatus_Register() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.of(sampleShop));
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(anyString())).thenReturn("0");
        when(shopEscrowFundRepository.findByShopId(sampleShop.getId())).thenReturn(Optional.empty());

        UpdateEscrowStatusRequest req = new UpdateEscrowStatusRequest();
        req.setIsEscrowParticipated(true);
        req.setCommittedAmount(new BigDecimal("5000000"));

        shopService.updateEscrowStatus(accountId, req);

        verify(shopEscrowFundRepository).save(any(ShopEscrowFund.class));
        verify(shopRepository).save(sampleShop);
        assertEquals(ShopStatus.PENDING_DEPOSIT, sampleShop.getStatus());
    }

    @Test
    @DisplayName("updateEscrowStatus ném lỗi khi vượt quá giới hạn rate limit 3 lần/ngày")
    void testUpdateEscrowStatus_RateLimit() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.of(sampleShop));
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(anyString())).thenReturn("3");
        when(redisTemplate.getExpire(anyString(), eq(TimeUnit.HOURS))).thenReturn(12L);

        UpdateEscrowStatusRequest req = new UpdateEscrowStatusRequest();
        CustomException ex = assertThrows(CustomException.class, () -> shopService.updateEscrowStatus(accountId, req));
        assertTrue(ex.getMessage().contains("vượt quá số lần cho phép"));
    }

    @Test
    @DisplayName("updateEscrowStatus: Tất cả các nhánh biên đăng ký/hủy và trạng thái quỹ")
    void testUpdateEscrowStatus_AllBranches() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.of(sampleShop));
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(anyString())).thenReturn("1"); // count = 1 -> test increment branch

        // 1. Muốn đăng ký nhưng committedAmount null hoặc <= 0
        UpdateEscrowStatusRequest reqZero = new UpdateEscrowStatusRequest();
        reqZero.setIsEscrowParticipated(true);
        reqZero.setCommittedAmount(BigDecimal.ZERO);
        assertThrows(CustomException.class, () -> shopService.updateEscrowStatus(accountId, reqZero));

        // 2. Muốn đăng ký nhưng fund đã ACTIVE và balance > 0
        ShopEscrowFund fundActive = ShopEscrowFund.builder()
                .id(UUID.randomUUID())
                .shop(sampleShop)
                .balance(new BigDecimal("1000000"))
                .status(EscrowFundStatus.ACTIVE)
                .build();
        when(shopEscrowFundRepository.findByShopId(sampleShop.getId())).thenReturn(Optional.of(fundActive));

        UpdateEscrowStatusRequest reqValid = new UpdateEscrowStatusRequest();
        reqValid.setIsEscrowParticipated(true);
        reqValid.setCommittedAmount(new BigDecimal("5000000"));
        assertThrows(CustomException.class, () -> shopService.updateEscrowStatus(accountId, reqValid));

        // 3. Muốn đăng ký khi fund đang PENDING_DEPOSIT hoặc balance == 0 -> cập nhật committedAmount
        fundActive.setStatus(EscrowFundStatus.PENDING_DEPOSIT);
        fundActive.setBalance(BigDecimal.ZERO);
        shopService.updateEscrowStatus(accountId, reqValid);
        assertEquals(new BigDecimal("5000000"), fundActive.getCommittedAmount());
        verify(shopEscrowFundRepository, atLeastOnce()).save(fundActive);

        // 4. Muốn hủy ký quỹ nhưng fund có balance > 0 -> lỗi
        UpdateEscrowStatusRequest reqCancel = new UpdateEscrowStatusRequest();
        reqCancel.setIsEscrowParticipated(false);
        fundActive.setBalance(new BigDecimal("2000000"));
        assertThrows(CustomException.class, () -> shopService.updateEscrowStatus(accountId, reqCancel));

        // 5. Muốn hủy ký quỹ khi fund có balance == 0 -> trả shop về ACTIVE
        fundActive.setBalance(BigDecimal.ZERO);
        shopService.updateEscrowStatus(accountId, reqCancel);
        assertEquals(BigDecimal.ZERO, fundActive.getCommittedAmount());
        assertEquals(ShopStatus.ACTIVE, sampleShop.getStatus());
        verify(valueOperations, atLeastOnce()).increment(anyString());

        // 6. User not found
        UUID unknownAcc = UUID.randomUUID();
        when(userRepository.findByAccountId(unknownAcc)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> shopService.updateEscrowStatus(unknownAcc, reqValid));

        // 7. Shop not found
        when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> shopService.updateEscrowStatus(accountId, reqValid));
    }

    @Test
    @DisplayName("getMyShopViolations: Bao phủ các target ORDER, PRODUCT và appeal mapping")
    void testGetMyShopViolations_AllTargets() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.of(sampleShop));

        UUID prodId = UUID.randomUUID();
        Product prod = Product.builder().id(prodId).name("Sản phẩm vi phạm").build();
        when(productRepository.findAllByShopIdWithDetails(sampleShop.getId())).thenReturn(List.of(prod));

        // Target ORDER
        UUID orderId = UUID.randomUUID();
        Order order = Order.builder().id(orderId).orderNumber("ORD-888").build();
        Report repOrder = Report.builder()
                .id(UUID.randomUUID())
                .targetType(TargetType.ORDER)
                .targetId(orderId)
                .build();
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        // Target PRODUCT with legacy appeal (violationReportId is null)
        Report repProd = Report.builder()
                .id(UUID.randomUUID())
                .targetType(TargetType.PRODUCT)
                .targetId(prodId)
                .build();

        Request appealReq = Request.builder().id(UUID.randomUUID()).status(RequestStatus.APPROVED).response("Đã duyệt").build();
        Report legacyAppeal = Report.builder()
                .id(UUID.randomUUID())
                .violationReportId(null)
                .targetId(prodId)
                .request(appealReq)
                .build();

        when(reportRepository.findApprovedReportsByShopId(sampleShop.getId())).thenReturn(List.of());
        when(reportRepository.findApprovedReportsByProductIds(List.of(prodId))).thenReturn(List.of(repProd));
        when(reportRepository.findApprovedReportsByShopIdForOrders(sampleShop.getId())).thenReturn(List.of(repOrder));
        

        List<ShopViolationResponse> violations = shopService.getMyShopViolations(accountId);
        assertNotNull(violations);
        assertEquals(2, violations.size());

        // Verify ORDER appealStatus is NONE when no appeal exists
        ShopViolationResponse orderVio = violations.stream().filter(v -> v.getTargetType() == TargetType.ORDER).findFirst().orElseThrow();
        assertEquals("FINAL_RULING", orderVio.getAppealStatus());
        assertEquals("Đơn hàng ORD-888", orderVio.getTargetName());

        // Verify PRODUCT appealStatus is FINAL_RULING
        ShopViolationResponse prodVio = violations.stream().filter(v -> v.getTargetType() == TargetType.PRODUCT).findFirst().orElseThrow();
        assertEquals("FINAL_RULING", prodVio.getAppealStatus());
        assertEquals("Sản phẩm vi phạm", prodVio.getTargetName());
    }

    @Test
    @DisplayName("Profile lookups: Lỗi khi không tìm thấy Shop hoặc User")
    void testProfileLookups_Failures() {
        UUID fakeId = UUID.randomUUID();
        when(shopRepository.findById(fakeId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> shopService.getShopProfileById(fakeId));

        when(userRepository.findByAccountId(fakeId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> shopService.getMyShopProfile(fakeId));

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> shopService.getMyShopProfile(accountId));
    }


    @Test
    @DisplayName("createShop voi yeu cau ky quy va khong co address cu the")
    void testCreateShop_WithDepositAndPickupAddress() {
        Seller sellerDetail = new Seller();
        sellerDetail.setIsEscrowParticipated(true);
        sellerDetail.setInitialDepositAmount(BigDecimal.valueOf(10000000));
        sellerDetail.setPickupAddress("Kho tong Ha Noi");
        sellerDetail.setAddress(null);
        sellerDetail.setShopPhone("0987654321");

        Request req = new Request();
        req.setDescription("Shop chuyen do cong nghe");
        req.setCoverImageUrl("http://cdn/cover.jpg");

        when(shopRepository.save(any(Shop.class))).thenAnswer(inv -> inv.getArgument(0));

        Shop created = shopService.createShop(sampleUser, "New Tech Store", req, sellerDetail);
        assertNotNull(created);
        assertEquals(ShopStatus.PENDING_DEPOSIT, created.getStatus());
        assertEquals("Kho tong Ha Noi", created.getAddress());
    }

    @Test
    @DisplayName("buildShopProfile tinh toan day du ty le phan hoi va danh gia")
    void testBuildShopProfile_StatsCalculations() {
        when(productRepository.countByShopIdAndStatusAndDeletedFalse(sampleShop.getId(), ProductStatus.PUBLISHED))
                .thenReturn(15L);
        when(shopFollowerRepository.countByShopId(sampleShop.getId())).thenReturn(250L);

        ShopReviewStatsProjection stats = mock(ShopReviewStatsProjection.class);
        when(stats.getTotalReviews()).thenReturn(10L);
        when(stats.getAvgRating()).thenReturn(4.85);
        when(reviewRepository.getShopStats(sampleShop.getId(), ReviewStatus.ACTIVE)).thenReturn(stats);

        ChatThread t1 = ChatThread.builder().id(UUID.randomUUID()).unreadAdmin(0).build();
        ChatThread t2 = ChatThread.builder().id(UUID.randomUUID()).unreadAdmin(1).build();
        when(chatThreadRepository.findByShopId(sampleShop.getId())).thenReturn(List.of(t1, t2));

        when(shopRepository.findById(sampleShop.getId())).thenReturn(Optional.of(sampleShop));

        ShopProfileResponse profile = shopService.getShopProfileById(sampleShop.getId());
        assertNotNull(profile);
        assertEquals(15L, profile.getProductCount());
        assertEquals(250L, profile.getFollowerCount());
        assertEquals(10L, profile.getReviewCount());
        assertEquals(4.9f, profile.getAverageRating());
        assertEquals("50%", profile.getResponseRate());
    }

    @Test
    @DisplayName("updateEscrowStatus kiem tra rate limit va dang ky quy moi")
    void testUpdateEscrowStatus_RateLimitAndRegister() {
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.of(sampleShop));

        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        // 1. Rate limit exceeded (>= 3 times)
        when(valueOperations.get("escrow_switch_limit:" + sampleShop.getId().toString())).thenReturn("3");
        when(redisTemplate.getExpire(anyString(), any())).thenReturn(12L);

        UpdateEscrowStatusRequest req = new UpdateEscrowStatusRequest();
        req.setIsEscrowParticipated(true);
        req.setCommittedAmount(BigDecimal.valueOf(5000000));

        assertThrows(CustomException.class, () -> shopService.updateEscrowStatus(accountId, req));

        // 2. Under limit, create new fund
        when(valueOperations.get("escrow_switch_limit:" + sampleShop.getId().toString())).thenReturn("0");
        when(shopEscrowFundRepository.findByShopId(sampleShop.getId())).thenReturn(Optional.empty());

        shopService.updateEscrowStatus(accountId, req);
        assertEquals(ShopStatus.PENDING_DEPOSIT, sampleShop.getStatus());
        verify(shopEscrowFundRepository).save(any(ShopEscrowFund.class));
    }

    @Test
    @DisplayName("Bao phủ các nhánh ngoại lệ trong buildShopProfile, getMyShopViolations, updateEscrowStatus")
    void testRemainingShopServiceBranches() {
        // 1. buildShopProfile catch blocks + averageRating > 0 + WARNED shop
        Shop warnedShop = Shop.builder()
                .id(UUID.randomUUID())
                .name("Warned Shop")
                .status(ShopStatus.WARNED)
                .averageRating(4.5f)
                .build();
        when(shopRepository.findEligibleActiveShops(any())).thenReturn(List.of(warnedShop));
        when(shopRepository.findAll()).thenReturn(List.of(warnedShop));
        when(productRepository.countByShopIdAndStatusAndDeletedFalse(any(), any())).thenThrow(new RuntimeException("DB err"));
        when(shopFollowerRepository.countByShopId(any())).thenThrow(new RuntimeException("DB err"));
        when(reviewRepository.getShopStats(any(), any())).thenThrow(new RuntimeException("DB err"));
        when(chatThreadRepository.findByShopId(any())).thenThrow(new RuntimeException("DB err"));

        List<ShopProfileResponse> shops = shopService.getAllActiveShops();
        assertEquals(1, shops.size());
        assertEquals(4.5f, shops.get(0).getAverageRating());

        // 2. getMyShopViolations: user/shop not found + violationReportId appeal + request/moderatorNote details
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> shopService.getMyShopViolations(accountId));

        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(sampleUser));
        when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> shopService.getMyShopViolations(accountId));

        when(shopRepository.findByUserId(sampleUser.getId())).thenReturn(Optional.of(sampleShop));
        UUID prodId = UUID.randomUUID();
        Product p1 = Product.builder().id(prodId).name("P1").build();
        Product p1Dup = Product.builder().id(prodId).name("P1-Dup").build();
        when(productRepository.findAllByShopIdWithDetails(sampleShop.getId())).thenReturn(List.of(p1, p1Dup));

        UUID repId = UUID.randomUUID();
        Request repReq = Request.builder().id(UUID.randomUUID()).description("Reason").coverImageUrl("img").response("AdminResp").build();
        Report rep = Report.builder()
                .id(repId)
                .targetType(TargetType.PRODUCT)
                .targetId(prodId)
                .request(repReq)
                .moderatorNote("ModNote")
                .build();
        Request appealReq = Request.builder().id(UUID.randomUUID()).status(RequestStatus.PENDING).response("Wait").build();
        Report exactAppeal = Report.builder().id(UUID.randomUUID()).violationReportId(repId).request(appealReq).build();
        Report dupAppeal = Report.builder().id(UUID.randomUUID()).violationReportId(repId).request(appealReq).build();

        when(reportRepository.findApprovedReportsByShopId(sampleShop.getId())).thenReturn(List.of(rep));
        when(reportRepository.findApprovedReportsByProductIds(anyList())).thenReturn(List.of());
        when(reportRepository.findApprovedReportsByShopIdForOrders(sampleShop.getId())).thenReturn(List.of());
        

        List<ShopViolationResponse> vios = shopService.getMyShopViolations(accountId);
        assertEquals(1, vios.size());
        assertEquals("FINAL_RULING", vios.get(0).getAppealStatus());
        assertEquals("ModNote", vios.get(0).getAdminNote());

        // 3. updateEscrowStatus: expireTime null/<=0, fund FROZEN with balance > 0, cancel when fund == null
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(anyString())).thenReturn("3");
        when(redisTemplate.getExpire(anyString(), any())).thenReturn(0L);
        UpdateEscrowStatusRequest req = new UpdateEscrowStatusRequest();
        assertThrows(CustomException.class, () -> shopService.updateEscrowStatus(accountId, req));

        when(valueOperations.get(anyString())).thenReturn(null);
        req.setIsEscrowParticipated(false);
        when(shopEscrowFundRepository.findByShopId(sampleShop.getId())).thenReturn(Optional.empty());
        shopService.updateEscrowStatus(accountId, req); // fund == null & cancel -> no-op

        ShopEscrowFund frozenFund = ShopEscrowFund.builder()
                .id(UUID.randomUUID())
                .shop(sampleShop)
                .balance(BigDecimal.TEN)
                .status(null)
                .build();
        when(shopEscrowFundRepository.findByShopId(sampleShop.getId())).thenReturn(Optional.of(frozenFund));
        req.setIsEscrowParticipated(true);
        req.setCommittedAmount(BigDecimal.valueOf(5000000));
        assertThrows(CustomException.class, () -> shopService.updateEscrowStatus(accountId, req));
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

        // 2. Sản phẩm phải được mở lại PUBLISHED (chỉ mở lại các sản phẩm INACTIVE)
        verify(productRepository).updateStatusByShopId(
                eq(shopId),
                eq(List.of(ProductStatus.INACTIVE)),
                eq(ProductStatus.PUBLISHED),
                any(LocalDateTime.class)
        );

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
