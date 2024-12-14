import { ReactNode, useState, useEffect } from 'react'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import type { LanguageModelV1ProviderMetadata } from '@ai-sdk/provider'
import type { AttributeValue } from '@opentelemetry/api'
import { createSchemaFromObject, isZodSchema } from './utils/schema'
import type { SchemaObject } from './utils/schema'
import { cn } from './utils/styles'

// Default model configuration
const defaultModel = openai('gpt-4o')

type TelemetrySettings = {
  isEnabled?: boolean
  recordInputs?: boolean
  recordOutputs?: boolean
  functionId?: string
  metadata?: Record<string, AttributeValue>
}

type AIProps<T> = {
  children: (props: T) => ReactNode
  prompt: string
  schema: z.ZodSchema<T> | SchemaObject
  model?: typeof defaultModel
  output?: 'object' | 'array'
  count?: number // Number of items to generate in array mode
  cols?: number
  gap?: string
  className?: string
  itemClassName?: string
  schemaName?: string
  schemaDescription?: string
  mode?: 'json'
  experimental_telemetry?: TelemetrySettings
  experimental_providerMetadata?: LanguageModelV1ProviderMetadata
}

export function AI<T>({
  children,
  prompt,
  schema: rawSchema,
  model = defaultModel,
  output = 'object',
  count,
  cols,
  gap = '1rem',
  className,
  itemClassName,
  schemaName,
  schemaDescription,
  mode = 'json',
  experimental_telemetry,
  experimental_providerMetadata,
}: AIProps<T>) {
  console.log('AI Component: Initializing with props', { prompt, output, count, cols })
  const [results, setResults] = useState<T[]>([])
  const [error, setError] = useState<Error | null>(null)

  const schema = isZodSchema(rawSchema)
    ? rawSchema as z.ZodSchema<T>
    : createSchemaFromObject(rawSchema as SchemaObject) as unknown as z.ZodSchema<T>

  console.log('AI Component: Schema created', { schema })

  const gridStyle = output === 'array' ? {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols || 1}, minmax(0, 1fr))`,
    gap,
  } : undefined

  useEffect(() => {
    console.log('AI Component: Starting generateProps effect')
    const generateProps = async () => {
      try {
        console.log('AI Component: Calling generateObject with', { model, prompt, output })
        const response = await generateObject({
          model,
          prompt: output === 'array'
            ? `Generate an array of ${count || cols || 3} items. ${prompt}`
            : prompt,
          output: 'no-schema',
          mode,
          ...(experimental_telemetry && { experimental_telemetry }),
          ...(experimental_providerMetadata && { experimental_providerMetadata }),
        })

        console.log('AI Component: Generated response', response)
        const responseObject = response.object as Record<string, unknown>
        const parsed = output === 'array'
          ? (Array.isArray(responseObject)
              ? responseObject.map(item => schema.parse(item))
              : [])
          : [schema.parse(responseObject)]

        console.log('AI Component: Setting parsed results', parsed)
        setResults(parsed)
      } catch (err) {
        console.error('AI Component: Error generating props', err)
        setError(err instanceof Error ? err : new Error('Unknown error'))
      }
    }

    generateProps()
  }, [prompt, schema, model, output, count, cols, gap, className, schemaName, schemaDescription, mode, experimental_telemetry, experimental_providerMetadata])

  if (error) {
    console.error('AI Component: Throwing error', error)
    throw error
  }

  if (!results.length) {
    console.log('AI Component: No results yet, returning null')
    return null
  }

  console.log('AI Component: Rendering with results', results)
  return output === 'array' ? (
    <div style={gridStyle} className={cn('ai-grid', className)}>
      {results.map((result, index) => (
        <div key={index} className={cn('ai-grid-item', itemClassName)}>
          {children(result)}
        </div>
      ))}
    </div>
  ) : children(results[0])
}
