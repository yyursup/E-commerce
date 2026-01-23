package com.marketplace.ecommerce.request.service;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.request.dto.request.CreateSendRequest;
import com.marketplace.ecommerce.request.dto.response.CreateRequestResponse;
import com.marketplace.ecommerce.request.dto.response.RejectRequestResponse;
import com.marketplace.ecommerce.request.dto.response.RequestDetailsResponse;
import com.marketplace.ecommerce.request.entity.Request;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface RequestService {
    Request createRequest(Account account, CreateSendRequest request);

    Page<CreateRequestResponse> getRequests(UUID accountId, Pageable pageable);

    RequestDetailsResponse getDetails(UUID requestId);

    RejectRequestResponse rejectRequest(UUID adminAccountId, UUID requestId, String response);

    void approveSellerRegistration(UUID requestId, UUID adminAccountId, String response);


}
