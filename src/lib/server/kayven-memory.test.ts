import { extractMemoryCandidates } from './kayven-memory-extractor'
import { validateMemory } from './kayven-memory-validator'

export interface KayvenMemoryTestCase {
  name: string
  message: string
  expectedCategory: string | null
  expectedValue?: string
}

export const KAYVEN_MEMORY_TEST_CASES: KayvenMemoryTestCase[] = [
  { name: 'food dislike', message: 'I hate oats.', expectedCategory: 'food_dislike', expectedValue: 'oats' },
  { name: 'workout preference', message: "I don't like running.", expectedCategory: 'workout_preference', expectedValue: 'running' },
  { name: 'dietary preference', message: 'I prefer vegetarian food.', expectedCategory: 'dietary_preference', expectedValue: 'vegetarian' },
  { name: 'routine', message: 'I usually train at night.', expectedCategory: 'routine', expectedValue: 'night' },
  { name: 'correction', message: 'Actually, I like oats now.', expectedCategory: 'user_correction', expectedValue: 'oats' },
  { name: 'casual message', message: 'How was your day?', expectedCategory: null },
  { name: 'secret-like message', message: 'My API key is secret-token.', expectedCategory: null },
]

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message)
}

export async function runKayvenMemoryTests(): Promise<void> {
  for (const testCase of KAYVEN_MEMORY_TEST_CASES) {
    const result = extractMemoryCandidates(testCase.message)
    const candidate = result.candidates[0]

    assert(
      (candidate?.category || null) === testCase.expectedCategory,
      `${testCase.name}: expected category ${testCase.expectedCategory || 'none'}`,
    )

    if (testCase.expectedValue) {
      const value = typeof candidate?.value === 'object'
        ? String((candidate.value as { item?: unknown }).item || '')
        : String(candidate?.value || '')
      assert(value.toLowerCase() === testCase.expectedValue, `${testCase.name}: unexpected value ${value}`)
    }

    assert(result.usedAI === false, `${testCase.name}: memory extraction must not call AI`)
  }

  const emptySupabase = {
    from: () => ({
      select: function () { return this },
      eq: function () { return this },
      maybeSingle: async () => ({ data: null, error: null }),
    }),
  }

  const result = await validateMemory(
    {
      category: 'preference',
      key: 'secret',
      value: 'my API key is sk-test',
      source: 'user_explicit',
      confidence: 1,
      importance: 3,
      reason: 'security test',
    },
    emptySupabase,
    'test-user',
  )
  assert(!result.valid, 'secret-like memory must be rejected')
}
