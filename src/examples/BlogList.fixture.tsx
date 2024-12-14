import { Suspense } from 'react'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { useValue } from 'react-cosmos/client'
import { AI } from '../AI'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { cn } from '../utils/styles'

const ErrorFallback = ({ error }: { error: Error }) => (
  <div style={{ color: 'red', padding: '1rem' }}>
    <h2>Something went wrong:</h2>
    <pre>{error.message}</pre>
  </div>
)

const LoadingFallback = () => <div>Loading...</div>

const blogSchema = z.object({
  title: z.string().describe('engaging blog post title'),
  excerpt: z.string().describe('compelling 2-3 sentence excerpt'),
  readTime: z.string().describe('estimated read time'),
  category: z.enum(['Blog', 'Tutorial', 'Case Study', 'News']).describe('content category'),
  tags: z.array(z.string()).describe('relevant topic tags')
})

type BlogProps = z.infer<typeof blogSchema>

const BlogFixture = () => {
  const [model] = useValue('model', { defaultValue: 'gpt-4o' })
  const [count] = useValue('count', { defaultValue: 6 })
  const [cols] = useValue('cols', { defaultValue: 3 })
  const [prompt] = useValue('prompt', {
    defaultValue: 'Generate engaging blog post previews about AI and machine learning topics.'
  })

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<LoadingFallback />}>
        <AI
          model={openai(model)}
          schema={blogSchema}
          output="array"
          count={count}
          cols={cols}
          className="gap-6"
          prompt={prompt}
        >
          {(props: BlogProps) => (
            <div className={cn('blog-card', 'p-4 border rounded-lg')}>
              <h2>{props.title}</h2>
              <p>{props.excerpt}</p>
              <div className="meta">
                <span>{props.readTime}</span>
                <span>{props.category}</span>
              </div>
              <div className="tags">
                {props.tags.map((tag, i) => (
                  <span key={i} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </AI>
      </Suspense>
    </ErrorBoundary>
  )
}

export default {
  'Editable Blog List': <BlogFixture />
}
