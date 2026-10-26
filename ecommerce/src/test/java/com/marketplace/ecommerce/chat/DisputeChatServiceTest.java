package com.marketplace.ecommerce.chat;

import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.entity.User;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.auth.repository.UserRepository;
import com.marketplace.ecommerce.chat.dto.ChatThreadResponse;
import com.marketplace.ecommerce.chat.dto.SendMessageRequest;
import com.marketplace.ecommerce.chat.entity.ChatMessage;
import com.marketplace.ecommerce.chat.entity.ChatThread;
import com.marketplace.ecommerce.chat.enums.ChatMessageType;
import com.marketplace.ecommerce.chat.enums.ThreadStatus;
import com.marketplace.ecommerce.chat.enums.ThreadType;
import com.marketplace.ecommerce.chat.repository.ChatMessageRepository;
import com.marketplace.ecommerce.chat.repository.ChatThreadRepository;
import com.marketplace.ecommerce.chat.service.impl.ChatServiceImpl;
import com.marketplace.ecommerce.chat.websocket.WebSocketSessionService;
import com.marketplace.ecommerce.common.CurrentUserInfo;
import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.file.service.FileService;
import com.marketplace.ecommerce.request.repository.ReportRepository;
import com.marketplace.ecommerce.shop.entity.Shop;
import com.marketplace.ecommerce.shop.repository.ShopRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DisputeChatServiceTest {

    @Mock
    private ChatThreadRepository chatThreadRepository;
    @Mock
    private ChatMessageRepository chatMessageRepository;
    @Mock
    private AccountRepository accountRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ShopRepository shopRepository;
    @Mock
    private ReportRepository reportRepository;
    @Mock
    private FileService fileService;
    @Mock
    private WebSocketSessionService webSocketSessionService;

    @InjectMocks
    private ChatServiceImpl chatService;

    private UUID buyerAccountId;
    private UUID shopOwnerAccountId;
    private UUID adminAccountId;
    private UUID shopId;
    private UUID orderId;
    private UUID requestId;
    private UUID threadId;

    private Account buyerAccount;
    private Account shopOwnerAccount;
    private Shop shop;
    private ChatThread disputeThread;

    @BeforeEach
    void setUp() {
        buyerAccountId = UUID.randomUUID();
        shopOwnerAccountId = UUID.randomUUID();
        adminAccountId = UUID.randomUUID();
        shopId = UUID.randomUUID();
        orderId = UUID.randomUUID();
        requestId = UUID.randomUUID();
        threadId = UUID.randomUUID();

        buyerAccount = Account.builder().id(buyerAccountId).username("buyer_user").build();
        shopOwnerAccount = Account.builder().id(shopOwnerAccountId).username("shop_owner").build();
        User shopUser = User.builder().id(UUID.randomUUID()).account(shopOwnerAccount).fullName("Chủ Shop A").build();
        shop = Shop.builder().id(shopId).name("Shop A Official").user(shopUser).build();

        disputeThread = ChatThread.builder()
                .id(threadId)
                .type(ThreadType.DISPUTE)
                .customer(buyerAccount)
                .shop(shop)
                .orderId(orderId)
                .requestId(requestId)
                .title("Khiếu nại đơn hàng #" + orderId.toString().substring(0, 8))
                .status(ThreadStatus.OPEN)
                .unreadCustomer(0)
                .unreadAdmin(0)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("1. Safe Insert lần đầu thành công -> Tạo tin nhắn chào mừng duy nhất và trả về Thread")
    void testCreateDisputeThread_SafeInsert_FirstThread_CreatesWelcomeMessage() {
        when(accountRepository.findById(buyerAccountId)).thenReturn(Optional.of(buyerAccount));
        when(userRepository.findByAccountId(buyerAccountId)).thenReturn(Optional.of(User.builder().fullName("Người Mua").build()));
        when(chatThreadRepository.insertDisputeThreadSafe(any(), eq(buyerAccountId), eq(shopId), eq(orderId), eq(requestId), anyString(), any(), anyString(), any()))
                .thenReturn(1); // 1 row inserted
        when(chatThreadRepository.findFirstByRequestIdAndType(requestId, ThreadType.DISPUTE))
                .thenReturn(Optional.of(disputeThread));

        ChatThreadResponse response = chatService.getOrCreateDisputeThread(orderId, requestId, buyerAccountId, shopId, "ORD-123456");

        assertNotNull(response);
        assertEquals(threadId, response.getId());
        assertEquals(ThreadType.DISPUTE, response.getType());
        assertFalse(response.isLocked());

        // Verify welcome system message was created
        verify(chatMessageRepository, times(1)).save(argThat(msg ->
                msg.getMessageType() == ChatMessageType.SYSTEM &&
                msg.getSenderId() == null &&
                msg.getContent().contains("Phòng thương lượng tranh chấp tự động kích hoạt")
        ));
    }

    @Test
    @DisplayName("2. Safe Insert luồng đến sau (affectedRows == 0) -> Không tạo thêm tin nhắn chào mừng trùng lặp")
    void testCreateDisputeThread_SafeInsert_AlreadyExists_NoDuplicateWelcomeMessage() {
        when(accountRepository.findById(buyerAccountId)).thenReturn(Optional.of(buyerAccount));
        when(userRepository.findByAccountId(buyerAccountId)).thenReturn(Optional.of(User.builder().fullName("Người Mua").build()));
        when(chatThreadRepository.insertDisputeThreadSafe(any(), eq(buyerAccountId), eq(shopId), eq(orderId), eq(requestId), anyString(), any(), anyString(), any()))
                .thenReturn(0); // 0 row inserted (ON CONFLICT DO NOTHING)
        when(chatThreadRepository.findFirstByRequestIdAndType(requestId, ThreadType.DISPUTE))
                .thenReturn(Optional.of(disputeThread));

        ChatThreadResponse response = chatService.getOrCreateDisputeThread(orderId, requestId, buyerAccountId, shopId, "ORD-123456");

        assertNotNull(response);
        assertEquals(threadId, response.getId());

        // Verify NO welcome message was created
        verify(chatMessageRepository, never()).save(any(ChatMessage.class));
    }

    @Test
    @DisplayName("3. Đóng phòng tranh chấp bằng Khóa bi quan và Idempotent an toàn")
    void testCloseDisputeThread_PessimisticLock_Idempotent() {
        when(chatThreadRepository.findByRequestIdForUpdate(requestId)).thenReturn(Optional.of(disputeThread));

        // First close call
        chatService.closeDisputeThread(requestId, "Đã hoàn tiền cho người mua");

        assertEquals(ThreadStatus.CLOSED, disputeThread.getStatus());
        assertTrue(disputeThread.isLocked());
        assertEquals("Đã hoàn tiền cho người mua", disputeThread.getCloseReason());
        assertNotNull(disputeThread.getClosedAt());

        // Verify system close message saved
        verify(chatMessageRepository, times(1)).save(argThat(msg ->
                msg.getMessageType() == ChatMessageType.SYSTEM &&
                msg.getSenderId() == null &&
                msg.getContent().contains("Phòng trao đổi thương lượng đã đóng")
        ));
        verify(chatThreadRepository, times(1)).saveAndFlush(disputeThread);

        // Second close call (idempotent test)
        chatService.closeDisputeThread(requestId, "Gọi đóng lần 2");
        // Should not save additional message or change reason
        verify(chatMessageRepository, times(1)).save(any());
        assertEquals("Đã hoàn tiền cho người mua", disputeThread.getCloseReason());
    }

    private CurrentUserInfo createUserInfo(UUID accountId, String username, String role) {
        CurrentUserInfo info = new CurrentUserInfo();
        info.setAccountId(accountId);
        info.setUsername(username);
        info.setRole(role);
        return info;
    }

    @Test
    @DisplayName("4. Phân quyền ghi: Admin bị từ chối gửi tin nhắn vào phòng tranh chấp (Chỉ được quyền Audit View)")
    void testDisputeMessageSecurity_AdminCannotSendMessage() {
        CurrentUserInfo adminInfo = createUserInfo(adminAccountId, "admin", "ADMIN");

        when(chatThreadRepository.findById(threadId)).thenReturn(Optional.of(disputeThread));

        SendMessageRequest request = new SendMessageRequest();
        request.setThreadId(threadId);
        request.setContent("Admin can thiep tin nhan");

        CustomException exception = assertThrows(CustomException.class, () ->
                chatService.sendMessage(adminInfo, request)
        );
        assertTrue(exception.getMessage().contains("Quản trị viên chỉ có quyền giám sát"));
    }

    @Test
    @DisplayName("5. An toàn nghiệp vụ: Chặn gửi tin nhắn vào phòng tranh chấp đã đóng (isLocked == true)")
    void testDisputeMessageSecurity_CannotSendToClosedThread() {
        disputeThread.setStatus(ThreadStatus.CLOSED);

        CurrentUserInfo buyerInfo = createUserInfo(buyerAccountId, "buyer_user", "CUSTOMER");

        when(chatThreadRepository.findById(threadId)).thenReturn(Optional.of(disputeThread));

        SendMessageRequest request = new SendMessageRequest();
        request.setThreadId(threadId);
        request.setContent("Tin nhắn sau khi đóng");

        CustomException exception = assertThrows(CustomException.class, () ->
                chatService.sendMessage(buyerInfo, request)
        );
        assertTrue(exception.getMessage().contains("Phòng thương lượng tranh chấp đã đóng"));
    }

    @Test
    @DisplayName("6. Data Retention: Cấm chỉnh sửa tin nhắn trong phòng tranh chấp để bảo đảm toàn vẹn hồ sơ")
    void testDisputeMessageSecurity_CannotEditDisputeMessage() {
        CurrentUserInfo buyerInfo = createUserInfo(buyerAccountId, "buyer_user", "CUSTOMER");

        UUID messageId = UUID.randomUUID();
        ChatMessage msg = ChatMessage.builder()
                .id(messageId)
                .thread(disputeThread)
                .senderId(buyerAccountId)
                .content("Bằng chứng ban đầu")
                .build();

        when(chatMessageRepository.findById(messageId)).thenReturn(Optional.of(msg));

        CustomException exception = assertThrows(CustomException.class, () ->
                chatService.editMessage(buyerInfo, messageId, "Sửa lại bằng chứng")
        );
        assertTrue(exception.getMessage().contains("Không thể chỉnh sửa tin nhắn trong phòng tranh chấp"));
    }

    @Test
    @DisplayName("7. Data Retention: Cấm xóa tin nhắn trong phòng tranh chấp để bảo đảm toàn vẹn hồ sơ")
    void testDisputeMessageSecurity_CannotDeleteDisputeMessage() {
        CurrentUserInfo buyerInfo = createUserInfo(buyerAccountId, "buyer_user", "CUSTOMER");

        UUID messageId = UUID.randomUUID();
        ChatMessage msg = ChatMessage.builder()
                .id(messageId)
                .thread(disputeThread)
                .senderId(buyerAccountId)
                .content("Bằng chứng gửi shop")
                .build();

        when(chatMessageRepository.findById(messageId)).thenReturn(Optional.of(msg));

        CustomException exception = assertThrows(CustomException.class, () ->
                chatService.deleteMessage(buyerInfo, messageId)
        );
        assertTrue(exception.getMessage().contains("Không thể xóa tin nhắn trong phòng tranh chấp"));
    }

    @Test
    @DisplayName("8. Bảo mật dữ liệu: Người dùng không liên quan bị chặn xem phòng tranh chấp")
    void testGetDisputeThreadByRequestId_UnauthorizedAccessBlocked() {
        UUID strangerAccountId = UUID.randomUUID();
        CurrentUserInfo strangerInfo = createUserInfo(strangerAccountId, "stranger", "CUSTOMER");

        when(chatThreadRepository.findFirstByRequestIdAndType(requestId, ThreadType.DISPUTE))
                .thenReturn(Optional.of(disputeThread));

        CustomException exception = assertThrows(CustomException.class, () ->
                chatService.getDisputeThreadByRequestId(strangerInfo, requestId)
        );
        assertTrue(exception.getMessage().contains("Không tìm thấy cuộc hội thoại"));
    }

    @Test
    @DisplayName("9. Toàn vẹn dữ liệu: Cấm chỉnh sửa tin nhắn hệ thống (SYSTEM)")
    void testEditMessage_SystemMessage_ThrowsException() {
        UUID messageId = UUID.randomUUID();
        ChatThread shopThread = ChatThread.builder().id(UUID.randomUUID()).type(ThreadType.SHOP).build();
        ChatMessage systemMsg = ChatMessage.builder()
                .id(messageId)
                .thread(shopThread)
                .senderId(null)
                .messageType(ChatMessageType.SYSTEM)
                .content("Thông báo hệ thống")
                .build();

        when(chatMessageRepository.findById(messageId)).thenReturn(Optional.of(systemMsg));

        CurrentUserInfo userInfo = createUserInfo(buyerAccountId, "user", "CUSTOMER");
        CustomException exception = assertThrows(CustomException.class, () ->
                chatService.editMessage(userInfo, messageId, "Nội dung sửa đổi")
        );
        assertTrue(exception.getMessage().contains("Không thể chỉnh sửa tin nhắn hệ thống"));
    }

    @Test
    @DisplayName("10. Toàn vẹn dữ liệu: Cấm xóa tin nhắn hệ thống (SYSTEM)")
    void testDeleteMessage_SystemMessage_ThrowsException() {
        UUID messageId = UUID.randomUUID();
        ChatThread shopThread = ChatThread.builder().id(UUID.randomUUID()).type(ThreadType.SHOP).build();
        ChatMessage systemMsg = ChatMessage.builder()
                .id(messageId)
                .thread(shopThread)
                .senderId(null)
                .messageType(ChatMessageType.SYSTEM)
                .content("Thông báo hệ thống")
                .build();

        when(chatMessageRepository.findById(messageId)).thenReturn(Optional.of(systemMsg));

        CurrentUserInfo adminInfo = createUserInfo(adminAccountId, "admin_user", "ADMIN");
        CustomException exception = assertThrows(CustomException.class, () ->
                chatService.deleteMessage(adminInfo, messageId)
        );
        assertTrue(exception.getMessage().contains("Không thể xóa tin nhắn hệ thống"));
    }
}
