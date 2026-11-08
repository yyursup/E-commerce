package com.marketplace.ecommerce.wallet.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminReviewWithdrawalRequest {

    @Size(max = 100, message = "Mã giao dịch ngân hàng tối đa 100 ký tự")
    private String bankTxNo;

    @Size(max = 500, message = "Ghi chú tối đa 500 ký tự")
    private String note;
}

