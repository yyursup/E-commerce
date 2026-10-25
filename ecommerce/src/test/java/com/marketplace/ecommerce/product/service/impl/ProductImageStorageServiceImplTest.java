package com.marketplace.ecommerce.product.service.impl;

import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.config.MinIOConfig;
import com.marketplace.ecommerce.product.dto.response.ImageUploadResponse;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ProductImageStorageServiceImplTest {

    @Mock
    private MinioClient minioClient;
    @Mock
    private MinIOConfig minIOConfig;

    @InjectMocks
    private ProductImageStorageServiceImpl storageService;

    @BeforeEach
    void setUp() {
        lenient().when(minIOConfig.getBucketName()).thenReturn("ecommerce-bucket");
        lenient().when(minIOConfig.getUrl()).thenReturn("http://localhost:9000/");
    }

    @Test
    @DisplayName("uploadProductImage tải ảnh hợp lệ lên MinIO thành công")
    void testUploadProductImage_Success() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "image.JPG", "image/jpeg", "image-content".getBytes());

        ImageUploadResponse res = storageService.uploadProductImage(file);
        assertNotNull(res);
        assertEquals("image.JPG", res.getFileName());
        assertEquals("image/jpeg", res.getContentType());
        assertTrue(res.getImageUrl().startsWith("http://localhost:9000/ecommerce-bucket/products/"));
        verify(minioClient).putObject(any(PutObjectArgs.class));
    }

    @Test
    @DisplayName("uploadProductImage ném ngoại lệ khi file rỗng, quá dung lượng hoặc đuôi sai")
    void testUploadProductImage_ValidationFailures() {
        // File null
        assertThrows(CustomException.class, () -> storageService.uploadProductImage(null));

        // File rỗng
        MockMultipartFile emptyFile = new MockMultipartFile("file", "test.png", "image/png", new byte[0]);
        assertThrows(CustomException.class, () -> storageService.uploadProductImage(emptyFile));

        // File quá 5MB
        byte[] bigContent = new byte[6 * 1024 * 1024];
        MockMultipartFile bigFile = new MockMultipartFile("file", "large.png", "image/png", bigContent);
        assertThrows(CustomException.class, () -> storageService.uploadProductImage(bigFile));

        // Đuôi không hợp lệ (.exe)
        MockMultipartFile invalidExt = new MockMultipartFile("file", "virus.exe", "application/octet-stream", "bad".getBytes());
        assertThrows(CustomException.class, () -> storageService.uploadProductImage(invalidExt));

        // File không có extension (không có dấu chấm)
        MockMultipartFile noExt = new MockMultipartFile("file", "noextensionfile", "image/png", "content".getBytes());
        assertThrows(CustomException.class, () -> storageService.uploadProductImage(noExt));

        // Mock file getOriginalFilename null
        MultipartFile mockFileNullName = mock(MultipartFile.class);
        when(mockFileNullName.isEmpty()).thenReturn(false);
        when(mockFileNullName.getSize()).thenReturn(100L);
        when(mockFileNullName.getOriginalFilename()).thenReturn(null);
        assertThrows(CustomException.class, () -> storageService.uploadProductImage(mockFileNullName));
    }

    @Test
    @DisplayName("uploadProductImage ném ngoại lệ khi MinIO gặp sự cố upload")
    void testUploadProductImage_MinioException() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "image.png", "image/png", "image-content".getBytes());
        doThrow(new RuntimeException("MinIO upload connection failed")).when(minioClient).putObject(any(PutObjectArgs.class));

        assertThrows(CustomException.class, () -> storageService.uploadProductImage(file));
    }

    @Test
    @DisplayName("uploadMultipleProductImages tải nhiều ảnh thành công")
    void testUploadMultipleProductImages_Success() throws Exception {
        MockMultipartFile file1 = new MockMultipartFile("files", "img1.png", "image/png", "c1".getBytes());
        MockMultipartFile file2 = new MockMultipartFile("files", "img2.webp", "image/webp", "c2".getBytes());

        List<ImageUploadResponse> list = storageService.uploadMultipleProductImages(new MultipartFile[]{file1, file2});
        assertEquals(2, list.size());
        verify(minioClient, times(2)).putObject(any(PutObjectArgs.class));
    }

    @Test
    @DisplayName("uploadMultipleProductImages ném lỗi khi mảng rỗng")
    void testUploadMultipleProductImages_EmptyArray() {
        assertThrows(CustomException.class, () -> storageService.uploadMultipleProductImages(new MultipartFile[]{}));
        assertThrows(CustomException.class, () -> storageService.uploadMultipleProductImages(null));
    }

    @Test
    @DisplayName("deleteProductImage xóa ảnh khỏi MinIO theo URL")
    void testDeleteProductImage_Success() throws Exception {
        String url = "http://localhost:9000/ecommerce-bucket/products/abc-xyz.png";
        ResponseEntity<Void> res = storageService.deleteProductImage(url);
        assertEquals(HttpStatus.NO_CONTENT, res.getStatusCode());
        verify(minioClient).removeObject(any(RemoveObjectArgs.class));
    }

    @Test
    @DisplayName("deleteProductImage trả về 204 ngay nếu URL null, rỗng hoặc không chứa bucket name")
    void testDeleteProductImage_InvalidUrls() throws Exception {
        ResponseEntity<Void> res1 = storageService.deleteProductImage(null);
        assertEquals(HttpStatus.NO_CONTENT, res1.getStatusCode());

        ResponseEntity<Void> res2 = storageService.deleteProductImage("");
        assertEquals(HttpStatus.NO_CONTENT, res2.getStatusCode());

        ResponseEntity<Void> res3 = storageService.deleteProductImage("http://other.com/image.png");
        assertEquals(HttpStatus.NO_CONTENT, res3.getStatusCode());
        verify(minioClient, never()).removeObject(any());
    }

    @Test
    @DisplayName("deleteProductImage ném CustomException khi MinIO gặp sự cố xóa")
    void testDeleteProductImage_MinioException() throws Exception {
        String url = "http://localhost:9000/ecommerce-bucket/products/abc-xyz.png";
        doThrow(new RuntimeException("MinIO remove connection failed")).when(minioClient).removeObject(any(RemoveObjectArgs.class));

        assertThrows(CustomException.class, () -> storageService.deleteProductImage(url));
    }
}
