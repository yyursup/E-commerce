package com.marketplace.ecommerce.wishlist.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WishlistStatusResponse {
    private boolean wishlisted;
    private long wishlistCount;
}
