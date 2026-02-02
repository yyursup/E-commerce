package com.marketplace.ecommerce.kyc.valueObjects;

public record FaceLivenessResult(boolean isLive,
                                 String liveness,
                                 String livenessMsg) {
}
