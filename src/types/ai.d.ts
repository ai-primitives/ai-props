import { z } from 'zod'

type JSONValue = string | number | boolean | null | { [key: string]: JSONValue } | JSONValue[]

export interface StreamObjectOptions<TSchema = JSONValue, TResponse = JSONValue> {
  prompt: string
  model: string | { provider: string; model: string }
  schema: TSchema
  mode?: 'json'
  experimental_telemetry?: boolean
  experimental_providerMetadata?: boolean
  apiEndpoint?: string
  headers?: Record<string, string>
}

export interface StreamChunk<TResponse = JSONValue> {
  object: TResponse
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  warnings?: string[]
}

export interface StreamObjectResult<TSchema = JSONValue, TResponse = JSONValue, TError = never> {
  [Symbol.asyncIterator](): AsyncGenerator<StreamChunk<TResponse>, void, unknown>
  warnings: string[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  experimental_providerMetadata?: Record<string, unknown>
  request: {
    prompt: string
    model: string | { provider: string; model: string }
    schema: TSchema
    mode?: 'json'
  }
}

declare module 'ai' {
  export function streamObject<TSchema = JSONValue, TResponse = JSONValue, TError = never>(
    options: StreamObjectOptions<TSchema, TResponse>,
  ): StreamObjectResult<TSchema, TResponse, TError>
}
