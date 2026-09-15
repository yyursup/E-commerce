package com.marketplace.ecommerce.voucher.dto;

import com.marketplace.ecommerce.voucher.entity.UserVoucher;
import com.marketplace.ecommerce.voucher.valueObjects.UserVoucherStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserVoucherResponse {

    private UUID id;
    private VoucherResponse voucher;
    private UserVoucherStatus status;
    private UUID orderId;
    private LocalDateTime claimedAt;
    private LocalDateTime usedAt;

    public static UserVoucherResponse from(UserVoucher uv) {
        if (uv == null) return null;
        VoucherResponse vResp = VoucherResponse.from(uv.getVoucher());
        if (vResp != null) {
            vResp.setClaimed(true);
        }
        return UserVoucherResponse.builder()
                .id(uv.getId())
                .voucher(vResp)
                .status(uv.getStatus())
                .orderId(uv.getOrder() != null ? uv.getOrder().getId() : null)
                .claimedAt(uv.getClaimedAt())
                .usedAt(uv.getUsedAt())
                .build();
    }
}
