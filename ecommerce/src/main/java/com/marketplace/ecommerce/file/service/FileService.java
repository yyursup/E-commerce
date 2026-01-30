package com.marketplace.ecommerce.file.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;

public interface FileService {

    String uploadFile(MultipartFile file, String folder);

    String uploadFile(MultipartFile file);

    InputStream downloadFile(String fileName);

    void deleteFile(String fileName);

    String getFileUrl(String fileName);

    boolean fileExists(String fileName);
}
