package com.marketplace.ecommerce.order.dto.response;

import com.marketplace.ecommerce.auth.dto.response.AddressResponse;
import com.marketplace.ecommerce.auth.entity.UserAddress;
import com.marketplace.ecommerce.cart.dto.response.CartItemResponse;
import com.marketplace.ecommerce.cart.entity.CartItem;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.voucher.dto.VoucherResponse;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class CheckoutConfirmResponse {
    private UUID shopId;
    private String shopName;
    private Integer shopDistrictId;
    private String shopWardCode;
    private String shopAddress;
    private AddressResponse address;
    private List<CartItemResponse> items;
    private BigDecimal subtotal;
    private BigDecimal shippingFee;
    private BigDecimal total;
    private List<VoucherResponse> availableVouchers;

    public static CheckoutConfirmResponse of(
            Shop shop,
            UserAddress address,
            List<CartItem> items,
            BigDecimal subtotal,
            BigDecimal shippingFee,
            List<VoucherResponse> availableVouchers
    ) {
        BigDecimal safeSubtotal = subtotal != null ? subtotal : BigDecimal.ZERO;
        BigDecimal safeShipping = shippingFee != null ? shippingFee : BigDecimal.ZERO;

        return CheckoutConfirmResponse.builder()
                .shopId(shop != null ? shop.getId() : null)
                .shopName(shop != null ? shop.getName() : null)
                .shopDistrictId(shop != null ? shop.getDistrictId() : null)
                .shopWardCode(shop != null ? shop.getWardCode() : null)
                .shopAddress(shop != null ? (shop.getPickupAddress() != null ? shop.getPickupAddress() : shop.getAddress()) : null)
                .address(address == null ? null : AddressResponse.from(address))
                .items(items == null ? List.of() : items.stream().map(CartItemResponse::fromCartItem).toList())
                .subtotal(safeSubtotal)
                .shippingFee(safeShipping)
                .total(safeSubtotal.add(safeShipping))
                .availableVouchers(availableVouchers == null ? List.of() : availableVouchers)
                .build();
    }
}
