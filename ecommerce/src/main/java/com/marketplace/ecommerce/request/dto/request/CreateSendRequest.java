package com.marketplace.ecommerce.request.dto.request;

import com.marketplace.ecommerce.request.valueObjects.RequestType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSendRequest {
    private RequestType requestType;
    private String description;
    private String coverImage;
}
