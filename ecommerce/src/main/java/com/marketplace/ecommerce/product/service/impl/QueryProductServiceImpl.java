package com.marketplace.ecommerce.product.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.QueryUtils;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.product.dto.request.PageQueryRequest;
import com.marketplace.ecommerce.product.dto.response.ProductResponse;
import com.marketplace.ecommerce.product.dto.response.SellerProductResponse;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.product.service.QueryProductService;
import com.marketplace.ecommerce.product.valueObjects.ProductStatus;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.review.repository.ReviewRepository;
import com.marketplace.ecommerce.review.dto.projection.ProductReviewStatsProjection;
import com.marketplace.ecommerce.review.dto.projection.ReviewStatsProjection;
import com.marketplace.ecommerce.review.valueObjects.ReviewStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QueryProductServiceImpl implements QueryProductService {
    private final ProductRepository productRepository;
    private final ShopRepository shopRepository;
    private final QueryUtils queryUtils;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;

    private void enrichReviewStats(List<ProductResponse> responses) {
        if (responses == null || responses.isEmpty()) return;
        List<UUID> ids = responses.stream().map(ProductResponse::getId).filter(Objects::nonNull).toList();
        if (ids.isEmpty()) return;

        List<ProductReviewStatsProjection> statsList = reviewRepository.getStatsForProducts(ids, ReviewStatus.ACTIVE);
        Map<UUID, ProductReviewStatsProjection> statsMap = statsList.stream()
                .collect(Collectors.toMap(ProductReviewStatsProjection::getProductId, s -> s, (a, b) -> a));

        for (ProductResponse res : responses) {
            ProductReviewStatsProjection stat = statsMap.get(res.getId());
            if (stat != null && stat.getTotalReviews() != null && stat.getTotalReviews() > 0) {
                double rounded = Math.round(stat.getAvgRating() * 10.0) / 10.0;
                res.setRating(rounded);
                res.setReviewCount(stat.getTotalReviews());
            } else {
                res.setRating(null);
                res.setReviewCount(0L);
            }
        }
    }

    private void enrichSingleReviewStats(ProductResponse res) {
        if (res == null || res.getId() == null) return;
        ReviewStatsProjection stats = reviewRepository.getStats(res.getId(), ReviewStatus.ACTIVE);
        if (stats != null && stats.getTotalReviews() != null && stats.getTotalReviews() > 0) {
            double rounded = Math.round(stats.getAvgRating() * 10.0) / 10.0;
            res.setRating(rounded);
            res.setReviewCount(stats.getTotalReviews());
        } else {
            res.setRating(null);
            res.setReviewCount(0L);
        }
    }

    @Override
    public Page<ProductResponse> getPublishedProducts(PageQueryRequest req) {
        int page = (req.getPage() == null || req.getPage() < 0) ? 0 : req.getPage();
        int size = (req.getSize() == null) ? 20 : req.getSize();
        if (size < 1) size = 20;
        if (size > 100) size = 100;

        String search = (req.getSearch() == null || req.getSearch().isBlank())
                ? null
                : req.getSearch().trim();

        Sort sort = queryUtils.createSort(req.getSortBy(), req.getSortDir());
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Product> products = productRepository.findPublishedProductsWithFilters(
                req.getCategoryId(),
                req.getShopId(),
                req.getMinPrice(),
                req.getMaxPrice(),
                search,
                pageable
        );

        Page<ProductResponse> responsePage = products.map(ProductResponse::from);
        enrichReviewStats(responsePage.getContent());
        return responsePage;
    }

    @Override
    public ProductResponse getPublishedProductById(UUID productId) {
        Product product = productRepository.findPublishedByIdWithDetails(productId)
                .orElseThrow(() -> new CustomException("Sản phẩm không tồn tại hoặc chưa được xuất bản"));

        ProductResponse res = ProductResponse.from(product);
        enrichSingleReviewStats(res);
        return res;
    }

    @Override
    public SellerProductResponse getProductById(UUID productId) {
        Product product = productRepository.findByIdWithDetails(productId)
                .orElseThrow(() -> new CustomException("Sản phẩm không tồn tại"));

        SellerProductResponse res = SellerProductResponse.from(product);
        // We might not have enrichSingleReviewStats for SellerProductResponse, but wait, Khoidm added it.
        // Let's just return SellerProductResponse.
        return res;
    }

    @Override
    public List<SellerProductResponse> getProductsByShopAndStatus(UUID accountId, String status) {
        Shop shop = getShopByAccountId(accountId);

        List<SellerProductResponse> list;
        if (status == null || status.isBlank()) {
            list = productRepository.findAllByShopIdWithDetails(shop.getId()).stream()
                    .map(SellerProductResponse::from)
                    .toList();
        } else if ("VIOLATION".equalsIgnoreCase(status) || "DELETED".equalsIgnoreCase(status)) {
            list = productRepository.findAllViolatedProductsByShopId(shop.getId()).stream()
                    .map(SellerProductResponse::from)
                    .toList();
        } else {
            ProductStatus productStatus = parseStatus(status);
            list = productRepository.findAllByShopIdAndStatusWithDetails(shop.getId(), productStatus).stream()
                    .map(SellerProductResponse::from)
                    .toList();
        }

        return list;
    }

    @Override
    public List<ProductResponse> getPublishedProductsByIds(List<UUID> ids) {
        if (ids == null || ids.isEmpty()) return new ArrayList<>();

        // Preserve input order, skip missing/unpublished products
        List<UUID> uniqueIds = ids.stream().filter(Objects::nonNull).distinct().collect(Collectors.toList());
        List<ProductResponse> out = new ArrayList<>(uniqueIds.size());
        for (UUID id : uniqueIds) {
            productRepository.findPublishedByIdWithDetails(id)
                    .map(ProductResponse::from)
                    .ifPresent(out::add);
        }
        enrichReviewStats(out);
        return out;
    }


//    @Override
//    @Transactional(readOnly = true)
//    public List<ProductResponse> getAllProductsByShop(UUID shopId) {
//        if (!shopRepository.existsById(shopId)) {
//            throw new CustomException("Shop not found");
//        }
//
//        return productRepository.findAllByShopIdWithDetails(shopId).stream()
//                .map(ProductResponse::from)
//                .collect(Collectors.toList());
//    }

    public ProductStatus parseStatus(String status) {
        try {
            return ProductStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new CustomException("Status không hợp lệ: " + status);
        }
    }

    private Shop getShopByAccountId(UUID accountId) {
        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("User not found"));

        return shopRepository.findByUserId(user.getId())
                .orElseThrow(() -> new CustomException("Shop not found"));
    }

    @Override
    public List<ProductResponse> getFeaturedProductsByShop(UUID shopId) {
        if (!shopRepository.existsById(shopId)) {
            throw new CustomException("Shop không tồn tại");
        }
        List<ProductResponse> responses = productRepository.findFeaturedByShopIdWithDetails(shopId).stream()
                .map(ProductResponse::from)
                .toList();
        enrichReviewStats(responses);
        return responses;
    }

}
