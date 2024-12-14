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
- `schema`: A Zod schema or Schema object defining the structure of the generated object
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
