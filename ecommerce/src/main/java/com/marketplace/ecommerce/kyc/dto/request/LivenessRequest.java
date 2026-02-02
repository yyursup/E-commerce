package com.marketplace.ecommerce.kyc.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class LivenessRequest {
    private String img;

    @JsonProperty("client_session")
    private String clientSession;

    private String token;
}
