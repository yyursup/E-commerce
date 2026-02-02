package com.marketplace.ecommerce.kyc.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class CompareRequest {
    @JsonProperty("img_front")
    private String imgFront;

    @JsonProperty("img_face")
    private String imgFace;

    @JsonProperty("client_session")
    private String clientSession;

    private String token;
}
