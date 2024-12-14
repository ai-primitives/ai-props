declare module '@ai-sdk/provider' {
  export interface LanguageModelV1ProviderMetadata {
    temperature?: number
    maxTokens?: number
    topP?: number
    frequencyPenalty?: number
    presencePenalty?: number
    stop?: string[]
    [key: string]: unknown
  }
}
