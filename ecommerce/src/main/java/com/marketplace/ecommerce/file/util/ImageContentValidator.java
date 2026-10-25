package com.marketplace.ecommerce.file.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.awt.image.BufferedImage;
import java.io.InputStream;
import java.util.Iterator;

@Slf4j
public class ImageContentValidator {

    private static final byte[] JPEG_MAGIC = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] PNG_MAGIC = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};

    // Giới hạn an toàn bộ nhớ (Memory Safety):
    // Max mỗi chiều: 8000 pixel (thừa đủ cho ảnh chụp chất lượng cao 4K/6K)
    // Max tổng số pixel: 25.000.000 pixels (~100MB RAM lúc giải mã raster, an toàn tuyệt đối cho JVM heap)
    public static final int MAX_DIMENSION = 8000;
    public static final long MAX_TOTAL_PIXELS = 25_000_000L;

    /**
     * Xác minh file tải lên có thực sự là tệp hình ảnh hợp lệ hay không (chống đổi đuôi / giả mạo Content-Type / Decompression Bomb).
     * Chỉ chấp nhận JPEG và PNG.
     * Quy trình an toàn bộ nhớ:
     * 1. Kiểm tra tính nhất quán MIME type và extension.
     * 2. Kiểm tra Magic Bytes đầu tệp.
     * 3. Đọc metadata kích thước bằng ImageReader TRƯỚC KHI giải mã raster bitmap.
     * 4. Từ chối trước khi giải mã nếu chiều rộng, chiều cao hoặc tổng số pixel vượt ngưỡng an toàn.
     * 5. Giải mã kiểm tra tính toàn vẹn (không bị corrupt/malformed).
     */
    public static boolean isValidImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return false;
        }

        // 1 & 2. Kiểm tra tính nhất quán giữa Content-Type và Extension
        String contentType = file.getContentType();
        if (contentType == null) {
            return false;
        }
        String lowerContentType = contentType.toLowerCase();
        boolean isJpegType = "image/jpeg".equals(lowerContentType) || "image/jpg".equals(lowerContentType);
        boolean isPngType = "image/png".equals(lowerContentType);

        if (!isJpegType && !isPngType) {
            return false;
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            return false;
        }
        String lowerName = originalFilename.toLowerCase();
        boolean isJpegExt = lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg");
        boolean isPngExt = lowerName.endsWith(".png");

        // Từ chối nếu Content-Type và phần mở rộng không khớp nhau
        if ((isJpegType && !isJpegExt) || (isPngType && !isPngExt)) {
            return false;
        }

        // 3. Đọc magic bytes và giải mã nội dung thực tế qua ImageReader
        try (InputStream is = file.getInputStream()) {
            byte[] header = new byte[32];
            int read = is.read(header);
            if (read < 8) {
                return false;
            }

            // Nếu khai báo là JPEG, nội dung thực tế bắt buộc phải khớp Magic Bytes JPEG
            if (isJpegType) {
                if (!matchBytes(header, 0, JPEG_MAGIC)) {
                    return false;
                }
                return verifyImageDimensionsAndDecode(file, "JPEG");
            }

            // Nếu khai báo là PNG, nội dung thực tế bắt buộc phải khớp Magic Bytes PNG
            if (isPngType) {
                if (!matchBytes(header, 0, PNG_MAGIC)) {
                    return false;
                }
                return verifyImageDimensionsAndDecode(file, "PNG");
            }

            // Từ chối mọi định dạng khác (bao gồm WEBP vì hệ thống không có decoder chuyên dụng an toàn)
            return false;
        } catch (Exception e) {
            log.warn("Lỗi khi xác minh nội dung ảnh: {}", e.getMessage());
            return false;
        }
    }

    private static boolean matchBytes(byte[] source, int offset, byte[] target) {
        if (source.length < offset + target.length) {
            return false;
        }
        for (int i = 0; i < target.length; i++) {
            if (source[offset + i] != target[i]) {
                return false;
            }
        }
        return true;
    }

    /**
     * Xác minh kích thước ảnh từ metadata TRƯỚC KHI giải mã toàn bộ raster bitmap,
     * ngăn chặn triệt để tấn công Decompression Bomb / OutOfMemoryError.
     */
    private static boolean verifyImageDimensionsAndDecode(MultipartFile file, String formatName) {
        try (InputStream is = file.getInputStream();
             ImageInputStream iis = ImageIO.createImageInputStream(is)) {
            if (iis == null) {
                return false;
            }

            Iterator<ImageReader> readers = ImageIO.getImageReadersByFormatName(formatName);
            if (!readers.hasNext()) {
                readers = ImageIO.getImageReaders(iis);
            }
            if (!readers.hasNext()) {
                return false;
            }

            ImageReader reader = readers.next();
            try {
                reader.setInput(iis, true, false);

                // 1. Đọc metadata kích thước trước khi giải mã raster bitmap
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);

                if (width <= 0 || width > MAX_DIMENSION || height <= 0 || height > MAX_DIMENSION) {
                    log.warn("Ảnh {} bị từ chối do kích thước từng chiều vượt giới hạn an toàn: {}x{} (giới hạn: {}x{})",
                            file.getOriginalFilename(), width, height, MAX_DIMENSION, MAX_DIMENSION);
                    return false;
                }

                // 2. Kiểm tra tổng số pixel chống Decompression Bomb (tính bằng long để tránh integer overflow)
                long totalPixels = (long) width * (long) height;
                if (totalPixels > MAX_TOTAL_PIXELS) {
                    log.warn("Ảnh {} bị từ chối do tổng số pixel vượt ngưỡng an toàn: {} pixels (giới hạn: {} pixels)",
                            file.getOriginalFilename(), totalPixels, MAX_TOTAL_PIXELS);
                    return false;
                }

                // 3. Chỉ sau khi kích thước an toàn, mới tiến hành giải mã để kiểm tra tính toàn vẹn
                BufferedImage img = reader.read(0);
                return img != null;
            } finally {
                reader.dispose();
            }
        } catch (Exception e) {
            log.warn("Lỗi khi xác minh hoặc giải mã ảnh {}: {}", file.getOriginalFilename(), e.getMessage());
            return false;
        }
    }
}
