import type {
  KAYVENAIResponse,
  KAYVENIntent,
  KAYVENMessage,
} from '@/lib/server/kayven-ai'

import {
  AnthropicProvider,
  OpenAIProvider,
} from '@/lib/server/ai-providers'

type BrainDecision = {
  intent?: KAYVENIntent
  confidence?: number
  complexity?: 'simple' | 'moderate' | 'complex'
  needsUserData?: boolean
  requiredData?: string[]
  resolvedReferences?: string[]
  shouldAskClarification?: boolean
  responseStrategy?: string
}

type AIChatInput = {
  message: string
  intent: KAYVENIntent
  context: Record<string, unknown>
  conversation: KAYVENMessage[]
  brainDecision: BrainDecision
  safetyStatus: 'allowed' | 'constrained' | 'escalate'
}

function getProvider() {
  if (process.env.ANTHROPIC_API_KEY) {
    return new AnthropicProvider()
  }

  if (process.env.OPENAI_API_KEY) {
    return new OpenAIProvider()
  }

  return null
}

function getModelName(
  provider: 'anthropic' | 'openai',
): string | undefined {
  if (provider === 'anthropic') {
    return process.env.ANTHROPIC_MODEL
  }

  return process.env.OPENAI_MODEL
}

export function shouldPreferAIResponse(
  message: string,
  conversation: KAYVENMessage[],
): boolean {
  const normalized =
    message.trim().toLowerCase()

  const exactDataQuestion =
    /^(how much|what is|show me|check)\b.*\b(protein|calories|carbs|fat|fiber|water|steps|weight)\b/i
      .test(normalized) ||
    /\b(today'?s?|current|latest)\b.*\b(protein|calories|carbs|fat|fiber|water|steps|weight)\b/i
      .test(normalized)

  if (exactDataQuestion) {
    return false
  }

  const humanConversation =
    /^(why|how|what should|what do|should i|can i|could i|i get|i feel|i am|i'm|but|then|yes|no|more|explain|help me)/i
      .test(normalized) ||
    /\b(hungry|hunger|craving|cravings|appetite|sleep|stress|tired|motivation|plateau|stuck|binge|overeating|night)\b/i
      .test(normalized)

  if (humanConversation) {
    return true
  }

  const previousUserMessages =
    conversation.filter(
      item => item.role === 'user',
    )

  if (
    normalized.length <= 100 &&
    previousUserMessages.length > 0
  ) {
    return true
  }

  return false
}

function safeContext(
  context: Record<string, unknown>,
): string {
  try {
    return JSON.stringify(
      context,
      (_key, value) => {
        if (typeof value === 'string') {
          return value.slice(0, 3000)
        }

        return value
      },
      2,
    ).slice(0, 30000)
  } catch {
    return '{}'
  }
}

export async function generateKayvenAIResponse(
  input: AIChatInput,
): Promise<KAYVENAIResponse | null> {
  const provider = getProvider()

  if (!provider) {
    console.warn(
      '[KAYVEN AI] No AI provider configured',
    )

    return null
  }

  try {
    const recentConversation =
      input.conversation
        .slice(-14)
        .map(
          item =>
            `${item.role.toUpperCase()}: ${item.content}`,
        )
        .join('\n')

    const system = `
You are KAYVEN, a highly intelligent, warm and natural AI nutrition and fitness coach.

Your goal is to feel like a real human conversation, not a dashboard, template, chatbot menu, or data-reporting system.

CRITICAL CONVERSATION RULES:

1. Always understand the user's latest message in the context of the conversation.
2. Never restart the conversation.
3. Never introduce yourself unless the user asks who you are.
4. Never say "Ask me about calories, protein, workouts..." unless the user explicitly asks what you can do.
5. Follow-up questions like "why?", "how?", "what should I eat instead?", "tell me more", "is that normal?" MUST refer to the previous conversation.
6. Answer the actual question before giving extra information.
7. Be natural, conversational, clear and helpful.
8. Do not sound robotic or repetitive.
9. Use the user's KAYVEN data when relevant.
10. Never invent personal logged data that is not present in the supplied context.
11. If the user asks a general nutrition or fitness question, answer using general knowledge while clearly separating general guidance from their personal logged data.
12. Do not repeat the same response simply because two messages share a similar intent.
13. For weight loss, hunger, cravings, sleep, motivation and behaviour questions, reason about likely causes and give practical next steps.
14. When a question is ambiguous but conversation context clearly resolves it, do NOT ask for clarification.
15. Keep normal answers concise but useful. Usually 1-5 short paragraphs or bullets.
16. Do not claim to diagnose medical conditions.
17. If safety restrictions require escalation, follow them.

You are not ChatGPT, Claude, Anthropic or OpenAI.
You are KAYVEN.

The user expects a conversation, not a static analytics report.
`.trim()

    const prompt = `
<conversation>
${recentConversation}
</conversation>

<user_data>
${safeContext(input.context)}
</user_data>

<brain_decision>
${JSON.stringify(input.brainDecision)}
</brain_decision>

<safety_status>
${input.safetyStatus}
</safety_status>

<latest_user_message>
${input.message}
</latest_user_message>

Answer the latest user message naturally.

Important:
- Use previous conversation to resolve references.
- Do not repeat a previous answer unless necessary.
- Do not give a generic KAYVEN introduction.
- Do not say you need more information if the conversation already provides enough context.
`.trim()

    const text =
      (
        await provider.generateResponse({
          system,
          prompt,
          maxTokens: 900,
        })
      )
        .trim()

    if (!text) {
      return null
    }

    return {
      text,
      safetyStatus:
        input.safetyStatus,
      provider: {
        name: provider.name,
        model: getModelName(
          provider.name as
            | 'anthropic'
            | 'openai',
        ),
      },
      metadata: {
        usedAI: true,
        provider: provider.name,
        intent: input.intent,
        executionPath: 'ai_fallback',
      },
    }
  } catch (error) {
    console.error(
      '[KAYVEN AI] Conversation generation failed',
      {
        provider: provider.name,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown error',
      },
    )

    return null
  }
}
