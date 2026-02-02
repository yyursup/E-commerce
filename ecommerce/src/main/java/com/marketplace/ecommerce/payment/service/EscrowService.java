package com.marketplace.ecommerce.payment.service;

import com.marketplace.ecommerce.payment.dto.EscrowAdminResponse;
import com.marketplace.ecommerce.payment.valueObjects.EscrowStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface EscrowService {
    void releaseByOrder(UUID orderId);

    Page<EscrowAdminResponse> adminList(EscrowStatus status, Pageable pageable);
}
