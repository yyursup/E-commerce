package com.marketplace.ecommerce.chat.service.impl;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.chat.dto.ChatMessageResponse;
import com.marketplace.ecommerce.chat.dto.ChatThreadResponse;
import com.marketplace.ecommerce.chat.dto.SendMessageRequest;
import com.marketplace.ecommerce.chat.entity.ChatMessage;
import com.marketplace.ecommerce.chat.entity.ChatThread;
import com.marketplace.ecommerce.chat.enums.ChatMessageType;
import com.marketplace.ecommerce.chat.enums.ThreadStatus;
import com.marketplace.ecommerce.chat.enums.ThreadType;
import com.marketplace.ecommerce.chat.repository.ChatMessageRepository;
import com.marketplace.ecommerce.chat.repository.ChatThreadRepository;
import com.marketplace.ecommerce.chat.service.ChatService;
import com.marketplace.ecommerce.chat.websocket.WebSocketSessionService;
import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.file.service.FileService;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatServiceImpl implements ChatService {

    private final ChatThreadRepository chatThreadRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    private final FileService fileService;
    private final WebSocketSessionService webSocketSessionService;

    @Override
    @Transactional(readOnly = true)
    public List<ChatThreadResponse> getThreads(CurrentUserInfo principal) {
        if (principal == null || principal.getAccountId() == null) {
            throw new CustomException("Vui lòng đăng nhập để xem danh sách chat");
        }

        boolean isAdmin = "ADMIN".equalsIgnoreCase(principal.getRole());
        List<ChatThread> threads;

        if (isAdmin) {
            threads = chatThreadRepository.findAllOrderByLastMessageAtDesc();
        } else if ("BUSINESS".equalsIgnoreCase(principal.getRole())) {
            // Find shop owned by this user
            Optional<User> userOpt = userRepository.findByAccountId(principal.getAccountId());
            Shop shop = userOpt.flatMap(u -> shopRepository.findByUserId(u.getId())).orElse(null);

            if (shop != null) {
                threads = chatThreadRepository.findByShopId(shop.getId());
            } else {
                threads = chatThreadRepository.findByCustomerId(principal.getAccountId());
            }
        } else {
            threads = chatThreadRepository.findByCustomerId(principal.getAccountId());
        }

        return threads.stream()
                .map(t -> ChatThreadResponse.from(t, principal.getAccountId(), isAdmin))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ChatThreadResponse getOrCreateSupportThread(CurrentUserInfo principal) {
        if (principal == null || principal.getAccountId() == null) {
            throw new CustomException("Vui lòng đăng nhập để bắt đầu hỗ trợ trực tuyến");
        }

        UUID accountId = principal.getAccountId();
        Optional<ChatThread> existingOpt = chatThreadRepository.findFirstByCustomer_IdAndTypeAndStatus(
                accountId, ThreadType.SUPPORT, ThreadStatus.OPEN);

        if (existingOpt.isPresent()) {
            return ChatThreadResponse.from(existingOpt.get(), accountId, false);
        }

        Account customer = accountRepository.findById(accountId)
                .orElseThrow(() -> new CustomException("Không tìm thấy tài khoản người dùng"));

        Optional<User> userOpt = userRepository.findByAccountId(accountId);
        String customerName = userOpt.map(User::getFullName).filter(s -> !s.isBlank()).orElse(customer.getUsername());
        String customerAvatar = userOpt.map(User::getAvatarUrl).orElse(null);

        ChatThread newThread = ChatThread.builder()
                .type(ThreadType.SUPPORT)
                .customer(customer)
                .customerName(customerName)
                .customerAvatar(customerAvatar)
                .title("Hỗ trợ: " + customerName)
                .status(ThreadStatus.OPEN)
                .unreadCustomer(0)
                .unreadAdmin(0)
                .createdAt(LocalDateTime.now())
                .build();

        ChatThread saved = chatThreadRepository.save(newThread);
        ChatThreadResponse response = ChatThreadResponse.from(saved, accountId, false);

        // Notify admins of new support thread
        webSocketSessionService.broadcastToAdmins("CHAT_THREAD_NEW", response);

        return response;
    }

    @Override
    @Transactional
    public ChatThreadResponse getOrCreateShopThread(CurrentUserInfo principal, UUID shopId) {
        if (principal == null || principal.getAccountId() == null) {
            throw new CustomException("Vui lòng đăng nhập để chat với Shop");
        }

        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new CustomException("Không tìm thấy Shop"));

        UUID accountId = principal.getAccountId();
        Optional<ChatThread> existingOpt = chatThreadRepository.findFirstByCustomer_IdAndShop_IdAndStatus(
                accountId, shopId, ThreadStatus.OPEN);

        if (existingOpt.isPresent()) {
            return ChatThreadResponse.from(existingOpt.get(), accountId, false);
        }

        Account customer = accountRepository.findById(accountId)
                .orElseThrow(() -> new CustomException("Không tìm thấy tài khoản người dùng"));

        Optional<User> userOpt = userRepository.findByAccountId(accountId);
        String customerName = userOpt.map(User::getFullName).filter(s -> !s.isBlank()).orElse(customer.getUsername());
        String customerAvatar = userOpt.map(User::getAvatarUrl).orElse(null);

        ChatThread newThread = ChatThread.builder()
                .type(ThreadType.SHOP)
                .customer(customer)
                .customerName(customerName)
                .customerAvatar(customerAvatar)
                .shop(shop)
                .title("Chat với " + shop.getName())
                .status(ThreadStatus.OPEN)
                .unreadCustomer(0)
                .unreadAdmin(0)
                .createdAt(LocalDateTime.now())
                .build();

        ChatThread saved = chatThreadRepository.save(newThread);
        return ChatThreadResponse.from(saved, accountId, false);
    }

    @Override
    @Transactional(readOnly = true)
    public ChatThreadResponse getThreadById(CurrentUserInfo principal, UUID threadId) {
        ChatThread thread = chatThreadRepository.findById(threadId)
                .orElseThrow(() -> new CustomException("Không tìm thấy cuộc hội thoại"));

        boolean isAdmin = checkIsAdmin(principal != null ? principal.getRole() : null);
        return ChatThreadResponse.from(thread, principal.getAccountId(), isAdmin);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ChatMessageResponse> getMessages(CurrentUserInfo principal, UUID threadId, int page, int size) {
        if (!chatThreadRepository.existsById(threadId)) {
            throw new CustomException("Không tìm thấy cuộc hội thoại");
        }

        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return chatMessageRepository.findByThread_IdOrderByCreatedAtDesc(threadId, pageRequest)
                .map(ChatMessageResponse::from);
    }

    @Override
    @Transactional
    public ChatMessageResponse sendMessage(CurrentUserInfo principal, SendMessageRequest request) {
        if (principal == null || principal.getAccountId() == null) {
            throw new CustomException("Chưa xác thực");
        }

        ChatThread thread = chatThreadRepository.findById(request.getThreadId())
                .orElseThrow(() -> new CustomException("Không tìm thấy cuộc hội thoại"));

        UUID senderId = principal.getAccountId();
        String senderRole = principal.getRole() != null ? principal.getRole() : "CUSTOMER";
        boolean isAdmin = checkIsAdmin(senderRole);

        // Determine sender display name
        Optional<User> userOpt = userRepository.findByAccountId(senderId);
        String senderName = userOpt.map(User::getFullName).filter(s -> !s.isBlank()).orElse(principal.getUsername());
        if (isAdmin) {
            senderName = "Hỗ trợ viên (" + principal.getUsername() + ")";
        }

        UUID recipientId = request.getRecipientId();
        if (recipientId == null) {
            if (isAdmin) {
                recipientId = thread.getCustomer().getId();
            } else if (thread.getAdmin() != null) {
                recipientId = thread.getAdmin().getId();
            }
        }

        ChatMessage message = ChatMessage.builder()
                .thread(thread)
                .senderId(senderId)
                .senderName(senderName)
                .senderRole(senderRole)
                .recipientId(recipientId)
                .content(request.getContent().trim())
                .messageType(ChatMessageType.TEXT)
                .createdAt(LocalDateTime.now())
                .build();

        ChatMessage saved = chatMessageRepository.save(message);

        // Update thread preview and unread counters
        LocalDateTime now = LocalDateTime.now();
        thread.setLastMessage(request.getContent().trim());
        thread.setLastMessageAt(now);

        if (isAdmin) {
            thread.setUnreadCustomer(thread.getUnreadCustomer() + 1);
            if (thread.getAdmin() == null) {
                accountRepository.findById(senderId).ifPresent(thread::setAdmin);
            }
        } else {
            thread.setUnreadAdmin(thread.getUnreadAdmin() + 1);
        }

        chatThreadRepository.save(thread);

        ChatMessageResponse response = ChatMessageResponse.from(saved);
        ChatThreadResponse threadResponse = ChatThreadResponse.from(thread, senderId, isAdmin);

        // Dispatch via WebSocket
        dispatchRealtimeMessage(thread, response, threadResponse, isAdmin);

        return response;
    }

    @Override
    @Transactional
    public ChatMessageResponse sendImageMessage(CurrentUserInfo principal, UUID threadId, MultipartFile file) {
        if (principal == null || principal.getAccountId() == null) {
            throw new CustomException("Chưa xác thực");
        }

        ChatThread thread = chatThreadRepository.findById(threadId)
                .orElseThrow(() -> new CustomException("Không tìm thấy cuộc hội thoại"));

        String fileName = fileService.uploadFile(file, "chat");
        String fileUrl = fileService.getFileUrl(fileName);

        UUID senderId = principal.getAccountId();
        String senderRole = principal.getRole() != null ? principal.getRole() : "CUSTOMER";
        boolean isAdmin = checkIsAdmin(senderRole);

        Optional<User> userOpt = userRepository.findByAccountId(senderId);
        String senderName = userOpt.map(User::getFullName).filter(s -> !s.isBlank()).orElse(principal.getUsername());
        if (isAdmin) {
            senderName = "Hỗ trợ viên (" + principal.getUsername() + ")";
        }

        ChatMessage message = ChatMessage.builder()
                .thread(thread)
                .senderId(senderId)
                .senderName(senderName)
                .senderRole(senderRole)
                .content("[Hình ảnh]")
                .messageType(ChatMessageType.IMAGE)
                .imageUrl(fileUrl)
                .createdAt(LocalDateTime.now())
                .build();

        ChatMessage saved = chatMessageRepository.save(message);

        LocalDateTime now = LocalDateTime.now();
        thread.setLastMessage("[Hình ảnh]");
        thread.setLastMessageAt(now);
        if (isAdmin) {
            thread.setUnreadCustomer(thread.getUnreadCustomer() + 1);
        } else {
            thread.setUnreadAdmin(thread.getUnreadAdmin() + 1);
        }
        chatThreadRepository.save(thread);

        ChatMessageResponse response = ChatMessageResponse.from(saved);
        ChatThreadResponse threadResponse = ChatThreadResponse.from(thread, senderId, isAdmin);

        dispatchRealtimeMessage(thread, response, threadResponse, isAdmin);

        return response;
    }

    @Override
    @Transactional
    public void markRead(CurrentUserInfo principal, UUID threadId) {
        if (principal == null || principal.getAccountId() == null) return;

        ChatThread thread = chatThreadRepository.findById(threadId).orElse(null);
        if (thread == null) return;

        boolean isAdmin = checkIsAdmin(principal.getRole());
        chatMessageRepository.markAllAsRead(threadId, principal.getAccountId(), LocalDateTime.now());

        if (isAdmin) {
            thread.setUnreadAdmin(0);
        } else {
            thread.setUnreadCustomer(0);
        }
        chatThreadRepository.save(thread);

        // Notify client side of read receipt
        Map<String, Object> readEvent = Map.of(
                "threadId", threadId,
                "readBy", principal.getUsername()
        );

        if (isAdmin) {
            webSocketSessionService.sendToUser(thread.getCustomer().getId(), "CHAT_READ", readEvent);
        } else {
            webSocketSessionService.broadcastToAdmins("CHAT_READ", readEvent);
        }
    }

    @Override
    @Transactional
    public void closeThread(CurrentUserInfo principal, UUID threadId) {
        ChatThread thread = chatThreadRepository.findById(threadId)
                .orElseThrow(() -> new CustomException("Không tìm thấy cuộc hội thoại"));

        thread.setStatus(ThreadStatus.RESOLVED);
        chatThreadRepository.save(thread);

        Map<String, Object> event = Map.of("threadId", threadId, "status", ThreadStatus.RESOLVED);
        webSocketSessionService.sendToUser(thread.getCustomer().getId(), "CHAT_THREAD_CLOSED", event);
        webSocketSessionService.broadcastToAdmins("CHAT_THREAD_CLOSED", event);
    }

    private void dispatchRealtimeMessage(ChatThread thread, ChatMessageResponse response,
                                         ChatThreadResponse threadResponse, boolean senderIsAdmin) {
        if (senderIsAdmin) {
            // Send to customer
            webSocketSessionService.sendToUser(thread.getCustomer().getId(), "CHAT_MESSAGE", response);
            webSocketSessionService.sendToUser(thread.getCustomer().getId(), "CHAT_THREAD_UPDATED", threadResponse);

            // Broadcast to all admins (including the sender admin)
            webSocketSessionService.broadcastToAdmins("CHAT_MESSAGE", response);
            webSocketSessionService.broadcastToAdmins("CHAT_THREAD_UPDATED", threadResponse);
        } else {
            // Customer sent: echo back to customer and broadcast to all admins
            webSocketSessionService.sendToUser(response.getSenderId(), "CHAT_MESSAGE", response);
            webSocketSessionService.broadcastToAdmins("CHAT_MESSAGE", response);
            webSocketSessionService.broadcastToAdmins("CHAT_THREAD_UPDATED", threadResponse);
        }
    }

    private boolean checkIsAdmin(String role) {
        if (role == null) return false;
        return "ADMIN".equalsIgnoreCase(role) || "ROLE_ADMIN".equalsIgnoreCase(role);
    }
}
