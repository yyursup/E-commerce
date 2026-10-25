package com.marketplace.ecommerce.request.service.impl;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.entity.Role;
import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.repository.RoleRepository;
import com.marketplace.ecommerce.auth.valueObjects.AccountStatus;
import com.marketplace.ecommerce.auth.valueObjects.DisciplineLevel;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.dto.response.OrderReturnResponse;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.service.OrderReturnService;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.order.valueObjects.ReturnConditionStatus;
import com.marketplace.ecommerce.order.valueObjects.ReturnStatus;
import com.marketplace.ecommerce.payment.entity.Escrow;
import com.marketplace.ecommerce.payment.repository.EscrowRepository;
import com.marketplace.ecommerce.payment.service.EscrowService;
import com.marketplace.ecommerce.payment.valueObjects.EscrowStatus;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.product.valueObjects.ProductStatus;
import com.marketplace.ecommerce.request.dto.request.CreateAppealRequest;
import com.marketplace.ecommerce.request.dto.request.CreateSendRequest;
import com.marketplace.ecommerce.request.dto.response.*;
import com.marketplace.ecommerce.request.entity.Report;
import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.entity.Seller;
import com.marketplace.ecommerce.request.policy.RequestPolicy;
import com.marketplace.ecommerce.request.repository.ReportRepository;
import com.marketplace.ecommerce.request.repository.RequestRepository;
import com.marketplace.ecommerce.request.repository.SellerRepository;
import com.marketplace.ecommerce.request.valueObjects.*;
import com.marketplace.ecommerce.review.entity.Review;
import com.marketplace.ecommerce.review.repository.ReviewRepository;
import com.marketplace.ecommerce.review.valueObjects.ReviewStatus;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.shop.service.ShopEscrowFundService;
import com.marketplace.ecommerce.shop.service.ShopService;
import com.marketplace.ecommerce.shop.valueObjects.ShopStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

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
    private RoleRepository roleRepository;
    @Mock
    private RequestPolicy requestValidation;
    @Mock
    private ShopService shopService;
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
    private EscrowService escrowService;
    @Mock
    private OrderReturnService orderReturnService;
    @Mock
    private ShopEscrowFundService shopEscrowFundService;

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

        RequestResponse response = requestService.approveRequest(requestId, adminAccountId, "Đã duyệt đơn đăng ký");

        assertNotNull(response);
        assertEquals(RequestStatus.APPROVED, mockRequest.getStatus());
        assertEquals("BUSINESS", ownerAccount.getRole().getRoleName());
        assertEquals(createdShop.getId(), mockSeller.getCreatedShopId());
    }

    @Test
    @DisplayName("Admin từ chối đơn đăng ký bán hàng với lý do")
    void rejectRequest_Success() {
        when(accountRepository.findById(adminAccountId)).thenReturn(Optional.of(adminAccount));
        when(requestRepository.findById(requestId)).thenReturn(Optional.of(mockRequest));

        RequestResponse response = requestService.rejectRequest(adminAccountId, requestId, "Ảnh GPKD bị mờ");

        assertNotNull(response);
        assertEquals(RequestStatus.REJECTED, mockRequest.getStatus());
        assertEquals("Ảnh GPKD bị mờ", mockRequest.getResponse());
        assertEquals(adminAccount, mockRequest.getReviewedBy());
        verify(requestRepository).save(mockRequest);
    }

    @Test
    @DisplayName("Lấy thông tin chi tiết đơn đăng ký bán hàng trả về RegisterSellerResponse đầy đủ")
    void getDetails_SellerRegistration_Success() {
        when(requestRepository.findById(requestId)).thenReturn(Optional.of(mockRequest));
        when(sellerRepository.findByRequestId(requestId)).thenReturn(mockSeller);

        RequestDetailsResponse details = requestService.getDetails(requestId);

        assertNotNull(details);
        assertInstanceOf(RegisterSellerResponse.class, details.getDetail());
    }

    @Test
    @DisplayName("getAllRequests và getRequests và createRequest đầy đủ các nhánh")
    void testGetAllRequests_AndCreateRequest() {
        Page<Request> mockPage = new PageImpl<>(List.of(mockRequest));
        when(requestRepository.findAllByTypeAndStatus(eq(RequestType.REPORT), eq(RequestStatus.PENDING), any(Pageable.class)))
                .thenReturn(mockPage);
        when(requestRepository.findAllByType(eq(RequestType.REPORT), any(Pageable.class)))
                .thenReturn(mockPage);
        when(requestRepository.findAllByStatus(eq(RequestStatus.PENDING), any(Pageable.class)))
                .thenReturn(mockPage);
        when(requestRepository.findAll(any(Pageable.class)))
                .thenReturn(mockPage);
        when(requestRepository.findAllRequestByAccountId(eq(adminAccountId), any(Pageable.class)))
                .thenReturn(mockPage);

        assertEquals(1, requestService.getAllRequests(RequestType.REPORT, RequestStatus.PENDING, PageRequest.of(0, 10)).getTotalElements());
        assertEquals(1, requestService.getAllRequests(RequestType.REPORT, null, PageRequest.of(0, 10)).getTotalElements());
        assertEquals(1, requestService.getAllRequests(null, RequestStatus.PENDING, PageRequest.of(0, 10)).getTotalElements());
        assertEquals(1, requestService.getAllRequests(null, null, PageRequest.of(0, 10)).getTotalElements());
        assertEquals(1, requestService.getRequests(adminAccountId, PageRequest.of(0, 10)).getTotalElements());

        when(requestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        Request createdRep = requestService.createRequest(ownerAccount, CreateSendRequest.builder()
                .requestType(RequestType.REPORT).description("Báo cáo").build());
        assertTrue(createdRep.getDisplayCode().startsWith("REP-"));

        Request createdReg = requestService.createRequest(ownerAccount, CreateSendRequest.builder()
                .requestType(RequestType.SELLER_REGISTRATION).description("Đăng ký").build());
        assertTrue(createdReg.getDisplayCode().startsWith("REG-"));
    }

    @Test
    @DisplayName("approveRequest: Các nhánh duyệt đơn kháng cáo SHOP, PRODUCT, REVIEW, USER, ORDER và lỗi")
    void testApproveRequest_Appeal_AllBranches() {
        Request appealReq = Request.builder()
                .id(requestId)
                .type(RequestType.APPEAL)
                .status(RequestStatus.PENDING)
                .account(ownerAccount)
                .build();
        when(requestRepository.findById(requestId)).thenReturn(Optional.of(appealReq));
        when(accountRepository.findById(adminAccountId)).thenReturn(Optional.of(adminAccount));

        // 1. Target SHOP: vi phạm giảm từ 4 xuống 3 -> WARNED
        UUID shopId = UUID.randomUUID();
        Account shopOwner = Account.builder().id(UUID.randomUUID()).violationCount(4).build();
        User sUser = User.builder().id(UUID.randomUUID()).account(shopOwner).build();
        Shop shop = Shop.builder().id(shopId).user(sUser).status(ShopStatus.SUSPENDED).build();

        Report repShop = Report.builder().id(UUID.randomUUID()).targetType(TargetType.SHOP).targetId(shopId).build();
        when(reportRepository.findByRequestId(requestId)).thenReturn(repShop);
        when(shopRepository.findById(shopId)).thenReturn(Optional.of(shop));

        RequestResponse respShop = requestService.approveRequest(requestId, adminAccountId, "Duyệt shop");
        assertEquals(RequestStatus.APPROVED, respShop.getStatus());
        assertEquals(3, shopOwner.getViolationCount());
        assertEquals(ShopStatus.WARNED, shop.getStatus());
        assertEquals(DisciplineLevel.WARNED, shopOwner.getDisciplineLevel());

        // 2. Target SHOP not found
        when(shopRepository.findById(shopId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> requestService.approveRequest(requestId, adminAccountId, "Lỗi"));

        // 3. Target PRODUCT
        UUID prodId = UUID.randomUUID();
        Product prod = Product.builder().id(prodId).status(ProductStatus.DRAFT).flagged(true).reportCount(5).build();
        Report repProd = Report.builder().id(UUID.randomUUID()).targetType(TargetType.PRODUCT).targetId(prodId).build();
        when(reportRepository.findByRequestId(requestId)).thenReturn(repProd);
        when(productRepository.findById(prodId)).thenReturn(Optional.of(prod));

        requestService.approveRequest(requestId, adminAccountId, "Duyệt sp");
        assertEquals(ProductStatus.PUBLISHED, prod.getStatus());
        assertFalse(prod.isFlagged());
        assertEquals(0, prod.getReportCount());

        // 4. Target PRODUCT not found
        when(productRepository.findById(prodId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> requestService.approveRequest(requestId, adminAccountId, "Lỗi"));

        // 5. Target REVIEW
        UUID revId = UUID.randomUUID();
        Review rev = Review.builder().id(revId).status(ReviewStatus.HIDDEN).flagged(true).reportCount(3).build();
        Report repRev = Report.builder().id(UUID.randomUUID()).targetType(TargetType.REVIEW).targetId(revId).build();
        when(reportRepository.findByRequestId(requestId)).thenReturn(repRev);
        when(reviewRepository.findById(revId)).thenReturn(Optional.of(rev));

        requestService.approveRequest(requestId, adminAccountId, "Duyệt review");
        assertEquals(ReviewStatus.ACTIVE, rev.getStatus());

        // 6. Target REVIEW not found
        when(reviewRepository.findById(revId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> requestService.approveRequest(requestId, adminAccountId, "Lỗi"));

        // 7. Target USER
        UUID targetUserId = UUID.randomUUID();
        Account targetAcc = Account.builder().id(targetUserId).status(AccountStatus.BANNED).violationCount(5).build();
        Report repUser = Report.builder().id(UUID.randomUUID()).targetType(TargetType.USER).targetId(targetUserId).build();
        when(reportRepository.findByRequestId(requestId)).thenReturn(repUser);
        when(accountRepository.findById(targetUserId)).thenReturn(Optional.of(targetAcc));

        requestService.approveRequest(requestId, adminAccountId, "Duyệt user");
        assertEquals(AccountStatus.ACTIVE, targetAcc.getStatus());

        // 8. Target USER not found
        when(accountRepository.findById(targetUserId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> requestService.approveRequest(requestId, adminAccountId, "Lỗi"));

        // 9. Target ORDER -> restores shop violation count, escrow HELD, releases escrow & completes order
        UUID orderId = UUID.randomUUID();
        shopOwner.setViolationCount(2);
        Order ord = Order.builder().id(orderId).shop(shop).status(OrderStatus.DELIVERED).build();
        Escrow escrow = Escrow.builder().id(UUID.randomUUID()).status(EscrowStatus.DISPUTED).build();
        Report repOrder = Report.builder().id(UUID.randomUUID()).targetType(TargetType.ORDER).targetId(orderId).build();
        when(reportRepository.findByRequestId(requestId)).thenReturn(repOrder);
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(ord));
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(escrow));

        requestService.approveRequest(requestId, adminAccountId, "Duyệt kháng cáo đơn hàng");
        assertEquals(OrderStatus.COMPLETED, ord.getStatus());
        assertEquals(EscrowStatus.HELD, escrow.getStatus());
        verify(escrowService).releaseByOrder(orderId);

        // Order not found in approveRequest
        when(orderRepository.findById(orderId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> requestService.approveRequest(requestId, adminAccountId, "Lỗi order"));

        // 10. Admin not found
        when(accountRepository.findById(adminAccountId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> requestService.approveRequest(requestId, adminAccountId, "Lỗi admin"));

        // 11. Unsupported type for approve
        Request repReq = Request.builder().id(requestId).type(RequestType.REPORT).account(ownerAccount).build();
        when(requestRepository.findById(requestId)).thenReturn(Optional.of(repReq));
        assertThrows(CustomException.class, () -> requestService.approveRequest(requestId, adminAccountId, "Lỗi"));
    }

    @Test
    @DisplayName("createAppeal: Thành công và các điều kiện trùng đơn kháng cáo")
    void testCreateAppeal_AllBranches() {
        UUID accountId = UUID.randomUUID();
        when(accountRepository.findById(accountId)).thenReturn(Optional.of(ownerAccount));
        when(requestRepository.save(any())).thenAnswer(inv -> {
            Request r = inv.getArgument(0);
            r.setId(UUID.randomUUID());
            return r;
        });

        UUID reportId = UUID.randomUUID();
        CreateAppealRequest req1 = CreateAppealRequest.builder()
                .reportId(reportId)
                .targetType(TargetType.SHOP)
                .targetId(UUID.randomUUID())
                .description("Kháng cáo")
                .evidenceUrl("http://img.jpg")
                .build();

        when(reportRepository.findAppealsByViolationReportId(reportId)).thenReturn(Collections.emptyList());
        assertNotNull(requestService.createAppeal(accountId, req1));

        Report pendingRep = Report.builder().id(UUID.randomUUID()).request(Request.builder().status(RequestStatus.PENDING).build()).build();
        when(reportRepository.findAppealsByViolationReportId(reportId)).thenReturn(List.of(pendingRep));
        assertThrows(CustomException.class, () -> requestService.createAppeal(accountId, req1));

        Report rejectedRep = Report.builder().id(UUID.randomUUID()).request(Request.builder().status(RequestStatus.REJECTED).build()).build();
        when(reportRepository.findAppealsByViolationReportId(reportId)).thenReturn(List.of(rejectedRep));
        assertThrows(CustomException.class, () -> requestService.createAppeal(accountId, req1));

        Report approvedRep = Report.builder().id(UUID.randomUUID()).request(Request.builder().status(RequestStatus.APPROVED).build()).build();
        when(reportRepository.findAppealsByViolationReportId(reportId)).thenReturn(List.of(approvedRep));
        assertThrows(CustomException.class, () -> requestService.createAppeal(accountId, req1));

        // Appeal without reportId (targetId only)
        UUID targetId = UUID.randomUUID();
        CreateAppealRequest req2 = CreateAppealRequest.builder()
                .targetId(targetId)
                .description("Kháng cáo shop")
                .evidenceUrl("http://img.jpg")
                .build();

        when(reportRepository.findAppealsByAccountIdAndTargetId(accountId, targetId)).thenReturn(List.of(pendingRep));
        assertThrows(CustomException.class, () -> requestService.createAppeal(accountId, req2));

        when(reportRepository.findAppealsByAccountIdAndTargetId(accountId, targetId)).thenReturn(List.of(rejectedRep));
        assertThrows(CustomException.class, () -> requestService.createAppeal(accountId, req2));

        when(reportRepository.findAppealsByAccountIdAndTargetId(accountId, targetId)).thenReturn(List.of(approvedRep));
        assertThrows(CustomException.class, () -> requestService.createAppeal(accountId, req2));

        when(accountRepository.findById(accountId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> requestService.createAppeal(accountId, req1));
    }

    @Test
    @DisplayName("rejectRequest và autoRefundExpiredDisputedOrders")
    void testRejectRequest_AndAutoRefund() {
        when(accountRepository.findById(adminAccountId)).thenReturn(Optional.of(adminAccount));

        // 1. Appeal ORDER -> orchestrateCustomerWon (REFUND_ONLY & RETURN_AND_REFUND)
        UUID orderId = UUID.randomUUID();
        UUID origRepId = UUID.randomUUID();
        Request appealReq = Request.builder().id(requestId).type(RequestType.APPEAL).status(RequestStatus.PENDING).account(ownerAccount).build();
        when(requestRepository.findById(requestId)).thenReturn(Optional.of(appealReq));

        Report origReport = Report.builder().id(origRepId).targetType(TargetType.ORDER).targetId(orderId).resolutionType(ResolutionType.RETURN_AND_REFUND).build();
        Report repOrder = Report.builder().id(UUID.randomUUID()).targetType(TargetType.ORDER).targetId(orderId).violationReportId(origRepId).build();
        when(reportRepository.findByRequestId(requestId)).thenReturn(repOrder);
        when(reportRepository.findById(origRepId)).thenReturn(Optional.of(origReport));

        requestService.rejectRequest(adminAccountId, requestId, "Bác kháng cáo đơn hàng");
        verify(orderReturnService).createReturn(orderId, origRepId);

        origReport.setResolutionType(ResolutionType.REFUND_ONLY);
        requestService.rejectRequest(adminAccountId, requestId, "Bác kháng cáo hoàn tiền");
        verify(escrowService).refundByOrder(eq(orderId), anyString());

        // 2. Appeal PRODUCT -> sets DELETED & flagged & deleted
        UUID prodId = UUID.randomUUID();
        Product prod = Product.builder().id(prodId).status(ProductStatus.PUBLISHED).flagged(false).deleted(false).build();
        Report repProd = Report.builder().id(UUID.randomUUID()).targetType(TargetType.PRODUCT).targetId(prodId).build();
        when(reportRepository.findByRequestId(requestId)).thenReturn(repProd);
        when(productRepository.findById(prodId)).thenReturn(Optional.of(prod));

        RequestResponse resp = requestService.rejectRequest(adminAccountId, requestId, "Bác đơn sản phẩm");
        assertEquals(RequestStatus.REJECTED, resp.getStatus());
        assertEquals(ProductStatus.DELETED, prod.getStatus());

        // 3. autoRefundExpiredDisputedOrders
        Escrow escrow = Escrow.builder().id(UUID.randomUUID()).status(EscrowStatus.DISPUTED).build();
        when(reportRepository.findApprovedOrderReportsReviewedBefore(any())).thenReturn(List.of(origReport));
        when(reportRepository.findAppealsByViolationReportId(origRepId)).thenReturn(Collections.emptyList());
        when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(escrow));

        requestService.autoRefundExpiredDisputedOrders();
        verify(escrowService, atLeastOnce()).refundByOrder(eq(orderId), anyString());
    }

    @Test
    @DisplayName("getDetails: Chi tiết các loại target khác nhau và SELLER_REGISTRATION")
    void testGetDetails_AllTargetTypes() {
        Request req = Request.builder().id(requestId).type(RequestType.REPORT).status(RequestStatus.PENDING).account(ownerAccount).build();
        when(requestRepository.findById(requestId)).thenReturn(Optional.of(req));

        when(reportRepository.findByRequestId(requestId)).thenReturn(null);
        assertNull(requestService.getDetails(requestId).getDetail());

        UUID shopId = UUID.randomUUID();
        Shop shop = Shop.builder().id(shopId).name("Shop X").phoneNumber("0987654321").address("Hà Nội").build();
        Report repShop = Report.builder().id(UUID.randomUUID()).targetType(TargetType.SHOP).targetId(shopId).build();
        when(reportRepository.findByRequestId(requestId)).thenReturn(repShop);
        when(shopRepository.findById(shopId)).thenReturn(Optional.of(shop));
        assertInstanceOf(ReportDetailsResponse.class, requestService.getDetails(requestId).getDetail());

        UUID prodId = UUID.randomUUID();
        Product prod = Product.builder().id(prodId).name("Sản phẩm Y").sku("SKU-123").shop(shop).basePrice(new BigDecimal("500000")).build();
        Report repProd = Report.builder().id(UUID.randomUUID()).targetType(TargetType.PRODUCT).targetId(prodId).build();
        when(reportRepository.findByRequestId(requestId)).thenReturn(repProd);
        when(productRepository.findById(prodId)).thenReturn(Optional.of(prod));
        assertInstanceOf(ReportDetailsResponse.class, requestService.getDetails(requestId).getDetail());

        UUID accId = UUID.randomUUID();
        Account acc = Account.builder().id(accId).email("user@test.com").violationCount(2).status(AccountStatus.ACTIVE).build();
        Report repUser = Report.builder().id(UUID.randomUUID()).targetType(TargetType.USER).targetId(accId).build();
        when(reportRepository.findByRequestId(requestId)).thenReturn(repUser);
        when(accountRepository.findById(accId)).thenReturn(Optional.of(acc));
        assertInstanceOf(ReportDetailsResponse.class, requestService.getDetails(requestId).getDetail());

        UUID revId = UUID.randomUUID();
        Review rev = Review.builder().id(revId).rating(5).comment("Rất tốt").build();
        Report repRev = Report.builder().id(UUID.randomUUID()).targetType(TargetType.REVIEW).targetId(revId).build();
        when(reportRepository.findByRequestId(requestId)).thenReturn(repRev);
        when(reviewRepository.findById(revId)).thenReturn(Optional.of(rev));
        assertInstanceOf(ReportDetailsResponse.class, requestService.getDetails(requestId).getDetail());

        UUID orderId = UUID.randomUUID();
        Order order = Order.builder().id(orderId).orderNumber("ORD-999").shop(shop).user(User.builder().fullName("Người mua").build()).total(new BigDecimal("200000")).status(OrderStatus.DELIVERED).build();
        OrderReturnResponse retDto = OrderReturnResponse.builder().status(ReturnStatus.WAITING_FOR_SHIPMENT).conditionStatus(ReturnConditionStatus.INTACT).build();
        Report repOrder = Report.builder().id(UUID.randomUUID()).targetType(TargetType.ORDER).targetId(orderId).build();
        when(reportRepository.findByRequestId(requestId)).thenReturn(repOrder);
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(orderReturnService.getReturnByOrderId(orderId)).thenReturn(retDto);
        ReportDetailsResponse orderDetail = (ReportDetailsResponse) requestService.getDetails(requestId).getDetail();
        assertTrue(orderDetail.getTargetInfo().contains("Kiện hoàn"));

        Request sellerReq = Request.builder().id(requestId).type(RequestType.SELLER_REGISTRATION).account(ownerAccount).build();
        when(requestRepository.findById(requestId)).thenReturn(Optional.of(sellerReq));
        when(sellerRepository.findByRequestId(requestId)).thenReturn(null);
        assertThrows(CustomException.class, () -> requestService.getDetails(requestId));

        when(requestRepository.findById(requestId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> requestService.getDetails(requestId));

        // Additional autoRefundExpiredDisputedOrders branches (null targetId, APPROVED appeal, exception catch)
        Report nullTargetRep = Report.builder().id(UUID.randomUUID()).targetId(null).build();
        Report approvedAppealRep = Report.builder().id(UUID.randomUUID()).targetId(UUID.randomUUID()).build();
        Report errRep = Report.builder().id(UUID.randomUUID()).targetId(UUID.randomUUID()).build();

        when(reportRepository.findApprovedOrderReportsReviewedBefore(any())).thenReturn(List.of(nullTargetRep, approvedAppealRep, errRep));
        Report appAppeal = Report.builder().id(UUID.randomUUID()).request(Request.builder().status(RequestStatus.APPROVED).build()).build();
        when(reportRepository.findAppealsByViolationReportId(approvedAppealRep.getId())).thenReturn(List.of(appAppeal));
        when(reportRepository.findAppealsByViolationReportId(errRep.getId())).thenThrow(new RuntimeException("DB err"));

        requestService.autoRefundExpiredDisputedOrders();
    }
}
