package com.marketplace.ecommerce.product.validate;

import com.marketplace.ecommerce.common.exception.CustomException;
import com.marketplace.ecommerce.product.dto.request.ProductVariantRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class ProductValidation {

    public void validateVariants(List<ProductVariantRequest> variants) {
        if (variants == null || variants.isEmpty()) {
            return;
        }

        Set<String> seenCombinations = new HashSet<>();
        for (int i = 0; i < variants.size(); i++) {
            ProductVariantRequest v = variants.get(i);
            String color = v.getColor() != null ? v.getColor().trim() : "";
            String size = v.getSize() != null ? v.getSize().trim() : "";

            if (color.isEmpty() && size.isEmpty()) {
                throw new CustomException("Phân loại hàng thứ " + (i + 1) + " không được để trống cả 2 thuộc tính.");
            }

            if (v.getPrice() == null || v.getPrice().doubleValue() < 0) {
                throw new CustomException("Giá bán của phân loại hàng thứ " + (i + 1) + " phải lớn hơn hoặc bằng 0.");
            }

            if (v.getStock() == null || v.getStock() < 0) {
                throw new CustomException("Số lượng tồn kho của phân loại hàng thứ " + (i + 1) + " không được âm.");
            }

            String key = color.toLowerCase() + "___" + size.toLowerCase();
            if (!seenCombinations.add(key)) {
                String label = (!color.isEmpty() && !size.isEmpty()) ? (color + " - " + size) : (!color.isEmpty() ? color : size);
                throw new CustomException("Phát hiện phân loại hàng bị trùng lặp: '" + label + "'. Mỗi phân loại hàng phải có ít nhất một thuộc tính khác biệt.");
            }
        }
    }
}
