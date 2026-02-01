package com.marketplace.ecommerce.webhook.controller;


import com.marketplace.ecommerce.order.service.OrderService;
import com.marketplace.ecommerce.webhook.constant.WebhookConstant;
import com.marketplace.ecommerce.webhook.dto.GhnWebhookPayload;
import com.marketplace.ecommerce.webhook.service.WebhookService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Webhook nhận callback từ GHN khi trạng thái đơn thay đổi.
 * Type: Create | Switch_status | Update_weight | Update_cod | Update_fee.
 * Khi Type=Switch_status và Status=delivered (hoặc tương đương), set order DELIVERED.
 * <p>
 * Luôn trả HTTP 200 theo yêu cầu GHN (nếu khác 200, GHN bắn lại 10 lần, mỗi lần cách 5 giây).
 * URL cấu hình trên GHN: https://your-domain/webhooks/ghn
 */
@Slf4j
@RestController
@RequestMapping(version = "1", path = "/webhooks/ghn")
@RequiredArgsConstructor
public class GhnWebhookController {

    private final WebhookService webhookService;

    @PostMapping
    public ResponseEntity<Void> handleGhnWebhook(@RequestBody GhnWebhookPayload payload) {
        if (payload == null) {
            return ResponseEntity.ok().build();
        }
        String orderCode = payload.getOrderCode();
        String clientOrderCode = payload.getClientOrderCode() != null ? payload.getClientOrderCode() : payload.getPartnerId();

        boolean isDelivered = WebhookConstant.STATUS_DELIVERED_ID == (payload.getDeliveryStatusId() != null ? payload.getDeliveryStatusId() : -1)
                || isDeliveredStatus(payload.getDeliveryStatus());

        if (isDelivered && (orderCode != null || clientOrderCode != null)) {
            try {
                boolean updated = webhookService.markDeliveredByGhnRef(orderCode, clientOrderCode);
                if (updated) {
                    log.info("GHN webhook: đã set DELIVERED (OrderCode={}, ClientOrderCode={})", orderCode, clientOrderCode);
                } else {
                    log.debug("GHN webhook: không tìm thấy đơn SHIPPED (OrderCode={}, ClientOrderCode={})", orderCode, clientOrderCode);
                }
            } catch (Exception e) {
                log.warn("GHN webhook: lỗi khi xử lý delivered – OrderCode={}, ClientOrderCode={}: {}", orderCode, clientOrderCode, e.getMessage());
            }
        }
        return ResponseEntity.ok().build();
    }

    private static boolean isDeliveredStatus(String status) {
        if (status == null || status.isBlank()) return false;
        String s = status.trim().toLowerCase();
        return "delivered".equals(s) || "đã giao hàng".equalsIgnoreCase(status.trim()) || "da_giao_hang".equals(s);
    }
}
