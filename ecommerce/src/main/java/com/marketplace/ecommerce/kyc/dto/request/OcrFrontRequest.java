package com.marketplace.ecommerce.kyc.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class OcrFrontRequest {
    @JsonProperty("img_front")
    private String imgFront;

    private Integer type;

    @JsonProperty("client_session")
    private String clientSession;

    private String token;
}
