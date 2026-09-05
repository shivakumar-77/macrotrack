import type { KAYVENMemoryRecord, KAYVENMemoryCategory } from './kayven-memory-schema'

export async function getUserMemories(supabase: any, userId: string): Promise<KAYVENMemoryRecord[]> {
  try {
    const { data, error } = await supabase
      .from('user_memories')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('importance', { ascending: false })
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('[Memory Service] Error loading memories:', error.message)
      return []
    }

    return data || []
  } catch (error) {
    console.error('[Memory Service] Unexpected error loading memories:', error)
    return []
  }
}

export async function getRelevantMemories(
  supabase: any,
  userId: string,
  options?: {
    category?: KAYVENMemoryCategory
    minImportance?: number
    limit?: number
  }
): Promise<KAYVENMemoryRecord[]> {
  try {
    let query = supabase
      .from('user_memories')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (options?.category) {
      query = query.eq('category', options.category)
    }

    if (options?.minImportance !== undefined) {
      query = query.gte('importance', options.minImportance)
    }

    const limit = options?.limit || 20

    const { data, error } = await query
      .order('importance', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[Memory Service] Error loading relevant memories:', error.message)
      return []
    }

    return data || []
  } catch (error) {
    console.error('[Memory Service] Unexpected error loading relevant memories:', error)
    return []
  }
}

export async function getMemoryByKey(
  supabase: any,
  userId: string,
  category: KAYVENMemoryCategory,
  key: string
): Promise<KAYVENMemoryRecord | null> {
  try {
    const { data, error } = await supabase
      .from('user_memories')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category)
      .eq('key', key)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      console.error('[Memory Service] Error loading memory by key:', error.message)
      return null
    }

    return data || null
  } catch (error) {
    console.error('[Memory Service] Unexpected error loading memory by key:', error)
    return null
  }
}

export async function createMemory(
  supabase: any,
  userId: string,
  memory: Omit<KAYVENMemoryRecord, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<KAYVENMemoryRecord | null> {
  try {
    const { data, error } = await supabase
      .from('user_memories')
      .insert([{ user_id: userId, ...memory, is_active: true }])
      .select()
      .single()

    if (error) {
      console.error('[Memory Service] Error creating memory:', error.message)
      return null
    }

    console.info('[Memory Service] Memory created', { category: memory.category, key: memory.key, importance: memory.importance })
    return data || null
  } catch (error) {
    console.error('[Memory Service] Unexpected error creating memory:', error)
    return null
  }
}

export async function updateMemory(
  supabase: any,
  userId: string,
  memoryId: string,
  updates: Partial<KAYVENMemoryRecord>
): Promise<KAYVENMemoryRecord | null> {
  try {
    const { data, error } = await supabase
      .from('user_memories')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', memoryId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('[Memory Service] Error updating memory:', error.message)
      return null
    }

    console.info('[Memory Service] Memory updated', { id: memoryId })
    return data || null
  } catch (error) {
    console.error('[Memory Service] Unexpected error updating memory:', error)
    return null
  }
}

export async function deactivateMemory(supabase: any, userId: string, memoryId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_memories')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', memoryId)
      .eq('user_id', userId)

    if (error) {
      console.error('[Memory Service] Error deactivating memory:', error.message)
      return false
    }

    console.info('[Memory Service] Memory deactivated', { id: memoryId })
    return true
  } catch (error) {
    console.error('[Memory Service] Unexpected error deactivating memory:', error)
    return false
  }
}

export async function deleteMemory(supabase: any, userId: string, memoryId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('user_memories').delete().eq('id', memoryId).eq('user_id', userId)

    if (error) {
      console.error('[Memory Service] Error deleting memory:', error.message)
      return false
    }

    console.info('[Memory Service] Memory deleted', { id: memoryId })
    return true
  } catch (error) {
    console.error('[Memory Service] Unexpected error deleting memory:', error)
    return false
  }
}

export async function clearUserMemories(supabase: any, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('user_memories').delete().eq('user_id', userId)

    if (error) {
      console.error('[Memory Service] Error clearing user memories:', error.message)
      return false
    }

    console.info('[Memory Service] User memories cleared', { userId })
    return true
  } catch (error) {
    console.error('[Memory Service] Unexpected error clearing memories:', error)
    return false
  }
}
