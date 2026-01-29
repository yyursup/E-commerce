package com.marketplace.ecommerce.order.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.entity.UserAddress;
import com.marketplace.ecommerce.auth.repository.UserAddressRepository;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.cart.entity.Cart;
import com.marketplace.ecommerce.cart.entity.CartItem;
import com.marketplace.ecommerce.cart.repository.CartItemRepository;
import com.marketplace.ecommerce.cart.repository.CartRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.dto.request.QuoteRequest;
import com.marketplace.ecommerce.order.dto.response.CheckoutConfirmResponse;
import com.marketplace.ecommerce.order.dto.response.QuoteResponse;
import com.marketplace.ecommerce.order.repository.OrderItemsRepository;
import com.marketplace.ecommerce.order.repository.OrderRepository;
import com.marketplace.ecommerce.order.service.CheckoutService;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.shipping.service.ShippingService;
import com.marketplace.ecommerce.shipping.usecase.GHNClient;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CheckoutServiceImpl implements CheckoutService {

    private final ShopRepository shopRepository;
    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final UserAddressRepository userAddressRepository;
    private final ShippingService shippingService;

    @Override
    @Transactional(readOnly = true)
    public QuoteResponse quote(UUID accountId, QuoteRequest req) {
        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("User not found."));

        Shop shop = shopRepository.findById(req.getShopId())
                .orElseThrow(() -> new CustomException("Shop not found."));

        UserAddress addr = userAddressRepository.findByIdAndUserIdAndDeletedFalse(req.getAddressId(), user.getId())
                .orElseThrow(() -> new CustomException("Address not found."));

        Cart cart = cartRepository.findByUserIdWithItems(user.getId())
                .orElseThrow(() -> new CustomException("Cart not found."));

        List<CartItem> items = cart.getItems().stream()
                .filter(i -> !Boolean.TRUE.equals(i.getDeleted()))
                .filter(i -> i.getProduct().getShop().getId().equals(req.getShopId()))
                .toList();

        if (items.isEmpty()) throw new CustomException("Giỏ hàng không có sản phẩm của shop này.");

        BigDecimal subtotal = items.stream()
                .map(i -> i.getProduct().getBasePrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal shippingFee = shippingService.quoteFee(shop, items, addr.getDistrictId(), addr.getWardCode());

        QuoteResponse res = new QuoteResponse();
        res.setShippingFee(shippingFee);
        res.setTotal(subtotal.add(shippingFee));
        return res;
    }

    @Override
    @Transactional(readOnly = true)
    public CheckoutConfirmResponse confirm(UUID accountId, UUID shopId) {
        User user = userRepository.findByAccountId(accountId)
                .orElseThrow(() -> new CustomException("User not found."));

        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new CustomException("Shop not found."));

        Cart cart = cartRepository.findByUserIdWithItems(user.getId())
                .orElseThrow(() -> new CustomException("Cart not found."));

        List<CartItem> items = cart.getItems().stream()
                .filter(i -> !Boolean.TRUE.equals(i.getDeleted()))
                .filter(i -> i.getProduct().getShop().getId().equals(shopId))
                .toList();

        if (items.isEmpty()) throw new CustomException("Giỏ hàng không có sản phẩm của shop này.");

        BigDecimal subtotal = items.stream()
                .map(i -> i.getProduct().getBasePrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        UserAddress addr = userAddressRepository.findDefault(user.getId())
                .or(() -> userAddressRepository.findLastUsed(user.getId()))
                .orElse(null);

        BigDecimal shippingFee = BigDecimal.ZERO;
        if (addr != null) {
            shippingFee = shippingService.quoteFee(shop, items, addr.getDistrictId(), addr.getWardCode());
        }

        return CheckoutConfirmResponse.of(addr, items, subtotal, shippingFee);
    }

}
