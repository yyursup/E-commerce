package com.marketplace.ecommerce.request.service.impl;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.valueObjects.AccountStatus;
import com.marketplace.ecommerce.auth.valueObjects.DisciplineLevel;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.product.valueObjects.ProductStatus;
import com.marketplace.ecommerce.request.dto.request.CreateReportRequest;
import com.marketplace.ecommerce.request.dto.request.CreateSendRequest;
import com.marketplace.ecommerce.request.dto.request.HandleReportRequest;
import com.marketplace.ecommerce.request.dto.response.CreateRequestResponse;
import com.marketplace.ecommerce.request.entity.Report;
import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.repository.ReportRepository;
import com.marketplace.ecommerce.request.service.ReportService;
import com.marketplace.ecommerce.request.service.RequestService;
import com.marketplace.ecommerce.request.policy.RequestPolicy;
import com.marketplace.ecommerce.request.valueObjects.ReportDecision;
import com.marketplace.ecommerce.request.valueObjects.RequestStatus;
import com.marketplace.ecommerce.request.valueObjects.RequestType;
import com.marketplace.ecommerce.request.valueObjects.TargetType;
import com.marketplace.ecommerce.review.entity.Review;
import com.marketplace.ecommerce.review.repository.ReviewRepository;
import com.marketplace.ecommerce.review.valueObjects.ReviewStatus;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.shop.service.ShopService;
import com.marketplace.ecommerce.shop.valueObjects.ShopStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {
    private final RequestService requestService;
    private final ReportRepository reportRepository;
    private final RequestPolicy requestValidation;
    private final AccountRepository accountRepository;
    private final RequestPolicy requestPolicy;
    private final ReviewRepository reviewRepository;
    private final ShopRepository shopRepository;
    private final ProductRepository productRepository;

    @Override
    @Transactional
    public void handleReport(UUID adminAccountId, UUID requestId, HandleReportRequest req) {

        Account admin = accountRepository.findById(adminAccountId)
                .orElseThrow(() -> new CustomException("Admin account not found"));

        Report report = reportRepository.findByRequestId(requestId);
        if (report == null) throw new CustomException("Report not found for requestId: " + requestId);

        Request r = report.getRequest();
        if (r == null) throw new CustomException("Request not found");

        if (r.getStatus() == RequestStatus.APPROVED || r.getStatus() == RequestStatus.REJECTED) {
            throw new CustomException("Request already handled");
        }

        LocalDateTime now = LocalDateTime.now();

        if (req.getDecision() == ReportDecision.REJECT) {
            rejectRequest(r, admin, now, req.getNote());
            return;
        }

        UUID targetId = report.getTargetId();
        TargetType type = requestPolicy.resolve(targetId);

        switch (type) {
            case USER -> handleReportUser(targetId, now);
            case SHOP -> handleReportShop(targetId, now);
            case PRODUCT -> handleReportProduct(targetId, now);
            case REVIEW -> handleReportReview(targetId, now);
            default -> throw new CustomException("Unsupported target type: " + type);
        }

        approveRequest(r, admin, now, req.getNote(), report);
    }

    private void rejectRequest(Request r, Account admin, LocalDateTime now, String note) {
        r.setStatus(RequestStatus.REJECTED);
        r.setReviewedBy(admin);
        r.setReviewedAt(now);
        r.setResponse(note);
    }

    private void approveRequest(Request r, Account admin, LocalDateTime now, String note, Report report) {
        r.setStatus(RequestStatus.APPROVED);
        r.setReviewedBy(admin);
        r.setReviewedAt(now);
        r.setResponse(note);
        report.setModeratorNote(note);
    }


    @Override
    public CreateRequestResponse createReport(UUID accountId, CreateReportRequest request) {

        Account acc = accountRepository.findById(accountId)
                .orElseThrow(() -> new CustomException("Account not found"));

        if (acc.getDisciplineLevel() == DisciplineLevel.SUSPENDED || acc.getStatus() == AccountStatus.BANNED) {
            throw new CustomException("You can not create report because you got suspended or banned");
        }

        Request r = requestService.createRequest(acc, CreateSendRequest.builder()
                .requestType(RequestType.REPORT)
                .coverImage(request.getCoverImageUrl())
                .description(request.getDescription())
                .build());

        TargetType targetType = requestValidation.resolve(request.getTargetId());

        Report re = Report.builder()
                .request(r)
                .evidenceUrl(request.getEvidenceUrl())
                .targetType(targetType)
                .targetId(request.getTargetId())
                .build();

        reportRepository.save(re);

        return CreateRequestResponse.from(r);
    }

    private void handleReportUser(UUID targetId, LocalDateTime now) {
        UUID accountId = requestPolicy.resolveTargetAccountId(TargetType.USER, targetId);
        if (accountId == null) throw new CustomException("Cannot resolve USER accountId");
        punishAccount(accountId, now);
    }

    private void handleReportProduct(UUID targetId, LocalDateTime now) {
        Product product = productRepository.findByIdForUpdate(targetId)
                .orElseThrow(() -> new CustomException("Product not found: " + targetId));

        if (product.getStatus() == ProductStatus.DELETED) {
            throw new CustomException("Product is already deleted");
        }

        int nextCount = product.getReportCount() + 1;
        product.setReportCount(nextCount);


        if (nextCount >= 3) {
            product.setFlagged(true);
        }

        if (nextCount >= 5) {
            product.setStatus(ProductStatus.DELETED);
        }


        UUID accountId = requestPolicy.resolveTargetAccountId(TargetType.PRODUCT, targetId);
        if (accountId == null) throw new CustomException("Cannot resolve PRODUCT owner accountId");
        punishAccount(accountId, now);
    }

    private void handleReportReview(UUID reviewId, LocalDateTime now) {

        Review review = reviewRepository.findByIdForUpdate(reviewId)
                .orElseThrow(() -> new CustomException("Review not found: " + reviewId));

        if (review.getStatus() == ReviewStatus.HIDDEN) {
            throw new CustomException("Review is already hidden");
        }

        int nextCount = review.getReportCount() + 1;
        review.setReportCount(nextCount);


        if (nextCount >= 3) {
            review.setFlagged(true);
        }

        if (nextCount >= 5) {
            review.setStatus(ReviewStatus.HIDDEN);
        }

        UUID accountId = requestPolicy.resolveTargetAccountId(TargetType.REVIEW, reviewId);
        if (accountId == null) throw new CustomException("Cannot resolve REVIEW owner accountId");

        punishAccount(accountId, now);
    }

    private DisciplineLevel punishAccount(UUID targetAccountId, LocalDateTime now) {

        Account target = accountRepository.findByIdForUpdate(targetAccountId)
                .orElseThrow(() -> new CustomException("Target account not found"));

        if (target.getDisciplineLevel() == DisciplineLevel.BANNED || target.getStatus() == AccountStatus.BANNED) {
            throw new CustomException("Account is already banned");
        }

        int next = target.getViolationCount() + 1;
        target.setViolationCount(next);
        target.setLastViolationAt(now);


        if (next >= 7) {
            target.setDisciplineLevel(DisciplineLevel.BANNED);
            target.setBannedUntil(now.plusDays(7));
            target.setStatus(AccountStatus.BANNED);
            target.setIsActive(false);
            return DisciplineLevel.BANNED;
        }

        if (next >= 5) {
            target.setDisciplineLevel(DisciplineLevel.SUSPENDED);
            target.setStatus(AccountStatus.SUSPENDED);
            target.setIsActive(true);
            return DisciplineLevel.SUSPENDED;
        }

        if (next >= 3) {
            target.setDisciplineLevel(DisciplineLevel.WARNED);
            return DisciplineLevel.WARNED;
        }

        target.setDisciplineLevel(DisciplineLevel.NONE);
        return DisciplineLevel.NONE;
    }

    private void handleReportShop(UUID shopId, LocalDateTime now) {

        Shop shop = shopRepository.findByIdForUpdate(shopId)
                .orElseThrow(() -> new CustomException("Shop not found: " + shopId));

        if (shop.getStatus() == ShopStatus.BANNED) {
            throw new CustomException("Shop is already banned");
        }

        UUID ownerAccountId = requestPolicy.resolveTargetAccountId(TargetType.SHOP, shopId);
        if (ownerAccountId == null) {
            throw new CustomException("Cannot resolve SHOP owner accountId");
        }

        DisciplineLevel level = punishAccount(ownerAccountId, now);

        if (level == DisciplineLevel.NONE) {
            return;
        }

        if (level == DisciplineLevel.WARNED) {
            if (shop.getStatus() == ShopStatus.ACTIVE) {
                shop.setStatus(ShopStatus.WARNED);
            }
            return;
        }

        if (level == DisciplineLevel.SUSPENDED) {
            if (shop.getStatus() != ShopStatus.SUSPENDED) {
                shop.setStatus(ShopStatus.SUSPENDED);
            }
            productRepository.updateStatusByShopId(shopId, ProductStatus.INACTIVE);
            return;
        }

        if (level == DisciplineLevel.BANNED) {
            shop.setStatus(ShopStatus.BANNED);
            productRepository.updateStatusByShopId(shopId, ProductStatus.DELETED);
        }
    }
}
