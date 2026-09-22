package com.marketplace.ecommerce.shop.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.request.entity.Request;
import com.marketplace.ecommerce.request.entity.Seller;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.shop.service.ShopService;
import com.marketplace.ecommerce.shop.valueObjects.ShopStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.product.valueObjects.ProductStatus;
import com.marketplace.ecommerce.shop.dto.response.ShopProfileResponse;
import com.marketplace.ecommerce.social.repository.ShopFollowerRepository;
import com.marketplace.ecommerce.review.repository.ReviewRepository;
import com.marketplace.ecommerce.review.dto.projection.ShopReviewStatsProjection;
import com.marketplace.ecommerce.review.valueObjects.ReviewStatus;
import com.marketplace.ecommerce.chat.repository.ChatThreadRepository;
import com.marketplace.ecommerce.chat.entity.ChatThread;

import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.request.entity.Report;
import com.marketplace.ecommerce.request.repository.ReportRepository;
import com.marketplace.ecommerce.request.valueObjects.TargetType;
import com.marketplace.ecommerce.shop.dto.response.ShopViolationResponse;
import com.marketplace.ecommerce.product.entity.Product;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ShopServiceImpl implements ShopService {
    private final ShopRepository shopRepository;
    private final ProductRepository productRepository;
    private final ShopFollowerRepository shopFollowerRepository;
    private final ReviewRepository reviewRepository;
    private final ChatThreadRepository chatThreadRepository;
    private final UserRepository userRepository;
    private final ReportRepository reportRepository;

    @Override
    public Shop createShop(User ownerUser, String shopName, Request req, Seller sellerDetail) {

        Shop shop = Shop.builder()
                .user(ownerUser)
                .name(shopName)
                .description(req.getDescription())
                .coverImageUrl(req.getCoverImageUrl())
                .logoUrl(req.getCoverImageUrl())
                .phoneNumber(sellerDetail.getShopPhone())
                .address(sellerDetail.getAddress() != null ? sellerDetail.getAddress() : sellerDetail.getPickupAddress())
                .pickupAddress(sellerDetail.getPickupAddress())
                .returnAddress(sellerDetail.getReturnAddress())
                .taxCode(sellerDetail.getTaxCode())
                .invoiceEmail(sellerDetail.getInvoiceEmail())
                .bankName(sellerDetail.getBankName())
                .bankAccountNumber(sellerDetail.getBankAccountNumber())
                .bankAccountName(sellerDetail.getBankAccountName())
                .sellerType(sellerDetail.getSellerType())
                .businessType(sellerDetail.getBusinessType())
                .businessName(sellerDetail.getBusinessName())
                .businessAddress(sellerDetail.getBusinessAddress())
                .businessLicenseUrl(sellerDetail.getBusinessLicenseUrl())
                .status(ShopStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return shopRepository.save(shop);
    }

    private ShopProfileResponse buildShopProfile(Shop s) {
        long productCount = 0L;
        try {
            productCount = productRepository.countByShopIdAndStatusAndDeletedFalse(s.getId(), ProductStatus.PUBLISHED);
        } catch (Throwable t) {
            log.warn("Failed to count products for shop {}: {}", s.getId(), t.getMessage());
        }

        long followerCount = 0L;
        try {
            followerCount = shopFollowerRepository.countByShopId(s.getId());
        } catch (Throwable t) {
            log.warn("Failed to count followers for shop {}: {}", s.getId(), t.getMessage());
        }

        long reviewCount = 0L;
        Float avgRating = (s.getAverageRating() != null && s.getAverageRating() > 0) ? s.getAverageRating() : null;
        try {
            ShopReviewStatsProjection reviewStats = reviewRepository.getShopStats(s.getId(), ReviewStatus.ACTIVE);
            if (reviewStats != null && reviewStats.getTotalReviews() != null && reviewStats.getTotalReviews() > 0) {
                reviewCount = reviewStats.getTotalReviews();
                if (reviewStats.getAvgRating() != null) {
                    avgRating = (float) (Math.round(reviewStats.getAvgRating() * 10.0) / 10.0);
                }
            }
        } catch (Throwable t) {
            log.warn("Failed to fetch review stats for shop {}: {}", s.getId(), t.getMessage());
        }

        String responseRate = "100%";
        try {
            List<ChatThread> threads = chatThreadRepository.findByShopId(s.getId());
            if (threads != null && !threads.isEmpty()) {
                long answered = threads.stream().filter(t -> t.getUnreadAdmin() == 0).count();
                int rate = (int) Math.round((double) answered * 100.0 / threads.size());
                responseRate = rate + "%";
            }
        } catch (Throwable t) {
            log.warn("Failed to compute response rate for shop {}: {}", s.getId(), t.getMessage());
        }

        return ShopProfileResponse.from(s, productCount, followerCount, reviewCount, avgRating, responseRate);
    }

    @Override
    public ShopProfileResponse getShopProfileById(UUID shopId) {
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new CustomException("Không tìm thấy thông tin cửa hàng"));
        return buildShopProfile(shop);
    }

    @Override
    public ShopProfileResponse getMyShopProfile(UUID accountId) {
        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("Không tìm thấy thông tin người dùng"));
        Shop shop = shopRepository.findByUserId(user.getId())
                .orElseThrow(() -> new CustomException("Tài khoản chưa có thông tin cửa hàng"));
        return buildShopProfile(shop);
    }

    @Override
    public List<ShopProfileResponse> getAllActiveShops() {
        return shopRepository.findAll().stream()
                .filter(s -> s.getStatus() == ShopStatus.ACTIVE || s.getStatus() == ShopStatus.WARNED)
                .map(this::buildShopProfile)
                .collect(Collectors.toList());
    }

    @Override
    public List<ShopViolationResponse> getMyShopViolations(UUID accountId) {
        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("Không tìm thấy thông tin người dùng"));
        Shop shop = shopRepository.findByUserId(user.getId())
                .orElseThrow(() -> new CustomException("Tài khoản chưa có thông tin cửa hàng"));

        List<Product> products = productRepository.findAllByShopIdWithDetails(shop.getId());
        List<UUID> productIds = products.stream().map(Product::getId).collect(Collectors.toList());

        List<Report> reports = new java.util.ArrayList<>();
        reports.addAll(reportRepository.findApprovedReportsByShopId(shop.getId()));
        if (!productIds.isEmpty()) {
            reports.addAll(reportRepository.findApprovedReportsByProductIds(productIds));
        }

        // Lấy danh sách appeal do account này gửi
        List<Report> appeals = reportRepository.findAllAppealsByAccountId(accountId);
        java.util.Map<UUID, Report> appealByReportIdMap = new java.util.HashMap<>();
        java.util.Set<UUID> usedLegacyAppealIds = new java.util.HashSet<>();

        for (Report a : appeals) {
            if (a.getViolationReportId() != null && !appealByReportIdMap.containsKey(a.getViolationReportId())) {
                appealByReportIdMap.put(a.getViolationReportId(), a);
            }
        }

        java.util.Map<UUID, String> productNameMap = products.stream()
                .collect(Collectors.toMap(Product::getId, Product::getName, (existing, replacement) -> existing));

        List<ShopViolationResponse> results = new java.util.ArrayList<>();
        for (Report rep : reports) {
            String targetName = rep.getTargetType() == TargetType.SHOP
                    ? shop.getName()
                    : productNameMap.getOrDefault(rep.getTargetId(), "Sản phẩm vi phạm");

            String appealStatus = "NONE";
            UUID appealRequestId = null;
            String appealResponse = null;

            // 1. Khớp chính xác theo vi phạm cụ thể (violationReportId)
            Report appeal = appealByReportIdMap.get(rep.getId());

            // 2. Fallback cho appeal cũ chưa có violationReportId: chỉ gán tối đa 1-1 cho 1 report vi phạm duy nhất
            if (appeal == null) {
                for (Report a : appeals) {
                    if (a.getViolationReportId() == null && !usedLegacyAppealIds.contains(a.getId())) {
                        if (a.getTargetId() != null && a.getTargetId().equals(rep.getTargetId())) {
                            appeal = a;
                            usedLegacyAppealIds.add(a.getId());
                            break;
                        }
                    }
                }
            }

            if (appeal != null && appeal.getRequest() != null) {
                appealStatus = appeal.getRequest().getStatus().name();
                appealRequestId = appeal.getRequest().getId();
                appealResponse = appeal.getRequest().getResponse();
            }

            results.add(ShopViolationResponse.builder()
                    .reportId(rep.getId())
                    .targetType(rep.getTargetType())
                    .targetId(rep.getTargetId())
                    .targetName(targetName)
                    .reason(rep.getRequest() != null ? rep.getRequest().getDescription() : "")
                    .evidenceUrl(rep.getEvidenceUrl())
                    .coverImageUrl(rep.getRequest() != null ? rep.getRequest().getCoverImageUrl() : null)
                    .createdAt(rep.getRequest() != null ? rep.getRequest().getCreatedAt() : null)
                    .adminNote(rep.getModeratorNote() != null ? rep.getModeratorNote() : (rep.getRequest() != null ? rep.getRequest().getResponse() : null))
                    .appealStatus(appealStatus)
                    .appealRequestId(appealRequestId)
                    .appealResponse(appealResponse)
                    .build());
        }

        return results;
    }
}
