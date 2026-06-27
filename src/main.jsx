import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import tabLogo from './assets/logo.png'

const existingIcon = document.querySelector("link[rel='icon']")
if (existingIcon) {
  existingIcon.setAttribute('href', tabLogo)
  existingIcon.setAttribute('type', 'image/png')
} else {
  const icon = document.createElement('link')
  icon.rel = 'icon'
  icon.type = 'image/png'
  icon.href = tabLogo
  document.head.appendChild(icon)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
