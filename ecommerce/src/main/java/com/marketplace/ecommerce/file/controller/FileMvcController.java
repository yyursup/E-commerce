package com.marketplace.ecommerce.file.controller;

import com.marketplace.ecommerce.file.response.FileUploadResponse;
import com.marketplace.ecommerce.file.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;

@Controller
@RequestMapping("/files")
@RequiredArgsConstructor
public class FileMvcController {

    private final FileService fileService;

    @PostMapping("/upload")
    @ResponseBody
    public ResponseEntity<FileUploadResponse> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "general") String folder) {
        
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }

            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().build();
            }

            // Validate file size (25MB)
            if (file.getSize() > 25 * 1024 * 1024) {
                return ResponseEntity.status(413).build(); // 413 Payload Too Large
            }

            // Upload file and get fileName
            String fileName = fileService.uploadFile(file, folder);
            
            // Get file URL
            String fileUrl = fileService.getFileUrl(fileName);
            
            // Create response
            FileUploadResponse response = FileUploadResponse.builder()
                    .fileName(fileName)
                    .url(fileUrl)
                    .size(file.getSize())
                    .contentType(contentType)
                    .build();
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/view/{fileName}")
    public ResponseEntity<InputStream> viewFile(@PathVariable String fileName) {
        try {
            InputStream inputStream = fileService.downloadFile(fileName);
            if (inputStream != null) {
                return ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_JPEG)
                        .body(inputStream);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/download/{fileName}")
    public ResponseEntity<InputStream> downloadFile(@PathVariable String fileName) {
        try {
            InputStream inputStream = fileService.downloadFile(fileName);
            if (inputStream != null) {
                return ResponseEntity.ok()
                        .header("Content-Disposition", "attachment; filename=\"" + fileName + "\"")
                        .body(inputStream);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
