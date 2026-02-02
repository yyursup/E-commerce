package com.marketplace.ecommerce.kyc.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ClassifyResponse {
    private String message;

    @JsonProperty("object")
    private Obj obj;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Obj {
        private Integer type;
        private String name;
        private Double confidence;
    }
}
