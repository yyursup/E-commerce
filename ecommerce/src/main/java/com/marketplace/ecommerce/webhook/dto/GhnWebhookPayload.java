package com.marketplace.ecommerce.webhook.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * Payload webhook GHN – callback trạng thái đơn hàng.
 * GHN gửi POST JSON, Type: Create | Switch_status | Update_weight | Update_cod | Update_fee.
 * Trường theo doc: ClientOrderCode, OrderCode, Status, Type, …
 * Khách hàng luôn trả về 200.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class GhnWebhookPayload {

    @JsonProperty("order_code")
    private String orderCode;

    @JsonProperty("client_order_code")
    private String clientOrderCode;

    @JsonProperty("status")
    private String deliveryStatus;

    @JsonProperty("type")
    private String webhookType;

    @JsonProperty("status_id")
    private Integer deliveryStatusId;

    @JsonProperty("partner_id")
    private String partnerId;

    @JsonProperty("label_id")
    private String labelId;
}
