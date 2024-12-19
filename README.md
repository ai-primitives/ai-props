# ai-props

[![npm version](https://badge.fury.io/js/ai-props.svg)](https://www.npmjs.com/package/ai-props)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A React component package that provides an AI component for generating and spreading AI-generated props to child components.

## Installation

```bash
npm install ai-props
```

## Usage

The `AI` component mirrors the `generateObject` function from the `ai` package and spreads the generated object's properties to its children.

### Model Configuration

The AI component supports both string-based OpenAI models and provider-specific model objects:

```tsx
// Simple string-based OpenAI model (recommended for OpenAI)
<AI
  model='gpt-4'
  schema={schema}
  prompt='Generate content'
/>

// Provider-specific model object (required for other providers)
import { anthropic } from '@ai-sdk/anthropic'

const model = anthropic('claude-2')
<AI
  model={model}
  schema={schema}
  prompt='Generate content'
/>

### Streaming Support

The AI component supports real-time streaming of generated content, providing a more interactive user experience:

```tsx
<AI
  model='gpt-4'
  stream={true}
  schema={{
    title: 'string',
    content: 'string'
  }}
  prompt='Generate an article about React'
>
  {(props, { isStreaming }) => (
    <article className={isStreaming ? 'animate-pulse' : ''}>
      <h1>{props.title}</h1>
      <div>{props.content}</div>
      {isStreaming && (
        <div className='text-gray-500'>Generating content...</div>
      )}
    </article>
  )}
</AI>
```

When using streaming:
- Set `stream={true}` to enable real-time updates
- Access streaming status via `isStreaming` in render prop
- UI updates automatically as content arrives
- Maintain type safety with your schema
- Reduced time to first content display

### API Proxy Integration

For enhanced security and control, you can route requests through your own API endpoint:

```tsx
<AI
  model='gpt-4'
  apiEndpoint='/api/generate'
  headers={{
    'Authorization': 'Bearer ${process.env.API_KEY}',
    'X-Custom-Header': 'value'
  }}
  schema={schema}
  prompt='Generate content'
/>
```

Your API endpoint should:
- Accept the same parameters as the AI provider
- Return compatible streaming or non-streaming responses
- Handle authentication and rate limiting
- Implement proper error handling

Benefits of using an API proxy:
- Keep API keys secure on your server
- Add custom request validation
- Implement usage tracking
- Control model access and costs
- Add custom error handling

Example API endpoint implementation:
```typescript
// pages/api/generate.ts
import { OpenAIStream } from 'ai'

export async function POST(req: Request) {
  const { prompt, schema, stream } = await req.json()

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      stream: stream,
    }),
  })

  if (stream) {
    const stream = OpenAIStream(response)
    return new Response(stream)
  }

  const json = await response.json()
  return Response.json(json)
}
```

### Simplified Schema Interface

You can define your schema using a simple object structure without importing Zod:

```tsx
import { AI } from 'ai-props'

function MyComponent() {
  return (
    <AI
      schema={{
        productType: 'App | API | Marketplace | Platform | Packaged Service | Professional Service | Website',
        profile: {
          customer: 'ideal customer profile in 3-5 words',
          solution: 'describe the offer in 4-10 words'
        },
        description: 'website meta description',
        tags: ['SEO-optimized meta tags']
      }}
      prompt='Generate product details'
    >
      {(props) => (
        <article>
          <h1>{props.productType}</h1>
          <div>
            <p>Customer: {props.profile.customer}</p>
            <p>Solution: {props.profile.solution}</p>
          </div>
          <p>{props.description}</p>
          <ul>
            {props.tags.map((tag, i) => (
              <li key={i}>{tag}</li>
            ))}
          </ul>
        </article>
      )}
    </AI>
  )
}
```

The simplified schema interface supports:
- Pipe-separated strings (`'Option1 | Option2 | Option3'`) which are automatically converted to enums
- Nested objects with type descriptions
- Array types with description hints

### Direct Zod Schema Usage

You can also use Zod schemas directly for more complex validation:

```tsx
import { AI } from 'ai-props'
import { z } from 'zod'

// Define your schema
const schema = z.object({
  title: z.string(),
  description: z.string()
})

// Use the AI component
function MyComponent() {
  return (
    <AI
      schema={schema}
      prompt='Generate a title and description for a blog post about React'
    >
      {(props) => (
        <article>
          <h1>{props.title}</h1>
          <p>{props.description}</p>
        </article>
      )}
    </AI>
  )
}
```

### Child Component Validation

The AI component supports prop validation for child components through the `validateProps` prop:

```tsx
function ChildComponent({ title, description }: Props) {
  // Define validation schema
  const propsSchema = z.object({
    title: z.string().min(10),
    description: z.string().max(200)
  })

  return (
    <AI
      schema={schema}
      prompt='Generate content'
      validateProps={propsSchema}
    >
      {(props) => (
        <div>
          <h1>{props.title}</h1>
          <p>{props.description}</p>
        </div>
      )}
    </AI>
  )
}
```

When validation fails, the AI component will:
1. Catch the zod validation error
2. Extract the schema from the error
3. Use this schema to regenerate content that matches the validation requirements

This enables components to enforce strict prop requirements while leveraging AI to fix validation issues automatically.

## Default Model Configuration

The AI component uses a default model configuration:

```typescript
import { openai } from '@ai-sdk/openai'
const model = openai('gpt-4o')
```

You can override this by providing your own model configuration through props.

## Props

The `AI` component accepts all props from the `generateObject` function:

### Required Props
- `schema`: A Zod schema or Schema object defining the structure of the generated object. Supports:
  - Direct Zod schemas for complex validation
  - Simplified object syntax without Zod imports
  - Pipe-separated strings for automatic enum conversion (e.g., `'Option1 | Option2'`)
- `prompt`: The prompt to send to the language model

### Optional Props
- `output`: Type of output ('object' | 'array' | 'enum' | 'no-schema')
- `schemaName`: Optional name for the output schema
- `schemaDescription`: Optional description for the output schema
- `mode`: Generation mode ('auto' | 'json' | 'tool'), defaults to 'auto'
- `model`: Override the default model
- `experimental_telemetry`: Optional telemetry configuration
- `experimental_providerMetadata`: Additional provider-specific metadata

### Array Output Mode

The `AI` component supports generating and rendering arrays of items using the `output='array'` prop. When using array output mode, you can also enable CSS Grid layout with the `cols` prop:

```tsx
<AI
  schema={blogSchema}
  prompt='Generate 6 blog post previews'
  output='array'
  cols={3}
  gap='2rem'
  className='grid-container'
  itemClassName='grid-item'
>
  {(props) => (
    <article>{/* Item content */}</article>
  )}
</AI>
```

#### Grid Support Props
- `cols`: Number of columns in the grid (default: 3)
- `gap`: Gap between grid items (CSS gap value)
- `className`: Class applied to the grid container
- `itemClassName`: Class applied to each grid item

### Styling Support

The `AI` component integrates with `clsx` and `tailwind-merge` for flexible styling:

```tsx
<AI
  className='max-w-7xl mx-auto px-4 py-16 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  itemClassName='bg-white p-6 rounded-lg shadow-md h-full flex flex-col'
>
  {/* Component content */}
</AI>
```

Class names are merged using the `cn` utility, which combines `clsx` and `tailwind-merge` for conflict-free class composition.

### Examples

#### Hero Section Example

A waitlist landing page hero section for an AI-powered SaaS product:

```tsx
import { AI } from 'ai-props'

const heroSchema = {
  productType: 'App | API | Marketplace | Platform',
  profile: {
    customer: 'ideal customer profile in 3-5 words',
    solution: 'describe the offer in 4-10 words'
  },
  description: 'website meta description',
  tags: ['SEO-optimized meta tags'],
  headline: 'compelling headline for AI SaaS product',
  subheadline: 'engaging subheadline explaining value proposition',
  ctaText: 'action-oriented button text',
  benefits: ['3-5 key benefits'],
  targetAudience: 'specific target audience description'
}

export function HeroSection() {
  return (
    <AI<typeof heroSchema>
      schema={heroSchema}
      prompt='Generate a hero section for an AI-powered SaaS product waitlist landing page'
      className='bg-gradient-to-br from-blue-50 to-indigo-50'
    >
      {(props) => (
        <div className='max-w-6xl mx-auto px-4 py-16'>
          <h1 className='text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600'>
            {props.headline}
          </h1>
          <p className='text-xl text-gray-600 mb-8'>{props.subheadline}</p>
          <button className='bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors'>
            {props.ctaText}
          </button>
          <div className='mt-12'>
            <h2 className='text-2xl font-semibold mb-4'>Perfect for {props.targetAudience}</h2>
            <ul className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {props.benefits.map((benefit, index) => (
                <li key={index} className='flex items-start bg-white p-4 rounded-lg shadow-sm'>
                  <span className='text-blue-500 mr-2'>✓</span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </AI>
  )
}

#### Blog List Example

A grid of blog post previews using array output mode:

```tsx
import { AI } from 'ai-props'

const blogSchema = {
  productType: 'App | API | Marketplace | Platform',
  profile: {
    customer: 'ideal customer profile in 3-5 words',
    solution: 'describe the offer in 4-10 words'
  },
  description: 'website meta description',
  tags: ['relevant topic tags'],
  title: 'engaging blog post title',
  excerpt: 'compelling 2-3 sentence excerpt',
  readTime: 'estimated read time',
  category: 'Blog | Tutorial | Case Study | News'
}

export function BlogList() {
  return (
    <AI<typeof blogSchema>
      schema={blogSchema}
      prompt='Generate 6 blog post previews about AI and machine learning'
      output='array'
      cols={3}
      gap='2rem'
      className='max-w-7xl mx-auto px-4 py-16 grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      itemClassName='h-full'
    >
      {(props) => (
        <article className='bg-white p-6 rounded-lg shadow-md h-full flex flex-col'>
          <div className='text-sm text-gray-500 mb-2 flex items-center justify-between'>
            <span>{props.category}</span>
            <span>{props.readTime}</span>
          </div>
          <h2 className='text-xl font-semibold mb-3'>{props.title}</h2>
          <p className='text-gray-600 mb-4 flex-grow'>{props.excerpt}</p>
          <div className='flex flex-wrap gap-2 mt-auto'>
            {props.tags.map((tag, index) => (
              <span key={index} className='bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm'>
                {tag}
              </span>
            ))}
          </div>
        </article>
      )}
    </AI>
  )
}

## Development

This package uses:
- Vite for building
- Vitest for testing
- React Cosmos for component development and testing

## Dependencies

This package requires the following peer dependencies:
- `react` (^18.2.0)
- `react-dom` (^18.2.0)
- `@types/react` (^18.2.0)
- `@types/react-dom` (^18.2.0)

And the following runtime dependencies:
- `ai` (^4.0.18)
- `@ai-sdk/openai` (^1.0.8)
- `clsx` (^2.1.1)
- `tailwind-merge` (^2.5.5)
- `zod` (^3.22.4)

Make sure to install these dependencies if they're not already in your project:

```bash
npm install ai @ai-sdk/openai clsx tailwind-merge zod
```

## License

MIT
