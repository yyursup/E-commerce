package com.marketplace.ecommerce.config;


import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "vnpt.ekyc")
public class EKycConfig {
    private String baseUrl = "";
    private String accessToken = "";
    private String tokenId = "";
    private String tokenKey = "";

    // ===== computed URLs =====

    public String getLivenessUrl() {
        return baseUrl + "/ai/v1/card/liveness";
    }

    public String getClassifyUrl() {
        return baseUrl + "/ai/v1/classify/id";
    }

    public String getCompareUrl() {
        return baseUrl + "/ai/v1/face/compare";
    }

    public String getOcrFrontUrl() {
        return baseUrl + "/ai/v1/ocr/id/front";
    }

    public String getOcrBackUrl() {
        return baseUrl + "/ai/v1/ocr/id/back";
    }

    public String getFileUploadUrl() {
        return baseUrl + "/file-service/v1/addFile";
    }

    public String getFaceLivenessUrl() {
        return baseUrl + "/ai/v1/face/liveness";
    }
}
