import { HeroSection } from './HeroSection'
import { openai } from '@ai-sdk/openai'
import { Suspense } from 'react'
import { ErrorBoundary } from '../utils/ErrorBoundary'

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div style={{ color: 'red', padding: '1rem' }}>
      <h2>Something went wrong:</h2>
      <pre>{error.message}</pre>
    </div>
  )
}

export default {
  'Default Hero': {
    component: HeroSection,
    wrap: (Component: React.ComponentType) => (
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Suspense fallback={<div>Loading...</div>}>
          <Component />
        </Suspense>
      </ErrorBoundary>
    ),
    props: {
      model: openai('gpt-4o'),
      schema: {
        headline: 'string',
        subheadline: 'string',
        ctaText: 'string',
        benefits: ['string'],
        targetAudience: 'string'
      }
    }
  },
  'Custom Model': {
    component: HeroSection,
    wrap: (Component: React.ComponentType) => (
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Suspense fallback={<div>Loading...</div>}>
          <Component />
        </Suspense>
      </ErrorBoundary>
    ),
    props: {
      model: openai('gpt-3.5-turbo'),
      schema: {
        headline: 'string',
        subheadline: 'string',
        ctaText: 'string',
        benefits: ['string'],
        targetAudience: 'string'
      }
    }
  }
}
