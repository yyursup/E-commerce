package com.marketplace.ecommerce.chat.controller;

import com.marketplace.ecommerce.chat.dto.ChatMessageResponse;
import com.marketplace.ecommerce.chat.dto.ChatThreadResponse;
import com.marketplace.ecommerce.chat.dto.SendMessageRequest;
import com.marketplace.ecommerce.chat.service.ChatService;
import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.config.CurrentUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping(version = "1", path = "/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @GetMapping("/threads")
    public ResponseEntity<List<ChatThreadResponse>> getThreads(@CurrentUser CurrentUserInfo principal) {
        return ResponseEntity.ok(chatService.getThreads(principal));
    }

    @PostMapping("/threads/support")
    public ResponseEntity<ChatThreadResponse> getOrCreateSupportThread(@CurrentUser CurrentUserInfo principal) {
        return ResponseEntity.ok(chatService.getOrCreateSupportThread(principal));
    }

    @PostMapping("/threads/shop/{shopId}")
    public ResponseEntity<ChatThreadResponse> getOrCreateShopThread(
            @CurrentUser CurrentUserInfo principal,
            @PathVariable UUID shopId) {
        return ResponseEntity.ok(chatService.getOrCreateShopThread(principal, shopId));
    }

    @GetMapping("/threads/{threadId}")
    public ResponseEntity<ChatThreadResponse> getThreadById(
            @CurrentUser CurrentUserInfo principal,
            @PathVariable UUID threadId) {
        return ResponseEntity.ok(chatService.getThreadById(principal, threadId));
    }

    @GetMapping("/threads/{threadId}/messages")
    public ResponseEntity<Page<ChatMessageResponse>> getMessages(
            @CurrentUser CurrentUserInfo principal,
            @PathVariable UUID threadId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        return ResponseEntity.ok(chatService.getMessages(principal, threadId, page, size));
    }

    @PostMapping("/threads/{threadId}/messages")
    public ResponseEntity<ChatMessageResponse> sendMessage(
            @CurrentUser CurrentUserInfo principal,
            @PathVariable UUID threadId,
            @Valid @RequestBody SendMessageRequest request) {
        request.setThreadId(threadId);
        return ResponseEntity.ok(chatService.sendMessage(principal, request));
    }

    @PostMapping(value = "/threads/{threadId}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ChatMessageResponse> sendImage(
            @CurrentUser CurrentUserInfo principal,
            @PathVariable UUID threadId,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(chatService.sendImageMessage(principal, threadId, file));
    }

    @PostMapping(value = "/threads/{threadId}/videos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ChatMessageResponse> sendVideo(
            @CurrentUser CurrentUserInfo principal,
            @PathVariable UUID threadId,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(chatService.sendVideoMessage(principal, threadId, file));
    }

    @PatchMapping("/messages/{messageId}")
    public ResponseEntity<ChatMessageResponse> editMessage(
            @CurrentUser CurrentUserInfo principal,
            @PathVariable UUID messageId,
            @RequestBody Map<String, String> body) {
        String content = body.get("content");
        return ResponseEntity.ok(chatService.editMessage(principal, messageId, content));
    }

    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<Void> deleteMessage(
            @CurrentUser CurrentUserInfo principal,
            @PathVariable UUID messageId) {
        chatService.deleteMessage(principal, messageId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/threads/{threadId}/read")
    public ResponseEntity<Void> markRead(
            @CurrentUser CurrentUserInfo principal,
            @PathVariable UUID threadId) {
        chatService.markRead(principal, threadId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/threads/{threadId}/close")
    public ResponseEntity<Void> closeThread(
            @CurrentUser CurrentUserInfo principal,
            @PathVariable UUID threadId) {
        chatService.closeThread(principal, threadId);
        return ResponseEntity.ok().build();
    }
}
