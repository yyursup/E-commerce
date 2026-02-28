package com.marketplace.ecommerce.kyc.service.impl;

import com.marketplace.ecommerce.kyc.service.*;
import com.marketplace.ecommerce.kyc.valueObjects.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class KycOrchestratorServiceImplTest {

    @Mock
    private UploadFileService uploadService;
    @Mock
    private CardLivenessService cardLivenessService;
    @Mock
    private CardClassifyService classifyService;
    @Mock
    private KycSessionAttachService attachService;
    @Mock
    private FaceLivenessService faceLivenessService;

    @InjectMocks
    private KycOrchestratorServiceImpl kycOrchestratorService;

    @Test
    void uploadFileAndAttach_Success_Card() {
        UUID sessionId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();
        MultipartFile file = mock(MultipartFile.class);
        String hash = "somehash";

        when(uploadService.upload(any(), any(), any())).thenReturn(hash);
        
        ClassifyResult cls = mock(ClassifyResult.class);
        when(cls.name()).thenReturn("ID_CARD");
        when(cls.type()).thenReturn(0);
        when(classifyService.classify(eq(hash), anyString())).thenReturn(cls);

        CardLivenessResult live = mock(CardLivenessResult.class);
        when(live.isReal()).thenReturn(true);
        when(cardLivenessService.verify(eq(hash), anyString())).thenReturn(live);

        AttachDecision decision = mock(AttachDecision.class);
        when(decision.attached()).thenReturn(true);
        when(attachService.attachFile(any(), any(), any(), any())).thenReturn(decision);

        Map<String, Object> result = kycOrchestratorService.uploadFileAndAttach(sessionId, accountId, file, "title", "desc");

        assertTrue((Boolean) result.get("ok"));
        assertEquals(hash, result.get("fileHash"));
    }

    @Test
    void uploadFileAndAttach_Success_Face() {
        UUID sessionId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();
        MultipartFile file = mock(MultipartFile.class);
        String hash = "facehash";

        when(uploadService.upload(any(), any(), any())).thenReturn(hash);
        
        ClassifyResult cls = mock(ClassifyResult.class);
        when(cls.name()).thenReturn("FACE");
        when(cls.type()).thenReturn(4);
        when(classifyService.classify(eq(hash), anyString())).thenReturn(cls);

        FaceLivenessResult faceLive = mock(FaceLivenessResult.class);
        when(faceLive.isLive()).thenReturn(true);
        when(faceLivenessService.verify(eq(hash), anyString())).thenReturn(faceLive);

        AttachDecision decision = mock(AttachDecision.class);
        when(decision.attached()).thenReturn(true);
        when(attachService.attachFile(any(), any(), any(), any())).thenReturn(decision);

        Map<String, Object> result = kycOrchestratorService.uploadFileAndAttach(sessionId, accountId, file, "title", "desc");

        assertTrue((Boolean) result.get("ok"));
    }

    @Test
    void uploadFileAndAttach_UploadFailed() {
        when(uploadService.upload(any(), any(), any())).thenReturn(null);

        Map<String, Object> result = kycOrchestratorService.uploadFileAndAttach(UUID.randomUUID(), UUID.randomUUID(), mock(MultipartFile.class), "t", "d");

        assertFalse((Boolean) result.get("ok"));
        assertEquals("UPLOAD", result.get("step"));
    }

    @Test
    void uploadFileAndAttach_ClassifyFailed() {
        when(uploadService.upload(any(), any(), any())).thenReturn("hash");
        when(classifyService.classify(any(), any())).thenReturn(null);

        Map<String, Object> result = kycOrchestratorService.uploadFileAndAttach(UUID.randomUUID(), UUID.randomUUID(), mock(MultipartFile.class), "t", "d");

        assertFalse((Boolean) result.get("ok"));
        assertEquals("CLASSIFY", result.get("step"));
    }
}
