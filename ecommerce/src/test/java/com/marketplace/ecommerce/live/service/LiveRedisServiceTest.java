package com.marketplace.ecommerce.live.service;

import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.SetOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class LiveRedisServiceTest {

    @Mock
    private StringRedisTemplate stringRedisTemplate;
    @Mock
    private ValueOperations<String, String> valueOperations;
    @Mock
    private SetOperations<String, String> setOperations;

    @InjectMocks
    private LiveRedisService liveRedisService;

    private UUID liveId;

    @BeforeEach
    void setUp() {
        liveId = UUID.randomUUID();
    }

    @Test
    @DisplayName("incrementLikes và getLikes thao tác đúng với Redis Value")
    void testLikes() {
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.increment("live:likes:" + liveId, 5)).thenReturn(10L);
        when(valueOperations.get("live:likes:" + liveId)).thenReturn("10");

        Long likes = liveRedisService.incrementLikes(liveId, 5);
        assertEquals(10L, likes);

        Long currentLikes = liveRedisService.getLikes(liveId);
        assertEquals(10L, currentLikes);

        // increment trả về null
        when(valueOperations.increment("live:likes:" + liveId, 1)).thenReturn(null);
        assertEquals(0L, liveRedisService.incrementLikes(liveId, 1));

        // get trả về null
        when(valueOperations.get("live:likes:" + liveId)).thenReturn(null);
        assertEquals(0L, liveRedisService.getLikes(liveId));
    }

    @Test
    @DisplayName("addViewer, removeViewer và getViewerCount thao tác đúng với Redis Set")
    void testViewers() {
        when(stringRedisTemplate.opsForSet()).thenReturn(setOperations);
        when(setOperations.size("live:viewers:" + liveId)).thenReturn(42L);

        liveRedisService.addViewer(liveId, "viewer_1");
        verify(setOperations).add(eq("live:viewers:" + liveId), eq("viewer_1"));

        Integer count = liveRedisService.getViewerCount(liveId);
        assertEquals(42, count);

        // size trả về null
        when(setOperations.size("live:viewers:" + liveId)).thenReturn(null);
        assertEquals(0, liveRedisService.getViewerCount(liveId));

        liveRedisService.removeViewer(liveId, "viewer_1");
        verify(setOperations).remove(eq("live:viewers:" + liveId), eq("viewer_1"));
    }

    @Test
    @DisplayName("setPinnedProductId và getPinnedProductId lưu và lấy id sản phẩm ghim")
    void testPinnedProduct() {
        UUID prodId = UUID.randomUUID();
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("live:pinned:" + liveId)).thenReturn(prodId.toString());

        liveRedisService.setPinnedProductId(liveId, prodId);
        verify(valueOperations).set(eq("live:pinned:" + liveId), eq(prodId.toString()), any());

        String retrieved = liveRedisService.getPinnedProductId(liveId);
        assertEquals(prodId.toString(), retrieved);

        liveRedisService.setPinnedProductId(liveId, null);
        verify(stringRedisTemplate).delete("live:pinned:" + liveId);
    }

    @Test
    @DisplayName("cleanupLive xóa toàn bộ key liên quan đến phòng live")
    void testCleanupLive() {
        liveRedisService.cleanupLive(liveId);
        verify(stringRedisTemplate).delete(anyList());
    }

    @Test
    @DisplayName("Tất cả các method xử lý Exception an toàn khi Redis bị lỗi")
    void testExceptions() {
        when(stringRedisTemplate.opsForValue()).thenThrow(new RuntimeException("Redis error"));
        when(stringRedisTemplate.opsForSet()).thenThrow(new RuntimeException("Redis error"));
        doThrow(new RuntimeException("Redis error")).when(stringRedisTemplate).delete(anyList());
        doThrow(new RuntimeException("Redis error")).when(stringRedisTemplate).delete(anyString());

        // incrementLikes
        assertEquals(0L, liveRedisService.incrementLikes(liveId, 5));

        // getLikes
        assertEquals(0L, liveRedisService.getLikes(liveId));

        // addViewer
        assertDoesNotThrow(() -> liveRedisService.addViewer(liveId, "v1"));

        // removeViewer
        assertDoesNotThrow(() -> liveRedisService.removeViewer(liveId, "v1"));

        // getViewerCount
        assertEquals(0, liveRedisService.getViewerCount(liveId));

        // setPinnedProductId
        assertDoesNotThrow(() -> liveRedisService.setPinnedProductId(liveId, UUID.randomUUID()));
        assertDoesNotThrow(() -> liveRedisService.setPinnedProductId(liveId, null));

        // getPinnedProductId
        assertNull(liveRedisService.getPinnedProductId(liveId));

        // cleanupLive
        assertDoesNotThrow(() -> liveRedisService.cleanupLive(liveId));
    }
}
