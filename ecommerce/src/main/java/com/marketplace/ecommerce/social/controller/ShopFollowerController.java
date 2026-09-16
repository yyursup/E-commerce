package com.marketplace.ecommerce.social.controller;

import com.marketplace.ecommerce.config.CurrentUser;
import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.social.dto.FollowStatusResponse;
import com.marketplace.ecommerce.social.service.ShopFollowerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping(version = "1", path = "/social/shop")
@RequiredArgsConstructor
public class ShopFollowerController {

    private final ShopFollowerService shopFollowerService;

    @PostMapping("/toggle-follow/{shopId}")
    public ResponseEntity<FollowStatusResponse> toggleFollow(
            @CurrentUser CurrentUserInfo currentUser,
            @PathVariable UUID shopId
    ) {
        if (currentUser == null || currentUser.getAccountId() == null) {
            return ResponseEntity.status(401).build();
        }
        FollowStatusResponse response = shopFollowerService.toggleFollowShop(currentUser.getAccountId(), shopId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/follow-status/{shopId}")
    public ResponseEntity<FollowStatusResponse> getFollowStatus(
            @CurrentUser CurrentUserInfo currentUser,
            @PathVariable UUID shopId
    ) {
        UUID accountId = (currentUser != null) ? currentUser.getAccountId() : null;
        FollowStatusResponse response = shopFollowerService.getFollowStatus(accountId, shopId);
        return ResponseEntity.ok(response);
    }
}
