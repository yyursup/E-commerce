package com.marketplace.ecommerce.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "ghn")
public class GHNConfig {
    private String url;
    private String token;
    private String shopId;
}
