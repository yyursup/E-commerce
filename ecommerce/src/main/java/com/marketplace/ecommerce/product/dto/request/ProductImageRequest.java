package com.marketplace.ecommerce.product.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductImageRequest {

    private UUID id;

    @NotBlank(message = "Vui lòng nhập đường dẫn ảnh")
    @Size(max = 255, message = "Đường dẫn ảnh tối đa 255 ký tự")
    private String imageUrl;

    private Boolean isThumbnail = false;

    private Integer displayOrder = 0;
}
