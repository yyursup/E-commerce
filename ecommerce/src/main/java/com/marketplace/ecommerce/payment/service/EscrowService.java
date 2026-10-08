package com.marketplace.ecommerce.payment.service;

import com.marketplace.ecommerce.order.entity.Order;
import com.marketplace.ecommerce.payment.dto.EscrowAdminResponse;
import com.marketplace.ecommerce.payment.valueObjects.EscrowStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.marketplace.ecommerce.payment.dto.SettlementInfo;

import java.util.UUID;

public interface EscrowService {
    void recordCodEscrow(Order order);

    void cancelCodEscrow(Order order);

    void releaseByOrder(UUID orderId);

    void refundByOrder(UUID orderId, String reason);

    void splitSettleByOrder(UUID orderId, Integer buyerPercentage, Integer sellerPercentage, String note);

    Page<EscrowAdminResponse> adminList(EscrowStatus status, Pageable pageable);

    SettlementInfo getSettlementByOrderId(UUID orderId);
}

