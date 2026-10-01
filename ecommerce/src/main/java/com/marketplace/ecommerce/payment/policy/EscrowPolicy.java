package com.marketplace.ecommerce.payment.policy;

import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.dto.response.OrderReturnResponse;
import com.marketplace.ecommerce.order.entity.Order;
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
     * Chặn tuyệt đối nếu kiện hàng hoàn đang trên đường vận chuyển (WAITING_FOR_SHIPMENT, SHIPPED).
     */
    public void validateSettlementPreconditions(UUID orderId) {
        if (orderId == null) {
            throw new CustomException("Mã đơn hàng không được để trống");
        }

        // 1. Kiểm tra đơn hàng tồn tại
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomException("Không tìm thấy đơn hàng: " + orderId));

        // 2. Thẩm định qua OrderReturnService (sử dụng Public Interface, không Domain Bleeding)
        OrderReturnResponse returnDto = orderReturnService.getReturnByOrderId(orderId);
        if (returnDto != null && returnDto.getStatus() != null) {
            ReturnStatus st = returnDto.getStatus();
            // Nếu có yêu cầu hoàn hàng đang active (chưa kết thúc COMPLETED/CANCELLED):
            // Admin CHỈ có quyền can thiệp khi chuyển sang trạng thái DISPUTED (khiếu nại từ Shop/Khách).
            if (st != ReturnStatus.DISPUTED && st != ReturnStatus.COMPLETED && st != ReturnStatus.CANCELLED) {
                if (st == ReturnStatus.RETURNED) {
                    throw new CustomException("Kiện hàng hoàn đã giao tới Người bán nhưng đang trong thời hạn kiểm hàng 72 giờ. "
                            + "Admin chỉ có quyền can thiệp xử lý ký quỹ khi yêu cầu chuyển sang trạng thái Tranh chấp (DISPUTED).");
                }
                throw new CustomException("Kiện hàng hoàn đang xử lý vận chuyển (Trạng thái: "
                        + st + "). Admin chỉ có quyền can thiệp xử lý ký quỹ khi yêu cầu chuyển sang trạng thái Tranh chấp (DISPUTED).");
            }
        }
    }
}
