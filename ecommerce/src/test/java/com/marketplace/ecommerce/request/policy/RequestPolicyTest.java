package com.marketplace.ecommerce.request.policy;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.request.dto.request.CreateAppealRequest;
import com.marketplace.ecommerce.request.entity.Report;
import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.entity.Seller;
import com.marketplace.ecommerce.request.repository.ReportRepository;
import com.marketplace.ecommerce.request.repository.SellerRepository;
import com.marketplace.ecommerce.request.valueObjects.*;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RequestPolicyTest {

    @Mock
    private ReportRepository reportRepository;
    @Mock
    private SellerRepository sellerRepository;
    @Mock
    private ShopRepository shopRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private RequestPolicy requestPolicy;

    private UUID orderId;
    private UUID reportId;

    @BeforeEach
    void setUp() {
        orderId = UUID.randomUUID();
        reportId = UUID.randomUUID();
    }

    @Test
    @DisplayName("resolve - Phân giải loại đối tượng báo cáo thành công hoặc ném lỗi khi không tìm thấy / mơ hồ")
    void testResolve() {
        UUID targetId = UUID.randomUUID();

        // Không tìm thấy
        when(reportRepository.resolveTargetTypes(targetId)).thenReturn(Collections.emptyList());
        assertThrows(CustomException.class, () -> requestPolicy.resolve(targetId));

        // Mơ hồ (nhiều hơn 1)
        when(reportRepository.resolveTargetTypes(targetId)).thenReturn(List.of("PRODUCT", "SHOP"));
        assertThrows(CustomException.class, () -> requestPolicy.resolve(targetId));

        // Giá trị không hợp lệ
        when(reportRepository.resolveTargetTypes(targetId)).thenReturn(List.of("UNKNOWN_TYPE"));
        assertThrows(CustomException.class, () -> requestPolicy.resolve(targetId));

        // Thành công
        when(reportRepository.resolveTargetTypes(targetId)).thenReturn(List.of("PRODUCT"));
        assertEquals(TargetType.PRODUCT, requestPolicy.resolve(targetId));
    }

    @Test
    @DisplayName("resolveTargetAccountId - Lấy Account ID của đối tượng bị báo cáo")
    void testResolveTargetAccountId() {
        UUID id = UUID.randomUUID();
        UUID accId = UUID.randomUUID();

        when(reportRepository.resolveUserAccountId(id)).thenReturn(accId);
        assertEquals(accId, requestPolicy.resolveTargetAccountId(TargetType.USER, id));

        when(reportRepository.resolveShopOwnerAccountId(id)).thenReturn(accId);
        assertEquals(accId, requestPolicy.resolveTargetAccountId(TargetType.SHOP, id));

        when(reportRepository.resolveProductOwnerAccountId(id)).thenReturn(accId);
        assertEquals(accId, requestPolicy.resolveTargetAccountId(TargetType.PRODUCT, id));

        when(reportRepository.resolveReviewOwnerAccountId(id)).thenReturn(accId);
        assertEquals(accId, requestPolicy.resolveTargetAccountId(TargetType.REVIEW, id));

        when(reportRepository.resolveOrderShopOwnerAccountId(id)).thenReturn(accId);
        assertEquals(accId, requestPolicy.resolveTargetAccountId(TargetType.ORDER, id));
    }

    @Test
    @DisplayName("validateOrderReport - Kiểm tra tính hợp lệ của khiếu nại đơn hàng")
    void testValidateOrderReport() {
        UUID buyerAccId = UUID.randomUUID();
        Account buyerAcc = Account.builder().id(buyerAccId).build();
        User buyer = User.builder().account(buyerAcc).build();

        Order order = Order.builder()
                .id(orderId)
                .user(buyer)
                .status(OrderStatus.DELIVERED)
                .deliveredAt(LocalDateTime.now().minusDays(1))
                .build();

        // Đơn hàng không tồn tại
        when(orderRepository.findById(orderId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> requestPolicy.validateOrderReport(buyerAccId, orderId));

        // Không phải chủ đơn hàng
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        assertThrows(CustomException.class, () -> requestPolicy.validateOrderReport(UUID.randomUUID(), orderId));

        // Đơn hàng bị CANCELLED hoặc REFUNDED
        order.setStatus(OrderStatus.CANCELLED);
        assertThrows(CustomException.class, () -> requestPolicy.validateOrderReport(buyerAccId, orderId));
        order.setStatus(OrderStatus.REFUNDED);
        assertThrows(CustomException.class, () -> requestPolicy.validateOrderReport(buyerAccId, orderId));

        // Đơn hàng chưa giao xong (VD: SHIPPING)
        order.setStatus(OrderStatus.SHIPPING);
        assertThrows(CustomException.class, () -> requestPolicy.validateOrderReport(buyerAccId, orderId));

        // Đã giao nhưng quá hạn 3 ngày
        order.setStatus(OrderStatus.DELIVERED);
        order.setDeliveredAt(LocalDateTime.now().minusDays(8));
        assertThrows(CustomException.class, () -> requestPolicy.validateOrderReport(buyerAccId, orderId));

        // Đang có khiếu nại pending
        order.setDeliveredAt(LocalDateTime.now().minusDays(1));
        when(reportRepository.existsPendingReportByOrderId(orderId)).thenReturn(true);
        assertThrows(CustomException.class, () -> requestPolicy.validateOrderReport(buyerAccId, orderId));

        // Hợp lệ
        when(reportRepository.existsPendingReportByOrderId(orderId)).thenReturn(false);
        assertDoesNotThrow(() -> requestPolicy.validateOrderReport(buyerAccId, orderId));
    }

    @Test
    @DisplayName("validateApproveSellerRequest - Kiểm tra điều kiện duyệt đơn đăng ký bán hàng")
    void testValidateApproveSellerRequest() {
        UUID reqId = UUID.randomUUID();
        Account acc = Account.builder().id(UUID.randomUUID()).build();
        User user = User.builder().id(UUID.randomUUID()).account(acc).build();

        Request req = Request.builder()
                .id(reqId)
                .account(acc)
                .status(RequestStatus.PENDING)
                .build();

        Seller seller = Seller.builder()
                .shopName("Official Tech Store")
                .taxCode("0102030405")
                .shopPhone("0909090909")
                .build();

        // Không phải PENDING
        req.setStatus(RequestStatus.APPROVED);
        assertThrows(CustomException.class, () -> requestPolicy.validateApproveSellerRequest(req, reqId));
        req.setStatus(RequestStatus.PENDING);

        // Không có account
        req.setAccount(null);
        assertThrows(CustomException.class, () -> requestPolicy.validateApproveSellerRequest(req, reqId));
        req.setAccount(acc);

        // User profile không tồn tại
        when(userRepository.findByAccountId(acc.getId())).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> requestPolicy.validateApproveSellerRequest(req, reqId));

        // User đã có shop
        when(userRepository.findByAccountId(acc.getId())).thenReturn(Optional.of(user));
        when(shopRepository.existsByUserId(user.getId())).thenReturn(true);
        assertThrows(CustomException.class, () -> requestPolicy.validateApproveSellerRequest(req, reqId));
        when(shopRepository.existsByUserId(user.getId())).thenReturn(false);

        // Seller detail không tìm thấy
        when(sellerRepository.findById(reqId)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> requestPolicy.validateApproveSellerRequest(req, reqId));

        // Tên shop rỗng hoặc đã tồn tại
        when(sellerRepository.findById(reqId)).thenReturn(Optional.of(seller));
        seller.setShopName("   ");
        assertThrows(CustomException.class, () -> requestPolicy.validateApproveSellerRequest(req, reqId));

        seller.setShopName("Official Tech Store");
        when(shopRepository.existsByNameIgnoreCase("Official Tech Store")).thenReturn(true);
        assertThrows(CustomException.class, () -> requestPolicy.validateApproveSellerRequest(req, reqId));
        when(shopRepository.existsByNameIgnoreCase("Official Tech Store")).thenReturn(false);

        // Mã số thuế trùng lặp
        when(shopRepository.existsByTaxCode("0102030405")).thenReturn(true);
        assertThrows(CustomException.class, () -> requestPolicy.validateApproveSellerRequest(req, reqId));
        when(shopRepository.existsByTaxCode("0102030405")).thenReturn(false);

        // Số điện thoại trùng lặp
        when(shopRepository.existsByPhoneNumber("0909090909")).thenReturn(true);
        assertThrows(CustomException.class, () -> requestPolicy.validateApproveSellerRequest(req, reqId));
        when(shopRepository.existsByPhoneNumber("0909090909")).thenReturn(false);

        // Hợp lệ
        ApproveSellerContext ctx = requestPolicy.validateApproveSellerRequest(req, reqId);
        assertNotNull(ctx);
        assertEquals("Official Tech Store", ctx.shopName());
        assertEquals(user, ctx.ownerUser());
    }
}
