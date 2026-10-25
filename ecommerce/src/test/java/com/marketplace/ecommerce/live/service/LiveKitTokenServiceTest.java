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
    @DisplayName("getLivekitUrl trả về đúng URL")
    void testGetLivekitUrl() {
        assertEquals("wss://livekit.example.com", tokenService.getLivekitUrl());
    }

    @Test
    @DisplayName("createHostToken tạo JWT cho Host")
    void testCreateHostToken() {
        String token = tokenService.createHostToken("room-1", "user-host-1", "Host Name");
        assertNotNull(token);
        assertFalse(token.isBlank());
    }

    @Test
    @DisplayName("createViewerToken tạo JWT cho Viewer")
    void testCreateViewerToken() {
        String token = tokenService.createViewerToken("room-1", "user-view-1", "Viewer Name");
        assertNotNull(token);
        assertFalse(token.isBlank());
    }
}
