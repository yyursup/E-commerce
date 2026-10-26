package com.marketplace.ecommerce.request.service;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.request.dto.request.CreateSendRequest;
import com.marketplace.ecommerce.request.dto.response.BanReviewStatusResponse;
import com.marketplace.ecommerce.request.dto.response.CreateRequestResponse;
import com.marketplace.ecommerce.request.dto.response.RequestResponse;
import com.marketplace.ecommerce.request.dto.response.RequestDetailsResponse;
import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.valueObjects.RequestStatus;
import com.marketplace.ecommerce.request.valueObjects.RequestType;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface RequestService {
    Request createRequest(Account account, CreateSendRequest request);

    Page<CreateRequestResponse> getRequests(UUID accountId, Pageable pageable);

    Page<CreateRequestResponse> getAllRequests(RequestType type, RequestStatus status, Pageable pageable);

    RequestDetailsResponse getDetails(UUID requestId);

    RequestResponse rejectRequest(UUID adminAccountId, UUID requestId, String response);

    RequestResponse approveSellerRegistration(UUID requestId, UUID adminAccountId, String response);

    RequestResponse approveRequest(UUID requestId, UUID adminAccountId, String response);

    CreateRequestResponse submitBanReview(UUID accountId, String description, List<MultipartFile> files);

    BanReviewStatusResponse getBanReviewStatus(UUID accountId);

    RequestResponse approveBanReview(UUID requestId, UUID adminAccountId, String response);

    void autoRefundExpiredDisputedOrders();
}
