package com.marketplace.ecommerce.kyc.service.impl;

import com.marketplace.ecommerce.common.exception.KycNotFoundException;
import com.marketplace.ecommerce.kyc.entity.EKycDocument;
import com.marketplace.ecommerce.kyc.entity.EKycSession;
import com.marketplace.ecommerce.kyc.repository.KycDocumentRepository;
import com.marketplace.ecommerce.kyc.repository.KycSessionRepository;
import com.marketplace.ecommerce.kyc.valueObjects.AttachDecision;
import com.marketplace.ecommerce.kyc.valueObjects.KycStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class KycSessionAttachServiceImplTest {

    @Mock
    private KycSessionRepository sessions;
    @Mock
    private KycDocumentRepository docs;

    @InjectMocks
    private KycSessionAttachServiceImpl attachService;

    private UUID sessionId;
    private UUID accountId;
    private EKycSession session;

    @BeforeEach
    void setUp() {
        sessionId = UUID.randomUUID();
        accountId = UUID.randomUUID();

        session = new EKycSession();
        session.setId(sessionId);
        session.setAccountId(accountId);
    }

    @Test
    @DisplayName("attachFile gán frontHash cho các biến thể tên mặt trước")
    void testAttachFile_FrontVariants() {
        when(sessions.findByIdAndAccountId(sessionId, accountId)).thenReturn(Optional.of(session));

        AttachDecision dec = attachService.attachFile(sessionId, accountId, "HASH_1", "new_front");
        assertTrue(dec.attached());
        assertEquals("frontHash", dec.savedTo());
        assertEquals("HASH_1", session.getFrontHash());
        assertEquals(KycStatus.IN_PROGRESS, session.getStatus());
        verify(docs).save(any(EKycDocument.class));
    }

    @Test
    @DisplayName("attachFile gán selfieHash cho các biến thể khác")
    void testAttachFile_SelfieVariants() {
        when(sessions.findByIdAndAccountId(sessionId, accountId)).thenReturn(Optional.of(session));

        AttachDecision dec = attachService.attachFile(sessionId, accountId, "HASH_2", "other_papers");
        assertTrue(dec.attached());
        assertEquals("selfieHash", dec.savedTo());
        assertEquals("HASH_2", session.getSelfieHash());
    }

    @Test
    @DisplayName("attachFile từ chối khi tên phân loại không hỗ trợ")
    void testAttachFile_Unsupported() {
        when(sessions.findByIdAndAccountId(sessionId, accountId)).thenReturn(Optional.of(session));

        AttachDecision dec = attachService.attachFile(sessionId, accountId, "HASH_3", "unknown_card");
        assertFalse(dec.attached());
        assertTrue(dec.reason().contains("not FRONT side"));
    }

    @Test
    @DisplayName("attachFile từ chối khi classifyName rỗng")
    void testAttachFile_EmptyName() {
        when(sessions.findByIdAndAccountId(sessionId, accountId)).thenReturn(Optional.of(session));

        AttachDecision dec = attachService.attachFile(sessionId, accountId, "HASH_4", "");
        assertFalse(dec.attached());
        assertTrue(dec.reason().contains("empty name"));
    }

    @Test
    @DisplayName("attachFile ném lỗi khi không tìm thấy phiên eKYC")
    void testAttachFile_NotFound() {
        when(sessions.findByIdAndAccountId(sessionId, accountId)).thenReturn(Optional.empty());
        assertThrows(KycNotFoundException.class, () -> attachService.attachFile(sessionId, accountId, "HASH", "new_front"));
    }
}
