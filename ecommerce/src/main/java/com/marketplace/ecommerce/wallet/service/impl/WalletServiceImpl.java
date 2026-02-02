package com.marketplace.ecommerce.wallet.service.impl;

import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.payment.entity.Escrow;
import com.marketplace.ecommerce.payment.entity.Payment;
import com.marketplace.ecommerce.payment.entity.Transaction;
import com.marketplace.ecommerce.payment.repository.EscrowRepository;
import com.marketplace.ecommerce.payment.repository.TransactionRepository;
import com.marketplace.ecommerce.payment.valueObjects.EscrowStatus;
import com.marketplace.ecommerce.payment.valueObjects.ReferenceType;
import com.marketplace.ecommerce.payment.valueObjects.TransactionStatus;
import com.marketplace.ecommerce.payment.valueObjects.TransactionType;
import com.marketplace.ecommerce.wallet.entity.Wallet;
import com.marketplace.ecommerce.wallet.repository.WalletRepository;
import com.marketplace.ecommerce.wallet.service.WalletService;
import com.marketplace.ecommerce.wallet.valueObjects.WalletType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class WalletServiceImpl implements WalletService {
    private final WalletRepository walletRepo;
    private final EscrowRepository escrowRepo;
    private final TransactionRepository txRepo;


    @Override
    @Transactional
    public void recordPaymentAndHoldEscrow(Payment payment) {
        Order order = payment.getOrder();
        BigDecimal amount = payment.getAmount();

        Wallet buyerWallet = walletRepo.findByUserIdForUpdate(order.getUser().getId())
                .orElseThrow(() -> new CustomException("Buyer wallet not found"));

        Wallet sellerWallet = walletRepo.findByUserIdForUpdate(order.getShop().getUser().getId())
                .orElseThrow(() -> new CustomException("Seller wallet not found"));

        Wallet escrowWallet = walletRepo.findSystemWalletForUpdate(WalletType.ESCROW)
                .orElseThrow(() -> new CustomException("System ESCROW wallet not found"));

        Escrow escrow = escrowRepo.findByOrderId(order.getId())
                .orElseGet(() -> Escrow.builder()
                        .order(order)
                        .buyerWallet(buyerWallet)
                        .sellerWallet(sellerWallet)
                        .escrowWallet(escrowWallet)
                        .amount(amount)
                        .status(EscrowStatus.HELD)
                        .createdAt(LocalDateTime.now())
                        .build());

        if (escrow.getId() == null) {
            escrowRepo.save(escrow);
        }

        String payDedupe = "PAYMENT:" + payment.getId();
        if (!txRepo.existsByDedupeKey(payDedupe)) {
            Transaction tx1 = Transaction.builder()
                    .fromWallet(null) // external
                    .toWallet(buyerWallet)
                    .amount(amount)
                    .type(TransactionType.PAYMENT)
                    .status(TransactionStatus.SUCCESS)
                    .referenceType(ReferenceType.PAYMENT)
                    .referenceId(payment.getId())
                    .dedupeKey(payDedupe)
                    .providerTxnNo(payment.getProviderTxnNo())
                    .createdAt(LocalDateTime.now())
                    .note("VNPay success, credit buyer wallet")
                    .build();

            buyerWallet.addAvailable(amount);
            txRepo.save(tx1);
        }

        // ---------- TX #2 ESCROW_HOLD ----------
        String holdDedupe = "ESCROW_HOLD:" + escrow.getId();
        if (!txRepo.existsByDedupeKey(holdDedupe)) {
            if (buyerWallet.getAvailableBalance().compareTo(amount) < 0) {
                throw new CustomException("Buyer available balance insufficient for escrow hold");
            }

            Transaction tx2 = Transaction.builder()
                    .fromWallet(buyerWallet)
                    .toWallet(escrowWallet)
                    .amount(amount)
                    .type(TransactionType.HOLD)
                    .status(TransactionStatus.SUCCESS)
                    .referenceType(ReferenceType.ESCROW)
                    .referenceId(escrow.getId())
                    .dedupeKey(holdDedupe)
                    .createdAt(LocalDateTime.now())
                    .note("Hold money to escrow for order " + order.getOrderNumber())
                    .build();

            buyerWallet.subAvailable(amount);
            escrowWallet.addLocked(amount);

            txRepo.save(tx2);
        }

        walletRepo.save(buyerWallet);
        walletRepo.save(escrowWallet);
    }
}
