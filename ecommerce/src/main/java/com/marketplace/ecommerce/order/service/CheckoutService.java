package com.marketplace.ecommerce.order.service;

import com.marketplace.ecommerce.order.dto.request.QuoteRequest;
import com.marketplace.ecommerce.order.dto.response.CheckoutConfirmResponse;
import com.marketplace.ecommerce.order.dto.response.QuoteResponse;

import java.util.UUID;

public interface CheckoutService {

    CheckoutConfirmResponse confirm(UUID accountId, UUID shopId);

    QuoteResponse quote(UUID accountId, QuoteRequest req);
}
