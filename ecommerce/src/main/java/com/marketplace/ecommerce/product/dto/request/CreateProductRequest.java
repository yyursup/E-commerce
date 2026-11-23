package com.marketplace.ecommerce.product.dto.request;

import com.marketplace.ecommerce.product.valueObjects.ConditionGrade;
import com.marketplace.ecommerce.product.valueObjects.WarrantyType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateProductRequest {

    @NotBlank(message = "Vui lòng nhập tên sản phẩm")
    @Size(max = 255, message = "Tên sản phẩm tối đa 255 ký tự")
    private String name;

    @Size(max = 5000, message = "Mô tả tối đa 5000 ký tự")
    private String description;

    @NotBlank(message = "Vui lòng nhập mã SKU")
    @Size(max = 100, message = "Mã SKU tối đa 100 ký tự")
    private String sku;

    @NotNull(message = "Vui lòng nhập giá gốc")
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá gốc phải lớn hơn 0")
    @Digits(integer = 10, fraction = 2, message = "Giá gốc không đúng định dạng")
    private BigDecimal basePrice;

    @NotNull(message = "Vui lòng nhập số lượng tồn kho")
    @Min(value = 0, message = "Số lượng tồn kho phải từ 0 trở lên")
    private Integer stockQuantity;

    private ConditionGrade conditionGrade = ConditionGrade.GRADE_NEW;

    private WarrantyType warrantyType = WarrantyType.OFFICIAL;

    private Integer warrantyMonths = 12;

    private Integer batteryHealth;

    private Boolean isRepaired = false;

    private String repairDetails;

    private String specifications;

    @Valid
    private List<ProductImageRequest> images;

    @NotNull(message = "Vui lòng chọn danh mục") // FIX: UUID uses NotNull
    private UUID categoryId;

    @Valid
    private List<ProductVariantRequest> variants;
}
