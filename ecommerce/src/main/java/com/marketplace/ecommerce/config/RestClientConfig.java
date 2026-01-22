package com.marketplace.ecommerce.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;

@Configuration
public class RestClientConfig {
    @Bean
    public RestClient vnptRestClient(EKycConfig cfg, EKycHelper helper) {

        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();

        JdkClientHttpRequestFactory rf = new JdkClientHttpRequestFactory(httpClient);
        rf.setReadTimeout(Duration.ofSeconds(30));

        return RestClient.builder()
                .baseUrl(cfg.getBaseUrl())
                .defaultHeaders(h -> h.addAll(helper.buildHeaders(false)))
                .requestFactory(rf)
                .build();
    }
}
