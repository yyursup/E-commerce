package com.marketplace.ecommerce.shipping.dto.response;

import lombok.Data;

@Data
public class GHNCommonResponse<T> {
    private Integer code;
    private String message;
    private T data;
}
