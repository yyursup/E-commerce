package com.marketplace.ecommerce.voucher.service;

import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.voucher.dto.*;
import com.marketplace.ecommerce.voucher.valueObjects.VoucherScope;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface VoucherService {

    List<VoucherResponse> listActiveVouchers(VoucherScope scope, UUID shopId, UUID accountId);

    List<VoucherResponse> getShopVouchers(UUID shopId, UUID accountId);

    List<UserVoucherResponse> getMyVouchers(UUID accountId);

    UserVoucherResponse claimVoucher(UUID accountId, UUID voucherId);

    VoucherCalculationResponse validateAndCalculate(UUID accountId, String voucherCode, UUID shopId, BigDecimal subtotal, BigDecimal shippingFee);

    BigDecimal applyVoucherToOrder(Order order, String voucherCode);

    void rollbackVoucherUsage(Order order);

    VoucherResponse createVoucher(UUID accountId, CreateVoucherRequest request);

    List<VoucherResponse> getShopManageVouchers(UUID accountId);
}
