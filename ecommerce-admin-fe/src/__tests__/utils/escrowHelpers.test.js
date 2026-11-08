import { describe, it, expect } from 'vitest'
import { getSplitSettlementInfo } from '../../utils/escrowHelpers'

describe('getSplitSettlementInfo', () => {
  it('returns null when there is nothing to settle', () => {
    expect(getSplitSettlementInfo()).toBeNull()
    expect(getSplitSettlementInfo({ item: {}, returnDetails: {}, order: {} })).toBeNull()
  })

  describe('from the escrow item', () => {
    it('splits the amount net of commission by percentage', () => {
      const info = getSplitSettlementInfo({
        item: { buyerPercentage: 70, sellerPercentage: 30, amount: 1_000_000, platformCommission: 50_000 },
      })
      expect(info).toEqual({
        isSplit: true,
        buyerPercentage: 70,
        sellerPercentage: 30,
        buyerAmount: 665_000, // 70% of 950,000
        sellerAmount: 285_000, // remainder, so nothing is lost to rounding
        totalAmount: 1_000_000,
        commission: 50_000,
        note: '',
      })
    })

    it('never creates or loses money: buyer + seller + commission = total', () => {
      const info = getSplitSettlementInfo({
        item: { buyerPercentage: 33, sellerPercentage: 67, amount: 999_999, platformCommission: 12_345 },
      })
      expect(info.buyerAmount + info.sellerAmount + info.commission).toBe(info.totalAmount)
    })

    it('prefers explicit amounts sent by the backend over computed ones', () => {
      const info = getSplitSettlementInfo({
        item: { buyerPercentage: 50, sellerPercentage: 50, amount: 100_000, buyerAmount: 40_000, sellerAmount: 60_000 },
      })
      expect(info.buyerAmount).toBe(40_000)
      expect(info.sellerAmount).toBe(60_000)
    })

    it('falls back to the order total and order commission', () => {
      const info = getSplitSettlementInfo({
        item: { buyerPercentage: 50, sellerPercentage: 50 },
        order: { total: 200_000, platformCommission: 20_000 },
      })
      expect(info.totalAmount).toBe(200_000)
      expect(info.commission).toBe(20_000)
      expect(info.buyerAmount).toBe(90_000)
      expect(info.sellerAmount).toBe(90_000)
    })

    it('reports a full refund as not split', () => {
      const info = getSplitSettlementInfo({ item: { buyerPercentage: 100, sellerPercentage: 0, amount: 100_000 } })
      expect(info.isSplit).toBe(false)
      expect(info.buyerAmount).toBe(100_000)
      expect(info.sellerAmount).toBe(0)
    })

    it('uses the settlement note, then the return condition note', () => {
      const base = { buyerPercentage: 50, sellerPercentage: 50, amount: 10 }
      expect(getSplitSettlementInfo({ item: { ...base, settlementNote: 'A' }, returnDetails: { conditionNote: 'B' } }).note).toBe('A')
      expect(getSplitSettlementInfo({ item: base, returnDetails: { conditionNote: 'B' } }).note).toBe('B')
    })

    it('ignores 0% / 0% and moves on to the return details', () => {
      const info = getSplitSettlementInfo({
        item: { buyerPercentage: 0, sellerPercentage: 0, amount: 100_000 },
        returnDetails: { buyerRefundPercentage: 20, sellerPayoutPercentage: 80 },
      })
      expect(info.buyerPercentage).toBe(20)
      expect(info.buyerAmount).toBe(20_000)
      expect(info.sellerAmount).toBe(80_000)
    })

    it('never produces a negative net amount when commission exceeds the total', () => {
      const info = getSplitSettlementInfo({
        item: { buyerPercentage: 50, sellerPercentage: 50, amount: 10_000, platformCommission: 50_000 },
      })
      expect(info.buyerAmount).toBe(0)
      expect(info.sellerAmount).toBe(0)
    })
  })

  describe('from the return details', () => {
    it('splits using refund/payout percentages', () => {
      const info = getSplitSettlementInfo({
        returnDetails: { buyerRefundPercentage: 60, sellerPayoutPercentage: 40, conditionNote: 'Trầy nhẹ' },
        order: { total: 500_000, platformCommission: 0 },
      })
      expect(info).toMatchObject({
        isSplit: true,
        buyerAmount: 300_000,
        sellerAmount: 200_000,
        totalAmount: 500_000,
        note: 'Trầy nhẹ',
      })
    })

    it('prefers explicit refund/payout amounts', () => {
      const info = getSplitSettlementInfo({
        returnDetails: {
          buyerRefundPercentage: 60,
          sellerPayoutPercentage: 40,
          buyerRefundAmount: 1,
          sellerPayoutAmount: 2,
        },
        order: { total: 500_000 },
      })
      expect(info.buyerAmount).toBe(1)
      expect(info.sellerAmount).toBe(2)
    })
  })

  describe('from free-text notes', () => {
    it('parses "Người mua X%, Người bán Y%" from the settlement note', () => {
      const info = getSplitSettlementInfo({
        item: { settlementNote: 'Phán quyết: Người mua 30%, Người bán 70%', amount: 1_000_000, platformCommission: 0 },
      })
      expect(info).toMatchObject({ isSplit: true, buyerPercentage: 30, sellerPercentage: 70, buyerAmount: 300_000, sellerAmount: 700_000 })
    })

    it('also reads the order note, case-insensitively', () => {
      const info = getSplitSettlementInfo({ order: { note: 'người mua 50% - người bán 50%', total: 100 } })
      expect(info.buyerPercentage).toBe(50)
      expect(info.sellerPercentage).toBe(50)
    })

    it('returns null when the notes contain no split', () => {
      expect(getSplitSettlementInfo({ item: { settlementNote: 'Hoàn tiền toàn bộ' } })).toBeNull()
    })
  })
})
