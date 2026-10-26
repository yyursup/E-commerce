package com.marketplace.ecommerce.chatbot.service.impl;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GeminiServiceImplTest {

    private GeminiServiceImpl geminiService;

    @Mock
    private HttpClient mockHttpClient;

    @Mock
    private HttpResponse<String> mockResponse;

    @BeforeEach
    void setUp() {
        geminiService = new GeminiServiceImpl();
        ReflectionTestUtils.setField(geminiService, "apiKey", "test-gemini-key");
        ReflectionTestUtils.setField(geminiService, "modelVersion", "gemini-2.5-flash");
        ReflectionTestUtils.setField(geminiService, "httpClient", mockHttpClient);
    }

    @Test
    @DisplayName("generateResponse trả về thông báo lỗi khi chưa cấu hình apiKey")
    void testGenerateResponse_MissingKey() {
        ReflectionTestUtils.setField(geminiService, "apiKey", "");
        String res = geminiService.generateResponse(List.of(Map.of("role", "user")));
        assertTrue(res.contains("chưa được cấu hình"));
    }

    @Test
    @DisplayName("generateResponse phân tích text trả về từ response JSON")
    void testGenerateResponse_Success() throws Exception {
        String json = """
                {
                    "candidates": [
                        {
                            "content": {
                                "parts": [
                                    {"text": "iPhone 15 Pro Max rất tốt"}
                                ]
                            }
                        }
                    ]
                }
                """;
        when(mockResponse.statusCode()).thenReturn(200);
        when(mockResponse.body()).thenReturn(json);
        doReturn(mockResponse).when(mockHttpClient).send(any(HttpRequest.class), any());

        String res = geminiService.generateResponse(List.of(Map.of("role", "user")));
        assertTrue(res.contains("iPhone 15 Pro Max rất tốt"));
    }

    @Test
    @DisplayName("generateResponse trả về lỗi khi API trả về mã lỗi HTTP khác 200")
    void testGenerateResponse_HttpError() throws Exception {
        when(mockResponse.statusCode()).thenReturn(503);
        when(mockResponse.body()).thenReturn("Service Unavailable");
        doReturn(mockResponse).when(mockHttpClient).send(any(HttpRequest.class), any());

        String res = geminiService.generateResponse(List.of(Map.of("role", "user")));
        assertTrue(res.contains("Có lỗi xảy ra khi kết nối tới AI (503)"));
    }

    @Test
    @DisplayName("generateResponse bắt ngoại lệ khi kết nối thất bại")
    void testGenerateResponse_Exception() throws Exception {
        when(mockHttpClient.send(any(HttpRequest.class), any())).thenThrow(new IOException("Connect failed"));

        String res = geminiService.generateResponse(List.of(Map.of("role", "user")));
        assertTrue(res.contains("Không thể tải phản hồi từ AI"));
    }

    @Test
    @DisplayName("streamResponse gửi thông báo khi chưa cấu hình apiKey")
    void testStreamResponse_MissingKey() {
        ReflectionTestUtils.setField(geminiService, "apiKey", null);
        SseEmitter emitter = mock(SseEmitter.class);
        geminiService.streamResponse(List.of(), List.of(), null, emitter);
        verify(emitter).complete();
    }

    @Test
    @DisplayName("streamResponse truyen luong SSE thanh cong va tich luy phan hoi")
    void testStreamResponse_Success() throws Exception {
        String json = """
                {
                    "candidates": [
                        {
                            "content": {
                                "parts": [
                                    {"text": "Chao ban, "},
                                    {"text": "toi co the giup gi?"}
                                ]
                            }
                        }
                    ]
                }
                """;
        HttpResponse<java.io.InputStream> mockStreamResponse = mock(HttpResponse.class);
        when(mockStreamResponse.statusCode()).thenReturn(200);
        when(mockStreamResponse.body()).thenReturn(new java.io.ByteArrayInputStream(json.getBytes(java.nio.charset.StandardCharsets.UTF_8)));

        doReturn(mockStreamResponse).when(mockHttpClient).send(any(HttpRequest.class), any());

        SseEmitter emitter = mock(SseEmitter.class);
        jakarta.servlet.http.HttpSession session = mock(jakarta.servlet.http.HttpSession.class);
        List<Map<String, Object>> history = new java.util.ArrayList<>();

        geminiService.streamResponse(List.of(Map.of("role", "user")), history, session, emitter);

        verify(emitter, timeout(3000)).complete();
        verify(emitter, atLeastOnce()).send(any(SseEmitter.SseEventBuilder.class));
        verify(session, timeout(3000)).setAttribute(eq("chatbotHistory"), any());
        assertFalse(history.isEmpty());
    }

    @Test
    @DisplayName("streamResponse xu ly ma loi HTTP khac 200 tu Gemini")
    void testStreamResponse_HttpError() throws Exception {
        HttpResponse<java.io.InputStream> mockStreamResponse = mock(HttpResponse.class);
        when(mockStreamResponse.statusCode()).thenReturn(400);

        doReturn(mockStreamResponse).when(mockHttpClient).send(any(HttpRequest.class), any());

        SseEmitter emitter = mock(SseEmitter.class);
        jakarta.servlet.http.HttpSession session = mock(jakarta.servlet.http.HttpSession.class);

        geminiService.streamResponse(List.of(Map.of("role", "user")), new java.util.ArrayList<>(), session, emitter);

        verify(emitter, timeout(3000)).complete();
        verify(emitter, atLeastOnce()).send(any(SseEmitter.SseEventBuilder.class));
    }

    @Test
    @DisplayName("streamResponse bat ngoai le ket noi va goi completeWithError")
    void testStreamResponse_Exception() throws Exception {
        when(mockHttpClient.send(any(HttpRequest.class), any())).thenThrow(new IOException("Stream connection failed"));

        SseEmitter emitter = mock(SseEmitter.class);
        jakarta.servlet.http.HttpSession session = mock(jakarta.servlet.http.HttpSession.class);

        geminiService.streamResponse(List.of(Map.of("role", "user")), new java.util.ArrayList<>(), session, emitter);

        verify(emitter, timeout(3000)).completeWithError(any());
    }
}
