package com.marketplace.ecommerce.chatbot.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiCompletionClientTest {

    private AiCompletionClient client;

    @Mock
    private HttpClient mockHttpClient;

    @Mock
    private HttpResponse<String> mockResponse;

    @BeforeEach
    void setUp() {
        client = new AiCompletionClient();
        ReflectionTestUtils.setField(client, "baseUrl", "https://api.openai.com/v1");
        ReflectionTestUtils.setField(client, "apiKey", "sk-test-12345");
        ReflectionTestUtils.setField(client, "model", "gpt-4o-mini");
        ReflectionTestUtils.setField(client, "httpClient", mockHttpClient);
    }

    @Test
    @DisplayName("complete ném lỗi khi apiKey chưa được cấu hình")
    void testComplete_MissingApiKey() {
        ReflectionTestUtils.setField(client, "apiKey", "");
        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> client.complete(Map.of()));
        assertTrue(ex.getMessage().contains("chưa được cấu hình"));
    }

    @Test
    @DisplayName("complete gọi HTTP thành công và trích xuất choices[0].message")
    void testComplete_Success() throws Exception {
        String responseBody = """
                {
                    "choices": [
                        {
                            "message": {
                                "role": "assistant",
                                "content": "Hello world from AI"
                            }
                        }
                    ]
                }
                """;
        when(mockResponse.statusCode()).thenReturn(200);
        when(mockResponse.body()).thenReturn(responseBody);
        doReturn(mockResponse).when(mockHttpClient).send(any(HttpRequest.class), any());

        JsonNode result = client.complete(Map.of("prompt", "hi"));
        assertNotNull(result);
        assertEquals("assistant", result.path("role").asText());
        assertEquals("Hello world from AI", result.path("content").asText());
    }

    @Test
    @DisplayName("complete ném lỗi khi HTTP trả về status khác 200")
    void testComplete_HttpError() throws Exception {
        when(mockResponse.statusCode()).thenReturn(400);
        when(mockResponse.body()).thenReturn("Bad Request");
        doReturn(mockResponse).when(mockHttpClient).send(any(HttpRequest.class), any());

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> client.complete(Map.of()));
        assertTrue(ex.getMessage().contains("AI API trả về lỗi 400"));
    }

    @Test
    @DisplayName("complete xử lý ngoại lệ mạng khi gọi AI")
    void testComplete_NetworkException() throws Exception {
        when(mockHttpClient.send(any(HttpRequest.class), any())).thenThrow(new IOException("Connection timed out"));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> client.complete(Map.of()));
        assertTrue(ex.getMessage().contains("Không gọi được AI"));
    }
}
