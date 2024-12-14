import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'

// This is just for type inspection
const model = openai('gpt-4o')
const result = generateObject
