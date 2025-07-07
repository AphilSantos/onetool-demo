import { supabase } from './supabase'
import { AISession, AISessionInsert, AISessionUpdate } from '@/types/supabase'
import { Message } from 'ai'

export class AISessionManager {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  async getSession(): Promise<AISession | null> {
    const { data, error } = await supabase
      .from('ai_sessions')
      .select('*')
      .eq('user_id', this.userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching AI session:', error)
      return null
    }

    return data
  }

  async saveSession(messages: Message[], currentTask?: string, taskStatus?: string): Promise<void> {
    const sessionData: AISessionInsert = {
      user_id: this.userId,
      messages: messages as any,
      current_task: currentTask || null,
      task_status: taskStatus || null
    }

    const { error } = await supabase
      .from('ai_sessions')
      .upsert(sessionData, {
        onConflict: 'user_id'
      })

    if (error) {
      console.error('Error saving AI session:', error)
      throw error
    }
  }

  async updateTaskStatus(currentTask?: string, taskStatus?: string): Promise<void> {
    const updateData: AISessionUpdate = {
      current_task: currentTask || null,
      task_status: taskStatus || null
    }

    const { error } = await supabase
      .from('ai_sessions')
      .update(updateData)
      .eq('user_id', this.userId)

    if (error) {
      console.error('Error updating task status:', error)
      throw error
    }
  }

  async clearSession(): Promise<void> {
    const { error } = await supabase
      .from('ai_sessions')
      .delete()
      .eq('user_id', this.userId)

    if (error) {
      console.error('Error clearing AI session:', error)
      throw error
    }
  }

  // Parse tool invocations to extract task information
  static parseTaskFromToolInvocations(toolInvocations: any[]): { task?: string, status?: string } {
    if (!toolInvocations || toolInvocations.length === 0) {
      return {}
    }

    // Look for the most recent tool invocation to determine current task
    const latestTool = toolInvocations[toolInvocations.length - 1]
    
    if (!latestTool) return {}

    const { toolName, state } = latestTool
    
    let task: string | undefined
    let status: string | undefined

    // Map tool names to human-readable tasks
    switch (toolName) {
      case 'getAvailableConnections':
        task = 'Fetching available connections'
        break
      case 'getAvailableActions':
        task = 'Retrieving supported actions'
        break
      case 'getActionKnowledge':
        task = 'Loading action knowledge'
        break
      case 'execute':
        task = 'Executing action'
        break
      case 'connectGithub':
        task = 'Connecting to GitHub'
        break
      default:
        task = `Running ${toolName}`
    }

    // Map tool states to status
    switch (state) {
      case 'call':
        status = 'in_progress'
        break
      case 'result':
        // Check if the result indicates success or failure
        const result = (latestTool as any).result
        if (result && typeof result === 'object') {
          if (result.success === false || result.error) {
            status = 'failed'
          } else {
            status = 'completed'
          }
        } else {
          status = 'completed'
        }
        break
      default:
        status = 'in_progress'
    }

    return { task, status }
  }
}