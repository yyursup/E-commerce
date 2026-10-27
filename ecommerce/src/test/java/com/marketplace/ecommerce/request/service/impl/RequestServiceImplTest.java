package com.marketplace.ecommerce.request.service.impl;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.entity.Role;
import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.repository.RoleRepository;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.request.dto.response.RegisterSellerResponse;
import com.marketplace.ecommerce.request.dto.response.ReportDetailsResponse;
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
import com.marketplace.ecommerce.file.service.FileService;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.service.OrderReturnService;
import com.marketplace.ecommerce.payment.repository.EscrowRepository;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.review.repository.ReviewRepository;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.shop.service.ShopEscrowFundService;
import com.marketplace.ecommerce.shop.service.ShopService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import com.marketplace.ecommerce.order.valueObjects.ReturnStatus;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import com.marketplace.ecommerce.request.repository.ReportRepository;
import com.marketplace.ecommerce.request.entity.Report;
import com.marketplace.ecommerce.request.valueObjects.ReportStage;
import com.marketplace.ecommerce.request.valueObjects.TargetType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.auth.valueObjects.AccountStatus;
import com.marketplace.ecommerce.auth.valueObjects.DisciplineLevel;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.review.entity.Review;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.payment.entity.Escrow;
import com.marketplace.ecommerce.payment.valueObjects.EscrowStatus;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.request.dto.request.CreateSendRequest;
import com.marketplace.ecommerce.request.dto.response.BanReviewStatusResponse;
import com.marketplace.ecommerce.request.dto.response.BanReviewDetailsResponse;
import com.marketplace.ecommerce.request.dto.response.ReportDetailsResponse;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;
import org.mockito.quality.Strictness;
import org.mockito.junit.jupiter.MockitoSettings;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RequestServiceImplTest {

        @Mock
        private RequestRepository requestRepository;

        @Mock
        private ReportRepository reportRepository;

        @Mock
        private SellerRepository sellerRepository;

        @Mock
        private AccountRepository accountRepository;

        @Mock
        private UserRepository userRepository;

        @Mock
        private RoleRepository roleRepository;

        @Mock
        private RequestPolicy requestValidation;

        @Mock
        private ShopService shopService;

        @Mock
        private ShopEscrowFundService shopEscrowFundService;

        @Mock
        private ProductRepository productRepository;

        @Mock
        private ShopRepository shopRepository;

        @Mock
        private ReviewRepository reviewRepository;

        @Mock
        private OrderRepository orderRepository;

        @Mock
        private EscrowRepository escrowRepository;

        @Mock
        private OrderReturnService orderReturnService;

        @Mock
        private FileService fileService;

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

        @Test
        @DisplayName("getAllRequests: Gọi findAllAdminRequests và batch map dữ liệu Report thành công")
        void getAllRequests_FiltersAndMapsReportCorrectly() {
                UUID reportRequestId = UUID.randomUUID();
                Request req = Request.builder()
                                .id(reportRequestId)
                                .type(RequestType.REPORT)
                                .status(RequestStatus.PENDING)
                                .description("Khiếu nại leo thang")
                                .build();

                Report report = Report.builder()
                                .id(reportRequestId)
                                .targetType(TargetType.ORDER)
                                .stage(ReportStage.ESCALATED_TO_ADMIN)
                                .build();

                Page<Request> mockPage = new PageImpl<>(List.of(req));
                when(requestRepository.findAllAdminRequests(eq(RequestType.REPORT), eq(RequestStatus.PENDING), any(Pageable.class)))
                                .thenReturn(mockPage);
                when(reportRepository.findAllById(List.of(reportRequestId))).thenReturn(List.of(report));

                Page<com.marketplace.ecommerce.request.dto.response.CreateRequestResponse> result =
                                requestService.getAllRequests(RequestType.REPORT, RequestStatus.PENDING, PageRequest.of(0, 10));

                assertNotNull(result);
                assertEquals(1, result.getTotalElements());
                com.marketplace.ecommerce.request.dto.response.CreateRequestResponse res = result.getContent().get(0);
                assertEquals(TargetType.ORDER, res.getTargetType());
                assertEquals(ReportStage.ESCALATED_TO_ADMIN, res.getStage());
                verify(requestRepository).findAllAdminRequests(eq(RequestType.REPORT), eq(RequestStatus.PENDING), any(Pageable.class));
        }

        @Test
        @DisplayName("approveRequest: Chuyển tiếp đúng loại SELLER_REGISTRATION, APPEAL hoặc ném lỗi nếu không hỗ trợ")
        void approveRequest_DelegationAndUnsupported() {
                Request regReq = Request.builder().id(requestId).account(ownerAccount).displayCode("REG-TEST-123").type(RequestType.SELLER_REGISTRATION).build();
                when(requestRepository.findById(requestId)).thenReturn(Optional.of(regReq));
                when(accountRepository.findById(adminAccountId)).thenReturn(Optional.of(adminAccount));
                ApproveSellerContext ctx = new ApproveSellerContext(ownerUser, mockSeller, "ABC Tech Store");
                when(requestValidation.validateApproveSellerRequest(any(), any())).thenReturn(ctx);
                when(shopService.createShop(any(), any(), any(), any())).thenReturn(Shop.builder().id(UUID.randomUUID()).build());
                when(roleRepository.findByRoleName("BUSINESS")).thenReturn(Optional.of(businessRole));

                RequestResponse res1 = requestService.approveRequest(requestId, adminAccountId, "Approved seller");
                assertNotNull(res1);

                // APPEAL
                UUID appealId = UUID.randomUUID();
                Account bannedAccount = Account.builder()
                                .id(UUID.randomUUID())
                                .status(AccountStatus.BANNED)
                                .disciplineLevel(DisciplineLevel.BANNED)
                                .violationCount(7)
                                .build();
                Request appealReq = Request.builder()
                                .id(appealId)
                                .type(RequestType.APPEAL)
                                .status(RequestStatus.PENDING)
                                .account(bannedAccount)
                                .build();
                when(requestRepository.findById(appealId)).thenReturn(Optional.of(appealReq));
                when(accountRepository.findByIdForUpdate(bannedAccount.getId())).thenReturn(Optional.of(bannedAccount));

                RequestResponse res2 = requestService.approveRequest(appealId, adminAccountId, "Unbanned");
                assertNotNull(res2);

                // Unsupported
                UUID otherId = UUID.randomUUID();
                Request otherReq = Request.builder().id(otherId).type(RequestType.REPORT).build();
                when(requestRepository.findById(otherId)).thenReturn(Optional.of(otherReq));
                assertThrows(CustomException.class, () -> requestService.approveRequest(otherId, adminAccountId, "Note"));
        }

        @Test
        @DisplayName("approveBanReview: Kiểm tra các nhánh validation lỗi (admin not found, req not found, not appeal, not pending, target not found, target not banned, strikes < 7)")
        void approveBanReview_ValidationBranches() {
                UUID appealId = UUID.randomUUID();
                when(accountRepository.findById(adminAccountId)).thenReturn(Optional.empty());
                assertThrows(CustomException.class, () -> requestService.approveBanReview(appealId, adminAccountId, "Note"));

                when(accountRepository.findById(adminAccountId)).thenReturn(Optional.of(adminAccount));
                when(requestRepository.findById(appealId)).thenReturn(Optional.empty());
                assertThrows(CustomException.class, () -> requestService.approveBanReview(appealId, adminAccountId, "Note"));

                // Not APPEAL
                Request reportReq = Request.builder().id(appealId).type(RequestType.REPORT).build();
                when(requestRepository.findById(appealId)).thenReturn(Optional.of(reportReq));
                assertThrows(CustomException.class, () -> requestService.approveBanReview(appealId, adminAccountId, "Note"));

                // Not PENDING
                Request approvedAppeal = Request.builder().id(appealId).type(RequestType.APPEAL).status(RequestStatus.APPROVED).build();
                when(requestRepository.findById(appealId)).thenReturn(Optional.of(approvedAppeal));
                assertThrows(CustomException.class, () -> requestService.approveBanReview(appealId, adminAccountId, "Note"));

                // Target not found
                Account acc = Account.builder().id(UUID.randomUUID()).build();
                Request validAppeal = Request.builder().id(appealId).type(RequestType.APPEAL).status(RequestStatus.PENDING).account(acc).build();
                when(requestRepository.findById(appealId)).thenReturn(Optional.of(validAppeal));
                when(accountRepository.findByIdForUpdate(acc.getId())).thenReturn(Optional.empty());
                assertThrows(CustomException.class, () -> requestService.approveBanReview(appealId, adminAccountId, "Note"));

                // Target not banned
                Account activeAcc = Account.builder().id(acc.getId()).status(AccountStatus.ACTIVE).violationCount(3).build();
                when(accountRepository.findByIdForUpdate(acc.getId())).thenReturn(Optional.of(activeAcc));
                assertThrows(CustomException.class, () -> requestService.approveBanReview(appealId, adminAccountId, "Note"));

                // Target banned but strikes < 7
                Account bannedFewStrikes = Account.builder().id(acc.getId()).status(AccountStatus.BANNED).disciplineLevel(DisciplineLevel.BANNED).violationCount(5).build();
                when(accountRepository.findByIdForUpdate(acc.getId())).thenReturn(Optional.of(bannedFewStrikes));
                assertThrows(CustomException.class, () -> requestService.approveBanReview(appealId, adminAccountId, "Note"));
        }

        @Test
        @DisplayName("rejectRequest: Ném ngoại lệ khi trạng thái không phải PENDING")
        void rejectRequest_Throws_WhenNotPending() {
                when(accountRepository.findById(adminAccountId)).thenReturn(Optional.of(adminAccount));
                Request rejectedReq = Request.builder().id(requestId).status(RequestStatus.REJECTED).build();
                when(requestRepository.findById(requestId)).thenReturn(Optional.of(rejectedReq));

                assertThrows(CustomException.class, () -> requestService.rejectRequest(adminAccountId, requestId, "Lý do"));
        }

        @Test
        @DisplayName("getDetails: Chi tiết Report cho các đối tượng SHOP, PRODUCT, USER, REVIEW, ORDER")
        void getDetails_Report_AllTargets() {
                // 1. SHOP target
                UUID shopRepId = UUID.randomUUID();
                UUID shopId = UUID.randomUUID();
                Request rShop = Request.builder().id(shopRepId).type(RequestType.REPORT).build();
                Report repShop = Report.builder().id(shopRepId).targetType(TargetType.SHOP).targetId(shopId).build();
                when(requestRepository.findById(shopRepId)).thenReturn(Optional.of(rShop));
                when(reportRepository.findByRequestId(shopRepId)).thenReturn(repShop);
                when(shopRepository.findById(shopId)).thenReturn(Optional.of(Shop.builder().name("Shop A").phoneNumber("0123").address("Hanoi").build()));

                RequestDetailsResponse detShop = requestService.getDetails(shopRepId);
                assertNotNull(detShop);
                ReportDetailsResponse rDto1 = (ReportDetailsResponse) detShop.getDetail();
                assertEquals("Shop A", rDto1.getTargetName());

                // 2. PRODUCT target
                UUID prodRepId = UUID.randomUUID();
                UUID prodId = UUID.randomUUID();
                Request rProd = Request.builder().id(prodRepId).type(RequestType.REPORT).build();
                Report repProd = Report.builder().id(prodRepId).targetType(TargetType.PRODUCT).targetId(prodId).build();
                when(requestRepository.findById(prodRepId)).thenReturn(Optional.of(rProd));
                when(reportRepository.findByRequestId(prodRepId)).thenReturn(repProd);
                when(productRepository.findById(prodId)).thenReturn(Optional.of(Product.builder().name("iPhone").sku("IP1").basePrice(new java.math.BigDecimal("1000")).build()));

                RequestDetailsResponse detProd = requestService.getDetails(prodRepId);
                assertNotNull(detProd);

                // 3. USER target
                UUID userRepId = UUID.randomUUID();
                UUID accId = UUID.randomUUID();
                Request rUser = Request.builder().id(userRepId).type(RequestType.REPORT).build();
                Report repUser = Report.builder().id(userRepId).targetType(TargetType.USER).targetId(accId).build();
                when(requestRepository.findById(userRepId)).thenReturn(Optional.of(rUser));
                when(reportRepository.findByRequestId(userRepId)).thenReturn(repUser);
                when(accountRepository.findById(accId)).thenReturn(Optional.of(Account.builder().email("user@test.com").status(AccountStatus.ACTIVE).violationCount(1).build()));

                RequestDetailsResponse detUser = requestService.getDetails(userRepId);
                assertNotNull(detUser);

                // 4. REVIEW target
                UUID revRepId = UUID.randomUUID();
                UUID revId = UUID.randomUUID();
                Request rRev = Request.builder().id(revRepId).type(RequestType.REPORT).build();
                Report repRev = Report.builder().id(revRepId).targetType(TargetType.REVIEW).targetId(revId).build();
                when(requestRepository.findById(revRepId)).thenReturn(Optional.of(rRev));
                when(reportRepository.findByRequestId(revRepId)).thenReturn(repRev);
                when(reviewRepository.findById(revId)).thenReturn(Optional.of(Review.builder().rating(5).comment("Great").build()));

                RequestDetailsResponse detRev = requestService.getDetails(revRepId);
                assertNotNull(detRev);

                // 5. ORDER target with Return and Escrow
                UUID orderRepId = UUID.randomUUID();
                UUID orderId = UUID.randomUUID();
                Request rOrder = Request.builder().id(orderRepId).type(RequestType.REPORT).build();
                Report repOrder = Report.builder().id(orderRepId).targetType(TargetType.ORDER).targetId(orderId).build();
                when(requestRepository.findById(orderRepId)).thenReturn(Optional.of(rOrder));
                when(reportRepository.findByRequestId(orderRepId)).thenReturn(repOrder);

                Order o = Order.builder().id(orderId).orderNumber("ORD-123").status(OrderStatus.DELIVERED).build();
                when(orderRepository.findById(orderId)).thenReturn(Optional.of(o));
                com.marketplace.ecommerce.order.dto.response.OrderReturnResponse retDto = com.marketplace.ecommerce.order.dto.response.OrderReturnResponse.builder().id(UUID.randomUUID()).status(ReturnStatus.WAITING_FOR_SHIPMENT).build();
                when(orderReturnService.getReturnByOrderId(orderId)).thenReturn(retDto);
                when(escrowRepository.findByOrderId(orderId)).thenReturn(Optional.of(Escrow.builder().id(UUID.randomUUID()).status(EscrowStatus.HELD).amount(new java.math.BigDecimal("500000")).build()));

                RequestDetailsResponse detOrder = requestService.getDetails(orderRepId);
                assertNotNull(detOrder);
                ReportDetailsResponse rDtoOrder = (ReportDetailsResponse) detOrder.getDetail();
                assertNotNull(rDtoOrder.getOrderReturn());
                assertNotNull(rDtoOrder.getEscrow());
        }

        @Test
        @DisplayName("getDetails: Chi tiết APPEAL với lịch sử khiếu nại và lịch sử vi phạm")
        void getDetails_Appeal_Success() {
                UUID appealReqId = UUID.randomUUID();
                Account acc = Account.builder().id(UUID.randomUUID()).username("banned_user").email("banned@test.com").status(AccountStatus.BANNED).disciplineLevel(DisciplineLevel.BANNED).violationCount(7).build();
                Request appealReq = Request.builder().id(appealReqId).account(acc).type(RequestType.APPEAL).description("Xin mo tai khoan").build();
                when(requestRepository.findById(appealReqId)).thenReturn(Optional.of(appealReq));

                Request olderAppeal = Request.builder().id(UUID.randomUUID()).account(acc).type(RequestType.APPEAL).status(RequestStatus.REJECTED).build();
                when(requestRepository.findByAccountIdAndTypeOrderByCreatedAtDesc(acc.getId(), RequestType.APPEAL)).thenReturn(List.of(appealReq, olderAppeal));

                Report pastViolation = Report.builder().id(UUID.randomUUID()).targetType(TargetType.ORDER).policyClauseCode("DISPUTE_LOSS").build();
                when(reportRepository.findApprovedViolationsByAccountId(acc.getId())).thenReturn(List.of(pastViolation));

                RequestDetailsResponse det = requestService.getDetails(appealReqId);
                assertNotNull(det);
                assertInstanceOf(BanReviewDetailsResponse.class, det.getDetail());
                BanReviewDetailsResponse bDto = (BanReviewDetailsResponse) det.getDetail();
                assertEquals(1, bDto.getPriorAppeals().size());
                assertEquals(1, bDto.getViolationHistory().size());
        }

        @Test
        @DisplayName("getBanReviewStatus: Kiểm tra tất cả các trạng thái canSubmit và blockReason")
        void getBanReviewStatus_AllConditions() {
                UUID accId = UUID.randomUUID();
                when(accountRepository.findById(accId)).thenReturn(Optional.empty());
                assertThrows(CustomException.class, () -> requestService.getBanReviewStatus(accId));

                // 1. Not banned
                Account activeAcc = Account.builder().id(accId).status(AccountStatus.ACTIVE).violationCount(0).build();
                when(accountRepository.findById(accId)).thenReturn(Optional.of(activeAcc));
                when(requestRepository.findByAccountIdAndTypeOrderByCreatedAtDesc(accId, RequestType.APPEAL)).thenReturn(List.of());

                BanReviewStatusResponse s1 = requestService.getBanReviewStatus(accId);
                assertFalse(s1.isCanSubmit());
                assertEquals("NOT_BANNED", s1.getBlockReason());

                // 2. Banned with Pending
                Account bannedAcc = Account.builder().id(accId).status(AccountStatus.BANNED).disciplineLevel(DisciplineLevel.BANNED).violationCount(7).build();
                when(accountRepository.findById(accId)).thenReturn(Optional.of(bannedAcc));
                Request pendingReq = Request.builder().id(UUID.randomUUID()).status(RequestStatus.PENDING).build();
                when(requestRepository.findByAccountIdAndTypeOrderByCreatedAtDesc(accId, RequestType.APPEAL)).thenReturn(List.of(pendingReq));

                BanReviewStatusResponse s2 = requestService.getBanReviewStatus(accId);
                assertFalse(s2.isCanSubmit());
                assertEquals("PENDING_REVIEW", s2.getBlockReason());

                // 3. Banned with Rejected
                Request rejectedReq = Request.builder().id(UUID.randomUUID()).status(RequestStatus.REJECTED).build();
                when(requestRepository.findByAccountIdAndTypeOrderByCreatedAtDesc(accId, RequestType.APPEAL)).thenReturn(List.of(rejectedReq));

                BanReviewStatusResponse s3 = requestService.getBanReviewStatus(accId);
                assertFalse(s3.isCanSubmit());
                assertEquals("PERMANENTLY_BLOCKED_REJECTED", s3.getBlockReason());

                // 4. Banned with no appeals -> Can submit
                when(requestRepository.findByAccountIdAndTypeOrderByCreatedAtDesc(accId, RequestType.APPEAL)).thenReturn(List.of());
                BanReviewStatusResponse s4 = requestService.getBanReviewStatus(accId);
                assertTrue(s4.isCanSubmit());
                assertNull(s4.getBlockReason());
        }

        @Test
        @DisplayName("submitBanReview: Kiểm tra các ràng buộc validation (độ dài, không bị ban, đã có đơn chờ/từ chối, số lượng/kích thước ảnh)")
        void submitBanReview_ValidationCases() {
                UUID accId = UUID.randomUUID();
                // Length < 10
                assertThrows(CustomException.class, () -> requestService.submitBanReview(accId, "short", null));
                // Length > 2000
                String longDesc = "a".repeat(2001);
                assertThrows(CustomException.class, () -> requestService.submitBanReview(accId, longDesc, null));

                // Account not found
                when(accountRepository.findByIdForUpdate(accId)).thenReturn(Optional.empty());
                assertThrows(CustomException.class, () -> requestService.submitBanReview(accId, "1234567890", null));

                // Account not banned
                Account active = Account.builder().id(accId).status(AccountStatus.ACTIVE).build();
                when(accountRepository.findByIdForUpdate(accId)).thenReturn(Optional.of(active));
                assertThrows(CustomException.class, () -> requestService.submitBanReview(accId, "1234567890", null));

                // Account banned, but has pending appeal
                Account banned = Account.builder().id(accId).status(AccountStatus.BANNED).disciplineLevel(DisciplineLevel.BANNED).violationCount(7).build();
                when(accountRepository.findByIdForUpdate(accId)).thenReturn(Optional.of(banned));
                Request pending = Request.builder().id(UUID.randomUUID()).status(RequestStatus.PENDING).build();
                when(requestRepository.findByAccountIdAndTypeOrderByCreatedAtDesc(accId, RequestType.APPEAL)).thenReturn(List.of(pending));
                assertThrows(CustomException.class, () -> requestService.submitBanReview(accId, "1234567890", null));

                // Account banned, has rejected appeal
                Request rejected = Request.builder().id(UUID.randomUUID()).status(RequestStatus.REJECTED).build();
                when(requestRepository.findByAccountIdAndTypeOrderByCreatedAtDesc(accId, RequestType.APPEAL)).thenReturn(List.of(rejected));
                assertThrows(CustomException.class, () -> requestService.submitBanReview(accId, "1234567890", null));

                // > 4 files
                when(requestRepository.findByAccountIdAndTypeOrderByCreatedAtDesc(accId, RequestType.APPEAL)).thenReturn(List.of());
                MockMultipartFile f = new MockMultipartFile("file", "test.png", "image/png", new byte[]{1, 2, 3});
                List<MultipartFile> fiveFiles = List.of(f, f, f, f, f);
                assertThrows(CustomException.class, () -> requestService.submitBanReview(accId, "1234567890", fiveFiles));
        }

        @Test
        @DisplayName("createRequest và getRequests: Gọi repository tương ứng thành công")
        void createRequest_And_GetRequests() {
                CreateSendRequest sendReq = new CreateSendRequest();
                sendReq.setRequestType(RequestType.REPORT);
                sendReq.setDescription("Báo cáo vi phạm");
                sendReq.setCoverImage("http://cover.jpg");

                when(requestRepository.save(any(Request.class))).thenAnswer(inv -> inv.getArgument(0));

                Request created = requestService.createRequest(adminAccount, sendReq);
                assertNotNull(created);
                assertEquals(RequestType.REPORT, created.getType());
                assertEquals("Báo cáo vi phạm", created.getDescription());

                when(requestRepository.findAllRequestByAccountId(eq(adminAccountId), any())).thenReturn(new PageImpl<>(List.of(created)));
                Page<com.marketplace.ecommerce.request.dto.response.CreateRequestResponse> page = requestService.getRequests(adminAccountId, PageRequest.of(0, 10));
                assertNotNull(page);
                assertEquals(1, page.getTotalElements());

                // autoRefundExpiredDisputedOrders no-op verification
                assertDoesNotThrow(() -> requestService.autoRefundExpiredDisputedOrders());
        }

        @Test
        @DisplayName("Lấy chi tiết Báo cáo Người dùng: Tra cứu thành công họ tên và thông tin từ UserRepository khi targetId là userId")
        void getDetails_ReportUser_ResolvesFullNameAndAccount() {
                UUID reportRequestId = UUID.randomUUID();
                UUID targetUserId = UUID.randomUUID();
                Request req = Request.builder()
                                .id(reportRequestId)
                                .type(RequestType.REPORT)
                                .status(RequestStatus.PENDING)
                                .description("Quấy rối người khác")
                                .build();

                Report report = Report.builder()
                                .id(reportRequestId)
                                .request(req)
                                .targetType(TargetType.USER)
                                .targetId(targetUserId)
                                .stage(ReportStage.ESCALATED_TO_ADMIN)
                                .build();

                Account reportedAccount = Account.builder()
                                .id(UUID.randomUUID())
                                .email("reported@test.com")
                                .status(com.marketplace.ecommerce.auth.valueObjects.AccountStatus.ACTIVE)
                                .violationCount(1)
                                .build();

                User reportedUser = User.builder()
                                .id(targetUserId)
                                .account(reportedAccount)
                                .fullName("Nguyễn Văn Nghi Phạm")
                                .phoneNumber("0912345678")
                                .build();

                when(requestRepository.findById(reportRequestId)).thenReturn(Optional.of(req));
                when(reportRepository.findByRequestId(reportRequestId)).thenReturn(report);
                when(accountRepository.findById(targetUserId)).thenReturn(Optional.empty());
                when(userRepository.findById(targetUserId)).thenReturn(Optional.of(reportedUser));

                RequestDetailsResponse details = requestService.getDetails(reportRequestId);

                assertNotNull(details);
                assertInstanceOf(ReportDetailsResponse.class, details.getDetail());
                ReportDetailsResponse repDto = (ReportDetailsResponse) details.getDetail();
                assertEquals("Nguyễn Văn Nghi Phạm (reported@test.com)", repDto.getTargetName());
                assertTrue(repDto.getTargetInfo().contains("0912345678"));
                assertTrue(repDto.getTargetInfo().contains("1 lần"));
        }
}
