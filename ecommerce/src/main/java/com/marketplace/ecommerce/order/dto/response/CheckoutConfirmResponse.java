package com.marketplace.ecommerce.order.dto.response;

import com.marketplace.ecommerce.auth.dto.response.AddressResponse;
import com.marketplace.ecommerce.auth.entity.UserAddress;
import com.marketplace.ecommerce.cart.dto.response.CartItemResponse;
import com.marketplace.ecommerce.cart.entity.CartItem;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class CheckoutConfirmResponse {
    private AddressResponse address;
    private List<CartItemResponse> items;
    private BigDecimal subtotal;
    private BigDecimal shippingFee;
    private BigDecimal total;

    public static CheckoutConfirmResponse of(
            UserAddress address,
            List<CartItem> items,
            BigDecimal subtotal,
            BigDecimal shippingFee
    ) {
        BigDecimal safeSubtotal = subtotal != null ? subtotal : BigDecimal.ZERO;
        BigDecimal safeShipping = shippingFee != null ? shippingFee : BigDecimal.ZERO;

        return CheckoutConfirmResponse.builder()
                .address(address == null ? null : AddressResponse.from(address))
                .items(items == null ? List.of() : items.stream().map(CartItemResponse::fromCartItem).toList())
                .subtotal(safeSubtotal)
                .shippingFee(safeShipping)
                .total(safeSubtotal.add(safeShipping))
                .build();
    }
}
