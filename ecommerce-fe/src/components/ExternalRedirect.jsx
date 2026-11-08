import { useEffect } from 'react'

// React Router's <Navigate> only handles in-app paths; leaving the app needs a full page load.
export default function ExternalRedirect({ to }) {
  useEffect(() => {
    window.location.replace(to)
  }, [to])
  return null
}
