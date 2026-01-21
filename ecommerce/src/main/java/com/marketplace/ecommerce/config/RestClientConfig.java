package com.marketplace.ecommerce.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class RestClientConfig {
    @Bean
    public RestClient vnptRestClient(EKycConfig cfg, EKycHelper helper) {
        return RestClient.builder()
                .baseUrl(cfg.getBaseUrl())
                .defaultHeaders(h -> h.addAll(helper.buildHeaders(false)))
                .build();
    }
}
