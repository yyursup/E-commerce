package com.marketplace.ecommerce.voucher.service;

import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.voucher.dto.*;
import com.marketplace.ecommerce.voucher.valueObjects.VoucherScope;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface VoucherService {

    Page<VoucherResponse> listActiveVouchers(VoucherScope scope, UUID shopId, UUID accountId, Pageable pageable);

    List<VoucherResponse> listActiveVouchers(VoucherScope scope, UUID shopId, UUID accountId);

    List<VoucherResponse> getShopVouchers(UUID shopId, UUID accountId);

    List<UserVoucherResponse> getMyVouchers(UUID accountId);

    UserVoucherResponse claimVoucher(UUID accountId, UUID voucherId);

    VoucherCalculationResponse validateAndCalculate(UUID accountId, String voucherCode, UUID shopId, BigDecimal subtotal, BigDecimal shippingFee);

    VoucherCalculationResponse validateAndCalculateMulti(UUID accountId, String shopVoucherCode, String platformVoucherCode, UUID shopId, BigDecimal subtotal, BigDecimal shippingFee);

    BigDecimal applyVoucherToOrder(Order order, String voucherCode);

    BigDecimal applyVouchersToOrder(Order order, String shopVoucherCode, String platformVoucherCode);

    void rollbackVoucherUsage(Order order);

    VoucherResponse createVoucher(UUID accountId, CreateVoucherRequest request);

    List<VoucherResponse> getShopManageVouchers(UUID accountId);
    
    /**
     * Vô hiệu hóa toàn bộ voucher đang hoạt động (ACTIVE) của gian hàng
     * sang trạng thái INACTIVE khi gian hàng chính thức đóng cửa (ShopStatus.CLOSED).
     *
     * @param shopId Định danh của gian hàng vừa đóng cửa
     */
    void deactivateVouchersOnShopClose(UUID shopId);
}
