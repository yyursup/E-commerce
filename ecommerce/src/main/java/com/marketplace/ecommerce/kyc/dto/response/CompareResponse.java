package com.marketplace.ecommerce.kyc.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class CompareResponse {
    private String message;

    @JsonProperty("server_version")
    private String serverVersion;

    @JsonProperty("object")
    private Obj obj;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Obj {
        private String result;
        private String msg;
        private Double prob;
    }
}
