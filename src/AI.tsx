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
  validateProps?: z.ZodSchema<T>
  children: (props: O extends 'array' ? T[] : T) => React.ReactNode
}

const resolveModel = (modelInput: ModelType = 'gpt-4') => {
  return typeof modelInput === 'string' ? { provider: 'openai', model: modelInput } : modelInput
}

export function AI<T extends Record<string, unknown>, O extends 'object' | 'array' = 'object'>({
  children,
  prompt,
  schema: rawSchema,
  validateProps,
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
  gap = '1rem',
}: AIProps<T, O>) {
  const [results, setResults] = useState<T[]>([])
  const [error, setError] = useState<Error | null>(null)
  const [validationSchema, setValidationSchema] = useState<z.ZodSchema<T> | null>(null)
  const [shouldRegenerate, setShouldRegenerate] = useState(false)

  const schema = isZodSchema(rawSchema) ? (rawSchema as z.ZodSchema<T>) : (createSchemaFromObject(rawSchema as SchemaObject) as unknown as z.ZodSchema<T>)

  const handleValidation = (data: T): T | null => {
    if (validateProps) {
      try {
        validateProps.parse(data)
        return data
      } catch (err: unknown) {
        if (!(err instanceof z.ZodError)) {
          throw err
        }

        const zodError: z.ZodError = err
        if (zodError.issues.length > 0) {
          const extractedSchema = zodError.issues[0].path.reduce<z.ZodTypeAny>(
            (acc, path) => {
              if (typeof path === 'string' && acc instanceof z.ZodObject) {
                return acc.shape[path] || acc
              }
              return acc
            },
            validateProps
          )

          if (extractedSchema instanceof z.ZodType) {
            setValidationSchema(extractedSchema as z.ZodSchema<T>)
            setShouldRegenerate(true)
            return null
          }
        }
        return null
      }
    }
    return data
  }

  const gridStyle =
    output === 'array'
      ? {
          display: 'grid',
          gridTemplateColumns: `repeat(${cols || 1}, minmax(0, 1fr))`,
          gap,
        }
      : undefined

  useEffect(() => {
    const generateProps = async () => {
      try {
        // Use validation schema if available, otherwise use original schema
        const schemaObject = validationSchema || isZodSchema(schema) ?
          ((validationSchema || schema).describe('') as unknown as SchemaObject) :
          (schema as SchemaObject)

        const currentValidationSchema = validationSchema || (isZodSchema(schema)
          ? (schema as unknown as z.ZodSchema<T>)
          : (createSchemaFromObject(schema as SchemaObject) as unknown as z.ZodSchema<T>))

        if (stream) {
          const { streamObject } = await import('ai')
          const streamResponse = streamObject({
            prompt,
            model: resolveModel(model),
            schema: output === 'array' ? { type: 'array', items: schemaObject } : schemaObject,
            mode: mode || 'json',
            ...(experimental_telemetry && { experimental_telemetry }),
            ...(experimental_providerMetadata && { experimental_providerMetadata }),
            ...(apiEndpoint && { apiEndpoint }),
            ...(headers && { headers }),
          })

          for await (const chunk of streamResponse) {
            if (chunk.object) {
              try {
                if (output === 'array') {
                  const arrayData = Array.isArray(chunk.object) ? chunk.object : [chunk.object]
                  const validatedData = await Promise.all(
                    arrayData.map(async (item: unknown) => {
                      try {
                        const validated = currentValidationSchema.parse(item)
                        return handleValidation(validated as T)
                      } catch (err) {
                        if (err instanceof Error && err.message.includes('Regenerating with extracted schema')) {
                          throw err
                        }
                        console.error('Validation error:', err)
                        return null
                      }
                    })
                  )
                  const filteredResults = validatedData.filter((item): item is NonNullable<typeof item> => item !== null)
                  setResults(filteredResults as T[])
                } else {
                  const validated = currentValidationSchema.parse(chunk.object)
                  const result = handleValidation(validated as T)
                  if (result) setResults([result])
                }
              } catch (e) {
                if (e instanceof Error && e.message.includes('Regenerating with extracted schema')) {
                  throw e
                }
                console.error('Error parsing chunk:', e)
              }
            }
          }
        } else {
          const response = await fetch(apiEndpoint || '/api/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(headers || {}),
            },
            body: JSON.stringify({
              prompt,
              model: resolveModel(model),
              schema: output === 'array' ? { type: 'array', items: schemaObject } : schemaObject,
              mode: mode || 'json',
              ...(experimental_telemetry && { experimental_telemetry }),
              ...(experimental_providerMetadata && { experimental_providerMetadata }),
            }),
          })

          if (!response?.ok) {
            throw new Error(`HTTP error! status: ${response?.status}`)
          }

          const responseData = await response.json()
          const parsed = output === 'array' ? (Array.isArray(responseData.object) ? responseData.object : [responseData.object]) : [responseData.object]

          try {
            const validatedData = await Promise.all(
              parsed.map(async (item: unknown) => {
                try {
                  const validated = currentValidationSchema.parse(item)
                  return handleValidation(validated as T)
                } catch (err) {
                  if (err instanceof Error && err.message.includes('Regenerating with extracted schema')) {
                    throw err
                  }
                  console.error('Validation error:', err)
                  return null
                }
              })
            )
            const filteredResults = validatedData.filter((item): item is NonNullable<typeof item> => item !== null)
            setResults(filteredResults as T[])
          } catch (err) {
            if (err instanceof Error && err.message.includes('Regenerating with extracted schema')) {
              throw err
            }
            throw err
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      }
    }

    generateProps()
    setShouldRegenerate(false)
  }, [prompt, schema, model, output, count, cols, mode, experimental_telemetry, experimental_providerMetadata, stream, apiEndpoint, headers, shouldRegenerate, validationSchema])

  if (error) {
    throw error
  }

  if (!results.length) {
    return <div data-testid="loading">Generating content...</div>
  }

  return output === 'array' ? (
    <div style={gridStyle} className={clsx('ai-grid', className)}>
      <div data-testid="content" className={clsx('ai-grid-items', itemClassName)}>
        {children(results as O extends 'array' ? T[] : T)}
      </div>
    </div>
  ) : (
    children(results[0] as O extends 'array' ? T[] : T)
  )
}
