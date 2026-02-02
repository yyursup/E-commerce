package com.marketplace.ecommerce.request.service;

import com.marketplace.ecommerce.request.dto.request.RegisterSellerRequest;
import com.marketplace.ecommerce.request.dto.response.CreateRequestResponse;

import java.util.UUID;

public interface RegisterSellerService {

     CreateRequestResponse createSellerRegistration(UUID accountId, RegisterSellerRequest request);
}
