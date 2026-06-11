import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionGlobalConfig } from 'framer-motion'
import './index.css'
import App from './App.jsx'

// Belt-and-suspenders: never leave UI stuck at motion "initial" values in production
if (import.meta.env.PROD) {
  MotionGlobalConfig.skipAnimations = true
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
