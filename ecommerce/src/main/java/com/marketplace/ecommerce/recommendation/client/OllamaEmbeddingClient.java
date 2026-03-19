package com.marketplace.ecommerce.recommendation.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;

/**
 * Gọi Ollama API /api/embeddings (model nomic-embed-text).
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class OllamaEmbeddingClient {

    @Value("${app.ollama.base-url:http://localhost:11434}")
    private String baseUrl;

    @Value("${app.ollama.embed-model:nomic-embed-text}")
    private String embedModel;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Trả về vector embedding cho text. Trả về null nếu Ollama không phản hồi.
     */
    public float[] embed(String text) {
        if (text == null || text.isBlank()) return null;
        String url = baseUrl + "/api/embeddings";
        Request body = new Request(embedModel, text.trim());
        try {
            ResponseEntity<Response> resp = restTemplate.postForEntity(url, body, Response.class);
            if (resp.getBody() != null && resp.getBody().embedding != null) {
                List<Double> list = resp.getBody().embedding;
                float[] out = new float[list.size()];
                for (int i = 0; i < list.size(); i++) out[i] = list.get(i).floatValue();
                return out;
            }
        } catch (Exception e) {
            log.warn("Ollama embedding failed for text length {}: {}", text.length(), e.getMessage());
        }
        return null;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Request {
        private String model;
        private String prompt;
        public Request(String model, String prompt) { this.model = model; this.prompt = prompt; }
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Response {
        @JsonProperty("embedding")
        private List<Double> embedding;
    }
}
