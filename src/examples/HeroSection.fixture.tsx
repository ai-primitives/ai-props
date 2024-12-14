import { Suspense } from 'react'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { AI } from '../AI'
import { ErrorBoundary } from '../components/ErrorBoundary'

const ErrorFallback = ({ error }: { error: Error }) => (
  <div style={{ color: 'red', padding: '1rem' }}>
    <h2>Something went wrong:</h2>
    <pre>{error.message}</pre>
  </div>
)

const LoadingFallback = () => <div>Loading...</div>

const heroSchema = z.object({
  headline: z.string().describe('compelling headline for AI SaaS product'),
  subheadline: z.string().describe('engaging subheadline explaining value proposition'),
  ctaText: z.string().describe('action-oriented button text'),
  benefits: z.array(z.string()).describe('3-5 key benefits'),
  targetAudience: z.string().describe('specific target audience description')
})

type HeroProps = z.infer<typeof heroSchema>

export default {
  'Default Hero': (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<LoadingFallback />}>
        <AI
          model={openai('gpt-4o')}
          schema={heroSchema}
          prompt="Create a compelling hero section for an AI SaaS product that highlights its key benefits and target audience."
        >
          {(props: HeroProps) => (
            <div className="hero-section">
              <h1>{props.headline}</h1>
              <p>{props.subheadline}</p>
              <button>{props.ctaText}</button>
              <ul>
                {props.benefits.map((benefit, i) => (
                  <li key={i}>{benefit}</li>
                ))}
              </ul>
              <p>Perfect for: {props.targetAudience}</p>
            </div>
          )}
        </AI>
      </Suspense>
    </ErrorBoundary>
  ),
  'Custom Model': (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<LoadingFallback />}>
        <AI
          model={openai('gpt-3.5-turbo')}
          schema={heroSchema}
          prompt="Create a compelling hero section for an AI SaaS product that highlights its key benefits and target audience."
        >
          {(props: HeroProps) => (
            <div className="hero-section">
              <h1>{props.headline}</h1>
              <p>{props.subheadline}</p>
              <button>{props.ctaText}</button>
              <ul>
                {props.benefits.map((benefit, i) => (
                  <li key={i}>{benefit}</li>
                ))}
              </ul>
              <p>Perfect for: {props.targetAudience}</p>
            </div>
          )}
        </AI>
      </Suspense>
    </ErrorBoundary>
  )
}
