package com.marketplace.ecommerce.chatbot.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

/** Gọi POST {base-url}/chat/completions theo chuẩn OpenAI (Gemini, RadoxAI, DeepSeek... đều dùng được). */
@Component
@Slf4j
public class AiCompletionClient {

    @Value("${ai.base-url}")
    private String baseUrl;

    @Value("${ai.api-key}")
    private String apiKey;

    @Value("${ai.model}")
    private String model;

    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /** Trả về choices[0].message; ném IllegalStateException (có mã HTTP) khi chưa cấu hình hoặc API lỗi. */
    public JsonNode complete(Map<String, Object> body) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("AI API key chưa được cấu hình");
        }
        Map<String, Object> payload = new LinkedHashMap<>(body);
        payload.put("model", model);
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl.replaceAll("/+$", "") + "/chat/completions"))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .timeout(Duration.ofSeconds(90))
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            // nhà cung cấp phía sau (nhất là model free trên OpenRouter) hay lỗi 5xx thoáng qua -> thử lại tối đa 2 lần
            for (int retry = 1; retry <= 2 && response.statusCode() >= 500; retry++) {
                log.warn("AI API {} (model={}), thử lại lần {}", response.statusCode(), model, retry);
                Thread.sleep(1000L * retry);
                response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            }
            if (response.statusCode() != 200) {
                log.error("AI API error: model={}, status={}, body={}", model, response.statusCode(), response.body());
                throw new IllegalStateException("AI API trả về lỗi " + response.statusCode());
            }
            return objectMapper.readTree(response.body()).path("choices").path(0).path("message");
        } catch (IllegalStateException e) {
            throw e;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Gọi AI bị gián đoạn", e);
        } catch (Exception e) {
            throw new IllegalStateException("Không gọi được AI: " + e.getMessage(), e);
        }
    }
}
