package com.marketplace.ecommerce.kyc.valueObjects;

public record CardLivenessResult(boolean isReal, String liveness, String livenessMsg) {
}
