package com.marketplace.ecommerce.kyc.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
@Data
public class UploadResponse {

    private String message;

    @JsonProperty("object")
    private Obj object;

    @Data
    public static class Obj {
        private String fileName;
        private String title;
        private String description;
        private String hash;
        private String fileType;
        private String uploadedDate;
        private String storageType;
        private String tokenId;
    }
}
