package com.marketplace.ecommerce.payment.service.impl;

import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.payment.dto.EscrowAdminResponse;
import com.marketplace.ecommerce.payment.entity.Escrow;
import com.marketplace.ecommerce.payment.entity.Transaction;
import com.marketplace.ecommerce.payment.repository.EscrowRepository;
import com.marketplace.ecommerce.payment.repository.TransactionRepository;
import com.marketplace.ecommerce.payment.service.EscrowService;
import com.marketplace.ecommerce.payment.valueObjects.EscrowStatus;
import com.marketplace.ecommerce.payment.valueObjects.ReferenceType;
import com.marketplace.ecommerce.payment.valueObjects.TransactionStatus;
import com.marketplace.ecommerce.payment.valueObjects.TransactionType;
import com.marketplace.ecommerce.wallet.entity.Wallet;
import com.marketplace.ecommerce.wallet.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EscrowServiceImpl implements EscrowService {
    private final EscrowRepository escrowRepository;
    private final OrderRepository orderRepository;
    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;

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
                .orElseThrow(() -> new CustomException("Order not found"));

        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new CustomException("Order chưa đủ điều kiện release: " + order.getStatus());
        }

        Escrow escrow = escrowRepository.findByOrderIdForUpdate(orderId)
                .orElseThrow(() -> new CustomException("Escrow not found for order"));

        if (escrow.getStatus() == EscrowStatus.RELEASED) {
            return;
        }
        if (escrow.getStatus() != EscrowStatus.HELD) {
            throw new CustomException("Escrow status không hợp lệ: " + escrow.getStatus());
        }

        boolean releasedTxnExists = transactionRepository
                .existsByReferenceTypeAndReferenceIdAndType(
                        ReferenceType.ESCROW,
                        escrow.getId(),
                        TransactionType.RELEASE
                );

        if (releasedTxnExists) {
            escrow.setStatus(EscrowStatus.RELEASED);
            escrowRepository.save(escrow);

            if (order.getStatus() == OrderStatus.DELIVERED) {
                order.setStatus(OrderStatus.COMPLETED);
                orderRepository.save(order);
            }
            return;
        }

        Wallet escrowWallet = escrow.getEscrowWallet();
        Wallet sellerWallet = escrow.getSellerWallet();

        if (escrowWallet == null) throw new CustomException("Escrow wallet missing");
        if (sellerWallet == null) throw new CustomException("Seller wallet missing");

        BigDecimal amount = escrow.getAmount();
        if (amount == null || amount.signum() <= 0) {
            throw new CustomException("Escrow amount invalid");
        }

        BigDecimal commission = order.getPlatformCommission();
        if (commission == null) commission = BigDecimal.ZERO;

        BigDecimal sellerNet = amount.subtract(commission);
        if (sellerNet.signum() < 0) {
            throw new CustomException("Commission > amount");
        }

        if (escrowWallet.getLockedBalance().compareTo(amount) < 0) {
            throw new CustomException("Escrow locked không đủ để release");
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

        order.setStatus(OrderStatus.COMPLETED);
        orderRepository.save(order);
    }
}
