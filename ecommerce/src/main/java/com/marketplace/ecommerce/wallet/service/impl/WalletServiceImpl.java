package com.marketplace.ecommerce.wallet.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
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
import com.marketplace.ecommerce.wallet.dto.response.WalletResponse;
import com.marketplace.ecommerce.wallet.entity.Wallet;
import com.marketplace.ecommerce.wallet.repository.WalletRepository;
import com.marketplace.ecommerce.wallet.service.WalletService;
import com.marketplace.ecommerce.wallet.valueObjects.WalletType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.marketplace.ecommerce.payment.repository.PaymentRepository;
import com.marketplace.ecommerce.payment.valueObjects.PaymentMethod;
import com.marketplace.ecommerce.payment.valueObjects.PaymentStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WalletServiceImpl implements WalletService {
    private final WalletRepository walletRepo;
    private final EscrowRepository escrowRepo;
    private final TransactionRepository txRepo;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;

    @Override
    public WalletResponse getWalletByUserName(String username) {
        User user = userRepository.findByAccountUsername(username)
                .orElseThrow(() -> new CustomException("User not found"));

        Wallet w = walletRepo.findByUserId(user.getId())
                .orElseThrow(() -> new CustomException("Wallet not found for userName=" + user.getAccount().getUsername()));

        return WalletResponse.from(w);
    }


    @Override
    @Transactional
    public WalletResponse getWallet(UUID accountId) {
        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("User not found"));

        Wallet w = walletRepo.findByUserId(user.getId())
                .orElseGet(() -> {
                    Wallet newWallet = Wallet.builder()
                            .user(user)
                            .currency("VND")
                            .availableBalance(BigDecimal.ZERO)
                            .lockedBalance(BigDecimal.ZERO)
                            .walletType(WalletType.USER)
                            .createdAt(LocalDateTime.now())
                            .build();
                    return walletRepo.save(newWallet);
                });

        return WalletResponse.from(w);
    }


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

    @Override
    @Transactional
    public void payOrderWithWallet(Order order) {
        BigDecimal amount = order.getTotal();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new CustomException("Số tiền thanh toán đơn hàng không hợp lệ");
        }

        // 1. Khóa bi quan ví người mua
        Wallet buyerWallet = walletRepo.findByUserIdForUpdate(order.getUser().getId())
                .orElseThrow(() -> new CustomException("Ví người mua không tồn tại hoặc chưa được kích hoạt"));

        if (buyerWallet.getAvailableBalance() == null || buyerWallet.getAvailableBalance().compareTo(amount) < 0) {
            BigDecimal currentBal = buyerWallet.getAvailableBalance() != null ? buyerWallet.getAvailableBalance() : BigDecimal.ZERO;
            throw new CustomException("Số dư ví không đủ để thanh toán đơn hàng. Hiện có: "
                    + currentBal.toPlainString() + " VND, Cần thanh toán: " + amount.toPlainString() + " VND");
        }

        // 2. Lấy ví Escrow sàn (Tuyệt đối không đụng vào ví người bán lúc thanh toán)
        Wallet escrowWallet = walletRepo.findSystemWalletForUpdate(WalletType.ESCROW)
                .orElseThrow(() -> new CustomException("Hệ thống ví ký quỹ ESCROW không tồn tại"));

        // 3. Trừ tiền ví buyer, cộng tiền khóa vào escrowWallet
        buyerWallet.subAvailable(amount);
        escrowWallet.addLocked(amount);
        walletRepo.saveAll(List.of(buyerWallet, escrowWallet));

        // 4. Tạo hoặc cập nhật Payment record
        String payDedupe = "WALLET_PAY:" + order.getId();
        Payment payment = paymentRepository.findByOrderId(order.getId())
                .orElseGet(() -> Payment.builder()
                        .order(order)
                        .amount(amount)
                        .method(PaymentMethod.WALLET)
                        .status(PaymentStatus.SUCCESS)
                        .txnRef("WAL-" + order.getOrderNumber() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                        .providerTxnNo(payDedupe)
                        .createdAt(LocalDateTime.now())
                        .build());
        payment.setMethod(PaymentMethod.WALLET);
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setAmount(amount);
        payment.setProviderTxnNo(payDedupe);
        paymentRepository.save(payment);

        // 5. Tạo Escrow record (chỉ lưu buyerWallet và escrowWallet, không đụng ví người bán)
        Escrow escrow = escrowRepo.findByOrderId(order.getId())
                .orElseGet(() -> Escrow.builder()
                        .order(order)
                        .buyerWallet(buyerWallet)
                        .escrowWallet(escrowWallet)
                        .amount(amount)
                        .status(EscrowStatus.HELD)
                        .createdAt(LocalDateTime.now())
                        .build());
        escrow.setStatus(EscrowStatus.HELD);
        escrow.setAmount(amount);
        escrowRepo.save(escrow);

        // 7. Ghi nhận Transaction HOLD vào Ký quỹ
        String holdDedupe = "WALLET_HOLD:" + escrow.getId();
        if (!txRepo.existsByDedupeKey(holdDedupe)) {
            Transaction tx = Transaction.builder()
                    .fromWallet(buyerWallet)
                    .toWallet(escrowWallet)
                    .amount(amount)
                    .type(TransactionType.HOLD)
                    .status(TransactionStatus.SUCCESS)
                    .referenceType(ReferenceType.ESCROW)
                    .referenceId(escrow.getId())
                    .dedupeKey(holdDedupe)
                    .createdAt(LocalDateTime.now())
                    .note("Thanh toán đơn hàng " + order.getOrderNumber() + " bằng ví số dư tài khoản")
                    .build();
            txRepo.save(tx);
        }
    }
}
