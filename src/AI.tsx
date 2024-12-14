import { ReactNode } from 'react'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

// Default model configuration
const defaultModel = openai('gpt-4o')

type AIProps<T> = {
  children: (props: T) => ReactNode
  prompt: string
  schema: z.Schema<T>
  model?: typeof defaultModel
  output?: 'object' | 'array' | 'enum' | 'no-schema'
  schemaName?: string
  schemaDescription?: string
  mode?: 'auto' | 'json' | 'tool'
  experimental_telemetry?: {
    isEnabled?: boolean
    recordInputs?: boolean
    recordOutputs?: boolean
    functionId?: string
    metadata?: Record<string, unknown>
  }
  experimental_providerMetadata?: Record<string, unknown>
}

export function AI<T>({
  children,
  prompt,
  schema,
  model = defaultModel,
  output = 'object',
  schemaName,
  schemaDescription,
  mode = 'auto',
  experimental_telemetry,
  experimental_providerMetadata
}: AIProps<T>) {
  const [result, setResult] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const generateProps = async () => {
      try {
        const response = await generateObject({
          model,
          prompt,
          schema,
          output,
          schemaName,
          schemaDescription,
          mode,
          experimental_telemetry,
          experimental_providerMetadata
        })
        setResult(response.object)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      }
    }

    generateProps()
  }, [
    prompt,
    schema,
    model,
    output,
    schemaName,
    schemaDescription,
    mode,
    experimental_telemetry,
    experimental_providerMetadata
  ])

  if (error) {
    throw error
  }

  if (!result) {
    return null // or loading state
  }

  return children(result)
}
