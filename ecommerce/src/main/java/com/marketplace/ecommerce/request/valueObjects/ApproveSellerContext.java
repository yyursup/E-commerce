package com.marketplace.ecommerce.request.valueObjects;

import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.request.entity.Seller;

public record ApproveSellerContext(User ownerUser, Seller sellerDetail, String shopName) {
}
