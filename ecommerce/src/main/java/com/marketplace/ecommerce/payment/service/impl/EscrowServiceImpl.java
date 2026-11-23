package com.marketplace.ecommerce.payment.service.impl;

import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.payment.dto.EscrowAdminResponse;
import com.marketplace.ecommerce.payment.dto.SettlementInfo;
import com.marketplace.ecommerce.payment.entity.Escrow;
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
    public void releaseByOrder(UUID orderId) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomException("Không tìm thấy đơn hàng"));

        if (order.getStatus() != OrderStatus.DELIVERED && order.getStatus() != OrderStatus.COMPLETED) {
            throw new CustomException("Order chưa đủ điều kiện release: " + order.getStatus());
        }

        Escrow escrow = escrowRepository.findByOrderIdForUpdate(orderId)
                .orElseThrow(() -> new CustomException("Không tìm thấy ký quỹ của đơn hàng"));

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

        // Khóa bi quan theo thứ tự toàn cục chuẩn: SellerWallet -> System EscrowWallet
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
        escrow.setSellerWallet(sellerWallet);

        Wallet escrowWallet = walletRepository.findSystemWalletForUpdate(WalletType.ESCROW)
                .orElseThrow(() -> new CustomException("Không tìm thấy ví ký quỹ của hệ thống"));

        BigDecimal amount = escrow.getAmount();
        if (amount == null || amount.signum() <= 0) {
            throw new CustomException("Số tiền ký quỹ không hợp lệ");
        }

        // 1. Phí ship khách trả (Sàn giữ lại trong ví ESCROW, Seller tuyệt đối không nhận)
        BigDecimal shippingFee = order.getShippingFee() != null ? order.getShippingFee() : BigDecimal.ZERO;
        BigDecimal shippingRetained = shippingFee.min(amount);

        // 2. Tiền hàng thực tế thu được trong Ký quỹ
        BigDecimal merchandiseProceeds = amount.subtract(shippingRetained);

        // 3. Khoản tài trợ Voucher Sàn (Platform Voucher Subsidy)
        // Quy tắc nghiệp vụ: Voucher do Sàn phát hành không làm giảm thu nhập của Seller
        BigDecimal platformSubsidy = order.getPlatformDiscountAmount() != null ? order.getPlatformDiscountAmount() : BigDecimal.ZERO;
        BigDecimal effectiveMerchandise = merchandiseProceeds.add(platformSubsidy);

        // 4. Phí hoa hồng sàn thực tế thu (tính trên tiền hàng hiệu dụng)
        BigDecimal nominalCommission = order.getPlatformCommission() != null ? order.getPlatformCommission() : BigDecimal.ZERO;
        BigDecimal actualCommission = nominalCommission.min(effectiveMerchandise);

        if (nominalCommission.compareTo(actualCommission) > 0) {
            BigDecimal shortfall = nominalCommission.subtract(actualCommission);
            log.warn("Đơn hàng {}: Tiền hàng hiệu dụng trong ký quỹ ({}) không đủ thu toàn bộ hoa hồng danh nghĩa ({}). Khoản hụt hoa hồng: {}",
                    order.getOrderNumber(), effectiveMerchandise, nominalCommission, shortfall);
        }

        // 5. Tiền thanh toán thực nhận của Seller (chỉ tiền hàng ròng, không có ship, được bù voucher sàn)
        BigDecimal sellerPayout = effectiveMerchandise.subtract(actualCommission);

        // 6. Doanh thu ròng của Sàn nạp vào số dư khả dụng (Hoa hồng - Khoản tài trợ voucher sàn).
        //    Phí ship KHÔNG phải doanh thu sàn: nó được ghi nhận là khoản trả ra cho GHN (giao dịch SHIPPING_FEE).
        BigDecimal platformNetCredit = actualCommission.subtract(platformSubsidy);

        if (escrowWallet.getLockedBalance().compareTo(amount) < 0) {
            escrowWallet.setLockedBalance(amount);
        }

        escrowWallet.subLocked(amount);

        if (sellerPayout.signum() > 0) {
            sellerWallet.addAvailable(sellerPayout);
        }

        if (platformNetCredit.signum() > 0) {
            escrowWallet.addAvailable(platformNetCredit);
        } else if (platformNetCredit.signum() < 0) {
            BigDecimal deficit = platformNetCredit.abs();
            if (escrowWallet.getAvailableBalance() != null && escrowWallet.getAvailableBalance().compareTo(deficit) < 0) {
                log.warn("Đơn hàng {}: Khoản tài trợ voucher sàn ({}) vượt quá tổng thu của sàn, gây thâm hụt số dư khả dụng: {}",
                        order.getOrderNumber(), platformSubsidy, deficit);
            }
            escrowWallet.subAvailable(deficit);
        }

        walletRepository.saveAll(List.of(escrowWallet, sellerWallet));

        // Hạch toán sổ cái (Transaction Ledger)
        String esCrowDedupe = "ESCROW:" + order.getId();
        if (!transactionRepository.existsByDedupeKey(esCrowDedupe)) {
            Transaction tRelease = Transaction.builder()
                    .fromWallet(escrowWallet)
                    .toWallet(sellerWallet)
                    .amount(sellerPayout)
                    .type(TransactionType.RELEASE)
                    .status(TransactionStatus.SUCCESS)
                    .referenceType(ReferenceType.ESCROW)
                    .referenceId(escrow.getId())
                    .createdAt(LocalDateTime.now())
                    .dedupeKey(esCrowDedupe)
                    .note("Release merchandise proceeds to seller for order " + order.getOrderNumber())
                    .build();
            transactionRepository.save(tRelease);
        }

        String commissionDedupe = "COMMISSION:" + order.getId();
        if (actualCommission.signum() > 0 && !transactionRepository.existsByDedupeKey(commissionDedupe)) {
            Transaction tFee = Transaction.builder()
                    .fromWallet(escrowWallet)
                    .toWallet(escrowWallet)
                    .amount(actualCommission)
                    .type(TransactionType.COMMISSION)
                    .status(TransactionStatus.SUCCESS)
                    .referenceType(ReferenceType.ESCROW)
                    .createdAt(LocalDateTime.now())
                    .referenceId(escrow.getId())
                    .dedupeKey(commissionDedupe)
                    .note("Taking platform commission for order " + order.getOrderNumber())
                    .build();
            transactionRepository.save(tFee);
        }

        String shippingDedupe = "SHIPPING_RETAIN:" + order.getId();
        if (shippingRetained.signum() > 0 && !transactionRepository.existsByDedupeKey(shippingDedupe)) {
            Transaction tShipping = Transaction.builder()
                    .fromWallet(escrowWallet)
                    .toWallet(null)
                    .amount(shippingRetained)
                    .type(TransactionType.SHIPPING_FEE)
                    .status(TransactionStatus.SUCCESS)
                    .referenceType(ReferenceType.ESCROW)
                    .createdAt(LocalDateTime.now())
                    .referenceId(escrow.getId())
                    .dedupeKey(shippingDedupe)
                    .note("Shipping fee paid out to GHN for order " + order.getOrderNumber())
                    .build();
            transactionRepository.save(tShipping);
        }

        String subsidyDedupe = "PLATFORM_SUBSIDY:" + order.getId();
        if (platformSubsidy.signum() > 0 && !transactionRepository.existsByDedupeKey(subsidyDedupe)) {
            Transaction tSubsidy = Transaction.builder()
                    .fromWallet(escrowWallet)
                    .toWallet(sellerWallet)
                    .amount(platformSubsidy)
                    .type(TransactionType.TRANSFER)
                    .status(TransactionStatus.SUCCESS)
                    .referenceType(ReferenceType.ESCROW)
                    .createdAt(LocalDateTime.now())
                    .referenceId(escrow.getId())
                    .dedupeKey(subsidyDedupe)
                    .note("Platform voucher subsidy for order " + order.getOrderNumber())
                    .build();
            transactionRepository.save(tSubsidy);
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
                .orElseThrow(() -> new CustomException("Không tìm thấy đơn hàng: " + orderId));

        Escrow escrow = escrowRepository.findByOrderIdForUpdate(orderId)
                .orElseThrow(() -> new CustomException("Không tìm thấy ký quỹ của đơn hàng: " + orderId));

        if (escrow.getStatus() == EscrowStatus.REFUNDED) {
            return;
        }

        if (escrow.getStatus() != EscrowStatus.HELD && escrow.getStatus() != EscrowStatus.DISPUTED) {
            throw new CustomException("Escrow status không hợp lệ để hoàn tiền: " + escrow.getStatus());
        }

        Wallet escrowWallet = escrow.getEscrowWallet();
        Wallet buyerWallet = escrow.getBuyerWallet();

        if (escrowWallet == null)
            throw new CustomException("Thiếu ví ký quỹ");
        if (buyerWallet == null)
            throw new CustomException("Thiếu ví người mua");

        BigDecimal amount = escrow.getAmount();
        if (amount == null || amount.signum() <= 0) {
            throw new CustomException("Số tiền ký quỹ không hợp lệ");
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
                .orElseThrow(() -> new CustomException("Không tìm thấy đơn hàng: " + orderId));

        Escrow escrow = escrowRepository.findByOrderIdForUpdate(orderId)
                .orElseThrow(() -> new CustomException("Không tìm thấy ký quỹ của đơn hàng: " + orderId));

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
            throw new CustomException("Thiếu ví ký quỹ");
        }
        if (buyerWallet == null) {
            throw new CustomException("Thiếu ví người mua");
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
            throw new CustomException("Số tiền ký quỹ không hợp lệ");
        }

        // Phí ship khách đã trả là tiền hộ GHN, không được đem chia cho Người mua/Người bán:
        // chuyến giao đã phát sinh nên trả ra cho GHN (giao dịch SHIPPING_FEE)
        BigDecimal shippingFee = order.getShippingFee() != null ? order.getShippingFee() : BigDecimal.ZERO;
        BigDecimal shippingRetained = shippingFee.min(totalAmount);
        BigDecimal merchandiseAmount = totalAmount.subtract(shippingRetained);

        BigDecimal commission = order.getPlatformCommission() != null ? order.getPlatformCommission() : BigDecimal.ZERO;
        BigDecimal netAmount = merchandiseAmount.subtract(commission);
        if (netAmount.signum() < 0) {
            throw new CustomException("Phí hoa hồng sàn lớn hơn tổng số tiền hàng ký quỹ");
        }

        // Số tiền chia cho từng bên từ netAmount (đã trừ phí ship và phí hoa hồng sàn)
        BigDecimal buyerShare = netAmount.multiply(BigDecimal.valueOf(buyerPercentage))
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
        BigDecimal sellerShare = netAmount.subtract(buyerShare); // Đảm bảo khớp từng đồng, không lệch do làm tròn

        if (escrowWallet.getLockedBalance().compareTo(totalAmount) < 0) {
            escrowWallet.setLockedBalance(totalAmount);
        }

        // Mở khóa toàn bộ ký quỹ: tiền hàng chia cho các bên, phần ship ghi nhận trả ra cho GHN
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
        String splitShipDedupe = "SHIPPING_RETAIN:" + order.getId();
        if (shippingRetained.signum() > 0 && !transactionRepository.existsByDedupeKey(splitShipDedupe)) {
            Transaction tShip = Transaction.builder()
                    .fromWallet(escrowWallet)
                    .toWallet(null)
                    .amount(shippingRetained)
                    .type(TransactionType.SHIPPING_FEE)
                    .status(TransactionStatus.SUCCESS)
                    .referenceType(ReferenceType.ESCROW)
                    .createdAt(LocalDateTime.now())
                    .referenceId(escrow.getId())
                    .dedupeKey(splitShipDedupe)
                    .note("Shipping fee paid out to GHN (admin split) for order " + order.getOrderNumber())
                    .build();
            transactionRepository.save(tShip);
        }

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

