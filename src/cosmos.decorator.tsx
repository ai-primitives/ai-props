import React, { Suspense, StrictMode } from 'react'
import { ErrorBoundary } from './components/ErrorBoundary'

const ErrorFallback = ({ error }: { error: Error }) => (
  <div style={{ color: 'red', padding: '1rem' }}>
    <h2>Something went wrong:</h2>
    <pre>{error.message}</pre>
  </div>
)

export default function CosmosDecorator({ children }: { children: React.ReactNode }) {
  console.log('Cosmos Decorator: Rendering children')
  return (
    <StrictMode>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Suspense fallback={<div>Loading...</div>}>
          {children}
        </Suspense>
      </ErrorBoundary>
    </StrictMode>
  )
}
