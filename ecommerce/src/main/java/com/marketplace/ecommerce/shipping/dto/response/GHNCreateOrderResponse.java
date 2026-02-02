package com.marketplace.ecommerce.shipping.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown=true)
public class GHNCreateOrderResponse {

    @JsonProperty("order_code")
    private String orderCode;

    @JsonProperty("total_fee")
    private Integer totalFee;

    @JsonProperty("sort_code")
    private String sortCode;

    @JsonProperty("trans_type")
    private String transType;

    @JsonProperty("ward_encode")
    private String wardEncode;

    @JsonProperty("district_encode")
    private String districtEncode;

    @JsonProperty("expected_delivery_time")
    private String expectedDeliveryTime;

    @JsonProperty("operation_partner")
    private String operationPartner;

    @JsonProperty("fee")
    private GHNFeeDetail fee;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class GHNFeeDetail {
        @JsonProperty("main_service")
        private Integer mainService;

        @JsonProperty("insurance")
        private Integer insurance;

        @JsonProperty("cod_fee")
        private Integer codFee;

        @JsonProperty("station_do")
        private Integer stationDO;

        @JsonProperty("station_pu")
        private Integer stationPU;

        @JsonProperty("coupon")
        private Integer coupon;
    }
}
