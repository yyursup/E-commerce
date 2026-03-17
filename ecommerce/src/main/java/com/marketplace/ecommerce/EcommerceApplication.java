package com.marketplace.ecommerce;

import com.marketplace.ecommerce.config.DotEnvConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableJpaAuditing
@EnableAsync
public class EcommerceApplication {

	public static void main(String[] args) {
		DotEnvConfig.loadDotEnv();
		SpringApplication.run(EcommerceApplication.class, args);
	}

}
