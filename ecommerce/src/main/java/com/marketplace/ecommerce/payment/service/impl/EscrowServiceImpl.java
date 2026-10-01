package com.marketplace.ecommerce.payment.service.impl;

import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.payment.dto.EscrowAdminResponse;
import com.marketplace.ecommerce.payment.dto.SettlementInfo;
import com.marketplace.ecommerce.payment.entity.Escrow;
import com.marketplace.ecommerce.payment.entity.Payment;
import com.marketplace.ecommerce.payment.entity.Transaction;
import com.marketplace.ecommerce.payment.repository.EscrowRepository;
import com.marketplace.ecommerce.payment.repository.PaymentRepository;
import com.marketplace.ecommerce.payment.repository.TransactionRepository;
import com.marketplace.ecommerce.payment.service.EscrowService;
import com.marketplace.ecommerce.payment.valueObjects.EscrowStatus;
import com.marketplace.ecommerce.payment.valueObjects.PaymentMethod;
import com.marketplace.ecommerce.payment.valueObjects.PaymentStatus;
import com.marketplace.ecommerce.payment.valueObjects.ReferenceType;
import com.marketplace.ecommerce.payment.valueObjects.TransactionStatus;
import com.marketplace.ecommerce.payment.valueObjects.TransactionType;
import com.marketplace.ecommerce.wallet.entity.Wallet;
import com.marketplace.ecommerce.wallet.repository.WalletRepository;
import com.marketplace.ecommerce.wallet.valueObjects.WalletType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EscrowServiceImpl implements EscrowService {
    private final EscrowRepository escrowRepository;
    private final OrderRepository orderRepository;
    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final PaymentRepository paymentRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<EscrowAdminResponse> adminList(EscrowStatus status, Pageable pageable) {
        return escrowRepository.adminList(status, pageable)
                .map(EscrowAdminResponse::from);
    }

    @Override
    @Transactional
    public void recordCodEscrow(Order order) {
        if (order == null || order.getId() == null) {
            return;
        }

        BigDecimal amount = order.getTotal();
        if (amount == null || amount.signum() <= 0) {
            log.warn("Cannot record COD escrow: order {} total is null or non-positive", order.getOrderNumber());
            return;
        }

        // 1. Create or retrieve Payment entity
        Payment payment = paymentRepository.findByOrderId(order.getId())
                .orElseGet(() -> Payment.builder()
                        .order(order)
                        .method(PaymentMethod.COD)
                        .status(PaymentStatus.PENDING)
                        .amount(amount)
                        .txnRef("COD-" + order.getOrderNumber() + "-"
                                + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                        .createdAt(LocalDateTime.now())
                        .build());

        if (payment.getId() == null) {
            paymentRepository.save(payment);
        }

        // 2. Safely retrieve or create buyer & seller wallets
        Wallet buyerWallet = walletRepository.findByUserIdForUpdate(order.getUser().getId())
                .orElseGet(() -> {
                    Wallet w = Wallet.builder()
                            .user(order.getUser())
                            .currency("VND")
                            .availableBalance(BigDecimal.ZERO)
                            .lockedBalance(BigDecimal.ZERO)
                            .walletType(WalletType.USER)
                            .createdAt(LocalDateTime.now())
                            .build();
                    return walletRepository.save(w);
                });

        Wallet sellerWallet = walletRepository.findByUserIdForUpdate(order.getShop().getUser().getId())
                .orElseGet(() -> {
                    Wallet w = Wallet.builder()
                            .user(order.getShop().getUser())
                            .currency("VND")
                            .availableBalance(BigDecimal.ZERO)
                            .lockedBalance(BigDecimal.ZERO)
                            .walletType(WalletType.USER)
                            .createdAt(LocalDateTime.now())
                            .build();
                    return walletRepository.save(w);
                });

        Wallet escrowWallet = walletRepository.findSystemWalletForUpdate(WalletType.ESCROW)
                .orElseThrow(() -> new CustomException("System ESCROW wallet not found"));

        // 3. Create or retrieve Escrow entity
        Escrow escrow = escrowRepository.findByOrderId(order.getId())
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
            escrow = escrowRepository.save(escrow);
        }

        // 4. Update escrow wallet locked balance and record Transaction
        String holdDedupe = "COD_HOLD:" + escrow.getId();
        if (!transactionRepository.existsByDedupeKey(holdDedupe)) {
            escrowWallet.addLocked(amount);
            walletRepository.save(escrowWallet);

            Transaction tx = Transaction.builder()
                    .fromWallet(null) // Physical cash COD collected by courier on delivery
                    .toWallet(escrowWallet)
                    .amount(amount)
                    .type(TransactionType.HOLD)
                    .status(TransactionStatus.SUCCESS)
                    .referenceType(ReferenceType.ESCROW)
                    .referenceId(escrow.getId())
                    .dedupeKey(holdDedupe)
                    .createdAt(LocalDateTime.now())
                    .note("COD escrow hold for order " + order.getOrderNumber())
                    .build();

            transactionRepository.save(tx);
        }
    }

    @Override
    @Transactional
    public void cancelCodEscrow(Order order) {
        if (order == null || order.getId() == null) {
            return;
        }

        Escrow escrow = escrowRepository.findByOrderIdForUpdate(order.getId()).orElse(null);
        if (escrow != null && escrow.getStatus() == EscrowStatus.HELD) {
            Wallet escrowWallet = escrow.getEscrowWallet();
            if (escrowWallet != null && escrow.getAmount() != null) {
                if (escrowWallet.getLockedBalance().compareTo(escrow.getAmount()) >= 0) {
                    escrowWallet.subLocked(escrow.getAmount());
                    walletRepository.save(escrowWallet);
                }
            }

            escrow.setStatus(EscrowStatus.CANCELED);
            escrow.setUpdatedAt(LocalDateTime.now());
            escrowRepository.save(escrow);

            String cancelDedupe = "COD_CANCEL:" + escrow.getId();
            if (!transactionRepository.existsByDedupeKey(cancelDedupe)) {
                Transaction tx = Transaction.builder()
                        .fromWallet(escrowWallet)
                        .toWallet(null)
                        .amount(escrow.getAmount())
                        .type(TransactionType.REFUND)
                        .status(TransactionStatus.SUCCESS)
                        .referenceType(ReferenceType.ESCROW)
                        .referenceId(escrow.getId())
                        .dedupeKey(cancelDedupe)
                        .createdAt(LocalDateTime.now())
                        .note("COD cancelled for order " + order.getOrderNumber())
                        .build();
                transactionRepository.save(tx);
            }
        }

        paymentRepository.findByOrderId(order.getId()).ifPresent(payment -> {
            if (payment.getStatus() == PaymentStatus.PENDING || payment.getStatus() == PaymentStatus.INIT) {
                payment.setStatus(PaymentStatus.CANCELLED);
                payment.setUpdatedAt(LocalDateTime.now());
                paymentRepository.save(payment);
            }
        });
    }

    @Override
    @Transactional
    public void releaseByOrder(UUID orderId) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomException("Order not found"));

        if (order.getStatus() != OrderStatus.DELIVERED && order.getStatus() != OrderStatus.COMPLETED) {
            throw new CustomException("Order chưa đủ điều kiện release: " + order.getStatus());
        }

        Escrow escrow = escrowRepository.findByOrderIdForUpdate(orderId)
                .orElse(null);

        if (escrow == null) {
            if (order.getPaymentMethod() == PaymentMethod.COD) {
                log.info("Auto-healing missing COD escrow for order {}", order.getOrderNumber());
                recordCodEscrow(order);
                escrow = escrowRepository.findByOrderIdForUpdate(orderId)
                        .orElseThrow(() -> new CustomException("Escrow not found for order"));
            } else {
                throw new CustomException("Escrow not found for order");
            }
        }

        if (escrow.getStatus() == EscrowStatus.RELEASED) {
            return;
        }
        if (escrow.getStatus() != EscrowStatus.HELD && escrow.getStatus() != EscrowStatus.DISPUTED) {
            throw new CustomException("Escrow status không hợp lệ: " + escrow.getStatus());
        }

        boolean releasedTxnExists = transactionRepository
                .existsByReferenceTypeAndReferenceIdAndType(
                        ReferenceType.ESCROW,
                        escrow.getId(),
                        TransactionType.RELEASE);

        if (releasedTxnExists) {
            escrow.setStatus(EscrowStatus.RELEASED);
            escrowRepository.save(escrow);

            if (order.getStatus() != OrderStatus.COMPLETED) {
                order.setStatus(OrderStatus.COMPLETED);
                orderRepository.save(order);
            }
            return;
        }

        Wallet escrowWallet = escrow.getEscrowWallet();
        Wallet sellerWallet = escrow.getSellerWallet();

        if (escrowWallet == null)
            throw new CustomException("Escrow wallet missing");
        if (sellerWallet == null) {
            sellerWallet = walletRepository.findByUserIdForUpdate(order.getShop().getUser().getId())
                    .orElseGet(() -> {
                        Wallet w = Wallet.builder()
                                .user(order.getShop().getUser())
                                .currency("VND")
                                .availableBalance(BigDecimal.ZERO)
                                .lockedBalance(BigDecimal.ZERO)
                                .walletType(WalletType.USER)
                                .createdAt(LocalDateTime.now())
                                .build();
                        return walletRepository.save(w);
                    });
            escrow.setSellerWallet(sellerWallet);
        }

        BigDecimal amount = escrow.getAmount();
        if (amount == null || amount.signum() <= 0) {
            throw new CustomException("Escrow amount invalid");
        }

        BigDecimal commission = order.getPlatformCommission();
        if (commission == null)
            commission = BigDecimal.ZERO;

        BigDecimal sellerNet = amount.subtract(commission);
        if (sellerNet.signum() < 0) {
            throw new CustomException("Commission > amount");
        }

        if (escrowWallet.getLockedBalance().compareTo(amount) < 0) {
            escrowWallet.setLockedBalance(amount);
        }

        escrowWallet.subLocked(amount);

        if (sellerNet.signum() > 0) {
            sellerWallet.addAvailable(sellerNet);
        }

        if (commission.signum() > 0) {
            escrowWallet.addAvailable(commission);
        }

        walletRepository.saveAll(List.of(escrowWallet, sellerWallet));

        String esCrowDedupe = "ESCROW:" + order.getId();
        Transaction tRelease = Transaction.builder()
                .fromWallet(escrowWallet)
                .toWallet(sellerWallet)
                .amount(sellerNet)
                .type(TransactionType.RELEASE)
                .status(TransactionStatus.SUCCESS)
                .referenceType(ReferenceType.ESCROW)
                .referenceId(escrow.getId())
                .createdAt(LocalDateTime.now())
                .dedupeKey(esCrowDedupe)
                .note("Release success for order " + order.getId())
                .build();
        transactionRepository.save(tRelease);

        String commissionDedupe = "COMMISSION:" + order.getId();
        if (commission.signum() > 0) {
            Transaction tFee = Transaction.builder()
                    .fromWallet(escrowWallet)
                    .toWallet(escrowWallet)
                    .amount(commission)
                    .type(TransactionType.COMMISSION)
                    .status(TransactionStatus.SUCCESS)
                    .referenceType(ReferenceType.ESCROW)
                    .createdAt(LocalDateTime.now())
                    .referenceId(escrow.getId())
                    .dedupeKey(commissionDedupe)
                    .note("Taking commission success for order " + order.getId())
                    .build();
            transactionRepository.save(tFee);
        }

        escrow.setStatus(EscrowStatus.RELEASED);
        escrow.setUpdatedAt(LocalDateTime.now());
        escrowRepository.save(escrow);

        if (order.getPaymentMethod() == PaymentMethod.COD) {
            paymentRepository.findByOrderId(order.getId()).ifPresent(payment -> {
                if (payment.getStatus() != PaymentStatus.SUCCESS) {
                    payment.setStatus(PaymentStatus.SUCCESS);
                    payment.setUpdatedAt(LocalDateTime.now());
                    paymentRepository.save(payment);
                }
            });
        }

        order.setStatus(OrderStatus.COMPLETED);
        orderRepository.save(order);

    }

    @Override
    @Transactional
    public void refundByOrder(UUID orderId, String reason) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomException("Order not found: " + orderId));

        Escrow escrow = escrowRepository.findByOrderIdForUpdate(orderId)
                .orElseThrow(() -> new CustomException("Escrow not found for order: " + orderId));

        if (escrow.getStatus() == EscrowStatus.REFUNDED) {
            return;
        }

        if (escrow.getStatus() != EscrowStatus.HELD && escrow.getStatus() != EscrowStatus.DISPUTED) {
            throw new CustomException("Escrow status không hợp lệ để hoàn tiền: " + escrow.getStatus());
        }

        Wallet escrowWallet = escrow.getEscrowWallet();
        Wallet buyerWallet = escrow.getBuyerWallet();

        if (escrowWallet == null)
            throw new CustomException("Escrow wallet missing");
        if (buyerWallet == null)
            throw new CustomException("Buyer wallet missing");

        BigDecimal amount = escrow.getAmount();
        if (amount == null || amount.signum() <= 0) {
            throw new CustomException("Escrow amount invalid");
        }

        if (escrowWallet.getLockedBalance().compareTo(amount) < 0) {
            escrowWallet.setLockedBalance(amount);
        }

        escrowWallet.subLocked(amount);
        buyerWallet.addAvailable(amount);

        walletRepository.saveAll(List.of(escrowWallet, buyerWallet));

        String refundDedupe = "ESCROW_REFUND:" + order.getId();
        if (!transactionRepository.existsByDedupeKey(refundDedupe)) {
            Transaction txRefund = Transaction.builder()
                    .fromWallet(escrowWallet)
                    .toWallet(buyerWallet)
                    .amount(amount)
                    .type(TransactionType.REFUND)
                    .status(TransactionStatus.SUCCESS)
                    .referenceType(ReferenceType.ESCROW)
                    .referenceId(escrow.getId())
                    .createdAt(LocalDateTime.now())
                    .dedupeKey(refundDedupe)
                    .note(reason != null ? reason
                            : "Hoàn tiền ký quỹ về ví người mua cho đơn " + order.getOrderNumber())
                    .build();
            transactionRepository.save(txRefund);
        }

        escrow.setStatus(EscrowStatus.REFUNDED);
        escrow.setUpdatedAt(LocalDateTime.now());
        escrowRepository.save(escrow);

        order.setStatus(OrderStatus.REFUNDED);
        orderRepository.save(order);

    }

    /**
     * Phân chia ký quỹ theo tỷ lệ phần trăm giữa Người mua và Người bán (Escrow Split Settlement).
     * 
     * QUY TẮC NGHIỆP VỤ BẢN QUYỀN CỦA SÀN (BUSINESS RULE):
     * Khi tranh chấp đơn hàng leo thang đến mức Ban Quản Trị phải can thiệp phân xử và phân chia tỷ lệ (Split),
     * Sàn luôn bảo lưu 5% phí hoa hồng sàn (order.getPlatformCommission()) để bù đắp chi phí vận hành, đối soát
     * và thẩm định tranh chấp.
     * Số tiền thực tế được phân bổ cho hai bên (netAmount = totalAmount - commission) được chia chính xác theo tỷ lệ %
     * do Admin phán quyết.
     * Lưu ý: Nếu Admin quyết định hoàn trả 100% không thu phí sàn (ví dụ gian hàng lừa đảo), Admin sử dụng endpoint refundByOrder.
     */
    @Override
    @Transactional
    public void splitSettleByOrder(UUID orderId, Integer buyerPercentage, Integer sellerPercentage, String note) {
        if (buyerPercentage == null || sellerPercentage == null) {
            throw new CustomException("Tỷ lệ phân chia không được để trống");
        }
        if (buyerPercentage < 0 || sellerPercentage < 0 || (buyerPercentage + sellerPercentage != 100)) {
            throw new CustomException("Tổng tỷ lệ phân chia giữa Người mua và Người bán phải chính xác bằng 100%");
        }


        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomException("Order not found: " + orderId));

        Escrow escrow = escrowRepository.findByOrderIdForUpdate(orderId)
                .orElseThrow(() -> new CustomException("Escrow not found for order: " + orderId));

        if (escrow.getStatus() == EscrowStatus.RELEASED || escrow.getStatus() == EscrowStatus.REFUNDED) {
            throw new CustomException("Ký quỹ đơn hàng đã được xử lý hoàn tất trước đó: " + escrow.getStatus());
        }

        if (escrow.getStatus() != EscrowStatus.HELD && escrow.getStatus() != EscrowStatus.DISPUTED) {
            throw new CustomException("Trạng thái Escrow không hợp lệ để phân chia: " + escrow.getStatus());
        }

        Wallet escrowWallet = escrow.getEscrowWallet();
        Wallet buyerWallet = escrow.getBuyerWallet();
        Wallet sellerWallet = escrow.getSellerWallet();

        if (escrowWallet == null) {
            throw new CustomException("Escrow wallet missing");
        }
        if (buyerWallet == null) {
            throw new CustomException("Buyer wallet missing");
        }
        if (sellerWallet == null) {
            sellerWallet = walletRepository.findByUserIdForUpdate(order.getShop().getUser().getId())
                    .orElseGet(() -> {
                        Wallet w = Wallet.builder()
                                .user(order.getShop().getUser())
                                .currency("VND")
                                .availableBalance(BigDecimal.ZERO)
                                .lockedBalance(BigDecimal.ZERO)
                                .walletType(WalletType.USER)
                                .createdAt(LocalDateTime.now())
                                .build();
                        return walletRepository.save(w);
                    });
            escrow.setSellerWallet(sellerWallet);
        }

        BigDecimal totalAmount = escrow.getAmount();
        if (totalAmount == null || totalAmount.signum() <= 0) {
            throw new CustomException("Escrow amount invalid");
        }

        BigDecimal commission = order.getPlatformCommission() != null ? order.getPlatformCommission() : BigDecimal.ZERO;
        BigDecimal netAmount = totalAmount.subtract(commission);
        if (netAmount.signum() < 0) {
            throw new CustomException("Phí hoa hồng sàn lớn hơn tổng số tiền ký quỹ");
        }

        // Số tiền chia cho từng bên từ netAmount (đã trừ phí hoa hồng sàn)
        BigDecimal buyerShare = netAmount.multiply(BigDecimal.valueOf(buyerPercentage))
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
        BigDecimal sellerShare = netAmount.subtract(buyerShare); // Đảm bảo khớp từng đồng, không lệch do làm tròn

        if (escrowWallet.getLockedBalance().compareTo(totalAmount) < 0) {
            escrowWallet.setLockedBalance(totalAmount);
        }

        escrowWallet.subLocked(totalAmount);

        if (commission.signum() > 0) {
            escrowWallet.addAvailable(commission);
        }
        if (buyerShare.signum() > 0) {
            buyerWallet.addAvailable(buyerShare);
        }
        if (sellerShare.signum() > 0) {
            sellerWallet.addAvailable(sellerShare);
        }

        walletRepository.saveAll(List.of(escrowWallet, buyerWallet, sellerWallet));

        // Hạch toán Transaction
        if (commission.signum() > 0) {
            String commissionDedupe = "COMMISSION:" + order.getId();
            if (!transactionRepository.existsByDedupeKey(commissionDedupe)) {
                Transaction tFee = Transaction.builder()
                        .fromWallet(escrowWallet)
                        .toWallet(escrowWallet)
                        .amount(commission)
                        .type(TransactionType.COMMISSION)
                        .status(TransactionStatus.SUCCESS)
                        .referenceType(ReferenceType.ESCROW)
                        .createdAt(LocalDateTime.now())
                        .referenceId(escrow.getId())
                        .dedupeKey(commissionDedupe)
                        .note("Khấu trừ hoa hồng sàn cho đơn " + order.getOrderNumber())
                        .build();
                transactionRepository.save(tFee);
            }
        }

        if (buyerShare.signum() > 0) {
            String buyerDedupe = "ESCROW_SPLIT_BUYER:" + order.getId();
            if (!transactionRepository.existsByDedupeKey(buyerDedupe)) {
                Transaction txBuyer = Transaction.builder()
                        .fromWallet(escrowWallet)
                        .toWallet(buyerWallet)
                        .amount(buyerShare)
                        .type(TransactionType.REFUND)
                        .status(TransactionStatus.SUCCESS)
                        .referenceType(ReferenceType.ESCROW)
                        .referenceId(escrow.getId())
                        .createdAt(LocalDateTime.now())
                        .dedupeKey(buyerDedupe)
                        .note(String.format("Phân xử hoàn tiền %d%% cho Người mua: %s", buyerPercentage,
                                (note != null ? note : "")))
                        .build();
                transactionRepository.save(txBuyer);
            }
        }

        if (sellerShare.signum() > 0) {
            String sellerDedupe = "ESCROW_SPLIT_SELLER:" + order.getId();
            if (!transactionRepository.existsByDedupeKey(sellerDedupe)) {
                Transaction txSeller = Transaction.builder()
                        .fromWallet(escrowWallet)
                        .toWallet(sellerWallet)
                        .amount(sellerShare)
                        .type(TransactionType.RELEASE)
                        .status(TransactionStatus.SUCCESS)
                        .referenceType(ReferenceType.ESCROW)
                        .referenceId(escrow.getId())
                        .createdAt(LocalDateTime.now())
                        .dedupeKey(sellerDedupe)
                        .note(String.format("Phân xử giải ngân %d%% cho Người bán: %s", sellerPercentage,
                                (note != null ? note : "")))
                        .build();
                transactionRepository.save(txSeller);
            }
        }

        escrow.setStatus(buyerPercentage == 100 ? EscrowStatus.REFUNDED : EscrowStatus.RELEASED);
        escrow.setUpdatedAt(LocalDateTime.now());
        escrowRepository.save(escrow);

        if (order.getPaymentMethod() == PaymentMethod.COD) {
            paymentRepository.findByOrderId(order.getId()).ifPresent(payment -> {
                if (payment.getStatus() != PaymentStatus.SUCCESS) {
                    payment.setStatus(PaymentStatus.SUCCESS);
                    payment.setUpdatedAt(LocalDateTime.now());
                    paymentRepository.save(payment);
                }
            });
        }

        order.setStatus(buyerShare.signum() > 0 ? OrderStatus.REFUNDED : OrderStatus.COMPLETED);
        orderRepository.save(order);
    }

    @Override
    @Transactional(readOnly = true)
    public SettlementInfo getSettlementByOrderId(UUID orderId) {
        if (orderId == null) {
            return null;
        }
        Escrow escrow = escrowRepository.findByOrderId(orderId).orElse(null);
        if (escrow == null) {
            return null;
        }
        List<Transaction> transactions = transactionRepository
                .findByReferenceTypeAndReferenceId(ReferenceType.ESCROW, escrow.getId());
        return SettlementInfo.fromTransactions(transactions, escrow.getAmount());
    }
}

