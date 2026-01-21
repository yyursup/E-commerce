package com.marketplace.ecommerce.kyc.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class ClassifyRequest {
    @JsonProperty("img_card")
    private String imgCard;

    @JsonProperty("client_session")
    private String clientSession;

    private String token;
}
