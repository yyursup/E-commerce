export function getSplitSettlementInfo({ item, returnDetails, order } = {}) {
  // 1. Kiểm tra từ item (EscrowAdminResponse)
  if (
    item?.buyerPercentage != null &&
    item?.sellerPercentage != null &&
    (item.buyerPercentage > 0 || item.sellerPercentage > 0)
  ) {
    const buyerPct = Number(item.buyerPercentage)
    const sellerPct = Number(item.sellerPercentage)
    const totalAmount = Number(item.amount || order?.total || 0)
    const commission =
      item.platformCommission != null
        ? Number(item.platformCommission)
        : (order?.platformCommission != null ? Number(order.platformCommission) : totalAmount * 0.1)
    const netAmount = Math.max(0, totalAmount - commission)
    const buyerAmount =
      item.buyerAmount != null ? Number(item.buyerAmount) : Math.round((netAmount * buyerPct) / 100)
    const sellerAmount =
      item.sellerAmount != null ? Number(item.sellerAmount) : Math.max(0, netAmount - buyerAmount)
    return {
      isSplit: buyerPct > 0 && sellerPct > 0,
      buyerPercentage: buyerPct,
      sellerPercentage: sellerPct,
      buyerAmount,
      sellerAmount,
      totalAmount,
      commission,
      note: item.settlementNote || returnDetails?.conditionNote || '',
    }
  }

  // 2. Kiểm tra từ returnDetails (OrderReturnResponse)
  if (
    returnDetails?.buyerRefundPercentage != null &&
    returnDetails?.sellerPayoutPercentage != null &&
    (returnDetails.buyerRefundPercentage > 0 || returnDetails.sellerPayoutPercentage > 0)
  ) {
    const buyerPct = Number(returnDetails.buyerRefundPercentage)
    const sellerPct = Number(returnDetails.sellerPayoutPercentage)
    const totalAmount = Number(item?.amount || order?.total || 0)
    const commission =
      item?.platformCommission != null
        ? Number(item.platformCommission)
        : (order?.platformCommission != null ? Number(order.platformCommission) : totalAmount * 0.1)
    const netAmount = Math.max(0, totalAmount - commission)
    const buyerAmount =
      returnDetails.buyerRefundAmount != null
        ? Number(returnDetails.buyerRefundAmount)
        : Math.round((netAmount * buyerPct) / 100)
    const sellerAmount =
      returnDetails.sellerPayoutAmount != null
        ? Number(returnDetails.sellerPayoutAmount)
        : Math.max(0, netAmount - buyerAmount)
    return {
      isSplit: buyerPct > 0 && sellerPct > 0,
      buyerPercentage: buyerPct,
      sellerPercentage: sellerPct,
      buyerAmount,
      sellerAmount,
      totalAmount,
      commission,
      note: returnDetails.conditionNote || '',
    }
  }

  // 3. Fallback trích xuất regex từ conditionNote hoặc settlementNote (dành cho đơn vừa test)
  const textToScan = [item?.settlementNote, returnDetails?.conditionNote, order?.note]
    .filter(Boolean)
    .join(' | ')

  if (textToScan) {
    const match = textToScan.match(/Người mua\s*(\d+)%[,|\s\-]+Người bán\s*(\d+)%/i)
    if (match) {
      const buyerPct = parseInt(match[1], 10)
      const sellerPct = parseInt(match[2], 10)
      const totalAmount = Number(item?.amount || order?.total || 0)
      const commission =
        item?.platformCommission != null
          ? Number(item.platformCommission)
          : (order?.platformCommission != null ? Number(order.platformCommission) : totalAmount * 0.1)
      const netAmount = Math.max(0, totalAmount - commission)
      const buyerAmount = Math.round((netAmount * buyerPct) / 100)
      const sellerAmount = Math.max(0, netAmount - buyerAmount)
      return {
        isSplit: buyerPct > 0 && sellerPct > 0,
        buyerPercentage: buyerPct,
        sellerPercentage: sellerPct,
        buyerAmount,
        sellerAmount,
        totalAmount,
        commission,
        note: textToScan,
      }
    }
  }

  return null
}
