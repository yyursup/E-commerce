package com.marketplace.ecommerce.cart.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.cart.dto.request.AddToCartRequest;
import com.marketplace.ecommerce.cart.dto.response.CartResponse;
import com.marketplace.ecommerce.cart.entity.Cart;
import com.marketplace.ecommerce.cart.entity.CartItem;
import com.marketplace.ecommerce.cart.repository.CartItemRepository;
import com.marketplace.ecommerce.cart.repository.CartRepository;
import com.marketplace.ecommerce.cart.service.CartService;
import com.marketplace.ecommerce.cart.validate.CartValidation;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.marketplace.ecommerce.product.entity.ProductVariant;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {
    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CartItemRepository cartItemRepository;
    private final CartValidation cartValidation;

    @Override
    @Transactional
    public CartResponse deleteItem(UUID accountId, UUID cartItemId) {
        User user = getUserByAccountId(accountId);

        CartItem cartItem = getActiveCartItemOfUser(user.getId(), cartItemId);

        cartItem.setDeleted(true);
        cartItem.setQuantity(0); // optional
        cartItemRepository.save(cartItem);

        Cart cart = cartRepository.findByUserIdWithItems(user.getId())
                .orElseThrow(() -> new CustomException("Cart not found"));

        return CartResponse.fromCart(cart);
    }


    @Override
    @Transactional(readOnly = true)
    public CartResponse getCartByAccountId(UUID accountId) {
        User user = getUserByAccountId(accountId);
        Cart cart = getCartWithItemsByUserId(user.getId());
        return CartResponse.fromCart(cart);
    }


    @Override
    @Transactional
    public CartResponse minus(UUID accountID, UUID cartItemId) {
        User user = getUserByAccountId(accountID);
        CartItem cartItem = getActiveCartItemOfUser(user.getId(), cartItemId);

        int newQty = cartItem.getQuantity() - 1;
        if (newQty <= 0) {
            cartItem.setDeleted(true);
            cartItem.setQuantity(0);
        } else {
            cartItem.setQuantity(newQty);
        }

        cartItemRepository.save(cartItem);

        return CartResponse.fromCart(getCartWithItemsByUserId(user.getId()));
    }

    @Override
    @Transactional
    public CartResponse add(UUID accountID, UUID cartItemId) {
        User user = getUserByAccountId(accountID);
        CartItem cartItem = getActiveCartItemOfUser(user.getId(), cartItemId);

        Product product = getPublishedProduct(cartItem.getProduct().getId());

        int newQty = cartItem.getQuantity() + 1;
        if (cartItem.getVariantId() != null && product.getVariants() != null) {
            ProductVariant variant = product.getVariants().stream()
                    .filter(v -> v.getId().equals(cartItem.getVariantId()) && !Boolean.TRUE.equals(v.getDeleted()))
                    .findFirst()
                    .orElse(null);
            if (variant != null && variant.getStock() != null && newQty > variant.getStock()) {
                throw new CustomException("Số lượng tồn kho của phân loại này đã đạt giới hạn (còn " + variant.getStock() + ")");
            }
        } else {
            cartValidation.ensureStock(product, newQty, "Out of stock");
        }

        cartItem.setQuantity(newQty);
        cartItemRepository.save(cartItem);

        return CartResponse.fromCart(getCartWithItemsByUserId(user.getId()));
    }

    @Override
    @Transactional
    public CartResponse addToCart(UUID accountID, AddToCartRequest request) {
        User user = getUserByAccountId(accountID);

        int reqQty = cartValidation.normalizeAndValidateQuantity(request.getQuantity());

        Product product = getPublishedProduct(request.getProductId());

        Cart cart = getCartWithItemsByUserId(user.getId());

        // Kiểm tra phân loại hàng (Variants)
        ProductVariant selectedVariant = null;
        boolean hasVariants = product.getVariants() != null && product.getVariants().stream().anyMatch(v -> !Boolean.TRUE.equals(v.getDeleted()));

        if (hasVariants) {
            if (request.getVariantId() == null) {
                throw new CustomException("Vui lòng chọn phân loại hàng (màu sắc / kích cỡ...)");
            }
            selectedVariant = product.getVariants().stream()
                    .filter(v -> !Boolean.TRUE.equals(v.getDeleted()) && v.getId().equals(request.getVariantId()))
                    .findFirst()
                    .orElseThrow(() -> new CustomException("Phân loại hàng không tồn tại hoặc đã ngừng kinh doanh"));

            if (selectedVariant.getStock() != null && selectedVariant.getStock() < reqQty) {
                throw new CustomException("Số lượng tồn kho của phân loại này không đủ (còn " + selectedVariant.getStock() + ")");
            }
        }

        CartItem existing = findActiveItemByProductAndVariant(cart, product.getId(), request.getVariantId());

        BigDecimal unitPrice = (selectedVariant != null && selectedVariant.getPrice() != null)
                ? selectedVariant.getPrice()
                : (product.getBasePrice() != null ? product.getBasePrice() : BigDecimal.ZERO);

        if (existing != null) {
            int newQty = existing.getQuantity() + reqQty;
            if (selectedVariant != null && selectedVariant.getStock() != null) {
                if (newQty > selectedVariant.getStock()) {
                    throw new CustomException("Số lượng trong giỏ (" + newQty + ") vượt quá tồn kho còn lại (" + selectedVariant.getStock() + ")");
                }
            } else {
                cartValidation.ensureStock(product, newQty, "Not enough quantity");
            }
            existing.setQuantity(newQty);
            existing.setUnitPrice(unitPrice);
        } else {
            if (selectedVariant == null) {
                cartValidation.ensureStock(product, reqQty, "Not enough quantity");
            }

            CartItem newItem = new CartItem();
            newItem.setCart(cart);
            newItem.setProduct(product);
            newItem.setQuantity(reqQty);
            newItem.setVariantId(request.getVariantId());
            newItem.setUnitPrice(unitPrice);
            newItem.setCreatedAt(LocalDateTime.now());
            cart.getItems().add(newItem);
        }

        cartRepository.save(cart);

        return CartResponse.fromCart(getCartWithItemsByUserId(user.getId()));
    }


    private User getUserByAccountId(UUID accountId) {
        return userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private Product getPublishedProduct(UUID productId) {
        return productRepository.findPublishedByIdWithDetails(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
    }

    private Cart getCartByUserId(UUID userId) {
        return cartRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Cart not found"));
    }

    private Cart getCartWithItemsByUserId(UUID userId) {
        return cartRepository.findByUserIdWithItems(userId)
                .orElseThrow(() -> new CustomException("Cart not found"));
    }

    private CartItem getActiveCartItemOfUser(UUID userId, UUID cartItemId) {
        return cartItemRepository.findActiveByIdAndUserId(userId, cartItemId)
                .orElseThrow(() -> new CustomException("CartItem not found"));
    }

    private CartItem findActiveItemByProductAndVariant(Cart cart, UUID productId, UUID variantId) {
        return cart.getActiveCartDetails().stream()
                .filter(i -> i.getProduct().getId().equals(productId) &&
                        (variantId == null ? i.getVariantId() == null : variantId.equals(i.getVariantId())))
                .findFirst()
                .orElse(null);
    }


}
