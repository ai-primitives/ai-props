import { ReactNode, useState, useEffect } from 'react'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import type { LanguageModelV1ProviderMetadata } from '@ai-sdk/provider'
import type { AttributeValue } from '@opentelemetry/api'

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
  schema: z.Schema<T>
  model?: typeof defaultModel
  output?: 'no-schema'
  schemaName?: string
  schemaDescription?: string
  mode?: 'json'
  experimental_telemetry?: TelemetrySettings
  experimental_providerMetadata?: LanguageModelV1ProviderMetadata
}

export function AI<T>({
  children,
  prompt,
  schema,
  model = defaultModel,
  output = 'no-schema',
  schemaName,
  schemaDescription,
  mode = 'json',
  experimental_telemetry,
  experimental_providerMetadata,
}: AIProps<T>) {
  const [result, setResult] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const generateProps = async () => {
      try {
        const response = await generateObject({
          model,
          prompt,
          output: 'no-schema' as const,
          mode: 'json' as const,
          ...(experimental_telemetry && { experimental_telemetry }),
          ...(experimental_providerMetadata && { experimental_providerMetadata }),
        })

        // Parse the response with the provided schema
        const parsed = schema.parse(response.object)
        setResult(parsed)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      }
    }

    generateProps()
  }, [prompt, schema, model, output, schemaName, schemaDescription, mode, experimental_telemetry, experimental_providerMetadata])

  if (error) {
    throw error
  }

  if (!result) {
    return null // or loading state
  }

  return children(result)
}
