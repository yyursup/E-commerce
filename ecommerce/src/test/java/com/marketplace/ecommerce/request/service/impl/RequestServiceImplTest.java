package com.marketplace.ecommerce.request.service.impl;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.entity.Role;
import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.repository.RoleRepository;
import com.marketplace.ecommerce.request.dto.response.RegisterSellerResponse;
import com.marketplace.ecommerce.request.dto.response.RequestDetailsResponse;
import com.marketplace.ecommerce.request.dto.response.RequestResponse;
import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.entity.Seller;
import com.marketplace.ecommerce.request.policy.RequestPolicy;
import com.marketplace.ecommerce.request.repository.RequestRepository;
import com.marketplace.ecommerce.request.repository.SellerRepository;
import com.marketplace.ecommerce.request.valueObjects.ApproveSellerContext;
import com.marketplace.ecommerce.request.valueObjects.BusinessType;
import com.marketplace.ecommerce.request.valueObjects.RequestStatus;
import com.marketplace.ecommerce.request.valueObjects.RequestType;
import com.marketplace.ecommerce.request.valueObjects.SellerType;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.service.ShopService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RequestServiceImplTest {

        @Mock
        private RequestRepository requestRepository;

        @Mock
        private SellerRepository sellerRepository;

        @Mock
        private AccountRepository accountRepository;

        @Mock
        private RoleRepository roleRepository;

        @Mock
        private RequestPolicy requestValidation;

        @Mock
        private ShopService shopService;

        @InjectMocks
        private RequestServiceImpl requestService;

        private UUID adminAccountId;
        private UUID requestId;
        private Account adminAccount;
        private Account ownerAccount;
        private User ownerUser;
        private Request mockRequest;
        private Seller mockSeller;
        private Role businessRole;

        @BeforeEach
        void setUp() {
                adminAccountId = UUID.randomUUID();
                requestId = UUID.randomUUID();

                adminAccount = Account.builder()
                                .id(adminAccountId)
                                .username("admin")
                                .role(Role.builder().roleName("ADMIN").build())
                                .build();

                ownerAccount = Account.builder()
                                .id(UUID.randomUUID())
                                .username("seller_user")
                                .role(Role.builder().roleName("CUSTOMER").build())
                                .accountVerified(true)
                                .build();

                ownerUser = User.builder()
                                .id(UUID.randomUUID())
                                .account(ownerAccount)
                                .email("seller@example.com")
                                .build();

                mockRequest = Request.builder()
                                .id(requestId)
                                .account(ownerAccount)
                                .type(RequestType.SELLER_REGISTRATION)
                                .status(RequestStatus.PENDING)
                                .createdAt(LocalDateTime.now())
                                .build();

                mockSeller = Seller.builder()
                                .id(requestId)
                                .request(mockRequest)
                                .sellerType(SellerType.BUSINESS)
                                .businessType(BusinessType.ENTERPRISE)
                                .businessName("Công Ty Cổ Phần Công Nghệ ABC")
                                .businessAddress("Tầng 5, Tòa nhà Bitexco, Q1, TP.HCM")
                                .businessLicenseUrl("https://example.com/gpkd.jpg")
                                .shopName("ABC Tech Store")
                                .shopPhone("0901234567")
                                .shopEmail("contact@abctech.vn")
                                .pickupAddress("Kho tổng: 456 Lê Văn Việt, TP.Thủ Đức")
                                .returnAddress("Kho tổng: 456 Lê Văn Việt, TP.Thủ Đức")
                                .taxCode("0309998888")
                                .invoiceEmail("ketoan@abctech.vn")
                                .bankName("VietinBank")
                                .bankAccountNumber("1020304050")
                                .bankAccountName("CONG TY CP CONG NGHE ABC")
                                .build();

                businessRole = Role.builder()
                                .id(UUID.randomUUID())
                                .roleName("BUSINESS")
                                .build();
        }

        @Test
        @DisplayName("Admin duyệt đơn đăng ký bán hàng thành công và tạo Shop mới")
        void approveSellerRegistration_Success() {
                // Given
                ApproveSellerContext ctx = new ApproveSellerContext(ownerUser, mockSeller, "ABC Tech Store");
                Shop createdShop = Shop.builder()
                                .id(UUID.randomUUID())
                                .user(ownerUser)
                                .name("ABC Tech Store")
                                .sellerType(SellerType.BUSINESS)
                                .build();

                when(accountRepository.findById(adminAccountId)).thenReturn(Optional.of(adminAccount));
                when(requestRepository.findById(requestId)).thenReturn(Optional.of(mockRequest));
                when(requestValidation.validateApproveSellerRequest(mockRequest, requestId)).thenReturn(ctx);
                when(shopService.createShop(eq(ownerUser), eq("ABC Tech Store"), eq(mockRequest), eq(mockSeller)))
                                .thenReturn(createdShop);
                when(roleRepository.findByRoleName("BUSINESS")).thenReturn(Optional.of(businessRole));

                // When
                RequestResponse response = requestService.approveSellerRegistration(requestId, adminAccountId,
                                "Đã duyệt đơn đăng ký");

                // Then
                assertNotNull(response);
                assertEquals(RequestStatus.APPROVED, mockRequest.getStatus());
                assertEquals("BUSINESS", ownerAccount.getRole().getRoleName());
                assertEquals(createdShop.getId(), mockSeller.getCreatedShopId());

                verify(shopService).createShop(ownerUser, "ABC Tech Store", mockRequest, mockSeller);
                verify(accountRepository).save(ownerAccount);
                verify(requestRepository).save(mockRequest);
                verify(sellerRepository).save(mockSeller);
        }

        @Test
        @DisplayName("Admin từ chối đơn đăng ký bán hàng với lý do")
        void rejectRequest_Success() {
                // Given
                when(accountRepository.findById(adminAccountId)).thenReturn(Optional.of(adminAccount));
                when(requestRepository.findById(requestId)).thenReturn(Optional.of(mockRequest));

                // When
                RequestResponse response = requestService.rejectRequest(adminAccountId, requestId, "Ảnh GPKD bị mờ");

                // Then
                assertNotNull(response);
                assertEquals(RequestStatus.REJECTED, mockRequest.getStatus());
                assertEquals("Ảnh GPKD bị mờ", mockRequest.getResponse());
                assertEquals(adminAccount, mockRequest.getReviewedBy());
                verify(requestRepository).save(mockRequest);
        }

        @Test
        @DisplayName("Lấy thông tin chi tiết đơn đăng ký bán hàng trả về RegisterSellerResponse đầy đủ")
        void getDetails_SellerRegistration_Success() {
                // Given
                when(requestRepository.findById(requestId)).thenReturn(Optional.of(mockRequest));
                when(sellerRepository.findByRequestId(requestId)).thenReturn(mockSeller);

                // When
                RequestDetailsResponse details = requestService.getDetails(requestId);

                // Then
                assertNotNull(details);
                assertInstanceOf(RegisterSellerResponse.class, details.getDetail());

                RegisterSellerResponse sellerDto = (RegisterSellerResponse) details.getDetail();
                assertEquals(SellerType.BUSINESS, sellerDto.getSellerType());
                assertEquals("ABC Tech Store", sellerDto.getShopName());
                assertEquals("0309998888", sellerDto.getTaxCode());
                assertEquals("VietinBank", sellerDto.getBankName());
                assertEquals("1020304050", sellerDto.getBankAccountNumber());
                assertEquals("https://example.com/gpkd.jpg", sellerDto.getBusinessLicenseUrl());
        }
}
