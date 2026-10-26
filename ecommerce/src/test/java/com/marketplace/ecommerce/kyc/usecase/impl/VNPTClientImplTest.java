package com.marketplace.ecommerce.kyc.usecase.impl;

import com.marketplace.ecommerce.config.EKycConfig;
import com.marketplace.ecommerce.kyc.dto.response.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class VNPTClientImplTest {

    @Mock
    private RestClient vnptRestClient;
    @Mock
    private EKycConfig cfg;

    private VNPTClientImpl client;

    private RestClient.RequestBodyUriSpec uriSpec;
    private RestClient.RequestBodySpec bodySpec;
    private RestClient.ResponseSpec responseSpec;

    @BeforeEach
    void setUp() {
        client = new VNPTClientImpl(vnptRestClient, cfg);

        uriSpec = mock(RestClient.RequestBodyUriSpec.class);
        bodySpec = mock(RestClient.RequestBodySpec.class);
        responseSpec = mock(RestClient.ResponseSpec.class);

        when(vnptRestClient.post()).thenReturn(uriSpec);
        when(uriSpec.uri(anyString())).thenReturn(bodySpec);
        when(bodySpec.contentType(any(MediaType.class))).thenReturn(bodySpec);
        when(bodySpec.body(any(Object.class))).thenReturn(bodySpec);
        when(bodySpec.retrieve()).thenReturn(responseSpec);
        when(cfg.getTokenKey()).thenReturn("test-token-key");
    }

    @Test
    @DisplayName("addFile tải file lên thành công")
    void testAddFile_Success() {
        MockMultipartFile file = new MockMultipartFile("file", "cccd.jpg", "image/jpeg", "image-bytes".getBytes());
        UploadResponse uploadRes = new UploadResponse();
        when(responseSpec.body(UploadResponse.class)).thenReturn(uploadRes);

        UploadResponse res = client.addFile(file, "Mặt trước CCCD", "Mô tả ảnh");
        assertNotNull(res);
        assertEquals(uploadRes, res);
    }

    @Test
    @DisplayName("addFile ném lỗi khi file null hoặc rỗng")
    void testAddFile_EmptyFile() {
        MockMultipartFile emptyFile = new MockMultipartFile("file", "", "image/jpeg", new byte[0]);
        assertThrows(RuntimeException.class, () -> client.addFile(null, "Title", "Desc"));
        assertThrows(RuntimeException.class, () -> client.addFile(emptyFile, "Title", "Desc"));
    }

    @Test
    @DisplayName("cardLiveness kiểm tra thẻ thật/giả")
    void testCardLiveness() {
        CardLivenessResponse livenessRes = new CardLivenessResponse();
        when(responseSpec.body(CardLivenessResponse.class)).thenReturn(livenessRes);

        CardLivenessResponse res = client.cardLiveness("hash123", "sess123");
        assertNotNull(res);
    }

    @Test
    @DisplayName("classify phân loại loại giấy tờ CCCD/CMND")
    void testClassify() {
        ClassifyResponse classifyRes = new ClassifyResponse();
        when(responseSpec.body(ClassifyResponse.class)).thenReturn(classifyRes);

        ClassifyResponse res = client.classify("hash123", "sess123");
        assertNotNull(res);
    }

    @Test
    @DisplayName("ocrFront đọc thông tin mặt trước CCCD và bắt ResourceAccessException")
    void testOcrFront() {
        OcrFrontResponse frontRes = new OcrFrontResponse();
        when(responseSpec.body(OcrFrontResponse.class)).thenReturn(frontRes);

        OcrFrontResponse res = client.ocrFront("hash123", 1, "sess123");
        assertNotNull(res);

        // Test exception handling
        when(responseSpec.body(OcrFrontResponse.class)).thenThrow(new ResourceAccessException("Timeout"));
        assertThrows(ResourceAccessException.class, () -> client.ocrFront("hash123", 1, "sess123"));

        doThrow(new org.springframework.web.client.RestClientException("500 Error")).when(responseSpec).body(OcrFrontResponse.class);
        assertThrows(org.springframework.web.client.RestClientException.class, () -> client.ocrFront("hash123", 1, "sess123"));
    }

    @Test
    @DisplayName("addFile: Bao phủ ByteArrayResource.getFilename và title/description null/blank")
    void testAddFile_ByteArrayResourceFilenameAndBlankMeta() {
        UploadResponse uploadRes = new UploadResponse();
        when(responseSpec.body(UploadResponse.class)).thenReturn(uploadRes);
        when(bodySpec.body(any(Object.class))).thenAnswer(inv -> {
            @SuppressWarnings("unchecked")
            org.springframework.util.MultiValueMap<String, Object> map = inv.getArgument(0);
            org.springframework.core.io.ByteArrayResource res = (org.springframework.core.io.ByteArrayResource) map.getFirst("file");
            assertNotNull(res.getFilename());
            return bodySpec;
        });

        MockMultipartFile fileWithName = new MockMultipartFile("file", "front.png", "image/png", "bytes".getBytes());
        client.addFile(fileWithName, null, "   ");

        org.springframework.web.multipart.MultipartFile fileNullName = mock(org.springframework.web.multipart.MultipartFile.class);
        try {
            when(fileNullName.isEmpty()).thenReturn(false);
            when(fileNullName.getBytes()).thenReturn("bytes".getBytes());
            when(fileNullName.getOriginalFilename()).thenReturn(null);
        } catch (Exception ignored) {}
        client.addFile(fileNullName, "  ", null);
    }

    @Test
    @DisplayName("ocrBack đọc thông tin mặt sau CCCD")
    void testOcrBack() {
        OcrBackResponse backRes = new OcrBackResponse();
        when(responseSpec.body(OcrBackResponse.class)).thenReturn(backRes);

        OcrBackResponse res = client.ocrBack("hash123", 1, "sess123");
        assertNotNull(res);
    }

    @Test
    @DisplayName("liveness kiểm tra sinh trắc học khuôn mặt")
    void testLiveness() {
        LivenessResponse liveRes = new LivenessResponse();
        when(responseSpec.body(LivenessResponse.class)).thenReturn(liveRes);

        LivenessResponse res = client.liveness("hash123", "sess123");
        assertNotNull(res);
    }

    @Test
    @DisplayName("compare so khớp khuôn mặt với ảnh trên CCCD")
    void testCompare() {
        CompareResponse compRes = new CompareResponse();
        when(responseSpec.body(CompareResponse.class)).thenReturn(compRes);

        CompareResponse res = client.compare("frontHash", "faceHash", "sess123");
        assertNotNull(res);
    }
}
