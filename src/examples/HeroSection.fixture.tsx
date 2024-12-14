import { Suspense } from 'react'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { useValue } from 'react-cosmos/client'
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

const HeroFixture = () => {
  const [model] = useValue('model', { defaultValue: 'gpt-4o' })
  const [prompt] = useValue('prompt', {
    defaultValue: 'Create a compelling hero section for an AI SaaS product that highlights its key benefits and target audience.'
  })

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<LoadingFallback />}>
        <AI
          model={openai(model)}
          schema={heroSchema}
          prompt={prompt}
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

export default {
  'Editable Hero': <HeroFixture />
}
