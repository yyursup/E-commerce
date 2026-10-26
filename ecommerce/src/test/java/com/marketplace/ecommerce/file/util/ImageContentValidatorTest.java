package com.marketplace.ecommerce.file.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.zip.CRC32;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Unit Tests: ImageContentValidator Memory Safety & Dimension Checks")
class ImageContentValidatorTest {

    @Test
    @DisplayName("1. Ảnh PNG hợp lệ (kích thước an toàn): chấp nhận")
    void validPng_accepted() {
        MockMultipartFile file = createValidPng(100, 100);
        assertTrue(ImageContentValidator.isValidImage(file));
    }

    @Test
    @DisplayName("2. Ảnh JPEG hợp lệ (kích thước an toàn): chấp nhận")
    void validJpeg_accepted() {
        MockMultipartFile file = createValidJpeg(100, 100);
        assertTrue(ImageContentValidator.isValidImage(file));
    }

    @Test
    @DisplayName("3. File null hoặc empty: từ chối")
    void nullOrEmpty_rejected() {
        assertFalse(ImageContentValidator.isValidImage(null));
        assertFalse(ImageContentValidator.isValidImage(new MockMultipartFile("f", "empty.png", "image/png", new byte[0])));
    }

    @Test
    @DisplayName("4. Content-Type và Extension không khớp: từ chối")
    void mismatchedContentTypeOrExtension_rejected() {
        // Đuôi .jpg nhưng Content-Type image/png
        MockMultipartFile file1 = new MockMultipartFile("f", "test.jpg", "image/png", new byte[100]);
        assertFalse(ImageContentValidator.isValidImage(file1));

        // Đuôi .png nhưng Content-Type image/jpeg
        MockMultipartFile file2 = new MockMultipartFile("f", "test.png", "image/jpeg", new byte[100]);
        assertFalse(ImageContentValidator.isValidImage(file2));

        // Content-Type lạ (image/webp)
        MockMultipartFile file3 = new MockMultipartFile("f", "test.webp", "image/webp", new byte[100]);
        assertFalse(ImageContentValidator.isValidImage(file3));
    }

    @Test
    @DisplayName("5. Khai báo JPEG nhưng magic bytes là PNG (mismatched binary): từ chối")
    void declaredJpeg_actualPngBinary_rejected() {
        MockMultipartFile file = createMismatchedJpegFile();
        assertFalse(ImageContentValidator.isValidImage(file));
    }

    @Test
    @DisplayName("6. File giả dạng (text giả image): từ chối")
    void fakeTextHeader_rejected() {
        MockMultipartFile file = new MockMultipartFile(
                "f", "fake.png", "image/png",
                "NOT_AN_IMAGE_HEADER_STRING_AT_ALL".getBytes(StandardCharsets.UTF_8)
        );
        assertFalse(ImageContentValidator.isValidImage(file));
    }

    @Test
    @DisplayName("7. Ảnh PNG có width vượt 8000 pixel: từ chối từ metadata TRƯỚC KHI giải mã raster (chống OOM)")
    void pngWidthExceedsLimit_rejectedFromMetadata() {
        // Tạo file PNG chỉ 57 bytes nhưng IHDR khai báo width = 8001, height = 10
        MockMultipartFile file = createCustomDimensionPng(8001, 10);
        assertFalse(ImageContentValidator.isValidImage(file));
    }

    @Test
    @DisplayName("8. Ảnh PNG có height vượt 8000 pixel: từ chối từ metadata TRƯỚC KHI giải mã raster (chống OOM)")
    void pngHeightExceedsLimit_rejectedFromMetadata() {
        // Tạo file PNG chỉ 57 bytes nhưng IHDR khai báo width = 10, height = 8001
        MockMultipartFile file = createCustomDimensionPng(10, 8001);
        assertFalse(ImageContentValidator.isValidImage(file));
    }

    @Test
    @DisplayName("9. Ảnh PNG có width và height <= 8000 nhưng tổng số pixel vượt 25 triệu: từ chối chống Decompression Bomb")
    void pngTotalPixelsExceedsLimit_rejectedFromMetadata() {
        // 6000 x 5000 = 30.000.000 pixels (> 25.000.000 limit)
        // File chỉ tốn 57 bytes metadata, không cấp phát raster trong JVM heap
        MockMultipartFile file = createCustomDimensionPng(6000, 5000);
        assertFalse(ImageContentValidator.isValidImage(file));
    }

    @Test
    @DisplayName("10. Ảnh PNG có width hoặc height <= 0: từ chối an toàn")
    void pngZeroOrNegativeDimension_rejected() {
        MockMultipartFile file = createCustomDimensionPng(0, 100);
        assertFalse(ImageContentValidator.isValidImage(file));
    }

    @Test
    @DisplayName("11. Ảnh PNG hỏng / cụt file (malformed/truncated): từ chối an toàn không làm crash ứng dụng")
    void pngMalformedData_rejectedSafely() {
        byte[] malformed = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00};
        MockMultipartFile file = new MockMultipartFile("f", "broken.png", "image/png", malformed);
        assertFalse(ImageContentValidator.isValidImage(file));
    }

    // =========================================================================
    // HELPER METHODS TẠO DỮ LIỆU TEST
    // =========================================================================

    private static MockMultipartFile createValidPng(int width, int height) {
        try {
            BufferedImage img = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(img, "png", baos);
            return new MockMultipartFile("files", "valid.png", "image/png", baos.toByteArray());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private static MockMultipartFile createValidJpeg(int width, int height) {
        try {
            BufferedImage img = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(img, "jpg", baos);
            return new MockMultipartFile("files", "valid.jpg", "image/jpeg", baos.toByteArray());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private static MockMultipartFile createMismatchedJpegFile() {
        try {
            // Nội dung là PNG nhưng khai báo image/jpeg và test.jpg
            BufferedImage img = new BufferedImage(10, 10, BufferedImage.TYPE_INT_RGB);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(img, "png", baos);
            return new MockMultipartFile("files", "test.jpg", "image/jpeg", baos.toByteArray());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Tạo file PNG hợp lệ về cấu trúc header và IHDR chunk với kích thước tùy ý,
     * chỉ tốn 57 bytes bộ nhớ, không cần cấp phát raster bitmap.
     */
    private static MockMultipartFile createCustomDimensionPng(int width, int height) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            // PNG signature (8 bytes)
            baos.write(new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A});

            // IHDR length: 13 bytes
            baos.write(new byte[]{0, 0, 0, 13});

            ByteArrayOutputStream ihdr = new ByteArrayOutputStream();
            ihdr.write("IHDR".getBytes(StandardCharsets.US_ASCII));
            ihdr.write((width >> 24) & 0xFF);
            ihdr.write((width >> 16) & 0xFF);
            ihdr.write((width >> 8) & 0xFF);
            ihdr.write(width & 0xFF);

            ihdr.write((height >> 24) & 0xFF);
            ihdr.write((height >> 16) & 0xFF);
            ihdr.write((height >> 8) & 0xFF);
            ihdr.write(height & 0xFF);

            // Bit depth 8, Color type 2 (RGB), Compression 0, Filter 0, Interlace 0
            ihdr.write(new byte[]{8, 2, 0, 0, 0});

            byte[] ihdrBytes = ihdr.toByteArray();
            baos.write(ihdrBytes);

            CRC32 crc = new CRC32();
            crc.update(ihdrBytes);
            long crcVal = crc.getValue();
            baos.write((int) ((crcVal >> 24) & 0xFF));
            baos.write((int) ((crcVal >> 16) & 0xFF));
            baos.write((int) ((crcVal >> 8) & 0xFF));
            baos.write((int) (crcVal & 0xFF));

            // IEND chunk
            baos.write(new byte[]{0, 0, 0, 0});
            baos.write("IEND".getBytes(StandardCharsets.US_ASCII));
            CRC32 endCrc = new CRC32();
            endCrc.update("IEND".getBytes(StandardCharsets.US_ASCII));
            long endCrcVal = endCrc.getValue();
            baos.write((int) ((endCrcVal >> 24) & 0xFF));
            baos.write((int) ((endCrcVal >> 16) & 0xFF));
            baos.write((int) ((endCrcVal >> 8) & 0xFF));
            baos.write((int) (endCrcVal & 0xFF));

            return new MockMultipartFile("files", "custom.png", "image/png", baos.toByteArray());
        } catch (Exception e) {
            throw new RuntimeException("Lỗi tạo PNG metadata tùy biến", e);
        }
    }
}
