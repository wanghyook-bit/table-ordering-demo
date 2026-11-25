import React from 'react'
import ReactDOM from 'react-dom/client'
import App, { hasTablePaymentToResume } from './App'
import './index.css'

const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
const params = new URLSearchParams(window.location.search)
const reloadTableTrial = params.get('code') === 'table' && navigation?.type === 'reload' && !hasTablePaymentToResume()
if ((!params.has('code') && !params.has('demo')) || reloadTableTrial) {
  window.location.replace(`${import.meta.env.BASE_URL}trial.html?code=table`)
} else {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}
