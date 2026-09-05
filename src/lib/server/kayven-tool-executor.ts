import { validateKAYVENSafety } from './kayven-safety'
import { executeTool, type KAYVENToolName } from './kayven-tools'

export interface SafeToolExecutionResult {
  success: boolean
  data: unknown
  error?: string
  safetyBlocked?: boolean
  safetyReason?: string
}

export async function executeSafeTool(
  toolName: KAYVENToolName,
  message: string,
  userId: string,
  supabase: any,
  context: Record<string, unknown>
): Promise<SafeToolExecutionResult> {
  const safety = validateKAYVENSafety(message)

  if (safety.status !== 'allowed') {
    return {
      success: false,
      data: null,
      safetyBlocked: true,
      safetyReason: `Request flagged as ${safety.status}: ${safety.reasons[0]}`
    }
  }

  const result = await executeTool(toolName, { userId, supabase, context })

  return {
    ...result,
    safetyBlocked: false
  }
}
