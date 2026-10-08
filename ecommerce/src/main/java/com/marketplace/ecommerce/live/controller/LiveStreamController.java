package com.marketplace.ecommerce.live.controller;

import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.config.CurrentUser;
import com.marketplace.ecommerce.live.dto.*;
import com.marketplace.ecommerce.live.service.LiveStreamService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping(version = "1", path = "/livestreams")
@RequiredArgsConstructor
public class LiveStreamController {

    private final LiveStreamService liveStreamService;

    @PostMapping
    public ResponseEntity<LiveStreamResponse> createLiveStream(
            @CurrentUser CurrentUserInfo currentUser,
            @Valid @RequestBody CreateLiveStreamRequest request
    ) {
        return ResponseEntity.ok(liveStreamService.createLiveStream(currentUser.getAccountId(), request));
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<LiveTokenResponse> startLiveStream(
            @CurrentUser CurrentUserInfo currentUser,
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(liveStreamService.startLiveStream(currentUser.getAccountId(), id));
    }

    @PostMapping("/{id}/end")
    public ResponseEntity<LiveStreamResponse> endLiveStream(
            @CurrentUser CurrentUserInfo currentUser,
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(liveStreamService.endLiveStream(currentUser.getAccountId(), id));
    }

    @GetMapping("/{id}/join")
    public ResponseEntity<LiveTokenResponse> joinLiveStream(
            @CurrentUser CurrentUserInfo currentUser,
            @PathVariable UUID id,
            @RequestParam(required = false) String guestName
    ) {
        UUID accountId = currentUser != null ? currentUser.getAccountId() : null;
        return ResponseEntity.ok(liveStreamService.joinLiveStream(accountId, id, guestName));
    }

    @GetMapping("/active")
    public ResponseEntity<List<LiveStreamResponse>> getActiveLiveStreams() {
        return ResponseEntity.ok(liveStreamService.getActiveLiveStreams());
    }

    @GetMapping("/my-streams")
    public ResponseEntity<List<LiveStreamResponse>> getShopLiveStreams(
            @CurrentUser CurrentUserInfo currentUser
    ) {
        return ResponseEntity.ok(liveStreamService.getShopLiveStreams(currentUser.getAccountId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LiveStreamResponse> getLiveStreamDetail(@PathVariable UUID id) {
        return ResponseEntity.ok(liveStreamService.getLiveStreamDetail(id));
    }

    @PostMapping("/{id}/pin/{productId}")
    public ResponseEntity<LiveProductResponse> pinProduct(
            @CurrentUser CurrentUserInfo currentUser,
            @PathVariable UUID id,
            @PathVariable UUID productId
    ) {
        return ResponseEntity.ok(liveStreamService.pinProduct(currentUser.getAccountId(), id, productId));
    }

    @PostMapping("/{id}/unpin")
    public ResponseEntity<Map<String, String>> unpinProduct(
            @CurrentUser CurrentUserInfo currentUser,
            @PathVariable UUID id
    ) {
        liveStreamService.unpinProduct(currentUser.getAccountId(), id);
        return ResponseEntity.ok(Map.of("message", "Đã gỡ ghim sản phẩm thành công"));
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<Map<String, Object>> likeLiveStream(
            @PathVariable UUID id,
            @RequestParam(required = false, defaultValue = "1") Long count
    ) {
        Long totalLikes = liveStreamService.likeLiveStream(id, count);
        return ResponseEntity.ok(Map.of("totalLikes", totalLikes));
    }
}
