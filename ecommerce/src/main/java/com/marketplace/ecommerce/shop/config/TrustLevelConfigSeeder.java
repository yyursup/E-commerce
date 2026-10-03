package com.marketplace.ecommerce.shop.config;

import com.marketplace.ecommerce.shop.entity.TrustLevelConfig;
import com.marketplace.ecommerce.shop.repository.TrustLevelConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class TrustLevelConfigSeeder implements CommandLineRunner {

    private final TrustLevelConfigRepository trustLevelConfigRepository;

    @Override
    public void run(String... args) {
        if (trustLevelConfigRepository.count() == 0) {
            log.info("Khởi tạo cấu hình mặc định cho 5 bậc xếp hạng uy tín ký quỹ (Trust Level 1-5 sao)...");
            List<TrustLevelConfig> defaultConfigs = List.of(
                TrustLevelConfig.builder()
                    .starLevel(1)
                    .tierName("Cơ bản (Chưa ký quỹ)")
                    .minDeposit(BigDecimal.ZERO)
                    .maxDeposit(new BigDecimal("1000000"))
                    .badgeIconUrl("/badges/star-1.png")
                    .benefitsDescription("Cấp độ cơ bản cho gian hàng không ký quỹ hoặc ký quỹ < 1 triệu. Vẫn được bán hàng nhưng mức độ bảo chứng tối thiểu.")
                    .isActive(true)
                    .build(),
                TrustLevelConfig.builder()
                    .starLevel(2)
                    .tierName("Tiềm năng")
                    .minDeposit(new BigDecimal("1000000"))
                    .maxDeposit(new BigDecimal("5000000"))
                    .badgeIconUrl("/badges/star-2.png")
                    .benefitsDescription("Huy hiệu Bảo chứng 2 sao. Có cam kết ký quỹ trách nhiệm từ 1 triệu đến dưới 5 triệu đồng.")
                    .isActive(true)
                    .build(),
                TrustLevelConfig.builder()
                    .starLevel(3)
                    .tierName("Uy tín Tiêu chuẩn")
                    .minDeposit(new BigDecimal("5000000"))
                    .maxDeposit(new BigDecimal("20000000"))
                    .badgeIconUrl("/badges/star-3.png")
                    .benefitsDescription("Huy hiệu Bảo chứng 3 sao. Ưu tiên hiển thị kết quả tìm kiếm, hỗ trợ phân xử khiếu nại nhanh.")
                    .isActive(true)
                    .build(),
                TrustLevelConfig.builder()
                    .starLevel(4)
                    .tierName("Đối tác Vàng")
                    .minDeposit(new BigDecimal("20000000"))
                    .maxDeposit(new BigDecimal("50000000"))
                    .badgeIconUrl("/badges/star-4.png")
                    .benefitsDescription("Huy hiệu Đối tác Vàng 4 sao. Được gắn nhãn Gian hàng Đảm bảo, ưu tiên đẩy top tìm kiếm và livestream.")
                    .isActive(true)
                    .build(),
                TrustLevelConfig.builder()
                    .starLevel(5)
                    .tierName("Kim Cương / Cam Kết Tối Đa")
                    .minDeposit(new BigDecimal("50000000"))
                    .maxDeposit(null)
                    .badgeIconUrl("/badges/star-5.png")
                    .benefitsDescription("Huy hiệu Kim Cương 5 sao danh giá nhất. Cam kết bảo chứng tối đa, ưu tiên nổi bật trên banner sàn, đền bù tức thì nếu có lỗi.")
                    .isActive(true)
                    .build()
            );
            trustLevelConfigRepository.saveAll(defaultConfigs);
            log.info("Đã khởi tạo thành công 5 bậc Trust Level mặc định.");
        }
    }
}
