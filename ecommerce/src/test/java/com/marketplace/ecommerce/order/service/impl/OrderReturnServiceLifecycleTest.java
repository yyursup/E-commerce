package com.marketplace.ecommerce.order.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.chat.service.ChatService;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.dto.response.OrderReturnResponse;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.entity.OrderReturn;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.repository.OrderReturnRepository;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.order.valueObjects.ReturnStatus;
import com.marketplace.ecommerce.payment.repository.EscrowRepository;
import com.marketplace.ecommerce.payment.service.EscrowService;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.product.repository.ProductVariantRepository;
import com.marketplace.ecommerce.product.service.InventoryHistoryService;
import com.marketplace.ecommerce.request.entity.Report;
import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.repository.ReportRepository;
import com.marketplace.ecommerce.request.repository.RequestRepository;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.service.ShopEscrowFundService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Các bước của quy trình hoàn hàng chưa được OrderReturnServiceTest phủ:
 * tạo yêu cầu (nhánh dự phòng), người mua xác nhận đã trả hàng, truy vấn, và đóng khi ký quỹ đã quyết toán.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class OrderReturnServiceLifecycleTest {

    @Mock private OrderReturnRepository orderReturnRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private ReportRepository reportRepository;
    @Mock private RequestRepository requestRepository;
    @Mock private EscrowRepository escrowRepository;
    @Mock private EscrowService escrowService;
    @Mock private ProductRepository productRepository;
    @Mock private ProductVariantRepository productVariantRepository;
    @Mock private InventoryHistoryService inventoryHistoryService;
    @Mock private UserRepository userRepository;
    @Mock private ShopEscrowFundService shopEscrowFundService;
    @Mock private ChatService chatService;

    @InjectMocks private OrderReturnServiceImpl orderReturnService;

    private UUID orderId;
    private UUID reportId;
    private UUID returnId;
    private UUID buyerAccountId;
    private User buyer;
    private User seller;
    private Shop shop;
    private Order order;
    private Report report;
    private OrderReturn orderReturn;

    @BeforeEach
    void setUp() {
        orderId = UUID.randomUUID();
        reportId = UUID.randomUUID();
        returnId = UUID.randomUUID();
        buyerAccountId = UUID.randomUUID();

        buyer = User.builder().id(UUID.randomUUID()).fullName("Nguyễn Văn Buyer").build();
        seller = User.builder().id(UUID.randomUUID()).fullName("Trần Thị Seller").phoneNumber("0911000111").build();
        shop = Shop.builder().id(UUID.randomUUID()).name("Shop Công Nghệ").user(seller).build();
        order = Order.builder().id(orderId).orderNumber("ORD-RET-9").user(buyer).shop(shop)
                .status(OrderStatus.DELIVERED).build();
        report = Report.builder().id(reportId).build();
        orderReturn = OrderReturn.builder().id(returnId).order(order).report(report)
                .status(ReturnStatus.SHIPPED).isRestocked(false).build();

        when(orderReturnRepository.save(any(OrderReturn.class))).thenAnswer(i -> i.getArgument(0));
    }

    @Nested
    @DisplayName("createReturn: tạo yêu cầu hoàn hàng khi người mua thắng khiếu nại")
    class CreateReturn {

        @BeforeEach
        void stubs() {
            when(orderReturnRepository.findByOrderId(orderId)).thenReturn(Optional.empty());
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
            when(reportRepository.findById(reportId)).thenReturn(Optional.of(report));
        }

        @Test
        @DisplayName("Trả về yêu cầu đã có, không tạo trùng")
        void returnsExistingReturn() {
            when(orderReturnRepository.findByOrderId(orderId)).thenReturn(Optional.of(orderReturn));

            OrderReturnResponse res = orderReturnService.createReturn(orderId, reportId);

            assertEquals(returnId, res.getId());
            verify(orderReturnRepository, never()).save(any());
            verifyNoInteractions(orderRepository, reportRepository);
        }

        @Test
        @DisplayName("Shop thiếu địa chỉ và SĐT: dùng tên shop và SĐT của chủ shop")
        void fallsBackToShopNameAndOwnerPhone() {
            OrderReturnResponse res = orderReturnService.createReturn(orderId, reportId);

            assertEquals("Địa chỉ gian hàng: Shop Công Nghệ", res.getReturnAddress());
            assertEquals("Trần Thị Seller", res.getReturnRecipientName());
            assertEquals("0911000111", res.getReturnRecipientPhone());
        }

        @Test
        @DisplayName("Shop không có chủ: người nhận là tên shop, SĐT là N/A")
        void fallsBackWhenShopHasNoOwner() {
            shop.setUser(null);
            shop.setAddress("   ");

            OrderReturnResponse res = orderReturnService.createReturn(orderId, reportId);

            assertEquals("Shop Công Nghệ", res.getReturnRecipientName());
            assertEquals("N/A", res.getReturnRecipientPhone());
            assertTrue(res.getReturnAddress().startsWith("Địa chỉ gian hàng:"));
        }

        @Test
        @DisplayName("Tạo mã vận đơn GHN mặc định và hạn gửi hàng 3 ngày")
        void setsDefaultTrackingAndDeadline() {
            LocalDateTime before = LocalDateTime.now();

            OrderReturnResponse res = orderReturnService.createReturn(orderId, reportId);

            assertEquals(ReturnStatus.WAITING_FOR_SHIPMENT, res.getStatus());
            assertEquals("GHN-RET-ORD-RET-9", res.getReturnTrackingCode());
            assertEquals("Giao Hàng Nhanh (GHN)", res.getCarrierName());
            assertFalse(res.getIsRestocked());
            Duration untilDeadline = Duration.between(before, res.getBuyerShipmentDeadline());
            assertTrue(untilDeadline.compareTo(Duration.ofDays(3)) >= 0
                    && untilDeadline.compareTo(Duration.ofDays(3).plusMinutes(1)) < 0);
        }

        @Test
        @DisplayName("Đơn không có mã đơn: mã vận đơn dùng 8 ký tự đầu của id, viết hoa")
        void trackingFallsBackToOrderId() {
            order.setOrderNumber(null);

            OrderReturnResponse res = orderReturnService.createReturn(orderId, reportId);

            assertEquals("GHN-RET-" + orderId.toString().substring(0, 8).toUpperCase(), res.getReturnTrackingCode());
        }

        @Test
        @DisplayName("Báo lỗi khi không tìm thấy đơn hoặc khiếu nại")
        void rejectsMissingOrderOrReport() {
            when(reportRepository.findById(reportId)).thenReturn(Optional.empty());
            assertThrows(CustomException.class, () -> orderReturnService.createReturn(orderId, reportId));

            when(orderRepository.findById(orderId)).thenReturn(Optional.empty());
            assertThrows(CustomException.class, () -> orderReturnService.createReturn(orderId, reportId));
            verify(orderReturnRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("confirmReturned: người mua xác nhận shop đã nhận hàng hoàn")
    class ConfirmReturned {

        @BeforeEach
        void stubs() {
            when(orderReturnRepository.findByIdForUpdate(returnId)).thenReturn(Optional.of(orderReturn));
            when(userRepository.findByAccountId(buyerAccountId)).thenReturn(Optional.of(buyer));
        }

        @Test
        @DisplayName("Chuyển sang RETURNED và cho shop 72 giờ kiểm hàng")
        void marksReturnedWith72hInspection() {
            LocalDateTime before = LocalDateTime.now();

            OrderReturnResponse res = orderReturnService.confirmReturned(buyerAccountId, returnId);

            assertEquals(ReturnStatus.RETURNED, res.getStatus());
            assertNotNull(res.getSellerReceivedAt());
            Duration window = Duration.between(before, res.getSellerInspectionDeadline());
            assertTrue(window.compareTo(Duration.ofHours(72)) >= 0
                    && window.compareTo(Duration.ofHours(72).plusMinutes(1)) < 0);
            verify(orderReturnRepository).save(orderReturn);
            verifyNoInteractions(escrowService);
        }

        @ParameterizedTest
        @EnumSource(value = ReturnStatus.class, names = "SHIPPED", mode = EnumSource.Mode.EXCLUDE)
        @DisplayName("Chỉ xác nhận được khi hàng đang ở trạng thái SHIPPED")
        void rejectsOtherStatuses(ReturnStatus status) {
            orderReturn.setStatus(status);

            CustomException ex = assertThrows(CustomException.class,
                    () -> orderReturnService.confirmReturned(buyerAccountId, returnId));

            assertTrue(ex.getMessage().contains(status.name()));
            verify(orderReturnRepository, never()).save(any());
        }

        @Test
        @DisplayName("Người khác không được xác nhận thay người mua")
        void rejectsOtherUser() {
            UUID strangerAccount = UUID.randomUUID();
            when(userRepository.findByAccountId(strangerAccount))
                    .thenReturn(Optional.of(User.builder().id(UUID.randomUUID()).build()));

            assertThrows(CustomException.class, () -> orderReturnService.confirmReturned(strangerAccount, returnId));
            assertEquals(ReturnStatus.SHIPPED, orderReturn.getStatus());
        }

        @Test
        @DisplayName("Báo lỗi khi không tìm thấy yêu cầu hoàn hàng hoặc người dùng")
        void rejectsMissingReturnOrUser() {
            UUID unknownAccount = UUID.randomUUID();
            when(userRepository.findByAccountId(unknownAccount)).thenReturn(Optional.empty());
            assertThrows(CustomException.class, () -> orderReturnService.confirmReturned(unknownAccount, returnId));

            UUID unknownReturn = UUID.randomUUID();
            when(orderReturnRepository.findByIdForUpdate(unknownReturn)).thenReturn(Optional.empty());
            assertThrows(CustomException.class, () -> orderReturnService.confirmReturned(buyerAccountId, unknownReturn));
        }
    }

    @Nested
    @DisplayName("Truy vấn thông tin hoàn hàng")
    class Queries {

        @Test
        @DisplayName("getReturnByOrderId trả về null khi đơn không có yêu cầu hoàn hàng")
        void byOrderIdReturnsNullWhenAbsent() {
            when(orderReturnRepository.findByOrderId(orderId)).thenReturn(Optional.empty());
            assertNull(orderReturnService.getReturnByOrderId(orderId));
        }

        @Test
        @DisplayName("getReturnByOrderId ánh xạ sang response")
        void byOrderIdMapsResponse() {
            when(orderReturnRepository.findByOrderId(orderId)).thenReturn(Optional.of(orderReturn));
            OrderReturnResponse res = orderReturnService.getReturnByOrderId(orderId);
            assertEquals(returnId, res.getId());
            assertEquals(orderId, res.getOrderId());
            assertEquals("ORD-RET-9", res.getOrderNumber());
            assertEquals(reportId, res.getReportId());
        }

        @Test
        @DisplayName("getReturnInfoBatch trả về map rỗng cho danh sách rỗng hoặc null, không gọi DB")
        void batchEmptyInput() {
            assertTrue(orderReturnService.getReturnInfoBatch(null).isEmpty());
            assertTrue(orderReturnService.getReturnInfoBatch(Collections.emptyList()).isEmpty());
            verifyNoInteractions(orderReturnRepository);
        }

        @Test
        @DisplayName("getReturnInfoBatch gom theo mã đơn, bỏ bản ghi mồ côi, giữ bản ghi đầu khi trùng")
        void batchGroupsByOrder() {
            Order other = Order.builder().id(UUID.randomUUID()).build();
            OrderReturn second = OrderReturn.builder().id(UUID.randomUUID()).order(other).build();
            OrderReturn duplicate = OrderReturn.builder().id(UUID.randomUUID()).order(order).build();
            OrderReturn orphan = OrderReturn.builder().id(UUID.randomUUID()).build();
            List<UUID> ids = List.of(orderId, other.getId());
            when(orderReturnRepository.findByOrderIdIn(ids)).thenReturn(List.of(orderReturn, second, duplicate, orphan));

            Map<UUID, OrderReturnResponse> result = orderReturnService.getReturnInfoBatch(ids);

            assertEquals(2, result.size());
            assertEquals(returnId, result.get(orderId).getId());
            assertEquals(second.getId(), result.get(other.getId()).getId());
        }

        @Test
        @DisplayName("getReturnDetails báo lỗi khi không tìm thấy")
        void detailsThrowsWhenMissing() {
            when(orderReturnRepository.findById(returnId)).thenReturn(Optional.empty());
            assertThrows(CustomException.class, () -> orderReturnService.getReturnDetails(returnId));

            when(orderReturnRepository.findById(returnId)).thenReturn(Optional.of(orderReturn));
            assertEquals(returnId, orderReturnService.getReturnDetails(returnId).getId());
        }
    }

    @Nested
    @DisplayName("closeReturnOnEscrowSettled: đóng yêu cầu hoàn hàng khi admin đã quyết toán ký quỹ")
    class CloseOnEscrowSettled {

        private UUID requestId;

        @BeforeEach
        void stubs() {
            requestId = UUID.randomUUID();
            report.setRequest(Request.builder().id(requestId).build());
            orderReturn.setStatus(ReturnStatus.DISPUTED);
            when(orderReturnRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(orderReturn));
        }

        @Test
        @DisplayName("Bỏ qua khi thiếu mã đơn hoặc trạng thái cuối")
        void ignoresNullArguments() {
            orderReturnService.closeReturnOnEscrowSettled(null, ReturnStatus.COMPLETED, "x");
            orderReturnService.closeReturnOnEscrowSettled(orderId, null, "x");
            verifyNoInteractions(orderReturnRepository, chatService);
        }

        @Test
        @DisplayName("Không làm gì khi đơn không có yêu cầu hoàn hàng")
        void ignoresOrderWithoutReturn() {
            when(orderReturnRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.empty());
            orderReturnService.closeReturnOnEscrowSettled(orderId, ReturnStatus.COMPLETED, "x");
            verify(orderReturnRepository, never()).save(any());
            verifyNoInteractions(chatService);
        }

        @Test
        @DisplayName("Chốt trạng thái, nối ghi chú và đóng luồng chat tranh chấp")
        void closesReturnAndDisputeThread() {
            orderReturn.setConditionNote("Thiếu sạc");

            orderReturnService.closeReturnOnEscrowSettled(orderId, ReturnStatus.COMPLETED, "Admin chia 50/50");

            assertEquals(ReturnStatus.COMPLETED, orderReturn.getStatus());
            assertEquals("Thiếu sạc | Admin chia 50/50", orderReturn.getConditionNote());
            verify(orderReturnRepository).save(orderReturn);
            verify(chatService).closeDisputeThread(requestId, "Admin chia 50/50");
        }

        @Test
        @DisplayName("Ghi chú trống: giữ nguyên ghi chú cũ, dùng lý do mặc định khi đóng chat")
        void blankNoteKeepsConditionNote() {
            orderReturn.setConditionNote("Thiếu sạc");

            orderReturnService.closeReturnOnEscrowSettled(orderId, ReturnStatus.CANCELLED, null);

            assertEquals("Thiếu sạc", orderReturn.getConditionNote());
            verify(chatService).closeDisputeThread(requestId, "Đổi trả kết thúc do quyết toán ký quỹ");
        }

        @Test
        @DisplayName("Ghi chú đầu tiên không có dấu phân cách")
        void firstNoteHasNoSeparator() {
            orderReturnService.closeReturnOnEscrowSettled(orderId, ReturnStatus.COMPLETED, "Hoàn tiền");
            assertEquals("Hoàn tiền", orderReturn.getConditionNote());
        }

        @ParameterizedTest
        @EnumSource(value = ReturnStatus.class, names = {"COMPLETED", "CANCELLED"})
        @DisplayName("Không ghi đè yêu cầu đã kết thúc")
        void leavesFinishedReturnsAlone(ReturnStatus finished) {
            orderReturn.setStatus(finished);

            orderReturnService.closeReturnOnEscrowSettled(orderId, ReturnStatus.DISPUTED, "x");

            assertEquals(finished, orderReturn.getStatus());
            verify(orderReturnRepository, never()).save(any());
            verify(chatService, never()).closeDisputeThread(any(), anyString());
        }

        @Test
        @DisplayName("Không gọi chat khi khiếu nại không gắn với yêu cầu")
        void skipsChatWithoutRequest() {
            report.setRequest(null);

            orderReturnService.closeReturnOnEscrowSettled(orderId, ReturnStatus.COMPLETED, "x");

            verify(orderReturnRepository).save(orderReturn);
            verifyNoInteractions(chatService);
        }
    }

    @Test
    @DisplayName("Lưu đúng một bản ghi khi tạo yêu cầu hoàn hàng mới")
    void createReturnSavesOnce() {
        when(orderReturnRepository.findByOrderId(orderId)).thenReturn(Optional.empty());
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(reportRepository.findById(reportId)).thenReturn(Optional.of(report));

        orderReturnService.createReturn(orderId, reportId);

        ArgumentCaptor<OrderReturn> captor = ArgumentCaptor.forClass(OrderReturn.class);
        verify(orderReturnRepository, times(1)).save(captor.capture());
        assertSame(order, captor.getValue().getOrder());
        assertSame(report, captor.getValue().getReport());
    }
}
