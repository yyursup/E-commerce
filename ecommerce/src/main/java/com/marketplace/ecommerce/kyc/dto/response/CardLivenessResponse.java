package com.marketplace.ecommerce.kyc.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class CardLivenessResponse {
    private String message;

    @JsonProperty("object")
    private Obj object;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Obj {
        private String liveness;

        @JsonProperty("liveness_msg")
        private String livenessMsg;

        @JsonProperty("face_swapping")
        private Boolean faceSwapping;

        @JsonProperty("fake_liveness")
        private Boolean fakeLiveness;
    }
}
