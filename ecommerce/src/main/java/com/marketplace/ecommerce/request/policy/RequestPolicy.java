package com.marketplace.ecommerce.request.policy;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.entity.Seller;
import com.marketplace.ecommerce.request.repository.ReportRepository;
import com.marketplace.ecommerce.request.repository.SellerRepository;
import com.marketplace.ecommerce.request.valueObjects.ApproveSellerContext;
import com.marketplace.ecommerce.request.valueObjects.RequestStatus;
import com.marketplace.ecommerce.request.valueObjects.TargetType;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class RequestPolicy {
    private final ReportRepository reportRepository;
    private final SellerRepository sellerRepository;
    private final ShopRepository shopRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    public TargetType resolve(UUID targetId) {
        List<String> types = reportRepository.resolveTargetTypes(targetId);

        if (types == null || types.isEmpty()) {
            throw new CustomException("Không tìm thấy đối tượng báo cáo: " + targetId);
        }
        if (types.size() > 1) {
            throw new CustomException("Đối tượng báo cáo không rõ ràng (trùng khớp nhiều loại đối tượng): " + targetId);
        }

        try {
            return TargetType.valueOf(types.get(0));
        } catch (IllegalArgumentException ex) {
            throw new CustomException("Loại đối tượng báo cáo không hợp lệ từ hệ thống: " + types.get(0));
        }
    }

    public UUID resolveTargetAccountId(TargetType type, UUID targetId) {
        return switch (type) {
            case USER -> reportRepository.resolveUserAccountId(targetId);
            case SHOP -> reportRepository.resolveShopOwnerAccountId(targetId);
            case PRODUCT -> reportRepository.resolveProductOwnerAccountId(targetId);
            case REVIEW -> reportRepository.resolveReviewOwnerAccountId(targetId);
            case ORDER -> reportRepository.resolveOrderShopOwnerAccountId(targetId);
        };
    }

    public void validateOrderReport(UUID buyerAccountId, UUID orderId) {
        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new CustomException("Không tìm thấy đơn hàng: " + orderId));

        if (order.getUser() == null || order.getUser().getAccount() == null ||
                !order.getUser().getAccount().getId().equals(buyerAccountId)) {
            throw new CustomException("Bạn không có quyền khiếu nại đơn hàng này.");
        }

        if (reportRepository.existsByOrderId(orderId)) {
            throw new CustomException("Đơn hàng này đã được gửi khiếu nại trước đó và không thể gửi lại.");
        }

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new CustomException("Không thể khiếu nại đơn hàng đã bị hủy.");
        }
        if (order.getStatus() == OrderStatus.REFUNDED) {
            throw new CustomException("Đơn hàng này đã được hoàn tiền trước đó.");
        }

        // Kiểm tra tính hợp lệ về thời điểm:
        // 1. DELIVERED: Hợp lệ khiếu nại (trong vòng 3 ngày kể từ khi giao, trước khi
        // hệ thống tự động giải ngân)
        if (order.getStatus() == OrderStatus.DELIVERED) {
            if (order.getDeliveredAt() != null) {
                if (LocalDateTime.now().isAfter(order.getDeliveredAt().plusDays(3))) {
                    throw new CustomException(
                            "Đã quá thời hạn 3 ngày khiếu nại kể từ khi đơn hàng được giao thành công.");
                }
            }
        } else {
            throw new CustomException(
                    "Chỉ có thể khiếu nại đơn hàng sau khi hệ thống đã cập nhật giao hàng thành công.");
        }
    }

    public ApproveSellerContext validateApproveSellerRequest(Request req, UUID requestId) {

        if (req.getStatus() != RequestStatus.PENDING) {
            throw new CustomException("Chỉ yêu cầu ở trạng thái PENDING mới có thể được phê duyệt");
        }

        Account ownerAccount = req.getAccount();
        if (ownerAccount == null) {
            throw new CustomException("Yêu cầu không có thông tin tài khoản sở hữu");
        }

        User user = userRepository.findByAccountId(ownerAccount.getId())
                .orElseThrow(() -> new CustomException(
                        "Không tìm thấy hồ sơ người dùng cho tài khoản: " + ownerAccount.getId()));

        if (shopRepository.existsByUserId(user.getId())) {
            throw new CustomException("Người dùng này đã sở hữu một gian hàng");
        }

        Seller sellerDetail = sellerRepository.findById(requestId)
                .orElseThrow(() -> new CustomException("Không tìm thấy thông tin đăng ký người bán: " + requestId));

        String shopName = sellerDetail.getShopName();
        if (shopName == null || shopName.trim().isEmpty()) {
            throw new CustomException("Tên gian hàng là bắt buộc");
        }

        if (shopRepository.existsByNameIgnoreCase(shopName)) {
            throw new CustomException("Tên gian hàng đã tồn tại: " + shopName);
        }

        String taxCode = sellerDetail.getTaxCode();
        if (taxCode != null && !taxCode.trim().isEmpty() && shopRepository.existsByTaxCode(taxCode.trim())) {
            throw new CustomException("Mã số thuế này đã được sử dụng bởi một gian hàng khác: " + taxCode);
        }

        String phone = sellerDetail.getShopPhone();
        if (phone != null && !phone.trim().isEmpty() && shopRepository.existsByPhoneNumber(phone.trim())) {
            throw new CustomException("Số điện thoại này đã được đăng ký bởi một gian hàng khác: " + phone);
        }

        return new ApproveSellerContext(user, sellerDetail, shopName.trim());
    }
}
