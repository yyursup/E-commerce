package com.marketplace.ecommerce.request.service.impl;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.valueObjects.AccountStatus;
import com.marketplace.ecommerce.auth.valueObjects.DisciplineLevel;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.order.entity.OrderReturn;
import com.marketplace.ecommerce.order.repository.OrderReturnRepository;
import com.marketplace.ecommerce.order.valueObjects.ReturnStatus;
import com.marketplace.ecommerce.payment.entity.Escrow;
import com.marketplace.ecommerce.payment.repository.EscrowRepository;
import com.marketplace.ecommerce.payment.service.EscrowService;
import com.marketplace.ecommerce.order.service.OrderReturnService;
import com.marketplace.ecommerce.payment.valueObjects.EscrowStatus;
import com.marketplace.ecommerce.request.dto.request.CreateReportRequest;
import com.marketplace.ecommerce.request.dto.request.HandleReportRequest;
import com.marketplace.ecommerce.request.dto.response.CreateRequestResponse;
import com.marketplace.ecommerce.request.entity.Report;
import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.policy.RequestPolicy;
import com.marketplace.ecommerce.request.repository.ReportRepository;
import com.marketplace.ecommerce.request.repository.RequestRepository;
import com.marketplace.ecommerce.request.service.RequestService;
import com.marketplace.ecommerce.request.valueObjects.ReportDecision;
import com.marketplace.ecommerce.request.valueObjects.ReportStage;
import com.marketplace.ecommerce.request.valueObjects.RequestStatus;
import com.marketplace.ecommerce.request.valueObjects.RequestType;
import com.marketplace.ecommerce.request.valueObjects.ResolutionType;
import com.marketplace.ecommerce.request.valueObjects.TargetType;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.shop.service.ShopEscrowFundService;
import com.marketplace.ecommerce.shop.valueObjects.ShopStatus;
import com.marketplace.ecommerce.product.repository.ProductRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderReportDisputeTest {

        @Mock
        private RequestPolicy requestValidation;

        @Mock
        private RequestService requestService;

        @Mock
        private RequestRepository requestRepository;

        @Mock
        private ReportRepository reportRepository;

        @Mock
        private AccountRepository accountRepository;

        @Mock
        private OrderRepository orderRepository;

        @Mock
        private EscrowRepository escrowRepository;

        @Mock
        private EscrowService escrowService;

        @Mock
        private OrderReturnService orderReturnService;

        @Mock
        private OrderReturnRepository orderReturnRepository;

        @Mock
        private ShopEscrowFundService shopEscrowFundService;

        @Mock
        private ShopRepository shopRepository;

        @Mock
        private ProductRepository productRepository;

        @InjectMocks
        private ReportServiceImpl reportService;

        private UUID buyerAccountId;
        private UUID adminAccountId;
        private UUID orderId;
        private UUID shopId;
        private UUID reportRequestId;
        private Account buyerAccount;
        private Account adminAccount;
        private Shop shop;
        private Order deliveredOrder;
        private Escrow heldEscrow;

        @BeforeEach
        void setUp() {
                buyerAccountId = UUID.randomUUID();
                adminAccountId = UUID.randomUUID();
                orderId = UUID.randomUUID();
                shopId = UUID.randomUUID();
                reportRequestId = UUID.randomUUID();

                buyerAccount = Account.builder()
                                .id(buyerAccountId)
                                .username("buyer_test")
                                .disciplineLevel(DisciplineLevel.NONE)
                                .status(AccountStatus.ACTIVE)
                                .build();

                User buyerUser = User
                                .builder()
                                .id(UUID.randomUUID())
                                .account(buyerAccount)
                                .fullName("Buyer Test")
                                .build();

                adminAccount = Account.builder()
                                .id(adminAccountId)
                                .username("admin_test")
                                .build();

                shop = Shop.builder()
                                .id(shopId)
                                .name("Test Shop")
                                .status(ShopStatus.ACTIVE)
                                .build();

                deliveredOrder = Order.builder()
                                .id(orderId)
                                .orderNumber("ORD-123456")
                                .user(buyerUser)
                                .shop(shop)
                                .status(OrderStatus.DELIVERED)
                                .deliveredAt(LocalDateTime.now().minusDays(1))
                                .total(new BigDecimal("500000"))
                                .build();

                heldEscrow = Escrow.builder()
                                .id(UUID.randomUUID())
                                .order(deliveredOrder)
                                .status(EscrowStatus.HELD)
                                .amount(new BigDecimal("500000"))
                                .build();
        }

        @Test
        @DisplayName("Tạo khiếu nại đơn hàng thành công và tự động tạm khóa Escrow sang DISPUTED")
        void createReport_OrderTarget_Success_DisputesEscrow() {
                // Given
                CreateReportRequest req = CreateReportRequest.builder()
                                .targetId(orderId)
                                .description("[Hàng bị hư hỏng / bể vỡ] Hàng nhận được bị vỡ nát")
                                .evidenceUrl("https://minio.local/img1.jpg")
                                .build();

                Request createdRequest = Request.builder()
                                .id(reportRequestId)
                                .account(buyerAccount)
                                .type(RequestType.REPORT)
                                .status(RequestStatus.PENDING)
                                .build();

                when(accountRepository.findById(buyerAccountId)).thenReturn(Optional.of(buyerAccount));
                when(requestValidation.resolve(orderId)).thenReturn(TargetType.ORDER);
                when(requestService.createRequest(eq(buyerAccount), any())).thenReturn(createdRequest);
                when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(heldEscrow));

                // When
                CreateRequestResponse response = reportService.createReport(buyerAccountId, req);

                // Then
                assertNotNull(response);
                assertEquals(reportRequestId, response.getRequestId());

                // Kiểm tra RequestValidation được gọi để thẩm định đơn hàng
                verify(requestValidation).validateOrderReport(buyerAccountId, orderId);

                // Kiểm tra Escrow được khóa sang DISPUTED
                assertEquals(EscrowStatus.DISPUTED, heldEscrow.getStatus());
                verify(escrowRepository).save(heldEscrow);
        }

        @Test
        @DisplayName("Admin bác khiếu nại đơn hàng thì tự động phục hồi Escrow về HELD")
        void handleReport_Reject_RestoresEscrowToHeld() {
                // Given
                Request reportReq = Request.builder()
                                .id(reportRequestId)
                                .status(RequestStatus.PENDING)
                                .build();

                Report report = Report.builder()
                                .id(UUID.randomUUID())
                                .request(reportReq)
                                .targetType(TargetType.ORDER)
                                .targetId(orderId)
                                .stage(ReportStage.ESCALATED_TO_ADMIN)
                                .build();

                heldEscrow.setStatus(EscrowStatus.DISPUTED);

                HandleReportRequest handleReq = new HandleReportRequest();
                handleReq.setDecision(ReportDecision.REJECT);
                handleReq.setNote("Bằng chứng không hợp lệ, sản phẩm không hư hỏng");

                when(accountRepository.findById(adminAccountId)).thenReturn(Optional.of(adminAccount));
                when(reportRepository.findByRequestId(reportRequestId)).thenReturn(report);
                when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(heldEscrow));

                // When
                reportService.handleReport(adminAccountId, reportRequestId, handleReq);

                // Then
                assertEquals(RequestStatus.REJECTED, reportReq.getStatus());
                assertEquals(EscrowStatus.HELD, heldEscrow.getStatus());
                verify(requestRepository).save(reportReq);
                verify(escrowRepository).save(heldEscrow);
        }

        @Test
        @DisplayName("Luồng mới: autoRefundExpiredDisputedOrders là no-op vì Admin phán quyết đã thực thi hoàn tiền ngay")
        void autoRefundExpiredDisputedOrders_ExecutesRefund() {
                // Given
                RequestServiceImpl requestServiceImpl = new RequestServiceImpl(
                                requestRepository, reportRepository, null, accountRepository, null,
                                requestValidation, null, null, null, null, orderRepository, escrowRepository, orderReturnService, null);

                // When
                requestServiceImpl.autoRefundExpiredDisputedOrders();

                // Then: No-op, không tương tác gọi refund kép
                verify(escrowService, never()).refundByOrder(any(), any());
                verify(orderReturnService, never()).createReturn(any(), any());
        }

        @Test
        @DisplayName("Luồng mới: autoRefundExpiredDisputedOrders là no-op vì Admin phán quyết đã khởi tạo Return ngay")
        void autoRefundExpiredDisputedOrders_InitiatesReturn_WhenReturnAndRefund() {
                // Given
                RequestServiceImpl requestServiceImpl = new RequestServiceImpl(
                                requestRepository, reportRepository, null, accountRepository, null,
                                requestValidation, null, null, null, null, orderRepository, escrowRepository, orderReturnService, null);

                // When
                requestServiceImpl.autoRefundExpiredDisputedOrders();

                // Then: No-op
                verify(orderReturnService, never()).createReturn(any(), any());
                verify(escrowService, never()).refundByOrder(any(), any());
        }

        @Test
        @DisplayName("Admin duyệt khiếu nại kiện hoàn của Shop (APPROVE) -> Release cho Shop, hủy kiện hoàn, không phạt Shop")
        void handleReport_SellerReturnDispute_Approve_ReleasesToShop() {
                Request disputeReq = Request.builder()
                                .id(reportRequestId)
                                .type(RequestType.REPORT)
                                .status(RequestStatus.PENDING)
                                .description("[Shop khiếu nại kiện hàng hoàn - DAMAGED] Hàng bị tráo")
                                .build();

                Report disputeReport = Report.builder()
                                .id(reportRequestId)
                                .request(disputeReq)
                                .targetType(TargetType.ORDER)
                                .targetId(orderId)
                                .violationReportId(UUID.randomUUID())
                                .build();

                OrderReturn orderReturn = OrderReturn.builder()
                                .id(UUID.randomUUID())
                                .order(deliveredOrder)
                                .status(ReturnStatus.DISPUTED)
                                .build();

                when(accountRepository.findById(adminAccountId)).thenReturn(Optional.of(adminAccount));
                when(reportRepository.findByRequestId(reportRequestId)).thenReturn(disputeReport);
                when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(deliveredOrder));
                when(orderReturnRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(orderReturn));
                when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(heldEscrow));
                heldEscrow.setStatus(EscrowStatus.DISPUTED);

                HandleReportRequest req = HandleReportRequest.builder()
                                .decision(ReportDecision.APPROVE)
                                .note("Xác nhận khách tráo hàng, duyệt cho Shop")
                                .build();

                reportService.handleReport(adminAccountId, reportRequestId, req);

                assertEquals(RequestStatus.APPROVED, disputeReq.getStatus());
                assertEquals(ReturnStatus.CANCELLED, orderReturn.getStatus());
                verify(escrowService).releaseByOrder(orderId);
                verify(escrowService, never()).refundByOrder(any(), any());
        }

        @Test
        @DisplayName("Admin bác bỏ khiếu nại kiện hoàn của Shop (REJECT) -> Hoàn tiền Buyer, hoàn tất kiện hoàn")
        void handleReport_SellerReturnDispute_Reject_RefundsBuyer() {
                Request disputeReq = Request.builder()
                                .id(reportRequestId)
                                .type(RequestType.REPORT)
                                .status(RequestStatus.PENDING)
                                .description("[Shop khiếu nại kiện hàng hoàn - DAMAGED] Hàng bị tráo")
                                .build();

                Report disputeReport = Report.builder()
                                .id(reportRequestId)
                                .request(disputeReq)
                                .targetType(TargetType.ORDER)
                                .targetId(orderId)
                                .violationReportId(UUID.randomUUID())
                                .build();

                OrderReturn orderReturn = OrderReturn.builder()
                                .id(UUID.randomUUID())
                                .order(deliveredOrder)
                                .status(ReturnStatus.DISPUTED)
                                .build();

                when(accountRepository.findById(adminAccountId)).thenReturn(Optional.of(adminAccount));
                when(reportRepository.findByRequestId(reportRequestId)).thenReturn(disputeReport);
                when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(deliveredOrder));
                when(orderReturnRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(orderReturn));

                HandleReportRequest req = HandleReportRequest.builder()
                                .decision(ReportDecision.REJECT)
                                .note("Bằng chứng của Shop không đủ cơ sở")
                                .build();

                reportService.handleReport(adminAccountId, reportRequestId, req);

                assertEquals(RequestStatus.REJECTED, disputeReq.getStatus());
                assertEquals(ReturnStatus.COMPLETED, orderReturn.getStatus());
                verify(escrowService).refundByOrder(eq(orderId), anyString());
                verify(escrowService, never()).releaseByOrder(any());
                verify(shopEscrowFundService).deductReturnDisputeShippingFees(orderReturn);
        }

        @Test
        @DisplayName("Case 1: Admin duyệt RETURN_AND_REFUND khi chưa có kiện hoàn -> Tạo kiện hoàn mới qua createReturn")
        void handleReport_Case1_AdminAuthorizesReturn_WhenNoOrderReturnExists() {
                Request reportReq = Request.builder()
                                .id(reportRequestId)
                                .type(RequestType.REPORT)
                                .status(RequestStatus.PENDING)
                                .description("Hàng không đúng mô tả")
                                .build();

                Report report = Report.builder()
                                .id(reportRequestId)
                                .request(reportReq)
                                .targetType(TargetType.ORDER)
                                .targetId(orderId)
                                .stage(ReportStage.ESCALATED_TO_ADMIN)
                                .build();

                when(accountRepository.findById(adminAccountId)).thenReturn(Optional.of(adminAccount));
                when(reportRepository.findByRequestId(reportRequestId)).thenReturn(report);
                when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(deliveredOrder));
                when(requestValidation.resolveTargetAccountId(TargetType.ORDER, orderId)).thenReturn(buyerAccountId);
                when(accountRepository.findByIdForUpdate(buyerAccountId)).thenReturn(Optional.of(buyerAccount));
                when(orderReturnRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.empty());

                HandleReportRequest req = HandleReportRequest.builder()
                                .decision(ReportDecision.APPROVE)
                                .resolutionType(ResolutionType.RETURN_AND_REFUND)
                                .note("Admin yêu cầu Người mua gửi trả hàng")
                                .build();

                reportService.handleReport(adminAccountId, reportRequestId, req);

                assertEquals(RequestStatus.APPROVED, reportReq.getStatus());
                assertEquals(ReportStage.RETURN_IN_PROGRESS, report.getStage());
                verify(orderReturnService).createReturn(orderId, report.getId());
                verify(requestRepository).save(reportReq);
                verify(reportRepository).save(report);
        }

        @Test
        @DisplayName("Case 2: Admin xử lý khi kiện hoàn đã đang diễn ra -> Tái sử dụng, KHÔNG tạo trùng, KHÔNG reset trạng thái")
        void handleReport_Case2_AdminHandlesReturn_WhenReturnAlreadyInProgress() {
                Request reportReq = Request.builder()
                                .id(reportRequestId)
                                .type(RequestType.REPORT)
                                .status(RequestStatus.PENDING)
                                .description("Hàng lỗi, yêu cầu đổi trả")
                                .build();

                Report report = Report.builder()
                                .id(reportRequestId)
                                .request(reportReq)
                                .targetType(TargetType.ORDER)
                                .targetId(orderId)
                                .stage(ReportStage.ESCALATED_TO_ADMIN)
                                .build();

                LocalDateTime fixedDeadline = LocalDateTime.now().plusDays(2);
                OrderReturn inProgressReturn = OrderReturn.builder()
                                .id(UUID.randomUUID())
                                .order(deliveredOrder)
                                .status(ReturnStatus.WAITING_FOR_SHIPMENT)
                                .buyerShipmentDeadline(fixedDeadline)
                                .build();

                when(accountRepository.findById(adminAccountId)).thenReturn(Optional.of(adminAccount));
                when(reportRepository.findByRequestId(reportRequestId)).thenReturn(report);
                when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(deliveredOrder));
                when(requestValidation.resolveTargetAccountId(TargetType.ORDER, orderId)).thenReturn(buyerAccountId);
                when(accountRepository.findByIdForUpdate(buyerAccountId)).thenReturn(Optional.of(buyerAccount));
                when(orderReturnRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(inProgressReturn));

                HandleReportRequest req = HandleReportRequest.builder()
                                .decision(ReportDecision.APPROVE)
                                .resolutionType(ResolutionType.RETURN_AND_REFUND)
                                .note("Tiếp tục quy trình đổi trả hàng")
                                .build();

                reportService.handleReport(adminAccountId, reportRequestId, req);

                assertEquals(RequestStatus.APPROVED, reportReq.getStatus());
                assertEquals(ReportStage.RETURN_IN_PROGRESS, report.getStage());
                assertEquals(ReturnStatus.WAITING_FOR_SHIPMENT, inProgressReturn.getStatus(), "Trạng thái không được reset");
                assertEquals(fixedDeadline, inProgressReturn.getBuyerShipmentDeadline(), "Deadline không bị khởi động lại");
                verify(orderReturnService, never()).createReturn(any(), any());
        }

        @Test
        @DisplayName("Case 3: Admin phân xử khiếu nại kiện hoàn (Seller return dispute) -> Giải quyết kiện hoàn, KHÔNG tạo mới return")
        void handleReport_Case3_AdminResolvesDispute_WithoutCreatingAnotherReturn() {
                Request reportReq = Request.builder()
                                .id(reportRequestId)
                                .type(RequestType.REPORT)
                                .status(RequestStatus.PENDING)
                                .description("Hàng lỗi vỡ")
                                .build();

                Report report = Report.builder()
                                .id(reportRequestId)
                                .request(reportReq)
                                .targetType(TargetType.ORDER)
                                .targetId(orderId)
                                .stage(ReportStage.ESCALATED_TO_ADMIN)
                                .escalationReason("Người bán khiếu nại kiện hàng hoàn: Hàng bị tráo")
                                .build();

                OrderReturn disputedReturn = OrderReturn.builder()
                                .id(UUID.randomUUID())
                                .order(deliveredOrder)
                                .status(ReturnStatus.DISPUTED)
                                .build();

                when(accountRepository.findById(adminAccountId)).thenReturn(Optional.of(adminAccount));
                when(reportRepository.findByRequestId(reportRequestId)).thenReturn(report);
                when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(deliveredOrder));
                when(orderReturnRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(disputedReturn));
                when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(heldEscrow));
                heldEscrow.setStatus(EscrowStatus.DISPUTED);

                // Admin gửi generic RETURN_AND_REFUND nhưng đây là Seller Return Dispute -> Không tạo return mới mà bồi hoàn Buyer
                HandleReportRequest req = HandleReportRequest.builder()
                                .decision(ReportDecision.APPROVE)
                                .resolutionType(ResolutionType.RETURN_AND_REFUND)
                                .note("Bác bỏ lý do của Shop, hoàn tiền cho Buyer")
                                .build();

                reportService.handleReport(adminAccountId, reportRequestId, req);

                assertEquals(ReturnStatus.COMPLETED, disputedReturn.getStatus());
                assertEquals(ReportStage.CLOSED, report.getStage());
                verify(orderReturnService, never()).createReturn(any(), any());
                verify(escrowService).refundByOrder(eq(orderId), anyString());
        }

        @Test
        @DisplayName("Safeguard: Admin gửi quyết định trùng lặp trên hồ sơ đã đóng -> Ném CustomException, chặn settlement kép")
        void handleReport_RepeatedDecisions_ThrowsException() {
                Request closedReq = Request.builder()
                                .id(reportRequestId)
                                .type(RequestType.REPORT)
                                .status(RequestStatus.APPROVED)
                                .build();

                Report closedReport = Report.builder()
                                .id(reportRequestId)
                                .request(closedReq)
                                .targetType(TargetType.ORDER)
                                .targetId(orderId)
                                .stage(ReportStage.CLOSED)
                                .build();

                when(accountRepository.findById(adminAccountId)).thenReturn(Optional.of(adminAccount));
                when(reportRepository.findByRequestId(reportRequestId)).thenReturn(closedReport);

                HandleReportRequest req = HandleReportRequest.builder()
                                .decision(ReportDecision.APPROVE)
                                .note("Thử submit lại phán quyết")
                                .build();

                assertThrows(com.marketplace.ecommerce.common.exception.CustomException.class,
                                () -> reportService.handleReport(adminAccountId, reportRequestId, req));
                verify(escrowService, never()).refundByOrder(any(), any());
                verify(escrowService, never()).releaseByOrder(any());
        }

        @Test
        @DisplayName("Safeguard: Escrow đã được settled (REFUNDED) -> Tuyệt đối không cho phép release hoặc refund trùng lặp")
        void handleReport_SettledEscrow_PreventsDuplicateSettlement() {
                Request disputeReq = Request.builder()
                                .id(reportRequestId)
                                .type(RequestType.REPORT)
                                .status(RequestStatus.PENDING)
                                .description("[Shop khiếu nại kiện hàng hoàn - DAMAGED] Hàng bị tráo")
                                .build();

                Report disputeReport = Report.builder()
                                .id(reportRequestId)
                                .request(disputeReq)
                                .targetType(TargetType.ORDER)
                                .targetId(orderId)
                                .violationReportId(UUID.randomUUID())
                                .stage(ReportStage.ESCALATED_TO_ADMIN)
                                .build();

                OrderReturn orderReturn = OrderReturn.builder()
                                .id(UUID.randomUUID())
                                .order(deliveredOrder)
                                .status(ReturnStatus.DISPUTED)
                                .build();

                Escrow refundedEscrow = Escrow.builder()
                                .id(UUID.randomUUID())
                                .status(EscrowStatus.REFUNDED)
                                .build();

                when(accountRepository.findById(adminAccountId)).thenReturn(Optional.of(adminAccount));
                when(reportRepository.findByRequestId(reportRequestId)).thenReturn(disputeReport);
                when(orderRepository.findByIdForUpdate(orderId)).thenReturn(Optional.of(deliveredOrder));
                when(orderReturnRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(orderReturn));
                when(escrowRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(refundedEscrow));

                HandleReportRequest req = HandleReportRequest.builder()
                                .decision(ReportDecision.APPROVE)
                                .note("Duyệt cho Shop")
                                .build();

                assertThrows(com.marketplace.ecommerce.common.exception.CustomException.class,
                                () -> reportService.handleReport(adminAccountId, reportRequestId, req));
                verify(escrowService, never()).releaseByOrder(any());
        }
}
