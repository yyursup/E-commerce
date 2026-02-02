package com.marketplace.ecommerce.shipping.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class GHNCommonResponse<T> {
    private Integer code;
    private String message;

    @JsonProperty("message_display")
    private String messageDisplay;

    @JsonProperty("code_message_value")
    private String codeMessageValue;

    private T data;
}
