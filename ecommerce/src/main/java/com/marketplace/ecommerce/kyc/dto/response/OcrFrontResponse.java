package com.marketplace.ecommerce.kyc.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class OcrFrontResponse {
    private String message;

    @JsonProperty("server_version")
    private String serverVersion;

    @JsonProperty("object")
    private Obj obj;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Obj {

        private String msg;

        @JsonProperty("card_type")
        private String cardType;

        private String id;
        private String name;

        @JsonProperty("birth_day")
        private String birthDay;

        private String gender;
        private String nationality;

        @JsonProperty("recent_location")
        private String recentLocation;

        @JsonProperty("origin_location")
        private String originLocation;

        @JsonProperty("issue_date")
        private String issueDate;

        @JsonProperty("issue_place")
        private String issuePlace;

        @JsonProperty("valid_date")
        private String validDate;

        @JsonProperty("type_id")
        private Integer typeId;
    }

}
