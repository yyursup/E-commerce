package com.marketplace.ecommerce.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(GHNConfig.class)
public class GHNRestClientConfig {
    @Bean
    RestClient ghnRestClient(GHNConfig cfg) {
        return RestClient.builder()
                .baseUrl(cfg.getUrl())
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader("Token", cfg.getToken())
                .defaultHeader("ShopId", String.valueOf(cfg.getShopId()))
                .build();
    }
}
