package com.marketplace.ecommerce.auth.controller;

import com.marketplace.ecommerce.auth.dto.request.UpsertAddressRequest;
import com.marketplace.ecommerce.auth.dto.response.UserAddressResponse;
import com.marketplace.ecommerce.auth.service.UserAddressService;
import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.config.CurrentUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(version = "1", path = "/address")
@RequiredArgsConstructor
public class UserAddressController {
    private final UserAddressService userAddressService;

    @GetMapping
    public ResponseEntity<List<UserAddressResponse>> listMyAddresses(
            @CurrentUser CurrentUserInfo c
    ) {
        return ResponseEntity.ok(userAddressService.listMyAddresses(c.getAccountId()));
    }

    @PostMapping
    public ResponseEntity<UserAddressResponse> createMyAddress(
            @CurrentUser CurrentUserInfo c,
            @Valid @RequestBody UpsertAddressRequest req
    ) {
        return ResponseEntity.ok(userAddressService.createMyAddress(c.getAccountId(), req));
    }

    @PutMapping("/{addressId}")
    public ResponseEntity<UserAddressResponse> updateMyAddress(
            @CurrentUser CurrentUserInfo c,
            @PathVariable UUID addressId,
            @Valid @RequestBody UpsertAddressRequest req
    ) {
        return ResponseEntity.ok(userAddressService.updateMyAddress(c.getAccountId(), addressId, req));
    }

    @DeleteMapping("/{addressId}")
    public ResponseEntity<Void> deleteMyAddress(
            @CurrentUser CurrentUserInfo c,
            @PathVariable UUID addressId
    ) {
        userAddressService.deleteMyAddress(c.getAccountId(), addressId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{addressId}/default")
    public ResponseEntity<UserAddressResponse> setDefault(
            @CurrentUser CurrentUserInfo c,
            @PathVariable UUID addressId
    ) {
        return ResponseEntity.ok(userAddressService.setDefault(c.getAccountId(), addressId));
    }
}
