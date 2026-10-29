package com.marketplace.ecommerce.request.policy;

import com.marketplace.ecommerce.common.exception.RateLimitException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReportRateLimiter {

    private final StringRedisTemplate stringRedisTemplate;

    private static final String KEY_PREFIX = "rate_limit:report:";
    private static final long COOLDOWN_SECONDS = 3L;

    /**
     * Kiểm tra và áp dụng rate limit cho tài khoản khi tạo report vi phạm marketplace.
     * Mỗi tài khoản chỉ được gửi 1 request trong mỗi khoảng 3 giây.
     *
     * @param accountId ID tài khoản thực hiện request (đã xác thực từ JWT)
     * @throws RateLimitException nếu request được gửi trong thời gian cooldown
     */
    public void checkRateLimit(UUID accountId) {
        if (accountId == null) {
            return;
        }

        if (stringRedisTemplate == null) {
            log.warn("StringRedisTemplate chưa được khởi tạo. Tạm thời fail-open cho accountId={}", accountId);
            return;
        }

        String key = KEY_PREFIX + accountId;
        Boolean acquired;

        // B1: Thao tác nguyên tử setIfAbsent (SET NX EX)
        // Chỉ bắt ngoại lệ giao tiếp Redis để fail-open
        try {
            acquired = stringRedisTemplate.opsForValue()
                    .setIfAbsent(key, "1", Duration.ofSeconds(COOLDOWN_SECONDS));
        } catch (Exception ex) {
            log.warn("Lỗi giao tiếp Redis khi kiểm tra rate limit cho accountId={}: {}. Tạm thời fail-open.",
                    accountId, ex.getMessage());
            // Fail-open: cho phép request tiếp tục khi hạ tầng Redis gặp sự cố
            return;
        }

        // B2: Đánh giá kết quả Redis an toàn
        // Chỉ khi acquired == Boolean.TRUE mới là request đầu tiên được cấp lượt
        if (Boolean.TRUE.equals(acquired)) {
            return;
        }

        // B3: Trường hợp acquired == Boolean.FALSE hoặc acquired == null (kết quả bất thường từ Redis):
        // Không mặc định cho qua khi trạng thái chưa rõ hoặc bị từ chối
        long retryAfter = COOLDOWN_SECONDS;
        try {
            Long ttl = stringRedisTemplate.getExpire(key, TimeUnit.SECONDS);
            if (ttl != null && ttl > 0) {
                retryAfter = ttl;
            }
        } catch (Exception ex) {
            log.warn("Lỗi khi truy vấn TTL key={} từ Redis: {}", key, ex.getMessage());
        }

        // B4: Ném RateLimitException NGOÀI khối try-catch Redis để không bao giờ bị nuốt nhầm
        throw new RateLimitException(
                "Bạn đang gửi báo cáo quá nhanh. Vui lòng thử lại sau " + retryAfter + " giây.",
                retryAfter
        );
    }
}

