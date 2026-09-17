package com.marketplace.ecommerce.chat.service;

import com.marketplace.ecommerce.chat.dto.ChatMessageResponse;
import com.marketplace.ecommerce.chat.dto.ChatThreadResponse;
import com.marketplace.ecommerce.chat.dto.SendMessageRequest;
import com.marketplace.ecommerce.common.CurrentUserInfo;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface ChatService {

    List<ChatThreadResponse> getThreads(CurrentUserInfo principal);
    List<ChatThreadResponse> getThreads(CurrentUserInfo principal, String type);

    ChatThreadResponse getOrCreateSupportThread(CurrentUserInfo principal);

    ChatThreadResponse getOrCreateShopThread(CurrentUserInfo principal, UUID shopId);
    ChatThreadResponse getOrCreateShopThread(CurrentUserInfo principal, String shopIdStr);

    ChatThreadResponse getThreadById(CurrentUserInfo principal, UUID threadId);

    Page<ChatMessageResponse> getMessages(CurrentUserInfo principal, UUID threadId, int page, int size);

    ChatMessageResponse sendMessage(CurrentUserInfo principal, SendMessageRequest request);

    ChatMessageResponse sendImageMessage(CurrentUserInfo principal, UUID threadId, MultipartFile file);

    ChatMessageResponse sendVideoMessage(CurrentUserInfo principal, UUID threadId, MultipartFile file);

    ChatMessageResponse editMessage(CurrentUserInfo principal, UUID messageId, String newContent);

    void deleteMessage(CurrentUserInfo principal, UUID messageId);

    void markRead(CurrentUserInfo principal, UUID threadId);

    void closeThread(CurrentUserInfo principal, UUID threadId);

    void handleTyping(CurrentUserInfo principal, UUID threadId, boolean isTyping);
}
