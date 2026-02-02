package com.marketplace.ecommerce.payment.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.cart.entity.Cart;
import com.marketplace.ecommerce.cart.entity.CartItem;
import com.marketplace.ecommerce.cart.repository.CartRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.order.entity.OrderItem;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.valueObjects.OrderStatus;
import com.marketplace.ecommerce.payment.entity.Payment;
import com.marketplace.ecommerce.payment.repository.PaymentRepository;
import com.marketplace.ecommerce.payment.service.PaymentService;
import com.marketplace.ecommerce.payment.service.VNPayService;
import com.marketplace.ecommerce.payment.valueObjects.PaymentMethod;
import com.marketplace.ecommerce.payment.valueObjects.PaymentStatus;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.wallet.service.WalletService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

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

    @Transactional
    @Override
    public void processCallback(Map<String, String> params) {
        if (!vnPayService.verifyChecksum(params)) {
            throw new CustomException("Invalid VNPay checksum");
        }

        String txnRef = params.get("vnp_TxnRef");
        String providerResponseCode = params.get("vnp_ResponseCode");
        String providerTxnNo = params.get("vnp_TransactionNo");

        Payment payment = paymentRepository.findByTxnRef(txnRef)
                .orElseThrow(() -> new CustomException("Payment not found by txnRef"));

        payment.setProviderTxnNo(providerTxnNo);
        payment.setProviderResponseCode(providerResponseCode);
        Order order = payment.getOrder();

        if ("00".equals(providerResponseCode)) {
            payment.setStatus(PaymentStatus.SUCCESS);
            order.setStatus(OrderStatus.CONFIRMED);
            handlePaymentSuccess(order.getId());
            walletService.recordPaymentAndHoldEscrow(payment);

        } else {

            payment.setStatus(PaymentStatus.FAILED);

            if (order.isStockDeducted()) {
                for (OrderItem item : order.getItems()) {
                    Product p = item.getProduct();
                    p.setQuantity(p.getQuantity() + item.getQuantity());
                }
                order.setStockDeducted(false);
            }
            order.setStatus(OrderStatus.CANCELLED);
        }


        paymentRepository.save(payment);
        orderRepository.save(order);

    }

    @Override
    public String createPayment(UUID orderId, UUID accountId) {
        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("User not found"));

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomException("Order not found"));

        if (!user.getId().equals(order.getUser().getId())) {
            throw new CustomException("You don't have permission to pay this order");
        }

        if (order.getStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new CustomException("Order is not payable in current status: " + order.getStatus());
        }

        Payment payment = paymentRepository.findByOrderId(order.getId())
                .orElseGet(() -> Payment.builder()
                        .order(order)
                        .method(PaymentMethod.VNPAY)
                        .status(PaymentStatus.PENDING)
                        .amount(order.getTotal())
                        .txnRef(generateTxnRef(order))
                        .build()
                );

        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            throw new CustomException("Payment already SUCCESS");
        }

        if (payment.getTxnRef() == null || payment.getTxnRef().isBlank()) {
            payment.setTxnRef(generateTxnRef(order));
        }

        paymentRepository.save(payment);
        return vnPayService.buildPaymentUrl(payment);
    }

    private String generateTxnRef(Order order) {
        // unique, readable
        return "PAY-" + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE)
                + "-" + order.getOrderNumber();
    }

    @Transactional
    public void handlePaymentSuccess(UUID orderId) {

        Order order = orderRepository.findById(orderId).orElseThrow();

        if (order.isStockDeducted()) return;

        for (OrderItem item : order.getItems()) {
            Product p = item.getProduct();
            if (p.getQuantity() < item.getQuantity()) {
                throw new CustomException("Not enough stock");
            }
            p.setQuantity(p.getQuantity() - item.getQuantity());
        }
        productRepository.saveAll(
                order.getItems().stream().map(OrderItem::getProduct).distinct().toList()
        );
        order.setStockDeducted(true);
        orderRepository.save(order);

    }
}
