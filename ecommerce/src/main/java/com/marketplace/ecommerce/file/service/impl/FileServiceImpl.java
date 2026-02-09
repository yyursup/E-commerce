package com.marketplace.ecommerce.file.service.impl;

import com.marketplace.ecommerce.config.MinIOConfig;
import com.marketplace.ecommerce.file.service.FileService;
import io.minio.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileServiceImpl implements FileService {

    private final MinioClient minioClient;
    private final MinIOConfig minIOConfig;

    @Override
    public String uploadFile(MultipartFile file, String folder) {
        try {
            // Validate file
            if (file.isEmpty()) {
                throw new IllegalArgumentException("File is empty");
            }

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String fileName = folder + "/" + UUID.randomUUID() + extension;

            // Upload to MinIO
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(minIOConfig.getBucketName())
                            .object(fileName)
                            .stream(file.getInputStream(), file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build()
            );

            log.info("File uploaded successfully: {}", fileName);
            return fileName;
        } catch (Exception e) {
            log.error("Error uploading file: {}", e.getMessage());
            throw new RuntimeException("Failed to upload file: " + e.getMessage(), e);
        }
    }

    @Override
    public String uploadFile(MultipartFile file) {
        return uploadFile(file, "uploads");
    }

    @Override
    public InputStream downloadFile(String fileName) {
        try {
            return minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(minIOConfig.getBucketName())
                            .object(fileName)
                            .build()
            );
        } catch (Exception e) {
            log.error("Error downloading file: {}", e.getMessage());
            throw new RuntimeException("Failed to download file: " + e.getMessage(), e);
        }
    }

    @Override
    public void deleteFile(String fileName) {
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(minIOConfig.getBucketName())
                            .object(fileName)
                            .build()
            );
            log.info("File deleted successfully: {}", fileName);
        } catch (Exception e) {
            log.error("Error deleting file: {}", e.getMessage());
            throw new RuntimeException("Failed to delete file: " + e.getMessage(), e);
        }
    }

    @Override
    public String getFileUrl(String fileName) {
        if (fileName == null || fileName.isEmpty()) {
            return null;
        }
        // Return public URL if bucket is public, otherwise return presigned URL
        return minIOConfig.getUrl() + "/" + minIOConfig.getBucketName() + "/" + fileName;
    }

    @Override
    public boolean fileExists(String fileName) {
        try {
            minioClient.statObject(
                    StatObjectArgs.builder()
                            .bucket(minIOConfig.getBucketName())
                            .object(fileName)
                            .build()
            );
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
