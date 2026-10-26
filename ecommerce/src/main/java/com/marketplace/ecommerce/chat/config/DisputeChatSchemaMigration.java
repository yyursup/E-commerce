package com.marketplace.ecommerce.chat.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Migration tự động khi khởi động Backend:
 * Đảm bảo Partial Unique Index và Check Constraint của phòng chat DISPUTE luôn tồn tại trong DB,
 * giúp developer chỉ cần down/up docker hoặc chạy backend mà không cần chạy SQL thủ công bằng tay.
 */
@Component
@Order(105)
@RequiredArgsConstructor
@Slf4j
public class DisputeChatSchemaMigration implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            log.info("DisputeChatSchemaMigration: Kiểm tra và khởi tạo Partial Unique Index cho phòng chat DISPUTE...");

            // 1. Tạo Partial Unique Index khớp chính xác với câu lệnh ON CONFLICT (request_id) WHERE type = 'DISPUTE'
            jdbcTemplate.execute(
                "CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_threads_dispute_request_id " +
                "ON chat_threads(request_id) WHERE type = 'DISPUTE'"
            );

            // 2. Tạo Check Constraint đảm bảo DISPUTE thread luôn có cả request_id và order_id
            jdbcTemplate.execute(
                "DO $$ BEGIN " +
                "  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_dispute_requires_request_and_order') THEN " +
                "    ALTER TABLE chat_threads ADD CONSTRAINT chk_dispute_requires_request_and_order " +
                "    CHECK (type != 'DISPUTE' OR (request_id IS NOT NULL AND order_id IS NOT NULL)); " +
                "  END IF; " +
                "END $$;"
            );

            // 3. Cho phép sender_id là NULL đối với tin nhắn hệ thống (SYSTEM)
            jdbcTemplate.execute("ALTER TABLE chat_messages ALTER COLUMN sender_id DROP NOT NULL;");

            // 4. Ràng buộc toàn vẹn: Chỉ message_type = 'SYSTEM' mới được phép có sender_id IS NULL, các tin nhắn khác bắt buộc có sender_id
            jdbcTemplate.execute(
                "DO $$ BEGIN " +
                "  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_chat_messages_sender_required') THEN " +
                "    ALTER TABLE chat_messages ADD CONSTRAINT chk_chat_messages_sender_required " +
                "    CHECK (message_type = 'SYSTEM' OR sender_id IS NOT NULL); " +
                "  END IF; " +
                "END $$;"
            );

            log.info("✓ DisputeChatSchemaMigration: Khởi tạo Partial Unique Index & Constraint thành công.");
        } catch (Exception e) {
            log.warn("DisputeChatSchemaMigration: {}", e.getMessage());
        }
    }
}
