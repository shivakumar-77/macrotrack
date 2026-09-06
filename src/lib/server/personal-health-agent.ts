import {
  buildKayvenUserState,
  type KayvenUserState,
} from './kayven-user-state'
import { KayvenIntelligenceContext } from './kayven-intelligence-context'
import { getNextBestAction, NextBestAction } from './next-best-action'

export type AgentStatus = 'needs_attention' | 'on_track' | 'no_action'

export interface PersonalHealthAgentState {
  generatedAt: string
  contextRange: KayvenIntelligenceContext['range']
  status: AgentStatus
  action: NextBestAction
  dataAvailable: boolean
}

function hasAvailableData(context: KayvenIntelligenceContext): boolean {
  return Boolean(
    context.user.profile ||
    context.nutrition.macroSummary.daysWithLogs ||
    context.body.weights.length ||
    context.fitness.recentWorkouts.length ||
    context.hydration.todayMl
  )
}

export function getPersonalHealthAgentState(
  context: KayvenIntelligenceContext,
  userState: KayvenUserState = buildKayvenUserState(context)
): PersonalHealthAgentState {
  const action = getNextBestAction(context, userState)
  const dataAvailable = hasAvailableData(context)

  return {
    generatedAt: action.generatedAt || new Date().toISOString(),
    contextRange: context.range,
    status: action.actionType === 'NONE'
      ? (dataAvailable ? 'on_track' : 'no_action')
      : 'needs_attention',
    action,
    dataAvailable,
  }
}
