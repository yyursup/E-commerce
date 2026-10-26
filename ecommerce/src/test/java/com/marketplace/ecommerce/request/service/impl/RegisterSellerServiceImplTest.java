package com.marketplace.ecommerce.request.service.impl;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.request.dto.request.CreateSendRequest;
import com.marketplace.ecommerce.request.dto.request.RegisterSellerRequest;
import com.marketplace.ecommerce.request.dto.response.CreateRequestResponse;
import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.entity.Seller;
import com.marketplace.ecommerce.request.repository.RequestRepository;
import com.marketplace.ecommerce.request.repository.SellerRepository;
import com.marketplace.ecommerce.request.service.RequestService;
import com.marketplace.ecommerce.request.valueObjects.BusinessType;
import com.marketplace.ecommerce.request.valueObjects.RequestStatus;
import com.marketplace.ecommerce.request.valueObjects.RequestType;
import com.marketplace.ecommerce.request.valueObjects.SellerType;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RegisterSellerServiceImplTest {

    @Mock
    private SellerRepository sellerRepository;

    @Mock
    private RequestService requestService;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RequestRepository requestRepository;

    @Mock
    private ShopRepository shopRepository;

    @InjectMocks
    private RegisterSellerServiceImpl registerSellerService;

    private UUID accountId;
    private Account verifiedAccount;
    private User mockUser;
    private Request mockRequest;

    @BeforeEach
    void setUp() {
        accountId = UUID.randomUUID();
        verifiedAccount = Account.builder()
                .id(accountId)
                .username("seller_user")
                .email("seller@example.com")
                .accountVerified(true)
                .isActive(true)
                .build();

        mockUser = User.builder()
                .id(UUID.randomUUID())
                .account(verifiedAccount)
                .fullName("Nguyen Van A")
                .phoneNumber("0912345678")
                .build();

        mockRequest = Request.builder()
                .id(UUID.randomUUID())
                .account(verifiedAccount)
                .type(RequestType.SELLER_REGISTRATION)
                .status(RequestStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Đăng ký người bán cá nhân thành công với đầy đủ thông tin")
    void createSellerRegistration_Individual_Success() {
        // Given
        RegisterSellerRequest request = RegisterSellerRequest.builder()
                .sellerType(SellerType.INDIVIDUAL)
                .shopName("Shop Cá Nhân ABC")
                .shopPhone("0912345678")
                .shopEmail("shop@individual.com")
                .pickupAddress("123 Đường Lấy Hàng, Q1, TP.HCM")
                .returnAddress("123 Đường Trả Hàng, Q1, TP.HCM")
                .taxCode("0123456789")
                .invoiceEmail("invoice@individual.com")
                .bankName("Vietcombank")
                .bankAccountNumber("1234567890")
                .bankAccountName("NGUYEN VAN A")
                .description("Shop chuyên bán đồ gia dụng")
                .coverImageUrl("https://example.com/cover.jpg")
                .build();

        when(accountRepository.findById(accountId)).thenReturn(Optional.of(verifiedAccount));
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(mockUser));
        when(shopRepository.existsByUserId(mockUser.getId())).thenReturn(false);
        when(requestRepository.existsByAccountIdAndTypeAndStatus(accountId, RequestType.SELLER_REGISTRATION, RequestStatus.PENDING)).thenReturn(false);
        when(requestService.createRequest(eq(verifiedAccount), any(CreateSendRequest.class))).thenReturn(mockRequest);

        // When
        CreateRequestResponse response = registerSellerService.createSellerRegistration(accountId, request);

        // Then
        assertNotNull(response);
        assertEquals(mockRequest.getId(), response.getRequestId());

        ArgumentCaptor<Seller> sellerCaptor = ArgumentCaptor.forClass(Seller.class);
        verify(sellerRepository).save(sellerCaptor.capture());

        Seller savedSeller = sellerCaptor.getValue();
        assertEquals(SellerType.INDIVIDUAL, savedSeller.getSellerType());
        assertEquals("Shop Cá Nhân ABC", savedSeller.getShopName());
        assertEquals("0912345678", savedSeller.getShopPhone());
        assertEquals("123 Đường Lấy Hàng, Q1, TP.HCM", savedSeller.getPickupAddress());
        assertEquals("123 Đường Trả Hàng, Q1, TP.HCM", savedSeller.getReturnAddress());
        assertEquals("0123456789", savedSeller.getTaxCode());
        assertEquals("Vietcombank", savedSeller.getBankName());
        assertEquals("1234567890", savedSeller.getBankAccountNumber());
        assertEquals("NGUYEN VAN A", savedSeller.getBankAccountName());
    }

    @Test
    @DisplayName("Đăng ký người bán Hộ kinh doanh/Doanh nghiệp thành công")
    void createSellerRegistration_Business_Success() {
        // Given
        RegisterSellerRequest request = RegisterSellerRequest.builder()
                .sellerType(SellerType.BUSINESS)
                .businessType(BusinessType.ENTERPRISE)
                .businessName("Công Ty TNHH Thương Mại Toàn Cầu")
                .businessAddress("Tòa nhà Landmark 81, Bình Thạnh, TP.HCM")
                .taxCode("0312345678")
                .businessLicenseUrl("https://example.com/gpkd.png")
                .shopName("Toàn Cầu Official Store")
                .shopPhone("0987654321")
                .shopEmail("contact@toancau.vn")
                .pickupAddress("Kho tổng: KCN Sóng Thần, Bình Dương")
                .returnAddress("Kho tổng: KCN Sóng Thần, Bình Dương")
                .bankName("Techcombank")
                .bankAccountNumber("9876543210")
                .bankAccountName("CONG TY TNHH TM TOAN CAU")
                .build();

        when(accountRepository.findById(accountId)).thenReturn(Optional.of(verifiedAccount));
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(mockUser));
        when(shopRepository.existsByUserId(mockUser.getId())).thenReturn(false);
        when(requestRepository.existsByAccountIdAndTypeAndStatus(accountId, RequestType.SELLER_REGISTRATION, RequestStatus.PENDING)).thenReturn(false);
        when(requestService.createRequest(eq(verifiedAccount), any(CreateSendRequest.class))).thenReturn(mockRequest);

        // When
        CreateRequestResponse response = registerSellerService.createSellerRegistration(accountId, request);

        // Then
        assertNotNull(response);
        ArgumentCaptor<Seller> sellerCaptor = ArgumentCaptor.forClass(Seller.class);
        verify(sellerRepository).save(sellerCaptor.capture());

        Seller savedSeller = sellerCaptor.getValue();
        assertEquals(SellerType.BUSINESS, savedSeller.getSellerType());
        assertEquals(BusinessType.ENTERPRISE, savedSeller.getBusinessType());
        assertEquals("Công Ty TNHH Thương Mại Toàn Cầu", savedSeller.getBusinessName());
        assertEquals("https://example.com/gpkd.png", savedSeller.getBusinessLicenseUrl());
    }

    @Test
    @DisplayName("Báo lỗi khi tài khoản chưa được xác thực (accountVerified = false)")
    void createSellerRegistration_UnverifiedAccount_ThrowsException() {
        // Given
        Account unverifiedAccount = Account.builder()
                .id(accountId)
                .accountVerified(false)
                .build();

        RegisterSellerRequest request = RegisterSellerRequest.builder()
                .sellerType(SellerType.INDIVIDUAL)
                .shopName("Shop")
                .shopPhone("0912345678")
                .pickupAddress("Địa chỉ lấy")
                .returnAddress("Địa chỉ trả")
                .taxCode("123")
                .bankName("VCB")
                .bankAccountNumber("123")
                .bankAccountName("A")
                .build();

        when(accountRepository.findById(accountId)).thenReturn(Optional.of(unverifiedAccount));

        // When & Then
        CustomException exception = assertThrows(CustomException.class, () ->
                registerSellerService.createSellerRegistration(accountId, request)
        );
        assertTrue(exception.getMessage().contains("KYC"));
        verify(sellerRepository, never()).save(any());
    }

    @Test
    @DisplayName("Báo lỗi khi Doanh nghiệp thiếu ảnh Giấy phép kinh doanh")
    void createSellerRegistration_BusinessMissingLicense_ThrowsException() {
        // Given
        RegisterSellerRequest request = RegisterSellerRequest.builder()
                .sellerType(SellerType.BUSINESS)
                .businessType(BusinessType.ENTERPRISE)
                .businessName("Công Ty ABC")
                .businessAddress("Trụ sở ABC")
                .taxCode("0312345678")
                .businessLicenseUrl("") // Thiếu link ảnh GPKD
                .shopName("Shop ABC")
                .shopPhone("0912345678")
                .pickupAddress("Địa chỉ lấy")
                .returnAddress("Địa chỉ trả")
                .bankName("VCB")
                .bankAccountNumber("123")
                .bankAccountName("CONG TY ABC")
                .build();

        when(accountRepository.findById(accountId)).thenReturn(Optional.of(verifiedAccount));
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(mockUser));
        when(shopRepository.existsByUserId(mockUser.getId())).thenReturn(false);
        when(requestRepository.existsByAccountIdAndTypeAndStatus(accountId, RequestType.SELLER_REGISTRATION, RequestStatus.PENDING)).thenReturn(false);

        // When & Then
        CustomException exception = assertThrows(CustomException.class, () ->
                registerSellerService.createSellerRegistration(accountId, request)
        );
        assertTrue(exception.getMessage().contains("Giấy phép kinh doanh"));
        verify(sellerRepository, never()).save(any());
    }

    @Test
    @DisplayName("Báo lỗi khi thiếu thông tin ngân hàng")
    void createSellerRegistration_MissingBank_ThrowsException() {
        // Given
        RegisterSellerRequest request = RegisterSellerRequest.builder()
                .sellerType(SellerType.INDIVIDUAL)
                .shopName("Shop ABC")
                .shopPhone("0912345678")
                .pickupAddress("Địa chỉ lấy")
                .returnAddress("Địa chỉ trả")
                .taxCode("0123456789")
                .bankName("") // Thiếu ngân hàng
                .bankAccountNumber("123")
                .bankAccountName("NGUYEN VAN A")
                .build();

        when(accountRepository.findById(accountId)).thenReturn(Optional.of(verifiedAccount));
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(mockUser));
        when(shopRepository.existsByUserId(mockUser.getId())).thenReturn(false);
        when(requestRepository.existsByAccountIdAndTypeAndStatus(accountId, RequestType.SELLER_REGISTRATION, RequestStatus.PENDING)).thenReturn(false);

        // When & Then
        CustomException exception = assertThrows(CustomException.class, () ->
                registerSellerService.createSellerRegistration(accountId, request)
        );
        assertTrue(exception.getMessage().contains("ngân hàng"));
    }

    @Test
    @DisplayName("Báo lỗi khi tài khoản hoặc user không tìm thấy, hoặc đã có Shop, hoặc đang có đơn PENDING")
    void testPreconditions_Errors() {
        // 1. Account not found
        when(accountRepository.findById(accountId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> registerSellerService.createSellerRegistration(accountId, new RegisterSellerRequest()));

        // 2. User not found
        when(accountRepository.findById(accountId)).thenReturn(Optional.of(verifiedAccount));
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> registerSellerService.createSellerRegistration(accountId, new RegisterSellerRequest()));

        // 3. Đã có Shop
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(mockUser));
        when(shopRepository.existsByUserId(mockUser.getId())).thenReturn(true);
        CustomException exShop = assertThrows(CustomException.class,
                () -> registerSellerService.createSellerRegistration(accountId, new RegisterSellerRequest()));
        assertTrue(exShop.getMessage().contains("đã sở hữu một gian hàng"));

        // 4. Đang có đơn PENDING
        when(shopRepository.existsByUserId(mockUser.getId())).thenReturn(false);
        when(requestRepository.existsByAccountIdAndTypeAndStatus(accountId, RequestType.SELLER_REGISTRATION, RequestStatus.PENDING)).thenReturn(true);
        CustomException exPending = assertThrows(CustomException.class,
                () -> registerSellerService.createSellerRegistration(accountId, new RegisterSellerRequest()));
        assertTrue(exPending.getMessage().contains("đang có một đơn đăng ký người bán chờ xét duyệt"));
    }

    @Test
    @DisplayName("Báo lỗi khi tên Shop để trống hoặc đã tồn tại")
    void testShopName_Errors() {
        when(accountRepository.findById(accountId)).thenReturn(Optional.of(verifiedAccount));
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(mockUser));
        when(shopRepository.existsByUserId(mockUser.getId())).thenReturn(false);
        when(requestRepository.existsByAccountIdAndTypeAndStatus(accountId, RequestType.SELLER_REGISTRATION, RequestStatus.PENDING)).thenReturn(false);

        // Tên shop null / blank
        RegisterSellerRequest req = RegisterSellerRequest.builder().shopName("   ").build();
        assertThrows(CustomException.class, () -> registerSellerService.createSellerRegistration(accountId, req));

        // Tên shop đã có trong Shop
        req.setShopName("Shop Da Co");
        when(shopRepository.existsByNameIgnoreCase("Shop Da Co")).thenReturn(true);
        CustomException ex1 = assertThrows(CustomException.class, () -> registerSellerService.createSellerRegistration(accountId, req));
        assertTrue(ex1.getMessage().contains("đã tồn tại"));

        // Tên shop đã có trong đơn pending Seller
        when(shopRepository.existsByNameIgnoreCase("Shop Da Co")).thenReturn(false);
        when(sellerRepository.existsPendingByShopNameIgnoreCase("Shop Da Co")).thenReturn(true);
        CustomException ex2 = assertThrows(CustomException.class, () -> registerSellerService.createSellerRegistration(accountId, req));
        assertTrue(ex2.getMessage().contains("đang có một đơn đăng ký khác chờ xét duyệt"));
    }

    @Test
    @DisplayName("Báo lỗi khi Business thiếu businessType, businessName, businessAddress, hoặc taxCode")
    void testBusiness_ValidationErrors() {
        when(accountRepository.findById(accountId)).thenReturn(Optional.of(verifiedAccount));
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(mockUser));
        when(shopRepository.existsByUserId(mockUser.getId())).thenReturn(false);
        when(requestRepository.existsByAccountIdAndTypeAndStatus(accountId, RequestType.SELLER_REGISTRATION, RequestStatus.PENDING)).thenReturn(false);

        RegisterSellerRequest req = RegisterSellerRequest.builder()
                .sellerType(SellerType.BUSINESS)
                .shopName("Tech Mall")
                .build();

        // 1. Thiếu businessType
        assertThrows(CustomException.class, () -> registerSellerService.createSellerRegistration(accountId, req));

        // 2. Thiếu businessName
        req.setBusinessType(BusinessType.ENTERPRISE);
        assertThrows(CustomException.class, () -> registerSellerService.createSellerRegistration(accountId, req));

        // 3. Thiếu businessAddress
        req.setBusinessName("Tech Corp");
        assertThrows(CustomException.class, () -> registerSellerService.createSellerRegistration(accountId, req));

        // 4. Thiếu taxCode
        req.setBusinessAddress("Hà Nội");
        assertThrows(CustomException.class, () -> registerSellerService.createSellerRegistration(accountId, req));

        // 5. Individual thiếu taxCode
        req.setSellerType(SellerType.INDIVIDUAL);
        req.setTaxCode(null);
        assertThrows(CustomException.class, () -> registerSellerService.createSellerRegistration(accountId, req));
    }

    @Test
    @DisplayName("Báo lỗi khi taxCode hoặc shopPhone bị trùng lặp")
    void testTaxCodeAndPhone_Duplicates() {
        when(accountRepository.findById(accountId)).thenReturn(Optional.of(verifiedAccount));
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(mockUser));
        when(shopRepository.existsByUserId(mockUser.getId())).thenReturn(false);
        when(requestRepository.existsByAccountIdAndTypeAndStatus(accountId, RequestType.SELLER_REGISTRATION, RequestStatus.PENDING)).thenReturn(false);

        RegisterSellerRequest req = RegisterSellerRequest.builder()
                .sellerType(SellerType.INDIVIDUAL)
                .shopName("Unique Shop")
                .taxCode("TAX999")
                .shopPhone("0900000000")
                .build();

        // 1. TaxCode trùng trong Shop
        when(shopRepository.existsByTaxCode("TAX999")).thenReturn(true);
        assertThrows(CustomException.class, () -> registerSellerService.createSellerRegistration(accountId, req));

        // 2. TaxCode trùng trong pending Seller
        when(shopRepository.existsByTaxCode("TAX999")).thenReturn(false);
        when(sellerRepository.existsPendingByTaxCode("TAX999")).thenReturn(true);
        assertThrows(CustomException.class, () -> registerSellerService.createSellerRegistration(accountId, req));

        // 3. Phone trùng trong Shop
        when(sellerRepository.existsPendingByTaxCode("TAX999")).thenReturn(false);
        when(shopRepository.existsByPhoneNumber("0900000000")).thenReturn(true);
        assertThrows(CustomException.class, () -> registerSellerService.createSellerRegistration(accountId, req));

        // 4. Phone trùng trong pending Seller
        when(shopRepository.existsByPhoneNumber("0900000000")).thenReturn(false);
        when(sellerRepository.existsPendingByShopPhone("0900000000")).thenReturn(true);
        assertThrows(CustomException.class, () -> registerSellerService.createSellerRegistration(accountId, req));
    }

    @Test
    @DisplayName("Báo lỗi khi thiếu thông tin ngân hàng hoặc địa chỉ lấy/trả hàng")
    void testBankAndAddress_Errors() {
        when(accountRepository.findById(accountId)).thenReturn(Optional.of(verifiedAccount));
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(mockUser));
        when(shopRepository.existsByUserId(mockUser.getId())).thenReturn(false);
        when(requestRepository.existsByAccountIdAndTypeAndStatus(accountId, RequestType.SELLER_REGISTRATION, RequestStatus.PENDING)).thenReturn(false);

        RegisterSellerRequest req = RegisterSellerRequest.builder()
                .sellerType(SellerType.INDIVIDUAL)
                .shopName("Good Shop")
                .taxCode("TAX123")
                .build();

        // 1. Thiếu bankAccountName
        assertThrows(CustomException.class, () -> registerSellerService.createSellerRegistration(accountId, req));

        // 2. Thiếu bankAccountNumber
        req.setBankAccountName("NGUYEN VAN A");
        assertThrows(CustomException.class, () -> registerSellerService.createSellerRegistration(accountId, req));

        // 3. Thiếu bankName
        req.setBankAccountNumber("12345678");
        assertThrows(CustomException.class, () -> registerSellerService.createSellerRegistration(accountId, req));

        // 4. Thiếu pickupAddress
        req.setBankName("VCB");
        assertThrows(CustomException.class, () -> registerSellerService.createSellerRegistration(accountId, req));

        // 5. Thiếu returnAddress
        req.setPickupAddress("Địa chỉ lấy");
        assertThrows(CustomException.class, () -> registerSellerService.createSellerRegistration(accountId, req));
    }

    @Test
    @DisplayName("Đăng ký thành công kèm ký quỹ cam kết (isEscrowParticipated = true) và địa chỉ tùy chỉnh")
    void testRegister_WithEscrowAndCustomAddress() {
        when(accountRepository.findById(accountId)).thenReturn(Optional.of(verifiedAccount));
        when(userRepository.findByAccountId(accountId)).thenReturn(Optional.of(mockUser));
        when(shopRepository.existsByUserId(mockUser.getId())).thenReturn(false);
        when(requestRepository.existsByAccountIdAndTypeAndStatus(accountId, RequestType.SELLER_REGISTRATION, RequestStatus.PENDING)).thenReturn(false);
        when(requestService.createRequest(eq(verifiedAccount), any())).thenReturn(mockRequest);

        RegisterSellerRequest req = RegisterSellerRequest.builder()
                .sellerType(SellerType.INDIVIDUAL)
                .shopName("Ký Quỹ Shop")
                .taxCode("TAX_ESCROW")
                .bankAccountName("CHỦ TÀI KHOẢN")
                .bankAccountNumber("888888")
                .bankName("MB Bank")
                .pickupAddress("Kho 1")
                .returnAddress("Kho 2")
                .address("Địa chỉ giao dịch chính")
                .isEscrowParticipated(true)
                .initialDepositAmount(java.math.BigDecimal.valueOf(5000000))
                .build();

        CreateRequestResponse res = registerSellerService.createSellerRegistration(accountId, req);
        assertNotNull(res);

        ArgumentCaptor<Seller> captor = ArgumentCaptor.forClass(Seller.class);
        verify(sellerRepository).save(captor.capture());
        Seller s = captor.getValue();
        assertTrue(s.getIsEscrowParticipated());
        assertEquals(java.math.BigDecimal.valueOf(5000000), s.getInitialDepositAmount());
        assertEquals("Địa chỉ giao dịch chính", s.getAddress());
    }

}
