package com.marketplace.ecommerce;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@ExtendWith(MockitoExtension.class)
class EcommerceApplicationTests {

	@Test
	@DisplayName("Kiểm tra khởi tạo ứng dụng EcommerceApplication độc lập (Mock UnitTest)")
	void contextLoads() {
		EcommerceApplication application = new EcommerceApplication();
		assertNotNull(application, "EcommerceApplication instance phải được khởi tạo thành công");
	}

}
