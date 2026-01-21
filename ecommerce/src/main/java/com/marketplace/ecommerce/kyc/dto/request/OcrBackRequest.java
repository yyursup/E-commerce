package com.marketplace.ecommerce.kyc.dto.request;


import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class OcrBackRequest {
    @JsonProperty("img_back")
    private String imgBack;

    private Integer type;

    @JsonProperty("client_session")
    private String clientSession;

    private String token;
}
