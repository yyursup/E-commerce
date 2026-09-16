package com.marketplace.ecommerce.auth.controller;

import com.marketplace.ecommerce.auth.dto.request.UpdateUserProfileRequest;
import com.marketplace.ecommerce.auth.dto.response.UserProfileResponse;
import com.marketplace.ecommerce.auth.service.UserService;
import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.config.CurrentUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(version = "1", path = "/user")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser(
            @CurrentUser CurrentUserInfo currentUser
    ) {
        return ResponseEntity.ok(
                userService.getUserProfile(currentUser.getAccountId())
        );
    }

    @PutMapping(value = "/profile")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @CurrentUser CurrentUserInfo currentUser,
            @ModelAttribute @Valid UpdateUserProfileRequest request
    ) {
        return ResponseEntity.ok(
                userService.updateProfile(currentUser.getAccountId(), request)
        );
    }

    @PutMapping("/password")
    public ResponseEntity<Void> changePassword(
            @CurrentUser CurrentUserInfo currentUser,
            @RequestBody @Valid com.marketplace.ecommerce.auth.dto.request.ChangePasswordRequest request
    ) {
        userService.changePassword(currentUser.getAccountId(), request);
        return ResponseEntity.ok().build();
    }
}
