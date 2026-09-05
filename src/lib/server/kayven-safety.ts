import type { KAYVENSafetyDecision } from './kayven-ai'

export function validateKAYVENSafety(message: string): KAYVENSafetyDecision {
  const text = message.toLowerCase()

  if (/emergency|severe pain|chest pain|shortness of breath|stroke|faint|severe bleeding|suicid/i.test(text)) {
    return {
      status: 'escalate',
      reasons: ['Emergency or high-risk medical language detected'],
      restrictions: ['Do not provide diagnostic or treatment advice'],
      shouldEscalate: true
    }
  }

  if (/diagnose|treat|medication|stop medication|replace doctor|cure/i.test(text)) {
    return {
      status: 'constrained',
      reasons: ['Medical advice request'],
      restrictions: ['Use general wellness guidance and recommend a licensed professional'],
      shouldEscalate: false
    }
  }

  return {
    status: 'allowed',
    reasons: ['Routine KAYVEN conversation'],
    restrictions: ['Use only valid user data and avoid assumptions'],
    shouldEscalate: false
  }
}
