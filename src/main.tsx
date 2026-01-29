import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Initialize Xaman wallet integration
import { initializeXaman } from './config/xaman'
const xamanConfig = initializeXaman()

// Log startup info
console.log('🚀 XRPL Control Room starting...')
console.log(`📱 Xaman mode: ${xamanConfig.mode}`)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
