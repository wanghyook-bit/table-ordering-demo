import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

const params = new URLSearchParams(window.location.search)
if (!params.has('code') && !params.has('demo')) {
  window.location.replace(`${import.meta.env.BASE_URL}trial.html?code=table`)
} else {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}
