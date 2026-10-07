package com.marketplace.ecommerce.live.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class LiveRedisService {

    private final StringRedisTemplate stringRedisTemplate;

    private static final String KEY_LIKES = "live:likes:";
    private static final String KEY_VIEWERS = "live:viewers:";
    private static final String KEY_PINNED = "live:pinned:";

    public Long incrementLikes(UUID liveId, long count) {
        try {
            String key = KEY_LIKES + liveId;
            Long likes = stringRedisTemplate.opsForValue().increment(key, count);
            stringRedisTemplate.expire(key, Duration.ofDays(1));
            return likes != null ? likes : 0L;
        } catch (Exception e) {
            log.warn("Lỗi khi tăng lượt thích trên Redis: {}", e.getMessage());
            return 0L;
        }
    }

    public Long getLikes(UUID liveId) {
        try {
            String val = stringRedisTemplate.opsForValue().get(KEY_LIKES + liveId);
            return val != null ? Long.parseLong(val) : 0L;
        } catch (Exception e) {
            return 0L;
        }
    }

    public void addViewer(UUID liveId, String viewerId) {
        try {
            String key = KEY_VIEWERS + liveId;
            stringRedisTemplate.opsForSet().add(key, viewerId);
            stringRedisTemplate.expire(key, Duration.ofDays(1));
        } catch (Exception e) {
            log.warn("Lỗi khi thêm người xem vào Redis: {}", e.getMessage());
        }
    }

    public void removeViewer(UUID liveId, String viewerId) {
        try {
            stringRedisTemplate.opsForSet().remove(KEY_VIEWERS + liveId, viewerId);
        } catch (Exception e) {
            log.warn("Lỗi khi gỡ người xem khỏi Redis: {}", e.getMessage());
        }
    }

    public Integer getViewerCount(UUID liveId) {
        try {
            Long size = stringRedisTemplate.opsForSet().size(KEY_VIEWERS + liveId);
            return size != null ? size.intValue() : 0;
        } catch (Exception e) {
            return 0;
        }
    }

    public void setPinnedProductId(UUID liveId, UUID productId) {
        try {
            String key = KEY_PINNED + liveId;
            if (productId != null) {
                stringRedisTemplate.opsForValue().set(key, productId.toString(), Duration.ofDays(1));
            } else {
                stringRedisTemplate.delete(key);
            }
        } catch (Exception e) {
            log.warn("Lỗi lưu sản phẩm ghim vào Redis: {}", e.getMessage());
        }
    }

    public String getPinnedProductId(UUID liveId) {
        try {
            return stringRedisTemplate.opsForValue().get(KEY_PINNED + liveId);
        } catch (Exception e) {
            return null;
        }
    }

    public void cleanupLive(UUID liveId) {
        try {
            stringRedisTemplate.delete(List.of(
                    KEY_LIKES + liveId,
                    KEY_VIEWERS + liveId,
                    KEY_PINNED + liveId
            ));
        } catch (Exception e) {
            log.warn("Lỗi dọn dẹp phòng live trên Redis: {}", e.getMessage());
        }
    }
}
