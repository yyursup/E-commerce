package com.marketplace.ecommerce.product.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.common.QueryUtils;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.product.dto.request.PageQueryRequest;
import com.marketplace.ecommerce.product.dto.response.ProductResponse;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.product.service.QueryProductService;
import com.marketplace.ecommerce.product.valueObjects.ProductStatus;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class QueryProductServiceImpl implements QueryProductService {
    private final ProductRepository productRepository;
    private final ShopRepository shopRepository;
    private final QueryUtils queryUtils;
    private final UserRepository userRepository;

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

        return products.map(ProductResponse::from);
    }

    @Override
    public ProductResponse getPublishedProductById(UUID productId) {
        Product product = productRepository.findPublishedByIdWithDetails(productId)
                .orElseThrow(() -> new CustomException("Sản phẩm không tồn tại hoặc chưa được xuất bản"));

        return ProductResponse.from(product);
    }

    @Override
    public ProductResponse getProductById(UUID productId) {
        Product product = productRepository.findByIdWithDetails(productId)
                .orElseThrow(() -> new CustomException("Sản phẩm không tồn tại"));

        return ProductResponse.from(product);
    }

    @Override
    public List<ProductResponse> getProductsByShopAndStatus(UUID accountId, String status) {
        Shop shop = getShopByAccountId(accountId);

        if (status == null || status.isBlank()) {
            return productRepository.findAllByShopIdWithDetails(shop.getId()).stream()
                    .map(ProductResponse::from)
                    .toList();
        }

        ProductStatus productStatus = parseStatus(status);

        return productRepository.findAllByShopIdAndStatusWithDetails(shop.getId(), productStatus).stream()
                .map(ProductResponse::from)
                .toList();
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

}
