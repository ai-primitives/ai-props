declare module '@ai-sdk/provider' {
  export interface LanguageModelV1ProviderMetadata {
    id: string
    name: string
    version: string
    capabilities: {
      streaming: boolean
      functionCalling: boolean
    }
  }
}
