package com.marketplace.ecommerce.live.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class LiveKitTokenServiceTest {

    private LiveKitTokenService tokenService;

    @BeforeEach
    void setUp() {
        tokenService = new LiveKitTokenService();
        ReflectionTestUtils.setField(tokenService, "livekitUrl", "wss://livekit.example.com");
        ReflectionTestUtils.setField(tokenService, "apiKey", "devkey");
        ReflectionTestUtils.setField(tokenService, "apiSecret", "secret123456789012345678901234567890");
    }

    @Test
    @DisplayName("init ném lỗi khi thiếu URL hoặc API Key/Secret")
    void testInit_Validation() {
        LiveKitTokenService unconfigured = new LiveKitTokenService();
        assertThrows(IllegalStateException.class, unconfigured::init);

        ReflectionTestUtils.setField(unconfigured, "livekitUrl", "wss://livekit.example.com");
        assertThrows(IllegalStateException.class, unconfigured::init);

        ReflectionTestUtils.setField(unconfigured, "apiKey", "key");
        assertThrows(IllegalStateException.class, unconfigured::init);

        // Hợp lệ
        tokenService.init();
        assertEquals("wss://livekit.example.com", tokenService.getLivekitUrl());
    }

    @Test
    @DisplayName("createHostToken tạo JWT cho Host và cache lại")
    void testCreateHostToken() {
        String token1 = tokenService.createHostToken("room-1", "user-host-1", "Host Name");
        assertNotNull(token1);
        assertFalse(token1.isBlank());

        // Lần 2 lấy từ cache
        String token2 = tokenService.createHostToken("room-1", "user-host-1", "Host Name");
        assertEquals(token1, token2);

        tokenService.clearCache();
    }

    @Test
    @DisplayName("createViewerToken tạo JWT cho Viewer và cache lại")
    void testCreateViewerToken() {
        String token1 = tokenService.createViewerToken("room-1", "user-view-1", "Viewer Name");
        assertNotNull(token1);
        assertFalse(token1.isBlank());

        // Lần 2 lấy từ cache
        String token2 = tokenService.createViewerToken("room-1", "user-view-1", "Viewer Name");
        assertEquals(token1, token2);
    }
}
