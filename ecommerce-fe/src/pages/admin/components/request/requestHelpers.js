export const formatAdminRequestDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString()
}

export const buildRequestDetailEntries = (requestType, requestDetail) => {
  if (requestType === 'SELLER_REGISTRATION') {
    return [
      ['Shop name', requestDetail.shopName],
      ['Tax code', requestDetail.taxCode],
      ['Address', requestDetail.address],
      ['Phone', requestDetail.shopPhone],
      ['Email', requestDetail.shopEmail],
    ]
  }
  if (requestType === 'REPORT') {
    return [
      ['Target type', requestDetail.targetType],
      ['Target ID', requestDetail.targetId],
      ['Evidence', requestDetail.evidenceUrl],
      ['Moderator note', requestDetail.moderatorNote],
    ]
  }
  return Object.entries(requestDetail || {}).map(([key, value]) => [key, value])
}
