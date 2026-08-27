import { AIProvider, AITextRequest, AIStructuredRequest, parseStructuredOutput } from './ai-provider'

export class AnthropicProvider implements AIProvider {
  async generateResponse(request: AITextRequest) {
    const key = process.env.ANTHROPIC_API_KEY
    if (!key) throw new Error('ANTHROPIC_API_KEY is not configured')
    const response = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001', max_tokens: request.maxTokens || 1000, system: request.system, messages: [{ role: 'user', content: request.prompt }] }) })
    if (!response.ok) { console.error('[AI Provider] Anthropic request failed', { status: response.status }); throw new Error('Anthropic request failed') }
    const data = await response.json()
    return data.content?.[0]?.text || ''
  }

  async generateStructuredOutput<T>(request: AIStructuredRequest) {
    return parseStructuredOutput<T>(await this.generateResponse({ ...request, prompt: `${request.prompt}\nRespond with valid JSON only.` }))
  }
}

export class OpenAIProvider implements AIProvider {
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