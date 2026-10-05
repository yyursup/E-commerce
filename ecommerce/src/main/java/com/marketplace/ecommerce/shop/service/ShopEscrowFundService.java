package com.marketplace.ecommerce.shop.service;

import com.marketplace.ecommerce.shop.dto.request.AdminAdjustEscrowFundRequest;
import com.marketplace.ecommerce.shop.dto.request.TopUpEscrowFundRequest;
import com.marketplace.ecommerce.shop.dto.response.ShopEscrowFundResponse;
import com.marketplace.ecommerce.shop.dto.response.ShopEscrowTransactionResponse;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.entity.ShopEscrowFund;
import com.marketplace.ecommerce.shop.entity.ShopEscrowTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.UUID;

public interface ShopEscrowFundService {

    ShopEscrowFundResponse getFundByShopId(UUID shopId);

    ShopEscrowFundResponse getFundByAccountId(UUID accountId);

    ShopEscrowFund createInitialFund(Shop shop, BigDecimal depositAmount, String refCode);

    ShopEscrowFundResponse topUpFund(UUID shopId, TopUpEscrowFundRequest request);

    ShopEscrowTransaction deductCompensation(UUID shopId, UUID orderId, UUID reportId, BigDecimal deductAmount, String reason);

    ShopEscrowFundResponse adminAdjustFund(UUID shopId, AdminAdjustEscrowFundRequest request, UUID adminId);

    Page<ShopEscrowTransactionResponse> getTransactionsByShopId(UUID shopId, Pageable pageable);

    Page<ShopEscrowTransactionResponse> getTransactionsByFundId(UUID fundId, Pageable pageable);

    Page<ShopEscrowFundResponse> getAllFunds(Boolean isDeficit, Pageable pageable);

    void checkAndAutoDowngradeDeficitShops();

    ShopEscrowFundResponse requestCloseShopAndRefund(UUID shopId);

    String createVnpayPaymentUrl(UUID shopId, TopUpEscrowFundRequest request, String clientIp);

    void processVnpayCallback(java.util.Map<String, String> params, String rawQueryString);
}
