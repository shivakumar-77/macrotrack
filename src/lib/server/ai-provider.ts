export type AIProviderName = 'anthropic' | 'openai' | 'gemini' | 'custom'

export interface AIProvider {
  readonly name: AIProviderName
  generateResponse(request: AITextRequest): Promise<string>
  generateStructuredOutput<T>(request: AIStructuredRequest): Promise<T>
}

export interface AITextRequest {
  prompt: string
  system?: string
  maxTokens?: number
  metadata?: Record<string, unknown>
}

export interface AIStructuredRequest extends AITextRequest {
  schema?: Record<string, unknown>
}

export function parseStructuredOutput<T>(text: string): T {
  const cleaned = text.replace(/```json|```/g, '').trim()
  return JSON.parse(cleaned) as T
}