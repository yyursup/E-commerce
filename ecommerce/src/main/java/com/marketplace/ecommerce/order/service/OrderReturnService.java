package com.marketplace.ecommerce.order.service;

import com.marketplace.ecommerce.order.dto.request.AdminResolveReturnDisputeRequest;
import com.marketplace.ecommerce.order.dto.request.SellerCompleteReturnRequest;
import com.marketplace.ecommerce.order.dto.request.SellerDisputeReturnRequest;
import com.marketplace.ecommerce.order.dto.request.SubmitReturnTrackingRequest;
import com.marketplace.ecommerce.order.dto.response.OrderReturnResponse;

import com.marketplace.ecommerce.order.valueObjects.ReturnStatus;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface OrderReturnService {

    OrderReturnResponse createReturn(UUID orderId, UUID reportId);

    OrderReturnResponse submitTracking(UUID accountId, UUID returnId, SubmitReturnTrackingRequest request);

    OrderReturnResponse confirmDelivered(UUID accountId, UUID returnId);

    OrderReturnResponse confirmReturned(UUID accountId, UUID returnId);

    OrderReturnResponse completeReturn(UUID accountId, UUID returnId, SellerCompleteReturnRequest request);

    OrderReturnResponse disputeReturn(UUID accountId, UUID returnId, SellerDisputeReturnRequest request);

    OrderReturnResponse resolveDispute(UUID adminAccountId, UUID returnId, AdminResolveReturnDisputeRequest request);

    OrderReturnResponse getReturnByOrderId(UUID orderId);

    Map<UUID, OrderReturnResponse> getReturnInfoBatch(List<UUID> orderIds);

    OrderReturnResponse getReturnDetails(UUID returnId);

    void closeReturnOnEscrowSettled(UUID orderId, ReturnStatus finalStatus, String note);

    void processExpiredBuyerShipments();

    void processExpiredSellerInspections();
}
