package com.marketplace.ecommerce.payment.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.entity.OrderItem;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.service.OrderService;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.payment.entity.Payment;
import com.marketplace.ecommerce.payment.repository.PaymentRepository;
import com.marketplace.ecommerce.payment.service.PaymentService;
import com.marketplace.ecommerce.payment.service.VNPayService;
import com.marketplace.ecommerce.payment.valueObjects.PaymentMethod;
import com.marketplace.ecommerce.payment.valueObjects.PaymentStatus;
import com.marketplace.ecommerce.payment.valueObjects.ReferenceType;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.wallet.entity.Wallet;
import com.marketplace.ecommerce.wallet.repository.WalletRepository;
import com.marketplace.ecommerce.wallet.service.WalletService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final VNPayService vnPayService;
    private final ProductRepository productRepository;
    private final WalletService walletService;
    private final OrderService orderService;
    private final WalletRepository walletRepository;

    @Transactional
    @Override
    public void processCallback(Map<String, String> params) {
        if (!vnPayService.verifyChecksum(params)) {
            throw new CustomException("Invalid VNPay checksum");
        }

        String txnRef = params.get("vnp_TxnRef");
        String providerResponseCode = params.get("vnp_ResponseCode");
        String providerTxnNo = params.get("vnp_TransactionNo");

        Payment payment = paymentRepository.findByTxnRef(txnRef).orElseThrow(() -> new CustomException("Payment not found by txnRef"));

        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            return;
        }

        payment.setProviderTxnNo(providerTxnNo);
        payment.setProviderResponseCode(providerResponseCode);

        if ("00".equals(providerResponseCode)) {
            payment.setStatus(PaymentStatus.SUCCESS);

            switch (payment.getReferenceType()) {
                case ORDER -> handleOrderPaymentSuccess(payment);
                case DEPOSIT -> handleDepositSuccess(payment);
                default -> throw new CustomException("Unsupported reference type: " + payment.getReferenceType());
            }
        } else {
            payment.setStatus(PaymentStatus.FAILED);

            switch (payment.getReferenceType()) {
                case ORDER -> handleOrderPaymentFailed(payment);
                case DEPOSIT -> handleDepositFailed(payment);
                default -> throw new CustomException("Unsupported reference type: " + payment.getReferenceType());
            }
        }

        paymentRepository.save(payment);
    }

    @Override
    public String createPayment(UUID orderId, UUID accountId) {
        User user = userRepository.findByAccountId(accountId).orElseThrow(() -> new CustomException("User not found"));

        Order order = orderRepository.findById(orderId).orElseThrow(() -> new CustomException("Order not found"));

        if (!user.getId().equals(order.getUser().getId())) {
            throw new CustomException("You don't have permission to pay this order");
        }

        if (order.getStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new CustomException("Order is not payable in current status: " + order.getStatus());
        }

        Payment payment = paymentRepository.findByOrderId(order.getId())
                .orElseGet(() -> Payment.builder()
                        .order(order)
                        .build());

        if (PaymentStatus.SUCCESS.equals(payment.getStatus())) {
            throw new CustomException("Payment already SUCCESS");
        }

        payment.setOrder(order);
        payment.setMethod(PaymentMethod.VNPAY);
        payment.setAmount(order.getTotal());
        payment.setTxnRef(generateTxnRef(order));
        payment.setStatus(PaymentStatus.PENDING);
        payment.setReferenceType(ReferenceType.ORDER);

        paymentRepository.save(payment);
        return vnPayService.buildPaymentUrl(payment);
    }

    @Override
    public String deposit(BigDecimal amount, UUID accountId) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new CustomException("Deposit amount must be greater than 0");
        }

        User user = userRepository.findByAccountId(accountId).orElseThrow(() -> new CustomException("User not found"));

        Wallet wallet = walletRepository.findByUserId(user.getId()).orElseThrow(() -> new CustomException("Wallet not found"));

        if (!user.getId().equals(wallet.getUser().getId())) {
            throw new CustomException("You don't have permission to deposit to this wallet");
        }

        Payment payment = Payment.builder().method(PaymentMethod.VNPAY).amount(amount).txnRef(generateDepositTxnRef(user.getId())).status(PaymentStatus.PENDING).referenceType(ReferenceType.DEPOSIT).referenceId(wallet.getId()).build();

        paymentRepository.save(payment);
        return vnPayService.buildPaymentUrl(payment);
    }

    private String generateDepositTxnRef(UUID userId) {
        String suffix = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        return "DEP-" + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE) + "-" + userId.toString().substring(0, 8).toUpperCase() + "-" + suffix;
    }

    private String generateTxnRef(Order order) {
        String suffix = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        return "PAY-" + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE) + "-" + order.getOrderNumber() + "-" + suffix;
    }

    private void handleDepositSuccess(Payment payment) {
        UUID walletId = payment.getReferenceId();
        if (walletId == null) {
            throw new CustomException("Deposit payment missing referenceId");
        }
        if (payment.getReferenceType() != ReferenceType.DEPOSIT) {
            throw new CustomException("Payment is not a deposit");
        }

        walletService.depositFromPayment(walletId, payment);
    }

    private void handleOrderPaymentSuccess(Payment payment) {
        Order order = payment.getOrder();
        if (order == null) {
            throw new CustomException("Order payment missing order");
        }

        order.setStatus(OrderStatus.CONFIRMED);
        handlePaymentSuccess(order.getId());
        orderService.tryCreateGHNOrder(order);
        walletService.recordPaymentAndHoldEscrow(payment);

        orderRepository.save(order);
    }

    private void handleDepositFailed(Payment payment) {
        if (payment == null) {
            throw new CustomException("Payment is required");
        }

        if (payment.getReferenceType() != ReferenceType.DEPOSIT) {
            throw new CustomException("Payment is not a deposit");
        }
    }

    private void handleOrderPaymentFailed(Payment payment) {
        Order order = payment.getOrder();
        if (order == null) {
            throw new CustomException("Order payment missing order");
        }

        if (order.isStockDeducted()) {
            for (OrderItem item : order.getItems()) {
                Product p = item.getProduct();
                p.setQuantity(p.getQuantity() + item.getQuantity());
            }

            productRepository.saveAll(order.getItems().stream().map(OrderItem::getProduct).distinct().toList());

            order.setStockDeducted(false);
        }

        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);
    }

    @Transactional
    public void handlePaymentSuccess(UUID orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow(() -> new CustomException("Order not found"));

        if (order.isStockDeducted()) {
            return;
        }

        for (OrderItem item : order.getItems()) {
            Product p = item.getProduct();
            if (p.getQuantity() < item.getQuantity()) {
                throw new CustomException("Not enough stock");
            }
            p.setQuantity(p.getQuantity() - item.getQuantity());
        }

        productRepository.saveAll(order.getItems().stream().map(OrderItem::getProduct).distinct().toList());

        order.setStockDeducted(true);
        orderRepository.save(order);
    }
}