import { useEffect, useState } from 'react'
import { z } from 'zod'
import clsx from 'clsx'

import { createSchemaFromObject, isZodSchema, type SchemaObject } from './utils/schema'

type ModelType = string | { provider: string; model: string }

interface AIProps<T extends Record<string, unknown>, O extends 'object' | 'array' = 'object'> {
  schema: z.ZodSchema<T> | SchemaObject
  prompt: string
  model?: ModelType
  output?: O
  count?: number
  cols?: number
  mode?: 'json'
  stream?: boolean
  apiEndpoint?: string
  headers?: Record<string, string>
  experimental_telemetry?: boolean
  experimental_providerMetadata?: boolean
  className?: string
  itemClassName?: string
  gap?: string
  children: (props: O extends 'array' ? T[] : T) => React.ReactNode
}

const resolveModel = (modelInput: ModelType = 'gpt-4') => {
  return typeof modelInput === 'string' ? { provider: 'openai', model: modelInput } : modelInput
}

export function AI<T extends Record<string, unknown>, O extends 'object' | 'array' = 'object'>({
  children,
  prompt,
  schema: rawSchema,
  model = 'gpt-4',
  output = 'object' as O,
  count,
  cols,
  mode = 'json',
  stream = false,
  apiEndpoint,
  headers,
  experimental_telemetry,
  experimental_providerMetadata,
  className,
  itemClassName,
  gap = '1rem'
}: AIProps<T, O>) {
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
        const schemaObject = isZodSchema(schema)
          ? (schema.describe('') as unknown as SchemaObject)
          : (schema as SchemaObject)

        const validationSchema = isZodSchema(schema)
          ? (schema as unknown as z.ZodSchema<T>)
          : (createSchemaFromObject(schema as SchemaObject) as unknown as z.ZodSchema<T>)

        if (stream) {
          const response = await fetch(apiEndpoint || '/api/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(headers || {})
            },
            body: JSON.stringify({
              prompt,
              model: resolveModel(model),
              schema: output === 'array' ? { type: 'array', items: schemaObject } : schemaObject,
              mode: mode || 'json',
              ...(experimental_telemetry && { experimental_telemetry }),
              ...(experimental_providerMetadata && { experimental_providerMetadata })
            })
          })

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const reader = response.body?.getReader()
          const decoder = new TextDecoder()

          if (!reader) throw new Error('No reader available')

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            try {
              const parsed = JSON.parse(chunk)
              if (output === 'array') {
                const arrayData = Array.isArray(parsed) ? parsed : [parsed]
                setResults(arrayData.map(item => validationSchema.parse(item) as T))
              } else {
                setResults([validationSchema.parse(parsed) as T])
              }
            } catch (e) {
              console.error('Error parsing chunk:', e)
            }
          }
        } else {
          const response = await fetch(apiEndpoint || '/api/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(headers || {})
            },
            body: JSON.stringify({
              prompt,
              model: resolveModel(model),
              schema: output === 'array' ? { type: 'array', items: schemaObject } : schemaObject,
              mode: mode || 'json',
              ...(experimental_telemetry && { experimental_telemetry }),
              ...(experimental_providerMetadata && { experimental_providerMetadata })
            })
          })

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const responseData = await response.json()
          const parsed = output === 'array'
            ? (Array.isArray(responseData) ? responseData : [responseData])
            : [responseData]

          setResults(parsed.map(item => validationSchema.parse(item) as T))
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      }
    }

    generateProps()
  }, [prompt, schema, model, output, count, cols, mode, experimental_telemetry, experimental_providerMetadata, stream, apiEndpoint, headers])

  if (error) {
    throw error
  }

  if (!results.length) {
    return null
  }

  return output === 'array' ? (
    <div style={gridStyle} className={clsx('ai-grid', className)}>
      <div className={clsx('ai-grid-items', itemClassName)}>
        {children(results as O extends 'array' ? T[] : T)}
      </div>
    </div>
  ) : children(results[0] as O extends 'array' ? T[] : T)
}
