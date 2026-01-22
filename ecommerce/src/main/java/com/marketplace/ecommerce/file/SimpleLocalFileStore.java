package com.marketplace.ecommerce.file;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;

@Component
public class SimpleLocalFileStore {
    private final Path baseDir;

    public SimpleLocalFileStore(@Value("${kyc.upload.dir:uploads/kyc}") String dir) {
        this.baseDir = Paths.get(dir);
    }

    public String saveAndGetSha256(MultipartFile file) {
        try {
            if (file == null || file.isEmpty()) {
                throw new IllegalArgumentException("file is empty");
            }
            Files.createDirectories(baseDir);

            // Compute SHA-256
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            try (InputStream in = file.getInputStream()) {
                byte[] buf = new byte[8192];
                int n;
                while ((n = in.read(buf)) > 0) {
                    md.update(buf, 0, n);
                }
            }
            String hash = toHex(md.digest());

            // Save file to disk (name by hash)
            String ext = safeExt(file.getOriginalFilename());
            Path target = baseDir.resolve(hash + ext);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            return hash;
        } catch (Exception e) {
            throw new RuntimeException("Cannot store KYC file: " + e.getMessage(), e);
        }
    }

    private static String toHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) sb.append(String.format("%02x", b));
        return sb.toString();
    }

    private static String safeExt(String name) {
        if (name == null) return "";
        int idx = name.lastIndexOf('.');
        if (idx < 0) return "";
        String ext = name.substring(idx).toLowerCase();
        // allowlist minimal
        if (ext.equals(".jpg") || ext.equals(".jpeg") || ext.equals(".png") || ext.equals(".pdf")) return ext;
        return "";
    }
}
