package com.marketplace.ecommerce.kyc.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketplace.ecommerce.auth.entity.Account;
import com.marketplace.ecommerce.auth.repository.AccountRepository;
import com.marketplace.ecommerce.common.exception.KycNotFoundException;
import com.marketplace.ecommerce.kyc.dto.response.CompareResponse;
import com.marketplace.ecommerce.kyc.entity.EKycSession;
import com.marketplace.ecommerce.kyc.repository.KycSessionRepository;
import com.marketplace.ecommerce.kyc.usecase.VNPTClient;
import com.marketplace.ecommerce.kyc.valueObjects.KycStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CompareKycServiceImplTest {

    @Mock
    private KycSessionRepository sessions;
    @Mock
    private VNPTClient vnpt;
    @Mock
    private AccountRepository accountRepository;
    @Mock
    private ObjectMapper om;

    @InjectMocks
    private CompareKycServiceImpl compareKycService;

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
    @DisplayName("compare ném lỗi khi thiếu ảnh mặt trước")
    void testCompare_MissingFront() {
        session.setFrontHash("");
        when(sessions.findByIdAndAccountId(sessionId, accountId)).thenReturn(Optional.of(session));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> compareKycService.compare(sessionId, accountId));
        assertTrue(ex.getMessage().contains("Front not uploaded"));
    }

    @Test
    @DisplayName("compare ném lỗi khi thiếu ảnh chân dung selfie")
    void testCompare_MissingSelfie() {
        session.setFrontHash("FRONT_HASH");
        session.setSelfieHash(null);
        when(sessions.findByIdAndAccountId(sessionId, accountId)).thenReturn(Optional.of(session));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> compareKycService.compare(sessionId, accountId));
        assertTrue(ex.getMessage().contains("Selfie not uploaded"));
    }

    @Test
    @DisplayName("compare xác minh thành công và cập nhật verified cho account")
    void testCompare_Success() {
        session.setFrontHash("FRONT_HASH");
        session.setSelfieHash("SELFIE_HASH");
        when(sessions.findByIdAndAccountId(sessionId, accountId)).thenReturn(Optional.of(session));

        CompareResponse res = new CompareResponse();
        CompareResponse.Obj o = new CompareResponse.Obj();
        o.setMsg("MATCH");
        o.setProb(98.0);
        res.setObj(o);
        when(vnpt.compare("FRONT_HASH", "SELFIE_HASH", sessionId.toString())).thenReturn(res);

        Account account = new Account();
        account.setId(accountId);
        when(accountRepository.findById(accountId)).thenReturn(Optional.of(account));

        Map<String, Object> out = compareKycService.compare(sessionId, accountId);
        assertNotNull(out);
        assertEquals(true, out.get("isMatch"));
        assertEquals(98.0, out.get("matchScore"));
        assertEquals(KycStatus.VERIFIED.name(), out.get("status"));
        assertTrue(account.getAccountVerified());
        verify(accountRepository).save(account);
        verify(sessions).save(session);
    }

    @Test
    @DisplayName("get ném KycNotFoundException khi session không tồn tại")
    void testGet_NotFound() {
        when(sessions.findByIdAndAccountId(sessionId, accountId)).thenReturn(Optional.empty());
        assertThrows(KycNotFoundException.class, () -> compareKycService.get(sessionId, accountId));
    }
}
