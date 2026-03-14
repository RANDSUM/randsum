import type { GlobalProvider } from '@ladle/react'

export const Provider: GlobalProvider = ({ children }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      boxSizing: 'border-box'
    }}
  >
    {children}
  </div>
)
