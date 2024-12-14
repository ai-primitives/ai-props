import React from 'react'
import { useValue } from 'react-cosmos/client'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { AI } from './AI'
import { ErrorBoundary } from './components/ErrorBoundary'

const helloSchema = z.object({
  greeting: z.string().describe('friendly greeting message'),
  name: z.string().describe('person | company | product name')
})

type HelloProps = z.infer<typeof helloSchema>

const HelloFixture = () => {
  const [model] = useValue('model', { defaultValue: 'gpt-4o' })
  const [prompt] = useValue('prompt', {
    defaultValue: 'Generate a friendly greeting for a website visitor.'
  })

  return (
    <ErrorBoundary FallbackComponent={({ error }) => <div>{error.message}</div>}>
      <AI model={openai(model)} schema={helloSchema} prompt={prompt}>
        {(props: HelloProps) => (
          <div className="text-center p-4">
            <h1 className="text-2xl font-bold">{props.greeting}</h1>
            <p className="text-lg">{props.name}</p>
          </div>
        )}
      </AI>
    </ErrorBoundary>
  )
}

export default {
  'Editable Hello': <HelloFixture />
}
