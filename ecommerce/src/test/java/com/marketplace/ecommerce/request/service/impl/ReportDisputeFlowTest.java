package com.marketplace.ecommerce.request.service.impl;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.auth.service.AccountDisciplineService;
import com.marketplace.ecommerce.chat.service.ChatService;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.notification.repository.NotificationRepository;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.review.repository.ReviewRepository;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.shop.service.ShopEscrowFundService;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.repository.OrderReturnRepository;
import com.marketplace.ecommerce.order.service.OrderReturnService;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.payment.entity.Escrow;
import com.marketplace.ecommerce.payment.repository.EscrowRepository;
import com.marketplace.ecommerce.payment.service.EscrowService;
import com.marketplace.ecommerce.payment.valueObjects.EscrowStatus;
import com.marketplace.ecommerce.request.dto.request.CreateReportRequest;
import com.marketplace.ecommerce.request.dto.request.EscalateReportRequest;
import com.marketplace.ecommerce.request.dto.request.HandleReportRequest;
import com.marketplace.ecommerce.request.dto.request.SellerDisputeRespondRequest;
import com.marketplace.ecommerce.request.dto.response.CreateRequestResponse;
import com.marketplace.ecommerce.request.entity.Report;
import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.policy.RequestPolicy;
import com.marketplace.ecommerce.request.repository.ReportRepository;
import com.marketplace.ecommerce.request.repository.RequestRepository;
import com.marketplace.ecommerce.request.service.RequestService;
import com.marketplace.ecommerce.platform.policy.dto.PlatformPolicyResponse;
import com.marketplace.ecommerce.platform.policy.service.PlatformPolicyService;
import com.marketplace.ecommerce.request.valueObjects.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReportDisputeFlowTest {

        @Mock
        private RequestService requestService;
        @Mock
        private RequestRepository requestRepository;
        @Mock
        private ReportRepository reportRepository;
        @Mock
        private AccountRepository accountRepository;
        @Mock
        private RequestPolicy requestPolicy;
        @Mock
        private PlatformPolicyService platformPolicyService;
        @Mock
        private OrderRepository orderRepository;
        @Mock
        private EscrowRepository escrowRepository;
        @Mock
        private OrderReturnRepository orderReturnRepository;
        @Mock
        private EscrowService escrowService;
        @Mock
        private OrderReturnService orderReturnService;
        @Mock
        private UserRepository userRepository;
        @Mock
        private NotificationRepository notificationRepository;
        @Mock
        private ShopEscrowFundService shopEscrowFundService;
        @Mock
        private ShopRepository shopRepository;
        @Mock
        private ReviewRepository reviewRepository;
        @Mock
        private ProductRepository productRepository;
        @Mock
        private ChatService chatService;

        @Mock
        private AccountDisciplineService accountDisciplineService;

        @InjectMocks
        private ReportServiceImpl reportService;

        private UUID buyerAccountId;
        private UUID sellerAccountId;
        private UUID adminAccountId;
        private UUID orderId;
        private UUID reportId;
        private Account buyerAccount;
        private Account adminAccount;
        private Request requestEntity;
        private Report reportEntity;
        private Escrow escrowEntity;
        private Order orderEntity;

        @BeforeEach
        void setUp() {
                ReflectionTestUtils.setField(reportService, "platformPolicyService", platformPolicyService);

                buyerAccountId = UUID.randomUUID();
                sellerAccountId = UUID.randomUUID();
                adminAccountId = UUID.randomUUID();
                orderId = UUID.randomUUID();
                reportId = UUID.randomUUID();

                buyerAccount = Account.builder().id(buyerAccountId).build();
                adminAccount = Account.builder().id(adminAccountId).build();

                requestEntity = Request.builder()
                                .id(reportId)
                                .account(buyerAccount)
                                .type(RequestType.REPORT)
                                .status(RequestStatus.PENDING)
                                .description("Hàng không đúng mô tả")
                                .build();

                reportEntity = Report.builder()
                                .id(reportId)
                                .request(requestEntity)
                                .targetType(TargetType.ORDER)
                                .targetId(orderId)
                                .stage(ReportStage.DIRECT_NEGOTIATION)
                                .sellerResponseDeadline(LocalDateTime.now().plusHours(48))
                                .build();

                escrowEntity = Escrow.builder()
                                .id(UUID.randomUUID())
                                .status(EscrowStatus.HELD)
                                .build();

                orderEntity = Order.builder()
                                .id(orderId)
                                .status(OrderStatus.DELIVERED)
                                .build();

                lenient().when(accountDisciplineService.checkAndReconcileSuspension(any(Account.class),
                                any(LocalDateTime.class)))
                                .thenAnswer(i -> i.getArgument(0));
        }

        @Test
        @DisplayName("B1: Tạo Report cho ORDER -> Chuyển vào DIRECT_NEGOTIATION, Escrow thành DISPUTED, có SLA 48h")
        void createReport_ForOrder_EntersDirectNegotiation() {
                CreateReportRequest req = CreateReportRequest.builder()
                                .targetId(orderId)
                                .description("Thiết bị bị móp cấn góc")
                                .build();

                when(accountRepository.findById(buyerAccountId)).thenReturn(Optional.of(buyerAccount));
                when(requestPolicy.resolve(orderId)).thenReturn(TargetType.ORDER);
                when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(escrowEntity));
                when(requestService.createRequest(eq(buyerAccount), any())).thenReturn(requestEntity);

                CreateRequestResponse response = reportService.createReport(buyerAccountId, req);

                assertNotNull(response);
                verify(requestPolicy).validateOrderReport(buyerAccountId, orderId);
                assertEquals(EscrowStatus.DISPUTED, escrowEntity.getStatus(),
                                "Escrow phải chuyển sang DISPUTED để tạm khóa");
                verify(reportRepository).save(argThat(r -> r.getStage() == ReportStage.DIRECT_NEGOTIATION &&
                                r.getSellerResponseDeadline() != null &&
                                r.getTargetType() == TargetType.ORDER));
        }

        @Test
        @DisplayName("B1: Tạo Report cho PRODUCT (Out-flow) -> Chuyển thẳng sang ESCALATED_TO_ADMIN")
        void createReport_ForProduct_EntersAdminQueue() {
                UUID productId = UUID.randomUUID();
                CreateReportRequest req = CreateReportRequest.builder()
                                .targetId(productId)
                                .description("Sản phẩm nghi vấn hàng giả")
                                .build();

                when(accountRepository.findById(buyerAccountId)).thenReturn(Optional.of(buyerAccount));
                when(requestPolicy.resolve(productId)).thenReturn(TargetType.PRODUCT);
                when(requestService.createRequest(eq(buyerAccount), any())).thenReturn(requestEntity);

                CreateRequestResponse response = reportService.createReport(buyerAccountId, req);

                assertNotNull(response);
                verify(reportRepository).save(argThat(r -> r.getStage() == ReportStage.ESCALATED_TO_ADMIN &&
                                r.getTargetType() == TargetType.PRODUCT));
        }

        @Test
        @DisplayName("B2: Buyer chủ động hủy khiếu nại -> Case CANCELLED, Escrow phục hồi HELD an toàn")
        void cancelReport_Success_RestoresEscrowHeld() {
                when(reportRepository.findByIdForUpdate(reportId)).thenReturn(Optional.of(reportEntity));
                when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(escrowEntity));
                escrowEntity.setStatus(EscrowStatus.DISPUTED);
                when(reportRepository.hasActiveOrderDispute(orderId)).thenReturn(false);

                reportService.cancelReport(buyerAccountId, reportId);

                assertEquals(ReportStage.CANCELLED, reportEntity.getStage());
                assertEquals(RequestStatus.REJECTED, requestEntity.getStatus());
                assertEquals(EscrowStatus.HELD, escrowEntity.getStatus(),
                                "Escrow phải được phục hồi an toàn về HELD khi không còn tranh chấp nào");
                verify(reportRepository).save(reportEntity);
                verify(requestRepository).save(requestEntity);
        }

        @Test
        @DisplayName("B2: Seller đồng ý hoàn tiền (ACCEPT_REFUND) -> Case RESOLVED, hoàn tiền cho buyer, không phạt uy tín")
        void sellerRespond_AcceptRefund_Success() {
                SellerDisputeRespondRequest req = SellerDisputeRespondRequest.builder()
                                .action(DisputeSellerAction.ACCEPT_REFUND)
                                .responseNote("Shop đồng ý hoàn tiền cho bạn")
                                .build();

                when(reportRepository.findByIdForUpdate(reportId)).thenReturn(Optional.of(reportEntity));
                when(requestPolicy.resolveTargetAccountId(TargetType.ORDER, orderId)).thenReturn(sellerAccountId);
                when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(orderEntity));

                reportService.sellerRespond(sellerAccountId, reportId, req);

                assertEquals(ReportStage.RESOLVED, reportEntity.getStage());
                assertEquals(ResolutionType.REFUND_ONLY, reportEntity.getResolutionType());
                assertEquals(OrderStatus.REFUNDED, orderEntity.getStatus());
                verify(escrowService).refundMerchandiseOnly(eq(orderId), any());
                verify(reportRepository).save(reportEntity);
        }

        @Test
        @DisplayName("B2: Seller đồng ý đổi trả (ACCEPT_RETURN) -> Case RETURN_IN_PROGRESS (chưa đóng RESOLVED)")
        void sellerRespond_AcceptReturn_EntersReturnInProgress() {
                SellerDisputeRespondRequest req = SellerDisputeRespondRequest.builder()
                                .action(DisputeSellerAction.ACCEPT_RETURN)
                                .responseNote("Shop đồng ý nhận lại máy để đổi mới")
                                .build();

                when(reportRepository.findByIdForUpdate(reportId)).thenReturn(Optional.of(reportEntity));
                when(requestPolicy.resolveTargetAccountId(TargetType.ORDER, orderId)).thenReturn(sellerAccountId);

                reportService.sellerRespond(sellerAccountId, reportId, req);

                assertEquals(ReportStage.RETURN_IN_PROGRESS, reportEntity.getStage(),
                                "Phải ở trạng thái trung gian RETURN_IN_PROGRESS, không được đóng case sớm");
                assertEquals(ResolutionType.RETURN_AND_REFUND, reportEntity.getResolutionType());
                verify(orderReturnService).createReturn(orderId, reportId);
                verify(reportRepository).save(reportEntity);
        }

        @Test
        @DisplayName("B2.1: Khi Buyer đã chuyển ESCALATED_TO_ADMIN -> Seller vẫn được phép gửi giải trình và bằng chứng cho Admin")
        void sellerRespond_AllowsExplanationAndEvidence_WhenEscalatedToAdmin() {
                reportEntity.setStage(ReportStage.ESCALATED_TO_ADMIN);
                SellerDisputeRespondRequest req = SellerDisputeRespondRequest.builder()
                                .action(DisputeSellerAction.REJECT_AND_ESCALATE)
                                .responseNote("Shop đã quay video đóng hàng niêm phong, kiện hàng đủ phụ kiện")
                                .evidenceUrl("https://minio.example.com/disputes/package_video.mp4")
                                .build();

                when(reportRepository.findByIdForUpdate(reportId)).thenReturn(Optional.of(reportEntity));
                when(requestPolicy.resolveTargetAccountId(TargetType.ORDER, orderId)).thenReturn(sellerAccountId);

                reportService.sellerRespond(sellerAccountId, reportId, req);

                assertEquals(ReportStage.ESCALATED_TO_ADMIN, reportEntity.getStage());
                assertEquals("Shop đã quay video đóng hàng niêm phong, kiện hàng đủ phụ kiện",
                                reportEntity.getSellerResponse());
                assertEquals("https://minio.example.com/disputes/package_video.mp4",
                                reportEntity.getSellerEvidenceUrl());
                assertEquals(DisputeSellerAction.REJECT_AND_ESCALATE, reportEntity.getSellerAction());
                verify(reportRepository).save(reportEntity);
        }

        @Test
        @DisplayName("B2: Seller từ chối hoặc Buyer yêu cầu can thiệp -> Case chuyển sang ESCALATED_TO_ADMIN")
        void escalateReport_Success() {
                EscalateReportRequest req = EscalateReportRequest.builder()
                                .reason("Hai bên không thương lượng được")
                                .build();

                when(reportRepository.findByIdForUpdate(reportId)).thenReturn(Optional.of(reportEntity));
                when(requestPolicy.resolveTargetAccountId(TargetType.ORDER, orderId)).thenReturn(sellerAccountId);

                reportService.escalateReport(buyerAccountId, reportId, req);

                assertEquals(ReportStage.ESCALATED_TO_ADMIN, reportEntity.getStage());
                assertNotNull(reportEntity.getEscalatedAt());
                assertEquals(buyerAccountId, reportEntity.getEscalatedByAccountId());
                verify(reportRepository).save(reportEntity);
        }

        @Test
        @DisplayName("B3: Admin bác bỏ khiếu nại (REJECT) -> Bảo vệ Shop, giải ngân an toàn releaseByOrder")
        void handleReport_AdminReject_ReleasesMoneyToShop() {
                HandleReportRequest req = HandleReportRequest.builder()
                                .decision(ReportDecision.REJECT)
                                .policyClauseCode("RETURN_REFUND_COMPLAINT_POLICY")
                                .note("Bằng chứng không đủ căn cứ")
                                .build();

                reportEntity.setStage(ReportStage.ESCALATED_TO_ADMIN);
                when(accountRepository.findById(adminAccountId)).thenReturn(Optional.of(adminAccount));
                when(reportRepository.findByRequestId(reportId)).thenReturn(reportEntity);
                when(orderReturnRepository.findByOrderId(orderId)).thenReturn(Optional.empty());
                when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(orderEntity));

                PlatformPolicyResponse policyResp = PlatformPolicyResponse.builder()
                                .policyKey("RETURN_REFUND_COMPLAINT_POLICY")
                                .title("Quy Trình 4 Bước Xử Lý Khiếu Nại, Đổi Trả & Hoàn Tiền")
                                .category("RETURN_REFUND")
                                .isActive(true)
                                .build();
                when(platformPolicyService.validateDisputeClause(eq("RETURN_REFUND_COMPLAINT_POLICY"),
                                eq("REJECT"), eq(false)))
                                .thenReturn(policyResp);

                reportService.handleReport(adminAccountId, reportId, req);

                assertEquals(ReportStage.CLOSED, reportEntity.getStage());
                assertEquals(RequestStatus.REJECTED, requestEntity.getStatus());
                assertEquals("RETURN_REFUND_COMPLAINT_POLICY", reportEntity.getPolicyClauseCode());
                assertEquals("Quy Trình 4 Bước Xử Lý Khiếu Nại, Đổi Trả & Hoàn Tiền", reportEntity.getPolicyClauseTitle());
                assertTrue(orderEntity.isReceivedByBuyer());
                assertEquals(OrderStatus.COMPLETED, orderEntity.getStatus());
                verify(escrowService).releaseByOrder(orderId);
        }

        @Test
        @DisplayName("B2 Guard: Admin can thiệp sớm khi đang thương lượng 1:1 -> Chặn đứng ném CustomException")
        void handleReport_ThrowsWhenNotEscalatedToAdmin() {
                HandleReportRequest req = HandleReportRequest.builder()
                                .decision(ReportDecision.REJECT)
                                .note("Bác bỏ sớm")
                                .build();

                reportEntity.setStage(ReportStage.DIRECT_NEGOTIATION);
                when(accountRepository.findById(adminAccountId)).thenReturn(Optional.of(adminAccount));
                when(reportRepository.findByRequestId(reportId)).thenReturn(reportEntity);

                assertThrows(CustomException.class, () -> reportService.handleReport(adminAccountId, reportId, req));
        }
}
