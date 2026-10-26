package com.marketplace.ecommerce.file.service.impl;

import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.marketplace.ecommerce.config.MinIOConfig;
import io.minio.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class FileServiceImplTest {

    @Mock
    private MinioClient minioClient;
    @Mock
    private MinIOConfig minIOConfig;

    @InjectMocks
    private FileServiceImpl fileService;

    @BeforeEach
    void setUp() {
        lenient().when(minIOConfig.getBucketName()).thenReturn("test-bucket");
        lenient().when(minIOConfig.getUrl()).thenReturn("http://localhost:9000");
    }

    @Test
    @DisplayName("uploadFile tải file lên MinIO với thư mục chỉ định hoặc mặc định")
    void testUploadFile_Success() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "avatar.png", "image/png", "png-data".getBytes());

        String path1 = fileService.uploadFile(file, "avatars");
        assertTrue(path1.startsWith("avatars/"));
        assertTrue(path1.endsWith(".png"));

        String path2 = fileService.uploadFile(file);
        assertTrue(path2.startsWith("uploads/"));

        verify(minioClient, times(2)).putObject(any(PutObjectArgs.class));
    }

    @Test
    @DisplayName("uploadFile: file không có extension hoặc filename null")
    void testUploadFile_NoExtensionOrNullName() throws Exception {
        // file không có dấu chấm
        MockMultipartFile noExtFile = new MockMultipartFile("file", "filenoext", "application/octet-stream", "data".getBytes());
        String path1 = fileService.uploadFile(noExtFile, "docs");
        assertTrue(path1.startsWith("docs/"));

        // file getOriginalFilename null
        MultipartFile mockFileNull = mock(MultipartFile.class);
        when(mockFileNull.isEmpty()).thenReturn(false);
        when(mockFileNull.getOriginalFilename()).thenReturn(null);
        when(mockFileNull.getInputStream()).thenReturn(new java.io.ByteArrayInputStream("data".getBytes()));
        when(mockFileNull.getSize()).thenReturn(4L);
        when(mockFileNull.getContentType()).thenReturn("application/octet-stream");

        String path2 = fileService.uploadFile(mockFileNull, "docs");
        assertTrue(path2.startsWith("docs/"));
    }

    @Test
    @DisplayName("uploadFile ném lỗi khi file rỗng hoặc MinIO lỗi")
    void testUploadFile_Errors() throws Exception {
        MockMultipartFile emptyFile = new MockMultipartFile("file", "empty.txt", "text/plain", new byte[0]);
        assertThrows(RuntimeException.class, () -> fileService.uploadFile(emptyFile));

        MockMultipartFile file = new MockMultipartFile("file", "doc.pdf", "application/pdf", "data".getBytes());
        doThrow(new RuntimeException("MinIO put failure")).when(minioClient).putObject(any(PutObjectArgs.class));
        assertThrows(RuntimeException.class, () -> fileService.uploadFile(file));
    }

    @Test
    @DisplayName("downloadFile lấy InputStream từ MinIO hoặc ném lỗi")
    void testDownloadFile() throws Exception {
        GetObjectResponse mockStream = mock(GetObjectResponse.class);
        when(minioClient.getObject(any(GetObjectArgs.class))).thenReturn(mockStream);

        InputStream in = fileService.downloadFile("uploads/file.png");
        assertNotNull(in);
        verify(minioClient).getObject(any(GetObjectArgs.class));

        // Exception
        when(minioClient.getObject(any(GetObjectArgs.class))).thenThrow(new RuntimeException("MinIO get error"));
        assertThrows(RuntimeException.class, () -> fileService.downloadFile("uploads/file.png"));
    }

    @Test
    @DisplayName("deleteFile xóa file trên MinIO thành công hoặc ném lỗi")
    void testDeleteFile() throws Exception {
        fileService.deleteFile("uploads/old.png");
        verify(minioClient).removeObject(any(RemoveObjectArgs.class));

        // Exception
        doThrow(new RuntimeException("MinIO delete error")).when(minioClient).removeObject(any(RemoveObjectArgs.class));
        assertThrows(RuntimeException.class, () -> fileService.deleteFile("uploads/old.png"));
    }

    @Test
    @DisplayName("getFileUrl trả về đường dẫn public của file")
    void testGetFileUrl() {
        assertNull(fileService.getFileUrl(null));
        assertNull(fileService.getFileUrl(""));

        String url = fileService.getFileUrl("chat/test.jpg");
        assertEquals("http://localhost:9000/test-bucket/chat/test.jpg", url);
    }

    @Test
    @DisplayName("fileExists kiểm tra file có tồn tại hay không")
    void testFileExists() throws Exception {
        when(minioClient.statObject(any(StatObjectArgs.class))).thenReturn(mock(StatObjectResponse.class));
        assertTrue(fileService.fileExists("exists.jpg"));

        when(minioClient.statObject(any(StatObjectArgs.class))).thenThrow(new RuntimeException("Not found"));
        assertFalse(fileService.fileExists("missing.jpg"));
    }
}
