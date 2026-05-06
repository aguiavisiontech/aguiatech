import { create } from 'zustand'

// Agent types matching the specification
export type AgentType = 
  | 'diagnostico'
  | 'causa-raiz'
  | 'simulacao'
  | 'correcao'
  | 'testes'
  | 'refatoracao'
  | 'riscos'
  | 'verificacao-cognitiva'
  | 'checklist'

export type AgentStatus = 'idle' | 'running' | 'completed' | 'error' | 'skipped'

export type ProblemComplexity = 'simples' | 'moderado' | 'complexo'
export type ProblemType = 'sintaxe' | 'logica' | 'integracao' | 'performance' | 'concorrencia' | 'desconhecido'

export interface AgentResult {
  agent: AgentType
  status: AgentStatus
  output: string
  timestamp: number
  duration?: number
}

export interface ExecutionPlan {
  steps: { agent: AgentType; reason: string }[]
  complexity: ProblemComplexity
  problemType: ProblemType
  strategy: string
}

export interface StrategicAnalysis {
  complexity: ProblemComplexity
  problemType: ProblemType
  strategy: string
  reasoning: string
}

export interface DynamicAdjustment {
  type: 'reexecute' | 'add_agent' | 'skip_agent' | 'compare_solutions'
  agent: AgentType
  reason: string
  timestamp: number
}

export interface FinalResult {
  problem: string
  rootCause: string
  solution: string
  correctedCode: string
  prevention: string
}

export interface OrchestratorState {
  // Input
  linguagem: string
  codigo: string
  resultadoEsperado: string
  resultadoAtual: string
  erros: string
  
  // Setters
  setLinguagem: (v: string) => void
  setCodigo: (v: string) => void
  setResultadoEsperado: (v: string) => void
  setResultadoAtual: (v: string) => void
  setErros: (v: string) => void
  resetInput: () => void
  
  // Orchestration state
  isRunning: boolean
  setIsRunning: (v: boolean) => void
  
  strategicAnalysis: StrategicAnalysis | null
  setStrategicAnalysis: (v: StrategicAnalysis | null) => void
  
  executionPlan: ExecutionPlan | null
  setExecutionPlan: (v: ExecutionPlan | null) => void
  
  agentResults: AgentResult[]
  addAgentResult: (result: AgentResult) => void
  updateAgentResult: (agent: AgentType, updates: Partial<AgentResult>) => void
  clearAgentResults: () => void
  
  dynamicAdjustments: DynamicAdjustment[]
  addDynamicAdjustment: (adjustment: DynamicAdjustment) => void
  clearDynamicAdjustments: () => void
  
  finalResult: FinalResult | null
  setFinalResult: (v: FinalResult | null) => void
  
  currentAgent: AgentType | null
  setCurrentAgent: (v: AgentType | null) => void
  
  // Full reset
  resetAll: () => void
}

export const AGENT_CONFIG: Record<AgentType, { name: string; icon: string; color: string; description: string }> = {
  'diagnostico': { name: 'Diagnóstico', icon: '🔍', color: 'amber', description: 'Identifica o problema' },
  'causa-raiz': { name: 'Causa Raiz', icon: '🎯', color: 'red', description: 'Encontra a origem' },
  'simulacao': { name: 'Simulação', icon: '⚙️', color: 'blue', description: 'Executa mentalmente o código' },
  'correcao': { name: 'Correção', icon: '🔧', color: 'green', description: 'Corrige o código' },
  'testes': { name: 'Testes', icon: '✅', color: 'emerald', description: 'Valida a solução' },
  'refatoracao': { name: 'Refatoração', icon: '♻️', color: 'teal', description: 'Melhora qualidade' },
  'riscos': { name: 'Riscos', icon: '⚠️', color: 'orange', description: 'Prevê falhas futuras' },
  'verificacao-cognitiva': { name: 'Verificação Cognitiva', icon: '🧠', color: 'purple', description: 'Valida e questiona' },
  'checklist': { name: 'Checklist', icon: '📋', color: 'slate', description: 'Previne recorrência' },
}

export const useOrchestratorStore = create<OrchestratorState>((set) => ({
  // Input defaults
  linguagem: '',
  codigo: '',
  resultadoEsperado: '',
  resultadoAtual: '',
  erros: '',
  
  setLinguagem: (v) => set({ linguagem: v }),
  setCodigo: (v) => set({ codigo: v }),
  setResultadoEsperado: (v) => set({ resultadoEsperado: v }),
  setResultadoAtual: (v) => set({ resultadoAtual: v }),
  setErros: (v) => set({ erros: v }),
  resetInput: () => set({ linguagem: '', codigo: '', resultadoEsperado: '', resultadoAtual: '', erros: '' }),
  
  // Orchestration
  isRunning: false,
  setIsRunning: (v) => set({ isRunning: v }),
  
  strategicAnalysis: null,
  setStrategicAnalysis: (v) => set({ strategicAnalysis: v }),
  
  executionPlan: null,
  setExecutionPlan: (v) => set({ executionPlan: v }),
  
  agentResults: [],
  addAgentResult: (result) => set((state) => ({ agentResults: [...state.agentResults.filter(r => r.agent !== result.agent), result] })),
  updateAgentResult: (agent, updates) => set((state) => ({
    agentResults: state.agentResults.map(r => r.agent === agent ? { ...r, ...updates } : r)
  })),
  clearAgentResults: () => set({ agentResults: [] }),
  
  dynamicAdjustments: [],
  addDynamicAdjustment: (adjustment) => set((state) => ({ dynamicAdjustments: [...state.dynamicAdjustments, adjustment] })),
  clearDynamicAdjustments: () => set({ dynamicAdjustments: [] }),
  
  finalResult: null,
  setFinalResult: (v) => set({ finalResult: v }),
  
  currentAgent: null,
  setCurrentAgent: (v) => set({ currentAgent: v }),
  
  resetAll: () => set({
    isRunning: false,
    strategicAnalysis: null,
    executionPlan: null,
    agentResults: [],
    dynamicAdjustments: [],
    finalResult: null,
    currentAgent: null,
  }),
}))
