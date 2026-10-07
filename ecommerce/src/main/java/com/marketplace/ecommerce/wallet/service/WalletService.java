package com.marketplace.ecommerce.wallet.service;

import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.payment.entity.Payment;
import com.marketplace.ecommerce.wallet.dto.response.WalletResponse;

import java.util.UUID;

public interface WalletService {
    void recordPaymentAndHoldEscrow(Payment payment);
    void payOrderWithWallet(Order order);
    WalletResponse getWallet(UUID accountId);

    WalletResponse getWalletByUserName(String username);
}
