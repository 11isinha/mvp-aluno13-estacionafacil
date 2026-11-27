import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

window.addEventListener('error', (event) => {
  document.body.innerHTML = `<div style="padding:20px;color:red;font-family:monospace;">
    <h3>Erro no App:</h3>
    <p>${event.message}</p>
  </div>`;
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
