package com.marketplace.ecommerce.shop.service.impl;

import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.shop.dto.request.TrustLevelConfigRequest;
import com.marketplace.ecommerce.shop.dto.response.TrustLevelConfigResponse;
import com.marketplace.ecommerce.shop.entity.TrustLevelConfig;
import com.marketplace.ecommerce.shop.repository.TrustLevelConfigRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TrustLevelConfigServiceImplTest {

    @Mock
    private TrustLevelConfigRepository repository;

    @InjectMocks
    private TrustLevelConfigServiceImpl service;

    private UUID adminId;
    private TrustLevelConfig sampleConfig;

    @BeforeEach
    void setUp() {
        adminId = UUID.randomUUID();
        sampleConfig = TrustLevelConfig.builder()
                .id(UUID.randomUUID())
                .starLevel(2)
                .tierName("Tiềm năng")
                .minDeposit(new BigDecimal("1000000"))
                .maxDeposit(new BigDecimal("5000000"))
                .commissionDiscount(new BigDecimal("0.20"))
                .badgeIconUrl("/badges/star-2.png")
                .benefitsDescription("Huy hiệu 2 sao")
                .isActive(true)
                .build();
    }

    @Test
    @DisplayName("getAllConfigs và getActiveConfigs trả về danh sách DTO")
    void testGetConfigs() {
        when(repository.findAllByOrderByStarLevelAsc()).thenReturn(List.of(sampleConfig));
        when(repository.findAllByIsActiveTrueOrderByStarLevelAsc()).thenReturn(List.of(sampleConfig));

        List<TrustLevelConfigResponse> all = service.getAllConfigs();
        List<TrustLevelConfigResponse> active = service.getActiveConfigs();

        assertEquals(1, all.size());
        assertEquals("Tiềm năng", all.get(0).getTierName());
        assertEquals(1, active.size());
    }

    @Test
    @DisplayName("updateConfig cập nhật cấu hình bậc sao thành công với đầy đủ thuộc tính")
    void testUpdateConfig_Success() {
        when(repository.findByStarLevel(2)).thenReturn(Optional.of(sampleConfig));
        when(repository.save(any(TrustLevelConfig.class))).thenAnswer(inv -> inv.getArgument(0));

        TrustLevelConfigRequest req = new TrustLevelConfigRequest();
        req.setTierName("Bạc Uy Tín");
        req.setMinDeposit(new BigDecimal("2000000"));
        req.setMaxDeposit(new BigDecimal("6000000"));
        req.setCommissionDiscount(new BigDecimal("0.30"));
        req.setBadgeIconUrl("/badges/star-2-new.png");
        req.setBenefitsDescription("Mô tả ưu đãi mới");
        req.setIsActive(true);

        TrustLevelConfigResponse res = service.updateConfig(2, req, adminId);
        assertNotNull(res);
        assertEquals("Bạc Uy Tín", res.getTierName());
        assertEquals(new BigDecimal("2000000"), res.getMinDeposit());
        assertEquals("/badges/star-2-new.png", res.getBadgeIconUrl());
        assertEquals("Mô tả ưu đãi mới", res.getBenefitsDescription());
        verify(repository).save(sampleConfig);
    }

    @Test
    @DisplayName("updateConfig ném lỗi khi starLevel không hợp lệ hoặc min/max/discount không hợp lệ")
    void testUpdateConfig_Validations() {
        TrustLevelConfigRequest req = new TrustLevelConfigRequest();
        req.setTierName("Tier 2");
        req.setMinDeposit(new BigDecimal("-1"));

        assertThrows(CustomException.class, () -> service.updateConfig(null, req, adminId));
        assertThrows(CustomException.class, () -> service.updateConfig(0, req, adminId));
        assertThrows(CustomException.class, () -> service.updateConfig(6, req, adminId));

        // Not found
        when(repository.findByStarLevel(2)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> service.updateConfig(2, req, adminId));

        // Negative min deposit
        when(repository.findByStarLevel(2)).thenReturn(Optional.of(sampleConfig));
        assertThrows(CustomException.class, () -> service.updateConfig(2, req, adminId));

        // max < min
        req.setMinDeposit(new BigDecimal("5000000"));
        req.setMaxDeposit(new BigDecimal("3000000"));
        assertThrows(CustomException.class, () -> service.updateConfig(2, req, adminId));

        // Commission discount < 0
        req.setMaxDeposit(new BigDecimal("10000000"));
        req.setCommissionDiscount(new BigDecimal("-0.1"));
        assertThrows(CustomException.class, () -> service.updateConfig(2, req, adminId));

        // Commission discount > 100
        req.setCommissionDiscount(new BigDecimal("101"));
        assertThrows(CustomException.class, () -> service.updateConfig(2, req, adminId));
    }

    @Test
    @DisplayName("getConfigByStarLevel trả về entity hoặc null")
    void testGetConfigByStarLevel() {
        when(repository.findByStarLevel(2)).thenReturn(Optional.of(sampleConfig));
        when(repository.findByStarLevel(99)).thenReturn(Optional.empty());

        assertNotNull(service.getConfigByStarLevel(2));
        assertNull(service.getConfigByStarLevel(99));
    }

    @Test
    @DisplayName("resolveTrustLevel tính bậc sao chuẩn xác theo số tiền ký quỹ")
    void testResolveTrustLevel() {
        // empty configs list
        when(repository.findAllByIsActiveTrueOrderByStarLevelAsc()).thenReturn(Collections.emptyList());
        assertEquals(1, service.resolveTrustLevel(new BigDecimal("500000")));

        TrustLevelConfig c1 = TrustLevelConfig.builder().starLevel(1).minDeposit(BigDecimal.ZERO).isActive(true).build();
        TrustLevelConfig c2 = TrustLevelConfig.builder().starLevel(2).minDeposit(new BigDecimal("1000000")).isActive(true).build();
        TrustLevelConfig c3 = TrustLevelConfig.builder().starLevel(3).minDeposit(new BigDecimal("5000000")).isActive(true).build();
        TrustLevelConfig cNullMin = TrustLevelConfig.builder().starLevel(4).minDeposit(null).isActive(true).build();
        when(repository.findAllByIsActiveTrueOrderByStarLevelAsc()).thenReturn(List.of(c1, c2, c3, cNullMin));

        assertEquals(1, service.resolveTrustLevel(null));
        assertEquals(1, service.resolveTrustLevel(BigDecimal.ZERO));
        assertEquals(1, service.resolveTrustLevel(new BigDecimal("500000")));
        assertEquals(2, service.resolveTrustLevel(new BigDecimal("1500000")));
        assertEquals(3, service.resolveTrustLevel(new BigDecimal("5000000")));
        assertEquals(3, service.resolveTrustLevel(new BigDecimal("100000000")));
    }

    @Test
    @DisplayName("resetDefaultConfigs khôi phục cả bậc sao đã có và bậc sao chưa có")
    void testResetDefaultConfigs() {
        // Cho sao 1 đã tồn tại, các sao 2-5 chưa tồn tại
        when(repository.findByStarLevel(1)).thenReturn(Optional.of(sampleConfig));
        when(repository.findByStarLevel(intThat(i -> i != null && i > 1))).thenReturn(Optional.empty());
        when(repository.findAllByOrderByStarLevelAsc()).thenReturn(List.of(sampleConfig));

        List<TrustLevelConfigResponse> res = service.resetDefaultConfigs(adminId);
        assertNotNull(res);
        verify(repository, atLeast(5)).save(any(TrustLevelConfig.class));
    }
}
