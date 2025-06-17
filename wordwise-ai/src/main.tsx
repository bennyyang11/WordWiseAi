// Polyfill for structuredClone to support Node.js 16
if (!globalThis.structuredClone) {
  globalThis.structuredClone = (obj: any) => {
    return JSON.parse(JSON.stringify(obj));
  };
}

// WordWise AI - Styling Update 2025

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
