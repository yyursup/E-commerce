package com.marketplace.ecommerce.wallet.service;

import com.marketplace.ecommerce.payment.entity.Payment;
import com.marketplace.ecommerce.wallet.dto.response.WalletResponse;

import java.util.UUID;

public interface WalletService {
    void recordPaymentAndHoldEscrow(Payment payment);
    WalletResponse getWallet(UUID accountId);


}
