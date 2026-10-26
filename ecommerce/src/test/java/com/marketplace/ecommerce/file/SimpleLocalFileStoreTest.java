package com.marketplace.ecommerce.file;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class SimpleLocalFileStoreTest {

    @Test
    @DisplayName("saveAndGetSha256 tính mã băm SHA256 và lưu file vào thư mục")
    void testSaveAndGetSha256(@TempDir Path tempDir) {
        SimpleLocalFileStore store = new SimpleLocalFileStore(tempDir.toString());
        MockMultipartFile file = new MockMultipartFile("file", "doc.pdf", "application/pdf", "Hello World KYC".getBytes());

        String hash = store.saveAndGetSha256(file);
        assertNotNull(hash);
        assertFalse(hash.isBlank());
        // SHA256 hex string có độ dài 64 ký tự
        assertEquals(64, hash.length());
    }

    @Test
    @DisplayName("saveAndGetSha256 ném lỗi khi file rỗng")
    void testSaveAndGetSha256_Empty(@TempDir Path tempDir) {
        SimpleLocalFileStore store = new SimpleLocalFileStore(tempDir.toString());
        MockMultipartFile emptyFile = new MockMultipartFile("file", "empty.pdf", "application/pdf", new byte[0]);

        assertThrows(RuntimeException.class, () -> store.saveAndGetSha256(emptyFile));
        assertThrows(RuntimeException.class, () -> store.saveAndGetSha256(null));
    }
}
