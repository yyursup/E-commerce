package com.marketplace.ecommerce.chatbot.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping(version = "1", path = "/chat")
public class UploadFileChatController {

    private static final Path CHAT_UPLOAD_DIR = Paths.get("uploads/chat");

    @PostMapping("/upload")
    public Map<String, String> uploadImage(
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request
    ) throws IOException {

        String fileName =
                UUID.randomUUID() + "_" + file.getOriginalFilename();

        if (!Files.exists(CHAT_UPLOAD_DIR)) {
            Files.createDirectories(CHAT_UPLOAD_DIR);
        }

        Path filePath = CHAT_UPLOAD_DIR.resolve(fileName);

        Files.copy(
                file.getInputStream(),
                filePath,
                StandardCopyOption.REPLACE_EXISTING
        );

        String imageUrl = ServletUriComponentsBuilder.fromRequestUri(request)
                .replacePath(null)
                .pathSegment("api", "v1", "chat", "uploads", fileName)
                .build()
                .encode()
                .toUriString();

        return Map.of("url", imageUrl);
    }

    @GetMapping("/uploads/{fileName:.+}")
    public ResponseEntity<Resource> viewImage(@PathVariable String fileName) throws IOException {
        Path filePath = CHAT_UPLOAD_DIR.resolve(fileName).normalize();
        Path uploadRoot = CHAT_UPLOAD_DIR.toAbsolutePath().normalize();

        if (!filePath.toAbsolutePath().startsWith(uploadRoot) || !Files.exists(filePath)) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new UrlResource(filePath.toUri());
        String contentType = Files.probeContentType(filePath);

        return ResponseEntity.ok()
                .contentType(contentType != null ? MediaType.parseMediaType(contentType) : MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }
}
