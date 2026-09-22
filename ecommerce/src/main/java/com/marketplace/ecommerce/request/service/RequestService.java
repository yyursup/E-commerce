package com.marketplace.ecommerce.request.service;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.request.dto.request.CreateSendRequest;
import com.marketplace.ecommerce.request.dto.response.CreateRequestResponse;
import com.marketplace.ecommerce.request.dto.response.RequestResponse;
import com.marketplace.ecommerce.request.dto.response.RequestDetailsResponse;
import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.valueObjects.RequestStatus;
import com.marketplace.ecommerce.request.valueObjects.RequestType;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

import com.marketplace.ecommerce.request.valueObjects.RequestType;

public interface RequestService {
    Request createRequest(Account account, CreateSendRequest request);

    Page<CreateRequestResponse> getRequests(UUID accountId, Pageable pageable);

    Page<CreateRequestResponse> getAllRequests(RequestType type, RequestStatus status, Pageable pageable);

    Page<CreateRequestResponse> getAllRequests(RequestType type, RequestStatus status, Pageable pageable);

    RequestDetailsResponse getDetails(UUID requestId);

    RequestResponse rejectRequest(UUID adminAccountId, UUID requestId, String response);

    RequestResponse approveSellerRegistration(UUID requestId, UUID adminAccountId, String response);

    RequestResponse approveRequest(UUID requestId, UUID adminAccountId, String response);

    CreateRequestResponse createAppeal(UUID accountId,
            com.marketplace.ecommerce.request.dto.request.CreateAppealRequest req);

}
