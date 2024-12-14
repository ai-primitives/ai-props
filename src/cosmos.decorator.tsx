import React from 'react'

const CosmosDecorator = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      style={{
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto',
        fontFamily: 'system-ui, sans-serif'
      }}
    >
      {children}
    </div>
  )
}

export default CosmosDecorator
