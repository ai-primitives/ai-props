# ai-props

A React component package that provides an AI component for generating and spreading AI-generated props to child components.

## Installation

```bash
npm install ai-props
```

## Dependencies

This package requires the following peer dependencies:
- `ai`
- `@ai-sdk/openai`

## Usage

The `AI` component mirrors the `generateObject` function from the `ai` package, with a default model configuration. It spreads the generated object's properties to its children.

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
      prompt="Generate product details"
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
      prompt="Generate a title and description for a blog post about React"
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

## Development

This package uses:
- Vite for building
- Vitest for testing
- React Cosmos for component development and testing

## License

MIT
