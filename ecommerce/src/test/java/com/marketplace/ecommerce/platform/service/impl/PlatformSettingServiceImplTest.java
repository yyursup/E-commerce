package com.marketplace.ecommerce.platform.service.impl;

import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.platform.constant.PlatformConstant;
import com.marketplace.ecommerce.platform.dto.PlatformSettingResponse;
import com.marketplace.ecommerce.platform.entity.PlatformSetting;
import com.marketplace.ecommerce.platform.repository.PlatformSettingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PlatformSettingServiceImplTest {

    @Mock
    private PlatformSettingRepository repository;

    @InjectMocks
    private PlatformSettingServiceImpl platformSettingService;

    private PlatformSetting setting;

    @BeforeEach
    void setUp() {
        setting = new PlatformSetting();
        setting.setKey(PlatformConstant.KEY_COMMISSION_RATE);
        setting.setValue("5.00");
    }

    @Test
    @DisplayName("getPlatformSetting lấy cấu hình hoa hồng thành công và ném lỗi khi không tìm thấy")
    void testGetPlatformSetting() {
        when(repository.findByKey(PlatformConstant.KEY_COMMISSION_RATE)).thenReturn(Optional.of(setting));
        PlatformSettingResponse res = platformSettingService.getPlatformSetting();
        assertNotNull(res);
        assertEquals("5.00", res.getValue());

        when(repository.findByKey(PlatformConstant.KEY_COMMISSION_RATE)).thenReturn(Optional.empty());
        assertThrows(CustomException.class, () -> platformSettingService.getPlatformSetting());
    }

    @Test
    @DisplayName("getCommissionRate, getFloorRate, getUsedGoodsCommissionRate trả về đúng giá trị hoặc default")
    void testGetRates() {
        when(repository.findByKey(PlatformConstant.KEY_COMMISSION_RATE)).thenReturn(Optional.of(setting));
        assertEquals(new BigDecimal("5.00"), platformSettingService.getCommissionRate());

        // fallback khi không tìm thấy
        when(repository.findByKey(PlatformConstant.KEY_COMMISSION_FLOOR_RATE)).thenReturn(Optional.empty());
        assertEquals(new BigDecimal("1.50"), platformSettingService.getFloorRate());

        when(repository.findByKey(PlatformConstant.KEY_COMMISSION_USED_GOODS_RATE)).thenReturn(Optional.empty());
        assertEquals(new BigDecimal("6.00"), platformSettingService.getUsedGoodsCommissionRate());

        // fallback khi value trong DB null
        PlatformSetting nullVal = new PlatformSetting();
        nullVal.setValue(null);
        when(repository.findByKey("NULL_KEY")).thenReturn(Optional.of(nullVal));

        // fallback khi value trong DB không parse được số (NumberFormatException)
        PlatformSetting badVal = new PlatformSetting();
        badVal.setValue("not_a_number");
        when(repository.findByKey(PlatformConstant.KEY_COMMISSION_RATE)).thenReturn(Optional.of(badVal));
        assertEquals(new BigDecimal("5.00"), platformSettingService.getCommissionRate());
    }

    @Test
    @DisplayName("setCommissionRate cập nhật tỷ lệ hoa hồng hợp lệ và ném lỗi khi rate null hoặc vượt biên")
    void testSetCommissionRate() {
        when(repository.findByKey(PlatformConstant.KEY_COMMISSION_RATE)).thenReturn(Optional.of(setting));
        when(repository.save(any(PlatformSetting.class))).thenAnswer(inv -> inv.getArgument(0));

        PlatformSettingResponse res = platformSettingService.setCommissionRate(new BigDecimal("7.50"));
        assertNotNull(res);
        assertEquals("7.5", res.getValue());
        verify(repository).save(setting);

        // Biên âm, > 100 hoặc null
        assertThrows(CustomException.class, () -> platformSettingService.setCommissionRate(null));
        assertThrows(CustomException.class, () -> platformSettingService.setCommissionRate(new BigDecimal("-1")));
        assertThrows(CustomException.class, () -> platformSettingService.setCommissionRate(new BigDecimal("105")));
    }

    @Test
    @DisplayName("updateSetting cập nhật cấu hình theo key với value null hoặc hợp lệ")
    void testUpdateSetting() {
        when(repository.findByKey("CUSTOM_KEY")).thenReturn(Optional.empty());
        when(repository.save(any(PlatformSetting.class))).thenAnswer(inv -> inv.getArgument(0));

        PlatformSettingResponse res = platformSettingService.updateSetting("CUSTOM_KEY", "custom_val");
        assertNotNull(res);
        assertEquals("custom_val", res.getValue());

        // value = null
        PlatformSettingResponse resNullVal = platformSettingService.updateSetting("CUSTOM_KEY", null);
        assertNotNull(resNullVal);
        assertEquals("", resNullVal.getValue());

        // key null hoặc blank
        assertThrows(CustomException.class, () -> platformSettingService.updateSetting(null, "val"));
        assertThrows(CustomException.class, () -> platformSettingService.updateSetting("", "val"));
        assertThrows(CustomException.class, () -> platformSettingService.updateSetting("   ", "val"));
    }

    @Test
    @DisplayName("getValue và getAllSettings")
    void testGetAndGetAll() {
        when(repository.findByKey("SOME_KEY")).thenReturn(Optional.of(setting));
        assertEquals("5.00", platformSettingService.getValue("SOME_KEY"));

        when(repository.findByKey("MISSING_KEY")).thenReturn(Optional.empty());
        assertNull(platformSettingService.getValue("MISSING_KEY"));

        when(repository.findAll()).thenReturn(List.of(setting));
        List<PlatformSettingResponse> all = platformSettingService.getAllSettings();
        assertEquals(1, all.size());
    }
}
