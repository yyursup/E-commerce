package com.marketplace.ecommerce.order.service.impl;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.entity.UserAddress;
import com.marketplace.ecommerce.auth.repository.UserAddressRepository;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.cart.entity.Cart;
import com.marketplace.ecommerce.cart.entity.CartItem;
import com.marketplace.ecommerce.cart.repository.CartRepository;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.order.dto.request.QuoteRequest;
import com.marketplace.ecommerce.order.dto.response.CheckoutConfirmResponse;
import com.marketplace.ecommerce.order.dto.response.QuoteResponse;
import com.marketplace.ecommerce.order.service.CheckoutService;
import com.marketplace.ecommerce.shipping.service.ShippingService;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import com.marketplace.ecommerce.voucher.dto.VoucherCalculationResponse;
import com.marketplace.ecommerce.voucher.dto.VoucherResponse;
import com.marketplace.ecommerce.voucher.service.VoucherService;
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
    private final VoucherService voucherService;

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

        BigDecimal discountAmount = BigDecimal.ZERO;
        String voucherCode = null;
        String shopVoucherCode = req.getShopVoucherCode();
        String platformVoucherCode = req.getPlatformVoucherCode();
        BigDecimal shopDiscountAmount = BigDecimal.ZERO;
        BigDecimal platformDiscountAmount = BigDecimal.ZERO;

        if (shopVoucherCode != null || platformVoucherCode != null) {
            VoucherCalculationResponse calc = voucherService.validateAndCalculateMulti(
                    accountId,
                    shopVoucherCode,
                    platformVoucherCode,
                    req.getShopId(),
                    subtotal,
                    shippingFee
            );
            discountAmount = calc.getDiscountAmount();
            shopDiscountAmount = calc.getShopDiscountAmount() != null ? calc.getShopDiscountAmount() : BigDecimal.ZERO;
            platformDiscountAmount = calc.getPlatformDiscountAmount() != null ? calc.getPlatformDiscountAmount() : BigDecimal.ZERO;
            shopVoucherCode = calc.getShopVoucherCode();
            platformVoucherCode = calc.getPlatformVoucherCode();
            voucherCode = calc.getVoucherCode();
        } else if (req.getVoucherCode() != null && !req.getVoucherCode().isBlank()) {
            VoucherCalculationResponse calc = voucherService.validateAndCalculate(
                    accountId,
                    req.getVoucherCode().trim(),
                    req.getShopId(),
                    subtotal,
                    shippingFee
            );
            discountAmount = calc.getDiscountAmount();
            shopDiscountAmount = calc.getShopDiscountAmount() != null ? calc.getShopDiscountAmount() : BigDecimal.ZERO;
            platformDiscountAmount = calc.getPlatformDiscountAmount() != null ? calc.getPlatformDiscountAmount() : BigDecimal.ZERO;
            shopVoucherCode = calc.getShopVoucherCode();
            platformVoucherCode = calc.getPlatformVoucherCode();
            voucherCode = calc.getVoucherCode();
        }

        BigDecimal total = subtotal.add(shippingFee).subtract(discountAmount);
        if (total.compareTo(BigDecimal.ZERO) < 0) {
            total = BigDecimal.ZERO;
        }

        QuoteResponse res = new QuoteResponse();
        res.setSubtotal(subtotal);
        res.setShippingFee(shippingFee);
        res.setDiscountAmount(discountAmount);
        res.setShopDiscountAmount(shopDiscountAmount);
        res.setPlatformDiscountAmount(platformDiscountAmount);
        res.setShopVoucherCode(shopVoucherCode);
        res.setPlatformVoucherCode(platformVoucherCode);
        res.setVoucherCode(voucherCode);
        res.setTotal(total);
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

        List<VoucherResponse> availableVouchers = voucherService.listActiveVouchers(null, shopId, accountId);

        return CheckoutConfirmResponse.of(shop, addr, items, subtotal, shippingFee, availableVouchers);
    }

}
