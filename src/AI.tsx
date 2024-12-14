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
  const [results, setResults] = useState<T[]>([])
  const [error, setError] = useState<Error | null>(null)

  const schema = isZodSchema(rawSchema)
    ? rawSchema as z.ZodSchema<T>
    : createSchemaFromObject(rawSchema as SchemaObject) as unknown as z.ZodSchema<T>

  const gridStyle = output === 'array' ? {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols || 1}, minmax(0, 1fr))`,
    gap,
  } : undefined

  useEffect(() => {
    const generateProps = async () => {
      try {
        const response = await generateObject({
          model,
          prompt: output === 'array'
            ? `Generate an array of ${cols || 3} items. ${prompt}`
            : prompt,
          output: 'no-schema',
          mode,
          ...(experimental_telemetry && { experimental_telemetry }),
          ...(experimental_providerMetadata && { experimental_providerMetadata }),
        })

        const responseObject = response.object as Record<string, unknown>
        const parsed = output === 'array'
          ? ('items' in responseObject && Array.isArray(responseObject.items)
              ? responseObject.items.map(item => schema.parse(item))
              : [])
          : [schema.parse(responseObject)]

        setResults(parsed)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      }
    }

    generateProps()
  }, [prompt, schema, model, output, cols, gap, className, schemaName, schemaDescription, mode, experimental_telemetry, experimental_providerMetadata])

  if (error) {
    throw error
  }

  if (!results.length) {
    return null
  }

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
