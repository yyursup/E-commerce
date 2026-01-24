package com.marketplace.ecommerce.request.service.impl;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.request.dto.request.CreateSendRequest;
import com.marketplace.ecommerce.request.dto.response.*;
import com.marketplace.ecommerce.request.entity.Report;
import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.entity.Seller;
import com.marketplace.ecommerce.request.repository.ReportRepository;
import com.marketplace.ecommerce.request.repository.RequestRepository;
import com.marketplace.ecommerce.request.repository.SellerRepository;
import com.marketplace.ecommerce.request.service.RequestService;
import com.marketplace.ecommerce.request.policy.RequestPolicy;
import com.marketplace.ecommerce.request.valueObjects.ApproveSellerContext;
import com.marketplace.ecommerce.request.valueObjects.RequestStatus;
import com.marketplace.ecommerce.request.valueObjects.TargetType;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.service.ShopService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RequestServiceImpl implements RequestService {


    private final RequestRepository requestRepository;
    private final ReportRepository reportRepository;
    private final SellerRepository sellerRepository;
    private final AccountRepository accountRepository;
    private final RequestPolicy requestValidation;
    private final ShopService shopService;

    public RequestResponse approveSellerRegistration(UUID requestId, UUID adminAccountId, String response) {

        Account acc = accountRepository.findById(adminAccountId).orElseThrow(() -> new CustomException("Account not found"));

        Request req = requestRepository.findById(requestId).orElseThrow(() -> new CustomException("Request not found: " + requestId));

        ApproveSellerContext ctx = requestValidation.validateApproveSellerRequest(req, requestId);

        Shop savedShop = shopService.createShop(ctx.ownerUser(), ctx.shopName(), req, ctx.sellerDetail());

        ctx.sellerDetail().setCreatedShopId(savedShop.getId());
        sellerRepository.save(ctx.sellerDetail());

        markApprovedRequest(req, acc, response);

        return RequestResponse.from(req);
    }

    public void markApprovedRequest(Request req, Account admin, String response) {
        req.setStatus(RequestStatus.APPROVED);
        req.setReviewedBy(admin);
        req.setReviewedAt(java.time.LocalDateTime.now());
        req.setResponse(response);
        requestRepository.save(req);
    }

    @Override
    public RequestResponse rejectRequest(UUID adminAccountId, UUID requestId, String response) {
        Account acc = accountRepository.findById(adminAccountId).orElseThrow(() -> new CustomException("Account not found"));

        Request request = requestRepository.findById(requestId).orElseThrow(() -> new CustomException("Request not found"));

        request.setStatus(RequestStatus.REJECTED);
        request.setResponse(response);
        request.setReviewedAt(LocalDateTime.now());
        request.setReviewedBy(acc);

        requestRepository.save(request);

        return RequestResponse.from(request);
    }


    @Override
    @Transactional(readOnly = true)
    public RequestDetailsResponse getDetails(UUID requestId) {

        Request r = requestRepository.findById(requestId).orElseThrow(() -> new CustomException("Request not found: " + requestId));

        Object detail = switch (r.getType()) {

            case REPORT -> {
                Report rep = reportRepository.findByRequestId(requestId);
                if (rep == null) throw new CustomException("Report detail not found for request: " + requestId);

                yield ReportDetailsResponse.builder().targetId(rep.getTargetId()).targetType(rep.getTargetType() != null ? TargetType.valueOf(rep.getTargetType().name()) : null).evidenceUrl(rep.getEvidenceUrl()).build();
            }

            case SELLER_REGISTRATION -> {
                Seller s = sellerRepository.findByRequestId(requestId);
                if (s == null) throw new CustomException("Seller detail not found for request: " + requestId);

                yield RegisterSellerResponse.builder().shopName(s.getShopName()).taxCode(s.getTaxCode()).address(s.getAddress()).shopPhone(s.getShopPhone()).shopEmail(s.getShopEmail()).build();
            }

            default -> throw new CustomException("Unsupported request type: " + r.getType());
        };

        return RequestDetailsResponse.from(r, detail);
    }

    @Override
    public Page<CreateRequestResponse> getRequests(UUID accountId, Pageable pageable) {
        return requestRepository.findAllRequestByAccountId(accountId, pageable).map(r -> CreateRequestResponse.builder().accountId(accountId).type(r.getType()).status(r.getStatus()).createdAt(LocalDateTime.from(r.getCreatedAt())).build());
    }

    @Override
    public Request createRequest(Account account, CreateSendRequest request) {

        Request re = Request.builder().account(account).type(request.getRequestType()).status(RequestStatus.PENDING).description(request.getDescription()).coverImageUrl(request.getCoverImage()).createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()).build();

        return requestRepository.save(re);
    }
}
