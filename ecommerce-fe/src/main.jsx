import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import AOS from 'aos'
import './index.css'
import App from './App.jsx'

function AOSInit() {
  useEffect(() => {
    AOS.init({ duration: 600, once: true, offset: 50 })
  }, [])
  return null
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AOSInit />
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { borderRadius: '12px' },
        }}
      />
    </BrowserRouter>
  </StrictMode>,
)
