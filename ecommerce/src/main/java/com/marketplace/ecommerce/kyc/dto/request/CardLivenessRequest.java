package com.marketplace.ecommerce.kyc.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class CardLivenessRequest {

    @JsonProperty("img")
    private String img;

    @JsonProperty("client_session")
    private String clientSession;
}
