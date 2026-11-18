package com.marketplace.ecommerce.shipping.service;

import com.marketplace.ecommerce.shipping.dto.response.ShippingFeeRecordResponse;
import com.marketplace.ecommerce.shipping.dto.response.ShippingFeeSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/** Tra cứu phí vận chuyển GHN của từng lần giao cho admin (chỉ đọc, không phải doanh thu sàn). */
public interface ShippingFeeAdminService {

    /** @param direction OUTBOUND, RETURN hoặc null (cả hai chiều) */
    Page<ShippingFeeRecordResponse> list(String direction, Pageable pageable);

    ShippingFeeSummaryResponse summary();
}
