'use client'

import { useCallback, useRef } from 'react'
import { useOrchestratorStore, type AgentType } from '@/lib/orchestrator-state'

export function useOrchestrator() {
  const store = useOrchestratorStore()
  const abortRef = useRef<AbortController | null>(null)

  const startOrchestration = useCallback(async () => {
    if (!store.codigo.trim()) return

    // Reset previous state
    store.resetAll()
    store.setIsRunning(true)

    const abortController = new AbortController()
    abortRef.current = abortController

    try {
      const response = await fetch('/api/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linguagem: store.linguagem || 'javascript',
          codigo: store.codigo,
          resultadoEsperado: store.resultadoEsperado,
          resultadoAtual: store.resultadoAtual,
          erros: store.erros,
        }),
        signal: abortController.signal,
      })

      if (!response.ok || !response.body) {
        throw new Error('Falha na conexão com o orquestrador')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let currentEvent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          
          if (trimmed.startsWith('event: ')) {
            currentEvent = trimmed.slice(7).trim()
          } else if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6))
              processEvent(currentEvent, data, store)
            } catch {
              // Ignore parse errors
            }
            currentEvent = ''
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Orchestration error:', error)
      }
    } finally {
      store.setIsRunning(false)
    }
  }, [store.codigo, store.linguagem, store.resultadoEsperado, store.resultadoAtual, store.erros])

  const stopOrchestration = useCallback(() => {
    abortRef.current?.abort()
    store.setIsRunning(false)
  }, [])

  return { startOrchestration, stopOrchestration }
}

function processEvent(
  eventType: string, 
  data: unknown, 
  store: ReturnType<typeof useOrchestratorStore>
) {
  const d = data as Record<string, unknown>

  switch (eventType) {
    case 'stage':
      // Stage updates are informational
      break

    case 'analysis':
      store.setStrategicAnalysis({
        complexity: (d.complexity as string) || 'moderado',
        problemType: (d.problemType as string) || 'desconhecido',
        strategy: (d.strategy as string) || '',
        reasoning: (d.reasoning as string) || '',
      })
      if (d.plan && Array.isArray(d.plan)) {
        store.setExecutionPlan({
          steps: d.plan.map((step: Record<string, string>) => ({
            agent: step.agent as AgentType,
            reason: step.reason || '',
          })),
          complexity: (d.complexity as string) || 'moderado',
          problemType: (d.problemType as string) || 'desconhecido',
          strategy: (d.strategy as string) || '',
        })
      }
      break

    case 'agent_start':
      store.setCurrentAgent(d.agent as AgentType)
      store.addAgentResult({
        agent: d.agent as AgentType,
        status: 'running',
        output: '',
        timestamp: Date.now(),
      })
      break

    case 'agent_complete':
      store.updateAgentResult(d.agent as AgentType, {
        status: 'completed',
        output: (d.output as string) || '',
        duration: (d.duration as number) || 0,
      })
      break

    case 'agent_error':
      store.updateAgentResult(d.agent as AgentType, {
        status: 'error',
        output: (d.error as string) || 'Erro desconhecido',
        duration: (d.duration as number) || 0,
      })
      break

    case 'adjustments':
      if (Array.isArray(d)) {
        d.forEach((adj: Record<string, string>) => {
          store.addDynamicAdjustment({
            type: (adj.type as 'reexecute') || 'reexecute',
            agent: adj.agent as AgentType,
            reason: adj.reason || '',
            timestamp: Date.now(),
          })
        })
      }
      break

    case 'final_result':
      store.setFinalResult({
        problem: (d.problem as string) || '',
        rootCause: (d.rootCause as string) || '',
        solution: (d.solution as string) || '',
        correctedCode: (d.correctedCode as string) || '',
        prevention: (d.prevention as string) || '',
      })
      break

    case 'done':
      store.setIsRunning(false)
      store.setCurrentAgent(null)
      break

    case 'error':
      console.error('Orchestrator error:', d.message)
      store.setIsRunning(false)
      break
  }
}
