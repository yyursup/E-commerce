package com.marketplace.ecommerce.payment.dto;

import com.marketplace.ecommerce.payment.entity.Transaction;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/**
 * Settlement breakdown derived from fintech ledger (Transaction records).
 * Source of truth: Transaction entities with referenceType=ESCROW.
 * No database schema changes required — purely a DTO projection.
 */
@Data
@Builder
public class SettlementInfo {

    public enum SettlementType {
        FULL_RELEASE, // 100% cho Seller (trừ commission)
        FULL_REFUND, // 100% cho Buyer
        PARTIAL_SPLIT // Chia % cho cả 2 bên
    }

    private SettlementType settlementType;
    private BigDecimal buyerRefundAmount;
    private BigDecimal sellerReleaseAmount;
    private BigDecimal commissionAmount;
    private BigDecimal shippingRetainedAmount;
    private BigDecimal platformSubsidyAmount;
    private Integer buyerPercentage; // % tính trên netAmount (sau commission)
    private Integer sellerPercentage; // % tính trên netAmount (sau commission)
    private String settlementNote;

    /**
     * Derives settlement info from existing Transaction records for an escrow.
     *
     * @param transactions All transactions with referenceType=ESCROW for a given
     *                     escrow ID
     * @param escrowAmount Total escrow amount (original order total held)
     * @return SettlementInfo or null if escrow has not been settled yet
     */
    public static SettlementInfo fromTransactions(List<Transaction> transactions, BigDecimal escrowAmount) {
        if (transactions == null || transactions.isEmpty()) {
            return null;
        }

        BigDecimal refundTotal = BigDecimal.ZERO;
        BigDecimal releaseTotal = BigDecimal.ZERO;
        BigDecimal commissionTotal = BigDecimal.ZERO;
        BigDecimal shippingRetainedTotal = BigDecimal.ZERO;
        BigDecimal subsidyTotal = BigDecimal.ZERO;
        String refundNote = null;
        String releaseNote = null;
        boolean hasReleaseTx = false;
        boolean hasRefundTx = false;

        for (Transaction tx : transactions) {
            if (tx.getType() == null)
                continue;
            switch (tx.getType()) {
                case REFUND -> {
                    hasRefundTx = true;
                    refundTotal = refundTotal.add(tx.getAmount() != null ? tx.getAmount() : BigDecimal.ZERO);
                    if (tx.getNote() != null)
                        refundNote = tx.getNote();
                }
                case RELEASE -> {
                    hasReleaseTx = true;
                    releaseTotal = releaseTotal.add(tx.getAmount() != null ? tx.getAmount() : BigDecimal.ZERO);
                    if (tx.getNote() != null)
                        releaseNote = tx.getNote();
                }
                case COMMISSION -> commissionTotal = commissionTotal.add(tx.getAmount() != null ? tx.getAmount() : BigDecimal.ZERO);

                case TRANSFER -> {
                    if (tx.getNote() != null && tx.getNote().toLowerCase().contains("shipping")) {
                        shippingRetainedTotal = shippingRetainedTotal.add(tx.getAmount() != null ? tx.getAmount() : BigDecimal.ZERO);
                    } else if (tx.getNote() != null && (tx.getNote().toLowerCase().contains("subsidy") || tx.getNote().toLowerCase().contains("voucher"))) {
                        subsidyTotal = subsidyTotal.add(tx.getAmount() != null ? tx.getAmount() : BigDecimal.ZERO);
                    }
                }

                default -> {
                    /* HOLD and other types are not settlement transactions */ }
            }
        }

        boolean hasRefund = refundTotal.signum() > 0 || hasRefundTx;
        boolean hasRelease = releaseTotal.signum() > 0 || hasReleaseTx;

        if (!hasRefund && !hasRelease) {
            return null; // Chưa settlement (chỉ có HOLD/COMMISSION)
        }

        // Net amount = escrow total - commission - shippingRetained + platformSubsidy (số tiền thực tế được phân chia giữa Buyer và Seller)
        BigDecimal netAmount = (escrowAmount != null ? escrowAmount : BigDecimal.ZERO)
                .subtract(commissionTotal)
                .subtract(shippingRetainedTotal)
                .add(subsidyTotal);
        if (netAmount.signum() <= 0) {
            netAmount = refundTotal.add(releaseTotal); // fallback
        }

        SettlementType type;
        if (hasRefund && hasRelease) {
            type = SettlementType.PARTIAL_SPLIT;
        } else if (hasRefund) {
            type = SettlementType.FULL_REFUND;
        } else {
            type = SettlementType.FULL_RELEASE;
        }

        // Tính percentage dựa trên netAmount (số tiền sau commission & shipping)
        int buyerPct = 0;
        int sellerPct = 0;
        if (netAmount.signum() > 0) {
            buyerPct = refundTotal.multiply(BigDecimal.valueOf(100))
                    .divide(netAmount, 0, RoundingMode.HALF_UP)
                    .intValue();
            sellerPct = 100 - buyerPct; // Đảm bảo tổng = 100%
        } else if (hasRefund) {
            buyerPct = 100;
        } else {
            sellerPct = 100;
        }

        // Compose note from transaction notes
        String note;
        if (type == SettlementType.PARTIAL_SPLIT) {
            // Ưu tiên note từ REFUND vì nó thường chứa "Admin phân chia..."
            note = refundNote;
        } else if (hasRefund) {
            note = refundNote;
        } else {
            note = releaseNote;
        }

        return SettlementInfo.builder()
                .settlementType(type)
                .buyerRefundAmount(refundTotal)
                .sellerReleaseAmount(releaseTotal)
                .commissionAmount(commissionTotal)
                .shippingRetainedAmount(shippingRetainedTotal)
                .platformSubsidyAmount(subsidyTotal)
                .buyerPercentage(buyerPct)
                .sellerPercentage(sellerPct)
                .settlementNote(note)
                .build();
    }
}
