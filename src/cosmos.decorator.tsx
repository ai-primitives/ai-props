import React from 'react'
import { Suspense } from 'react'

export default function CosmosDecorator({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      {children}
    </Suspense>
  )
}
