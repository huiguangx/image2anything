import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { DashboardApp } from './DashboardApp'

const pathname = window.location.pathname.replace(/\/+$/, '') || '/'
const RootApp = pathname === '/dashboard' ? DashboardApp : App

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootApp />
  </StrictMode>,
)
