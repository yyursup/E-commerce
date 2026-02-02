package com.marketplace.ecommerce.request.dto.response;

import com.marketplace.ecommerce.request.valueObjects.TargetType;
import lombok.*;

import java.util.UUID;
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportDetailsResponse {
    private TargetType targetType;
    private UUID targetId;
    private String evidenceUrl;
    private String moderatorNote;
}
