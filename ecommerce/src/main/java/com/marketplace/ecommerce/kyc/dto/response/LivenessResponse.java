package com.marketplace.ecommerce.kyc.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class LivenessResponse {
    private String message;

    @JsonProperty("object")
    private Obj obj;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Obj {

        private String liveness;

        @JsonProperty("liveness_msg")
        private String livenessMsg;

        @JsonProperty("is_eye_open")
        private String isEyeOpen;
    }
}
