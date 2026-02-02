package com.marketplace.ecommerce.kyc.dto.request;

import com.marketplace.ecommerce.kyc.valueObjects.KycDocumentType;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.jetbrains.annotations.NotNull;

@Data
public class KycThumbnailAttachRequest {
    @NotNull
    private KycDocumentType type;

    @NotBlank
    private String fileHash;
}

