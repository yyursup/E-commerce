package com.marketplace.ecommerce.payment.policy;

import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.dto.response.OrderReturnResponse;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.service.OrderReturnService;
import com.marketplace.ecommerce.order.valueObjects.ReturnStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class EscrowPolicy {

    private final OrderRepository orderRepository;
    private final OrderReturnService orderReturnService;

    /**
     * Thẩm định điều kiện tiên quyết trước khi Admin giải ngân / hoàn tiền / phân chia ký quỹ đơn hàng.
     * Quy tắc nghiệp vụ cốt lõi:
     * Admin CHỈ ĐƯỢC QUYỀN xử lý can thiệp ký quỹ (Giải ngân / Hoàn tiền / Phân chia) khi và chỉ khi 
     * Kiện hàng hoàn đang ở trạng thái Tranh chấp (OrderReturn status == DISPUTED).
     * Mọi trường hợp khác phải tuân thủ quy trình tự động hoặc luồng Báo cáo / Kháng cáo:
     * - Nếu đơn mới chỉ có Báo cáo (Report): Admin duyệt tại tab Báo cáo. Nếu chọn REFUND_ONLY và Shop kháng cáo thất bại (hoặc hết hạn 72h), hệ thống tự động hoàn tiền vào ví khách hàng.
     * - Nếu kiện hàng hoàn đang trong vòng đời vận chuyển hoặc kiểm hàng 72h: Admin không can thiệp cho đến khi Shop khiếu nại kiện hoàn (DISPUTED).
     */
    public void validateSettlementPreconditions(UUID orderId) {
        if (orderId == null) {
            throw new CustomException("Mã đơn hàng không được để trống");
        }

        // 1. Kiểm tra đơn hàng tồn tại
        orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomException("Không tìm thấy đơn hàng: " + orderId));

        // 2. Thẩm định qua OrderReturnService (sử dụng Public Interface, không Domain Bleeding)
        OrderReturnResponse returnDto = orderReturnService.getReturnByOrderId(orderId);
        if (returnDto == null) {
            throw new CustomException("Đơn hàng không có khiếu nại kiện hàng hoàn ở trạng thái Tranh chấp (DISPUTED). "
                    + "Nếu đơn hàng có báo cáo vi phạm, vui lòng xử lý tại tab Báo cáo / Kháng cáo để hệ thống tự động xử lý tiền ký quỹ theo đúng quy trình.");
        }

        ReturnStatus st = returnDto.getStatus();
        if (st != ReturnStatus.DISPUTED) {
            if (st == ReturnStatus.RETURNED) {
                throw new CustomException("Kiện hàng hoàn đã giao tới Người bán nhưng đang trong thời hạn kiểm hàng 72 giờ. "
                        + "Admin chỉ có quyền can thiệp xử lý ký quỹ khi yêu cầu chuyển sang trạng thái Tranh chấp (DISPUTED).");
            }
            if (st == ReturnStatus.COMPLETED || st == ReturnStatus.CANCELLED) {
                throw new CustomException("Yêu cầu trả hàng đã kết thúc (" + st + "). Không thể can thiệp xử lý ký quỹ thủ công.");
            }
            throw new CustomException("Kiện hàng hoàn đang xử lý vận chuyển (Trạng thái: "
                    + st + "). Admin chỉ có quyền can thiệp xử lý ký quỹ khi yêu cầu chuyển sang trạng thái Tranh chấp (DISPUTED).");
        }
    }
}
