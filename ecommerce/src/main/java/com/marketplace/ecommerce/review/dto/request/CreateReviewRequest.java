package com.marketplace.ecommerce.review.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Data
public class CreateReviewRequest {

    private UUID subOrderId;

    @NotNull(message = "Vui lòng đánh giá từ 1 đến 5 sao")
    @Min(1) @Max(5)
    private Integer rating;

    @Size(max = 2000, message = "Nội dung quá dài")
    private String comment;

    private List<MultipartFile> images;
    private List<MultipartFile> videos;
}