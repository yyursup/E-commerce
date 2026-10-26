export const isVideoUrl = (url = '') => {
  if (!url || typeof url !== 'string') return false
  const cleanUrl = url.split('?')[0].toLowerCase()
  return (
    cleanUrl.endsWith('.mp4') ||
    cleanUrl.endsWith('.webm') ||
    cleanUrl.endsWith('.ogg') ||
    cleanUrl.endsWith('.mov') ||
    cleanUrl.endsWith('.m4v') ||
    cleanUrl.endsWith('.mkv') ||
    url.includes('/video/') ||
    url.includes('video%2F')
  )
}

export const isVideoFile = (file) => {
  if (!file) return false
  if (file.type && file.type.startsWith('video/')) return true
  const name = file.name || ''
  const cleanName = name.toLowerCase()
  return (
    cleanName.endsWith('.mp4') ||
    cleanName.endsWith('.webm') ||
    cleanName.endsWith('.ogg') ||
    cleanName.endsWith('.mov') ||
    cleanName.endsWith('.m4v') ||
    cleanName.endsWith('.mkv')
  )
}
