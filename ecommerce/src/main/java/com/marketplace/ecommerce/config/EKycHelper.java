package com.marketplace.ecommerce.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.util.logging.Logger;
@Slf4j
@Configuration
public class EKycHelper {

    private final EKycConfig config;

    public EKycHelper(EKycConfig config) {
        this.config = config;
    }

    public HttpHeaders buildHeaders(boolean isMultipart) {
        HttpHeaders headers = new HttpHeaders();

        headers.add(HttpHeaders.AUTHORIZATION, "Bearer " + config.getAccessToken());
        headers.add("Token-id", config.getTokenId());
        headers.add("Token-key", config.getTokenKey());
        headers.add("mac-address", "SERVER");

        headers.setContentType(
                isMultipart
                        ? MediaType.MULTIPART_FORM_DATA
                        : MediaType.APPLICATION_JSON
        );

        log.debug(
                "[EKycHelper] headers built. tokenId={}, tokenKey=****, contentType={}",
                config.getTokenId(),
                headers.getContentType()
        );

        return headers;
    }
}
