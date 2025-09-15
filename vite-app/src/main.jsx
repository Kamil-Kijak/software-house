import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <h1 className='text-2xl'>Hello world</h1>
  </StrictMode>
)
