package com.marketplace.ecommerce.kyc.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class OcrBackResponse {
    private String message;

    @JsonProperty("server_version")
    private String serverVersion;

    @JsonProperty("object")
    private Obj obj;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Obj {

        @JsonProperty("msg_back")
        private String msgBack;

        @JsonProperty("issue_date")
        private String issueDate;

        @JsonProperty("issue_place")
        private String issuePlace;

        @JsonProperty("back_type_id")
        private Integer backTypeId;
    }
}
