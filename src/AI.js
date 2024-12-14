import { useState, useEffect } from 'react'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
// Default model configuration
const defaultModel = openai('gpt-4o')
export function AI({
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
}) {
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  useEffect(() => {
    const generateProps = async () => {
      try {
        const response = await generateObject({
          model,
          prompt,
          output: 'no-schema',
          mode: 'json',
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
