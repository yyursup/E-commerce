package com.marketplace.ecommerce.request.service.impl;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.request.dto.request.CreateSendRequest;
import com.marketplace.ecommerce.request.dto.request.RegisterSellerRequest;
import com.marketplace.ecommerce.request.dto.response.CreateRequestResponse;
import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.entity.Seller;
import com.marketplace.ecommerce.request.repository.SellerRepository;
import com.marketplace.ecommerce.request.service.RequestService;
import com.marketplace.ecommerce.request.valueObjects.BusinessType;
import com.marketplace.ecommerce.request.valueObjects.RequestStatus;
import com.marketplace.ecommerce.request.valueObjects.RequestType;
import com.marketplace.ecommerce.request.valueObjects.SellerType;
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

@ExtendWith(MockitoExtension.class)
class RegisterSellerServiceImplTest {

    @Mock
    private SellerRepository sellerRepository;

    @Mock
    private RequestService requestService;

    @Mock
    private AccountRepository accountRepository;

    @InjectMocks
    private RegisterSellerServiceImpl registerSellerService;

    private UUID accountId;
    private Account verifiedAccount;
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
        assertTrue(exception.getMessage().contains("verified"));
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

        // When & Then
        CustomException exception = assertThrows(CustomException.class, () ->
                registerSellerService.createSellerRegistration(accountId, request)
        );
        assertTrue(exception.getMessage().contains("ngân hàng"));
    }
}
