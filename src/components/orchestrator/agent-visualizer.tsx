'use client'

import { useOrchestratorStore, AGENT_CONFIG, type AgentType } from '@/lib/orchestrator-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Brain, 
  Cpu, 
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const AGENT_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  'amber': { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-500', glow: 'shadow-amber-500/20' },
  'red': { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-500', glow: 'shadow-red-500/20' },
  'blue': { bg: 'bg-sky-500/10', border: 'border-sky-500/30', text: 'text-sky-500', glow: 'shadow-sky-500/20' },
  'green': { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-500', glow: 'shadow-green-500/20' },
  'emerald': { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-500', glow: 'shadow-emerald-500/20' },
  'teal': { bg: 'bg-teal-500/10', border: 'border-teal-500/30', text: 'text-teal-500', glow: 'shadow-teal-500/20' },
  'orange': { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-500', glow: 'shadow-orange-500/20' },
  'purple': { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-500', glow: 'shadow-purple-500/20' },
  'slate': { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-500', glow: 'shadow-slate-500/20' },
}

function AgentCard({ agentType, status, reason }: { agentType: AgentType; status: 'idle' | 'running' | 'completed' | 'error' | 'skipped'; reason?: string }) {
  const config = AGENT_CONFIG[agentType]
  const colors = AGENT_COLORS[config.color] || AGENT_COLORS['slate']
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`
        relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-300
        ${status === 'running' ? `${colors.bg} ${colors.border} shadow-lg ${colors.glow}` : 
          status === 'completed' ? 'bg-background/50 border-border/50' : 
          status === 'error' ? 'bg-red-500/5 border-red-500/20' :
          'bg-background/30 border-border/30'}
      `}
    >
      {/* Pulsing indicator for running agent */}
      {status === 'running' && (
        <motion.div
          className={`absolute inset-0 rounded-xl ${colors.bg}`}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      
      <div className={`
        relative flex h-9 w-9 items-center justify-center rounded-lg text-lg
        ${status === 'running' ? colors.bg : status === 'completed' ? 'bg-green-500/10' : 'bg-muted/50'}
      `}>
        {status === 'running' ? (
          <Loader2 className={`h-4 w-4 animate-spin ${colors.text}`} />
        ) : status === 'completed' ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : status === 'error' ? (
          <XCircle className="h-4 w-4 text-red-500" />
        ) : (
          <span className="text-sm">{config.icon}</span>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${status === 'running' ? colors.text : ''}`}>
            {config.name}
          </span>
          <Badge 
            variant={status === 'running' ? 'default' : status === 'completed' ? 'secondary' : 'outline'}
            className={`text-[9px] h-4 px-1.5 ${
              status === 'running' ? `${colors.bg} ${colors.text} border-0` : ''
            }`}
          >
            {status === 'running' ? 'Executando' : 
             status === 'completed' ? 'Concluído' :
             status === 'error' ? 'Erro' : 'Aguardando'}
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
          {reason || config.description}
        </p>
      </div>
    </motion.div>
  )
}

export function AgentVisualizer() {
  const store = useOrchestratorStore()
  const plan = store.executionPlan
  const agentResults = store.agentResults
  const currentAgent = store.currentAgent
  const strategicAnalysis = store.strategicAnalysis
  const isRunning = store.isRunning

  // Calculate progress
  const completedAgents = agentResults.filter(r => r.status === 'completed').length
  const totalAgents = plan?.steps.length || 0
  const progressPercent = totalAgents > 0 ? (completedAgents / totalAgents) * 100 : 0

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10">
              <Brain className="h-4 w-4 text-purple-500" />
            </div>
            Orquestração
          </CardTitle>
          {isRunning && (
            <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              Em execução
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 overflow-y-auto max-h-[calc(100vh-240px)] pr-1">
        {/* Strategic Analysis */}
        {strategicAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 p-3 rounded-xl border border-border/50 bg-background/50"
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <Cpu className="h-4 w-4 text-purple-500" />
              Análise Estratégica
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Complexidade</div>
                <div className="text-sm font-medium text-amber-600 dark:text-amber-400 capitalize">
                  {strategicAnalysis.complexity}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-sky-500/5 border border-sky-500/20">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Tipo</div>
                <div className="text-sm font-medium text-sky-600 dark:text-sky-400 capitalize">
                  {strategicAnalysis.problemType}
                </div>
              </div>
            </div>
            
            {strategicAnalysis.strategy && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {strategicAnalysis.strategy}
              </p>
            )}
          </motion.div>
        )}

        {/* Progress */}
        {totalAgents > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">{completedAgents}/{totalAgents} agentes</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        )}

        {/* Agent Flow */}
        <div className="space-y-2">
          {plan ? (
            <AnimatePresence mode="popLayout">
              {plan.steps.map((step, index) => {
                const result = agentResults.find(r => r.agent === step.agent)
                const status = step.agent === currentAgent && !result ? 'running' :
                  result?.status || 'idle'
                
                return (
                  <div key={`${step.agent}-${index}`}>
                    <AgentCard 
                      agentType={step.agent} 
                      status={status}
                      reason={step.reason}
                    />
                    {index < plan.steps.length - 1 && (
                      <div className="flex justify-center py-1">
                        <ArrowRight className="h-3 w-3 text-muted-foreground/30 rotate-90" />
                      </div>
                    )}
                  </div>
                )
              })}
            </AnimatePresence>
          ) : (
            <div className="text-center py-8 space-y-3">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/30">
                  <Brain className="h-8 w-8 text-muted-foreground/30" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nenhum plano ativo</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Insira o código e clique em &quot;Iniciar Debug&quot;
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Adjustments */}
        {store.dynamicAdjustments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2 p-3 rounded-xl border border-orange-500/20 bg-orange-500/5"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-orange-600 dark:text-orange-400">
              <Clock className="h-4 w-4" />
              Ajustes Dinâmicos
            </div>
            {store.dynamicAdjustments.map((adj, i) => (
              <p key={i} className="text-xs text-muted-foreground">
                Re-executando <span className="font-medium">{adj.agent}</span>: {adj.reason}
              </p>
            ))}
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}
