import { BlogList } from './BlogList'
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
  'Default Blog List': {
    component: BlogList,
    wrap: (Component: React.ComponentType) => (
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Suspense fallback={<div>Loading...</div>}>
          <Component />
        </Suspense>
      </ErrorBoundary>
    ),
    props: {
      model: openai('gpt-4o'),
      cols: 2,
      schema: {
        title: 'string',
        excerpt: 'string',
        readTime: 'string',
        category: 'Blog | Tutorial | Case Study | News',
        tags: ['string']
      }
    }
  },
  'Three Column Grid': {
    component: BlogList,
    wrap: (Component: React.ComponentType) => (
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Suspense fallback={<div>Loading...</div>}>
          <Component />
        </Suspense>
      </ErrorBoundary>
    ),
    props: {
      model: openai('gpt-4o'),
      cols: 3,
      schema: {
        title: 'string',
        excerpt: 'string',
        readTime: 'string',
        category: 'Blog | Tutorial | Case Study | News',
        tags: ['string']
      }
    }
  }
}
