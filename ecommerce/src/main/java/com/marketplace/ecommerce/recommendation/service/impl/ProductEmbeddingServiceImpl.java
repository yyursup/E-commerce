package com.marketplace.ecommerce.recommendation.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketplace.ecommerce.product.entity.Product;
import com.marketplace.ecommerce.product.repository.ProductRepository;
import com.marketplace.ecommerce.recommendation.client.OllamaEmbeddingClient;
import com.marketplace.ecommerce.recommendation.entity.ProductEmbedding;
import com.marketplace.ecommerce.recommendation.repository.ProductEmbeddingRepository;
import com.marketplace.ecommerce.recommendation.service.ProductEmbeddingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class ProductEmbeddingServiceImpl implements ProductEmbeddingService {

    private static final int MAX_TEXT_LENGTH = 8000;

    private final OllamaEmbeddingClient embeddingClient;
    private final ProductEmbeddingRepository embeddingRepository;
    private final ProductRepository productRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    @Transactional
    public void ensureEmbedding(UUID productId) {
        Optional<Product> opt = productRepository.findPublishedByIdWithDetails(productId);
        if (opt.isEmpty()) return;
        float[] vec = getOrComputeEmbedding(opt.get());
        if (vec != null) {
            saveEmbedding(productId, vec);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public float[] getOrComputeEmbedding(Product product) {
        Optional<ProductEmbedding> existing = embeddingRepository.findByProductId(product.getId());
        if (existing.isPresent()) {
            return parseEmbeddingJson(existing.get().getEmbeddingJson());
        }
        String text = buildProductText(product);
        float[] vec = embeddingClient.embed(text);
        if (vec != null) {
            saveEmbedding(product.getId(), vec);
        }
        return vec;
    }

    @Override
    @Transactional(readOnly = true)
    public float[] getStoredEmbedding(UUID productId) {
        return embeddingRepository.findByProductId(productId)
                .map(pe -> parseEmbeddingJson(pe.getEmbeddingJson()))
                .orElse(null);
    }

    private String buildProductText(Product product) {
        String name = product.getName() != null ? product.getName() : "";
        String desc = product.getDescription() != null ? product.getDescription() : "";
        String combined = (name + " " + desc).trim();
        if (combined.length() > MAX_TEXT_LENGTH) {
            combined = combined.substring(0, MAX_TEXT_LENGTH);
        }
        return combined.isEmpty() ? name : combined;
    }

    private void saveEmbedding(UUID productId, float[] vec) {
        String json = toEmbeddingJson(vec);
        ProductEmbedding pe = embeddingRepository.findByProductId(productId)
                .orElse(ProductEmbedding.builder().productId(productId).build());
        pe.setEmbeddingJson(json);
        pe.setUpdatedAt(LocalDateTime.now());
        embeddingRepository.save(pe);
    }

    private String toEmbeddingJson(float[] vec) {
        try {
            List<Float> list = new java.util.ArrayList<>();
            for (float v : vec) list.add(v);
            return objectMapper.writeValueAsString(list);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize embedding", e);
        }
    }

    private float[] parseEmbeddingJson(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            List<Double> list = objectMapper.readValue(json, new TypeReference<>() {});
            float[] out = new float[list.size()];
            for (int i = 0; i < list.size(); i++) out[i] = list.get(i).floatValue();
            return out;
        } catch (JsonProcessingException e) {
            log.warn("Failed to parse embedding json: {}", e.getMessage());
            return null;
        }
    }
}
