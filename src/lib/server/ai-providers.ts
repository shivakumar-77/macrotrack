import { AIProvider, AIProviderName, AITextRequest, AIStructuredRequest, parseStructuredOutput } from './ai-provider'

const ANTHROPIC_ERROR_BODY_LOG_LIMIT = 2000

function sanitizeAnthropicErrorValue(value: string): string {
  const sanitized = value
    .replace(/\b(?:sk-ant|sk)-[A-Za-z0-9_-]+\b/gi, '[REDACTED]')
    .replace(/\bBearer\s+\S+/gi, 'Bearer [REDACTED]')
    .replace(/(["']?(?:x-api-key|authorization|api[_-]?key)["']?\s*[:=]\s*)[^,}\s]+/gi, '$1[REDACTED]')

  return sanitized.length > ANTHROPIC_ERROR_BODY_LOG_LIMIT
    ? `${sanitized.slice(0, ANTHROPIC_ERROR_BODY_LOG_LIMIT)}…[truncated]`
    : sanitized
}

function anthropicErrorDetails(body: string): {
  type: string | null
  message: string | null
  sanitizedBody: string
} {
  try {
    const parsed = JSON.parse(body) as { error?: { type?: unknown; message?: unknown } }
    const type = typeof parsed.error?.type === 'string'
      ? sanitizeAnthropicErrorValue(parsed.error.type)
      : null
    const message = typeof parsed.error?.message === 'string'
      ? sanitizeAnthropicErrorValue(parsed.error.message)
      : null

    return {
      type,
      message,
      sanitizedBody: JSON.stringify({ error: { type, message } }),
    }
  } catch {
    return {
      type: null,
      message: null,
      sanitizedBody: sanitizeAnthropicErrorValue(body),
    }
  }
}

export class AnthropicProvider implements AIProvider {
  readonly name: AIProviderName = 'anthropic'

  async generateResponse(request: AITextRequest) {
    const key = process.env.ANTHROPIC_API_KEY
    if (!key) throw new Error('ANTHROPIC_API_KEY is not configured')
    const response = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001', max_tokens: request.maxTokens || 1000, system: request.system, messages: [{ role: 'user', content: request.prompt }] }) })
    if (!response.ok) {
      let responseBody = ''

      try {
        responseBody = await response.text()
      } catch {
        responseBody = '[Anthropic error response body unavailable]'
      }

      const error = anthropicErrorDetails(responseBody)
      console.error('[AI Provider] Anthropic request failed', {
        status: response.status,
        errorType: error.type,
        errorMessage: error.message,
        responseBody: error.sanitizedBody,
      })
      throw new Error(error.message ? `Anthropic request failed: ${error.message}` : 'Anthropic request failed')
    }
    const data = await response.json()
    return data.content?.[0]?.text || ''
  }

  async generateStructuredOutput<T>(request: AIStructuredRequest) {
    return parseStructuredOutput<T>(await this.generateResponse({ ...request, prompt: `${request.prompt}\nRespond with valid JSON only.` }))
  }
}

export class OpenAIProvider implements AIProvider {
  readonly name: AIProviderName = 'openai'

  async generateResponse(request: AITextRequest) {
    const key = process.env.OPENAI_API_KEY
    if (!key) throw new Error('OPENAI_API_KEY is not configured')
    const response = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }, body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini', max_tokens: request.maxTokens || 1000, messages: [{ role: 'system', content: request.system || '' }, { role: 'user', content: request.prompt }] }) })
    if (!response.ok) { console.error('[AI Provider] OpenAI request failed', { status: response.status }); throw new Error('OpenAI request failed') }
    const data = await response.json()
    return data.choices?.[0]?.message?.content || ''
  }

  async generateStructuredOutput<T>(request: AIStructuredRequest) {
    return parseStructuredOutput<T>(await this.generateResponse({ ...request, prompt: `${request.prompt}\nRespond with valid JSON only.` }))
  }
}

export class GeminiProvider implements AIProvider {
  readonly name: AIProviderName = 'gemini'

  async generateResponse(_request: AITextRequest): Promise<string> {
    throw new Error('Gemini provider is intentionally not enabled yet. Add credentials in a future module only when needed.')
  }

  async generateStructuredOutput<T>(_request: AIStructuredRequest): Promise<T> {
    throw new Error('Gemini provider is intentionally not enabled yet. Add credentials in a future module only when needed.')
  }
}
