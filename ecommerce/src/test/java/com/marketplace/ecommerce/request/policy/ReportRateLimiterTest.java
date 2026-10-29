package com.marketplace.ecommerce.request.policy;

import com.marketplace.ecommerce.common.exception.RateLimitException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReportRateLimiterTest {

    @Mock
    private StringRedisTemplate stringRedisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private ReportRateLimiter reportRateLimiter;

    private UUID accountId1;
    private UUID accountId2;

    @BeforeEach
    void setUp() {
        accountId1 = UUID.randomUUID();
        accountId2 = UUID.randomUUID();
        lenient().when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
    }

    @Test
    @DisplayName("1. Request đầu tiên của tài khoản được cấp quyền (setIfAbsent trả về true)")
    void testFirstRequest_Permitted() {
        String expectedKey = "rate_limit:report:" + accountId1;
        when(valueOperations.setIfAbsent(eq(expectedKey), eq("1"), eq(Duration.ofSeconds(3))))
                .thenReturn(Boolean.TRUE);

        assertDoesNotThrow(() -> reportRateLimiter.checkRateLimit(accountId1));

        verify(valueOperations, times(1))
                .setIfAbsent(eq(expectedKey), eq("1"), eq(Duration.ofSeconds(3)));
    }

    @Test
    @DisplayName("2. Request tiếp theo trong 3 giây bị từ chối (setIfAbsent trả về false -> ném RateLimitException)")
    void testSubsequentRequestWithin3s_ThrowsRateLimitException() {
        String expectedKey = "rate_limit:report:" + accountId1;
        when(valueOperations.setIfAbsent(eq(expectedKey), eq("1"), eq(Duration.ofSeconds(3))))
                .thenReturn(Boolean.FALSE);
        when(stringRedisTemplate.getExpire(eq(expectedKey), eq(TimeUnit.SECONDS)))
                .thenReturn(2L);

        RateLimitException ex = assertThrows(
                RateLimitException.class,
                () -> reportRateLimiter.checkRateLimit(accountId1)
        );

        assertEquals(2L, ex.getRetryAfterSeconds());
        assertTrue(ex.getMessage().contains("2 giây"));
    }

    @Test
    @DisplayName("3. Sau khi TTL hết hạn, request mới được cấp quyền thành công")
    void testRequestAfterTtlExpiry_Permitted() {
        String expectedKey = "rate_limit:report:" + accountId1;
        // Lần 1: Thành công
        when(valueOperations.setIfAbsent(eq(expectedKey), eq("1"), eq(Duration.ofSeconds(3))))
                .thenReturn(Boolean.TRUE);
        assertDoesNotThrow(() -> reportRateLimiter.checkRateLimit(accountId1));

        // Lần 2 (khi TTL đã hết hạn trên Redis, setIfAbsent lại trả về true): Thành công
        when(valueOperations.setIfAbsent(eq(expectedKey), eq("1"), eq(Duration.ofSeconds(3))))
                .thenReturn(Boolean.TRUE);
        assertDoesNotThrow(() -> reportRateLimiter.checkRateLimit(accountId1));

        verify(valueOperations, times(2))
                .setIfAbsent(eq(expectedKey), eq("1"), eq(Duration.ofSeconds(3)));
    }

    @Test
    @DisplayName("4. Hai accountId khác nhau có giới hạn độc lập (Account A không ảnh hưởng Account B)")
    void testIndependentAccountIds() {
        String key1 = "rate_limit:report:" + accountId1;
        String key2 = "rate_limit:report:" + accountId2;

        // Account 1 bị rate limit (đã gửi trước đó)
        when(valueOperations.setIfAbsent(eq(key1), eq("1"), eq(Duration.ofSeconds(3))))
                .thenReturn(Boolean.FALSE);
        when(stringRedisTemplate.getExpire(eq(key1), eq(TimeUnit.SECONDS)))
                .thenReturn(3L);

        // Account 2 gửi lần đầu -> được cấp quyền
        when(valueOperations.setIfAbsent(eq(key2), eq("1"), eq(Duration.ofSeconds(3))))
                .thenReturn(Boolean.TRUE);

        // Account 1 ném exception
        assertThrows(RateLimitException.class, () -> reportRateLimiter.checkRateLimit(accountId1));

        // Account 2 được phép đi qua bình thường
        assertDoesNotThrow(() -> reportRateLimiter.checkRateLimit(accountId2));
    }

    @Test
    @DisplayName("5. Xử lý kết quả Redis null an toàn, không mặc định cho qua khi chưa xác định rõ trạng thái")
    void testAbnormalRedisNullResult_RejectsRequest() {
        String expectedKey = "rate_limit:report:" + accountId1;
        when(valueOperations.setIfAbsent(eq(expectedKey), eq("1"), eq(Duration.ofSeconds(3))))
                .thenReturn(null); // Kết quả null bất thường từ driver Redis

        RateLimitException ex = assertThrows(
                RateLimitException.class,
                () -> reportRateLimiter.checkRateLimit(accountId1)
        );

        assertNotNull(ex);
        assertTrue(ex.getRetryAfterSeconds() > 0);
    }

    @Test
    @DisplayName("6. Khi Redis phát sinh lỗi kết nối (RedisConnectionFailureException), áp dụng fail-open")
    void testRedisConnectionFailure_FailsOpen() {
        String expectedKey = "rate_limit:report:" + accountId1;
        when(valueOperations.setIfAbsent(eq(expectedKey), eq("1"), eq(Duration.ofSeconds(3))))
                .thenThrow(new RedisConnectionFailureException("Không thể kết nối đến Redis"));

        // Khi Redis lỗi kết nối, component ghi nhận cảnh báo và fail-open (không ném ngoại lệ 500)
        assertDoesNotThrow(() -> reportRateLimiter.checkRateLimit(accountId1));
    }

    @Test
    @DisplayName("7. Xác nhận RateLimitException không bị catch rồi bỏ qua trong component")
    void testRateLimitException_NotSwallowed() {
        String expectedKey = "rate_limit:report:" + accountId1;
        when(valueOperations.setIfAbsent(eq(expectedKey), eq("1"), eq(Duration.ofSeconds(3))))
                .thenReturn(Boolean.FALSE);
        when(stringRedisTemplate.getExpire(eq(expectedKey), eq(TimeUnit.SECONDS)))
                .thenReturn(3L);

        try {
            reportRateLimiter.checkRateLimit(accountId1);
            fail("Phải ném RateLimitException nhưng không ném!");
        } catch (RateLimitException ex) {
            assertEquals(3L, ex.getRetryAfterSeconds());
            assertEquals("Bạn đang gửi báo cáo quá nhanh. Vui lòng thử lại sau 3 giây.", ex.getMessage());
        }
    }

    @Test
    @DisplayName("8. Xử lý accountId null an toàn")
    void testNullAccountId_SafeReturn() {
        assertDoesNotThrow(() -> reportRateLimiter.checkRateLimit(null));
        verifyNoInteractions(valueOperations);
    }
}

