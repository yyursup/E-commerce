package com.marketplace.ecommerce.wallet.service;

import com.marketplace.ecommerce.payment.entity.Payment;

public interface WalletService {
    void recordPaymentAndHoldEscrow(Payment payment);
}
