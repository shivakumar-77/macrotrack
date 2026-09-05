import type { KAYVENMemoryCandidate, MemoryExtractorResult } from './kayven-memory-schema'

export function extractMemoryCandidates(message: string): MemoryExtractorResult {
  const candidates: KAYVENMemoryCandidate[] = []
  const text = message.toLowerCase()

  // Food dislikes
  const dislikePatterns = [
    { regex: /i\s+hate\s+([a-z\s]+)[.,!?]?$/i, category: 'food_dislike' as const, importance: 4 },
    { regex: /i\s+don't\s+like\s+([a-z\s]+)[.,!?]?$/i, category: 'food_dislike' as const, importance: 4 },
    { regex: /never\s+recommend\s+([a-z\s]+)[.,!?]?$/i, category: 'constraint' as const, importance: 5 },
    { regex: /can't\s+eat\s+([a-z\s]+)[.,!?]?$/i, category: 'food_dislike' as const, importance: 4 }
  ]

  for (const pattern of dislikePatterns) {
    const match = message.match(pattern.regex)
    if (match && match[1]) {
      const food = match[1].trim()
      if (food.length > 0 && food.length < 50) {
        candidates.push({
          category: pattern.category,
          key: `${pattern.category}_${food.replace(/\s+/g, '_')}`,
          value: food,
          source: 'user_explicit',
          confidence: 0.95,
          importance: pattern.importance,
          reason: 'Explicit user statement about food dislike'
        })
      }
    }
  }

  // Food likes
  const likePatterns = [
    { regex: /i\s+love\s+([a-z\s]+)[.,!?]?$/i, importance: 3 },
    { regex: /i\s+really\s+like\s+([a-z\s]+)[.,!?]?$/i, importance: 3 },
    { regex: /my\s+favorite\s+is\s+([a-z\s]+)[.,!?]?$/i, importance: 3 }
  ]

  for (const pattern of likePatterns) {
    const match = message.match(pattern.regex)
    if (match && match[1]) {
      const food = match[1].trim()
      if (food.length > 0 && food.length < 50) {
        candidates.push({
          category: 'food_like',
          key: `food_like_${food.replace(/\s+/g, '_')}`,
          value: food,
          source: 'user_explicit',
          confidence: 0.9,
          importance: pattern.importance,
          reason: 'Explicit user statement about food preference'
        })
      }
    }
  }

  // Dietary preferences
  const dietaryPatterns = [
    { regex: /i'm\s+(vegetarian|vegan|pescatarian|keto|paleo|gluten.?free)/i, importance: 5 },
    { regex: /i\s+prefer\s+(vegetarian|vegan|pescatarian|keto|paleo|gluten.?free)/i, importance: 5 },
    { regex: /(vegetarian|vegan|pescatarian|keto|paleo|gluten.?free)\s+diet/i, importance: 5 }
  ]

  for (const pattern of dietaryPatterns) {
    const match = message.match(pattern.regex)
    if (match && match[1]) {
      const diet = match[1].toLowerCase().replace(/[.-]/g, '')
      candidates.push({
        category: 'dietary_preference',
        key: `dietary_${diet}`,
        value: diet,
        source: 'user_explicit',
        confidence: 0.95,
        importance: pattern.importance,
        reason: 'Explicit dietary preference statement'
      })
    }
  }

  // Dietary restrictions (allergies, intolerances)
  const restrictionPatterns = [
    { regex: /i'm\s+allergic\s+to\s+([a-z\s]+)/i, importance: 5 },
    { regex: /i\s+can't\s+have\s+([a-z\s]+)\s+\(allerg/i, importance: 5 },
    { regex: /i'm\s+intolerant\s+to\s+([a-z\s]+)/i, importance: 5 }
  ]

  for (const pattern of restrictionPatterns) {
    const match = message.match(pattern.regex)
    if (match && match[1]) {
      const restriction = match[1].trim()
      if (restriction.length > 0 && restriction.length < 50) {
        candidates.push({
          category: 'dietary_restriction',
          key: `restriction_${restriction.replace(/\s+/g, '_')}`,
          value: restriction,
          source: 'user_explicit',
          confidence: 0.95,
          importance: pattern.importance,
          reason: 'Explicit dietary restriction or allergy'
        })
      }
    }
  }

  // Workout preferences
  const workoutPatterns = [
    { regex: /i\s+don't\s+like\s+(running|cardio|weights|lifting)/i, importance: 3 },
    { regex: /i\s+hate\s+(running|cardio|weights|lifting)/i, importance: 4 },
    { regex: /i\s+prefer\s+(running|cardio|weights|lifting)/i, importance: 3 }
  ]

  for (const pattern of workoutPatterns) {
    const match = message.match(pattern.regex)
    if (match && match[1]) {
      const workout = match[1].toLowerCase()
      candidates.push({
        category: 'workout_preference',
        key: `workout_${workout}`,
        value: workout,
        source: 'user_explicit',
        confidence: 0.9,
        importance: pattern.importance,
        reason: 'Explicit workout preference statement'
      })
    }
  }

  // Routines (time-based)
  const routinePatterns = [
    { regex: /i\s+usually\s+train\s+(?:in\s+the\s+)?([a-z\s]+(?:morning|afternoon|evening|night))/i, importance: 3 },
    { regex: /i\s+workout\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i, importance: 3 },
    { regex: /my\s+(?:usual\s+)?workout\s+time\s+is\s+([a-z\s]+(?:morning|afternoon|evening|night))/i, importance: 3 }
  ]

  for (const pattern of routinePatterns) {
    const match = message.match(pattern.regex)
    if (match && match[1]) {
      const routine = match[1].trim()
      if (routine.length > 0 && routine.length < 50) {
        candidates.push({
          category: 'routine',
          key: `routine_${routine.replace(/\s+/g, '_')}`,
          value: routine,
          source: 'user_explicit',
          confidence: 0.85,
          importance: pattern.importance,
          reason: 'Explicit user routine statement'
        })
      }
    }
  }

  // Fitness goals
  const goalPatterns = [
    { regex: /my\s+goal\s+is\s+to\s+([a-z0-9\s]+)/i, importance: 5 },
    { regex: /i\s+want\s+to\s+([a-z0-9\s]+)/i, importance: 4 },
    { regex: /i'm\s+trying\s+to\s+([a-z0-9\s]+)/i, importance: 4 }
  ]

  for (const pattern of goalPatterns) {
    const match = message.match(pattern.regex)
    if (match && match[1]) {
      const goal = match[1].trim()
      if (goal.length > 5 && goal.length < 100 && /(lose|gain|build|run|lift|improve|reach|achieve|lose weight|build muscle)/i.test(goal)) {
        candidates.push({
          category: 'fitness_goal',
          key: `goal_${goal.substring(0, 30).replace(/\s+/g, '_')}`,
          value: goal,
          source: 'user_explicit',
          confidence: 0.9,
          importance: pattern.importance,
          reason: 'Explicit fitness goal statement'
        })
      }
    }
  }

  // User corrections (contradicting previous info)
  const correctionPatterns = [
    { regex: /actually,?\s+i\s+(?:like|hate|prefer|don't\s+like)\s+([a-z\s]+)/i },
    { regex: /i\s+was\s+wrong,?\s+i\s+(?:like|hate|prefer)\s+([a-z\s]+)/i },
    { regex: /i\s+changed\s+my\s+mind,?\s+i\s+(?:like|hate|prefer)\s+([a-z\s]+)/i }
  ]

  for (const pattern of correctionPatterns) {
    const match = message.match(pattern.regex)
    if (match && match[1]) {
      const correction = match[1].trim()
      if (correction.length > 0 && correction.length < 50) {
        candidates.push({
          category: 'user_correction',
          key: `correction_${correction.replace(/\s+/g, '_')}`,
          value: correction,
          source: 'user_correction',
          confidence: 0.95,
          importance: 4,
          reason: 'User explicitly correcting previous statement'
        })
      }
    }
  }

  return {
    candidates,
    message,
    usedAI: false
  }
}
