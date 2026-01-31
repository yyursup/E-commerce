import api from './client'

const toFormData = fields => {
  const form = new FormData()
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) form.append(key, value)
  })
  return form
}

export const startSession = () => api.post('/kyc/sessions:start')

export const uploadDocument = ({ sessionId, type, file, title, description }) => {
  const form = toFormData({ type, file, title, description })
  return api.post(`/kyc/session/${sessionId}/upload`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const attachDocument = (sessionId, payload) =>
  api.post(`/kyc/session/${sessionId}/attach`, payload)

export const classify = (sessionId, fileHash) =>
  api.post(`/kyc/sessions/${sessionId}/classify`, null, {
    params: fileHash ? { fileHash } : {},
  })

export const ocrFront = (sessionId, { fileHash, type } = {}) =>
  api.post(`/kyc/sessions/${sessionId}/ocr/front`, null, {
    params: {
      ...(fileHash ? { fileHash } : {}),
      ...(type !== undefined ? { type } : {}),
    },
  })

export const ocrBack = (sessionId, { fileHash, type } = {}) =>
  api.post(`/kyc/sessions/${sessionId}/ocr/back`, null, {
    params: {
      ...(fileHash ? { fileHash } : {}),
      ...(type !== undefined ? { type } : {}),
    },
  })

export const liveness = (sessionId, fileHash) =>
  api.post(`/kyc/sessions/${sessionId}/ocr/liveness`, null, {
    params: fileHash ? { fileHash } : {},
  })

export const compare = sessionId =>
  api.post(`/kyc/sessions/${sessionId}/compare`)

export const getSession = sessionId => api.get(`/kyc/sessions/${sessionId}`)

export const fullFlowUpload = ({ sessionId, file, title, description }) => {
  const form = toFormData({ file, title, description })
  return api.post(`/kyc/sessions/${sessionId}/fullFlow-upload`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
