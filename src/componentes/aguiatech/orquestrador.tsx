'use client'

import { useOrchestratorStore, AGENT_CONFIG, type AgentType } from '@/lib/orchestrator-state'
import { useOrchestrator } from '@/hooks/use-orchestrator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Code2, Play, Square, RotateCcw, FileCode, AlertTriangle, Target, Zap,
  Loader2, Brain, Cpu, Clock, CheckCircle2, XCircle, ArrowRight,
  ClipboardList, ChevronDown, ChevronUp, Copy, Check, Bug, Wrench, Shield,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

const LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'Go', 'Rust',
  'Ruby', 'PHP', 'Swift', 'Kotlin', 'SQL', 'HTML/CSS', 'Shell/Bash', 'Outro',
]

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

function AgentFlowCard({ agentType, status, reason }: { agentType: AgentType; status: string; reason?: string }) {
  const config = AGENT_CONFIG[agentType]
  const colors = AGENT_COLORS[config.color] || AGENT_COLORS['slate']
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`
        relative flex items-center gap-2.5 p-2.5 rounded-lg border transition-all duration-300
        ${status === 'running' ? `${colors.bg} ${colors.border} shadow-md ${colors.glow}` : 
          status === 'completed' ? 'bg-background/50 border-border/50' : 
          status === 'error' ? 'bg-red-500/5 border-red-500/20' :
          'bg-background/30 border-border/30'}
      `}
    >
      {status === 'running' && (
        <motion.div
          className={`absolute inset-0 rounded-lg ${colors.bg}`}
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      
      <div className={`
        relative flex h-7 w-7 items-center justify-center rounded-md text-sm
        ${status === 'running' ? colors.bg : status === 'completed' ? 'bg-green-500/10' : 'bg-muted/50'}
      `}>
        {status === 'running' ? (
          <Loader2 className={`h-3.5 w-3.5 animate-spin ${colors.text}`} />
        ) : status === 'completed' ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
        ) : status === 'error' ? (
          <XCircle className="h-3.5 w-3.5 text-red-500" />
        ) : (
          <span className="text-xs">{config.icon}</span>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-medium ${status === 'running' ? colors.text : ''}`}>
            {config.name}
          </span>
          <Badge 
            variant={status === 'running' ? 'default' : status === 'completed' ? 'secondary' : 'outline'}
            className={`text-[8px] h-3.5 px-1 ${
              status === 'running' ? `${colors.bg} ${colors.text} border-0` : ''
            }`}
          >
            {status === 'running' ? 'Executando' : 
             status === 'completed' ? 'OK' :
             status === 'error' ? 'Erro' : '-'}
          </Badge>
        </div>
        <p className="text-[10px] text-muted-foreground truncate mt-0.5">
          {reason || config.description}
        </p>
      </div>
    </motion.div>
  )
}

function AgentOutputCard({ agentType, output, status, duration }: { 
  agentType: AgentType; output: string; status: string; duration?: number 
}) {
  const [isExpanded, setIsExpanded] = useState(true)
  const config = AGENT_CONFIG[agentType]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-lg border border-border/50 bg-card/50 overflow-hidden"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2.5 p-2.5 hover:bg-muted/30 transition-colors"
      >
        <span className="text-sm">{config.icon}</span>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium">{config.name}</span>
            {status === 'completed' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
            {status === 'error' && <XCircle className="h-3 w-3 text-red-500" />}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {duration && (
            <Badge variant="outline" className="text-[8px] h-3.5 px-1 gap-0.5">
              <Clock className="h-2 w-2" />
              {(duration / 1000).toFixed(1)}s
            </Badge>
          )}
          {isExpanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && output && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-2.5 pb-2.5 pt-0">
              <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed p-3 rounded-md bg-background/50 border border-border/30 overflow-hidden">
                <ReactMarkdown>{output}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function FinalResultCard() {
  const store = useOrchestratorStore()
  const finalResult = store.finalResult
  const [copiedCode, setCopiedCode] = useState(false)

  const copyCode = () => {
    if (finalResult?.correctedCode) {
      navigator.clipboard.writeText(finalResult.correctedCode)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  if (!finalResult) return null

  const sections = [
    { icon: Bug, label: 'Problema', content: finalResult.problem, color: 'red' },
    { icon: Target, label: 'Causa Raiz', content: finalResult.rootCause, color: 'amber' },
    { icon: Wrench, label: 'Solução', content: finalResult.solution, color: 'green' },
    { icon: Shield, label: 'Prevenção', content: finalResult.prevention, color: 'teal' },
  ]

  const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
    red: { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', icon: 'text-red-500' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', icon: 'text-amber-500' },
    green: { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400', icon: 'text-green-500' },
    teal: { bg: 'bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400', icon: 'text-teal-500' },
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-card/80 to-teal-500/5 backdrop-blur-sm overflow-hidden">
        <div className="px-5 pt-4 pb-2.5 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Resultado Final Consolidado</h3>
                <p className="text-[10px] text-muted-foreground">Solução gerada pelo sistema multi-agente</p>
              </div>
            </div>
            <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 text-[10px]">
              Concluído
            </Badge>
          </div>
        </div>

        <CardContent className="p-5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {sections.map((section) => {
              const colors = colorMap[section.color] || colorMap.amber
              return (
                <motion.div
                  key={section.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-3 rounded-lg border border-border/50 ${colors.bg}`}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <section.icon className={`h-3.5 w-3.5 ${colors.icon}`} />
                    <span className={`text-xs font-semibold ${colors.text}`}>{section.label}</span>
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{section.content}</ReactMarkdown>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {finalResult.correctedCode && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-border/50 bg-background/50 overflow-hidden"
            >
              <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b border-border/50">
                <div className="flex items-center gap-1.5">
                  <FileCode className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xs font-medium">Código Corrigido</span>
                </div>
                <button
                  onClick={copyCode}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-muted/50"
                >
                  {copiedCode ? (
                    <><Check className="h-3 w-3 text-green-500" /><span className="text-green-500">Copiado!</span></>
                  ) : (
                    <><Copy className="h-3 w-3" />Copiar</>
                  )}
                </button>
              </div>
              <pre className="p-3 overflow-x-auto text-xs font-mono leading-relaxed">
                <code>{finalResult.correctedCode}</code>
              </pre>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function Orquestrador() {
  const store = useOrchestratorStore()
  const { startOrchestration, stopOrchestration } = useOrchestrator()
  const isRunning = store.isRunning
  const hasResults = store.agentResults.length > 0
  const plan = store.executionPlan
  const strategicAnalysis = store.strategicAnalysis
  const agentResults = store.agentResults
  const currentAgent = store.currentAgent
  const finalResult = store.finalResult

  const completedAgents = agentResults.filter(r => r.status === 'completed').length
  const totalAgents = plan?.steps.length || 0
  const progressPercent = totalAgents > 0 ? (completedAgents / totalAgents) * 100 : 0

  const handleSubmit = () => {
    if (!store.codigo.trim()) return
    startOrchestration()
  }

  const handleReset = () => {
    stopOrchestration()
    store.resetAll()
    store.resetInput()
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Hero */}
      {!hasResults && !isRunning && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center py-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 mb-4">
            <Zap className="h-3.5 w-3.5 text-violet-500" />
            <span className="text-xs font-medium text-violet-600 dark:text-violet-400">
              Sistema Adaptativo Inteligente
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            Orquestrador Inteligente de{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-amber-500">
              Debug
            </span>
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            O orquestrador decide dinamicamente quais agentes ativar, em qual ordem e quantas vezes 
            executar cada um, baseado na complexidade do problema.
          </p>
          
          {/* Agent cards preview */}
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {Object.entries(AGENT_CONFIG).map(([key, config]) => (
              <div key={key} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 border border-border/30 text-[10px]">
                <span>{config.icon}</span>
                <span className="font-medium">{config.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left - Input */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10">
                  <Code2 className="h-3.5 w-3.5 text-amber-500" />
                </div>
                Contexto do Problema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-muted-foreground">Linguagem</Label>
                <Select value={store.linguagem} onValueChange={store.setLinguagem} disabled={isRunning}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Selecione a linguagem" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map(lang => (
                      <SelectItem key={lang} value={lang.toLowerCase()}>{lang}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                  <FileCode className="h-3 w-3" />
                  Código
                  <Badge variant="destructive" className="h-3.5 px-1 text-[8px]">Obrigatório</Badge>
                </Label>
                <Textarea
                  value={store.codigo}
                  onChange={(e) => store.setCodigo(e.target.value)}
                  placeholder="Cole o código com problema aqui..."
                  className="min-h-[160px] font-mono text-xs bg-background/50 resize-y leading-relaxed"
                  disabled={isRunning}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                  <Target className="h-3 w-3" />
                  Resultado Esperado
                </Label>
                <Input
                  value={store.resultadoEsperado}
                  onChange={(e) => store.setResultadoEsperado(e.target.value)}
                  placeholder="O que o código deveria fazer?"
                  className="h-8 text-xs bg-background/50"
                  disabled={isRunning}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                  <AlertTriangle className="h-3 w-3" />
                  Resultado Atual
                </Label>
                <Input
                  value={store.resultadoAtual}
                  onChange={(e) => store.setResultadoAtual(e.target.value)}
                  placeholder="O que está acontecendo de errado?"
                  className="h-8 text-xs bg-background/50"
                  disabled={isRunning}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                  <Zap className="h-3 w-3" />
                  Mensagens de Erro
                </Label>
                <Textarea
                  value={store.erros}
                  onChange={(e) => store.setErros(e.target.value)}
                  placeholder="Mensagens de erro, stack traces..."
                  className="min-h-[60px] font-mono text-[10px] bg-background/50 resize-y leading-relaxed"
                  disabled={isRunning}
                />
              </div>

              <div className="flex gap-2 pt-1">
                {isRunning ? (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                    <Button onClick={stopOrchestration} variant="destructive" className="w-full h-9 text-xs font-medium gap-1.5">
                      <Square className="h-3.5 w-3.5" />
                      Parar
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                    <Button
                      onClick={handleSubmit}
                      disabled={!store.codigo.trim()}
                      className="w-full h-9 bg-violet-500 hover:bg-violet-600 text-white text-xs font-medium gap-1.5"
                    >
                      <Play className="h-3.5 w-3.5" />
                      Iniciar Debug
                    </Button>
                  </motion.div>
                )}
                <Button onClick={handleReset} variant="outline" disabled={isRunning} className="h-9 text-xs gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Limpar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle - Agent Flow */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10">
                    <Brain className="h-3.5 w-3.5 text-purple-500" />
                  </div>
                  Orquestração
                </CardTitle>
                {isRunning && (
                  <Badge className="bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 text-[9px]">
                    <Loader2 className="h-2.5 w-2.5 animate-spin mr-0.5" />
                    Ativo
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Strategic Analysis */}
              {strategicAnalysis && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2.5 p-2.5 rounded-lg border border-border/50 bg-background/50"
                >
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <Cpu className="h-3.5 w-3.5 text-purple-500" />
                    Análise Estratégica
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="p-1.5 rounded-md bg-amber-500/5 border border-amber-500/20">
                      <div className="text-[8px] text-muted-foreground uppercase tracking-wider">Complexidade</div>
                      <div className="text-xs font-medium text-amber-600 dark:text-amber-400 capitalize">
                        {strategicAnalysis.complexity}
                      </div>
                    </div>
                    <div className="p-1.5 rounded-md bg-sky-500/5 border border-sky-500/20">
                      <div className="text-[8px] text-muted-foreground uppercase tracking-wider">Tipo</div>
                      <div className="text-xs font-medium text-sky-600 dark:text-sky-400 capitalize">
                        {strategicAnalysis.problemType}
                      </div>
                    </div>
                  </div>
                  {strategicAnalysis.strategy && (
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      {strategicAnalysis.strategy}
                    </p>
                  )}
                </motion.div>
              )}

              {/* Progress */}
              {totalAgents > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-medium">{completedAgents}/{totalAgents}</span>
                  </div>
                  <Progress value={progressPercent} className="h-1.5" />
                </div>
              )}

              {/* Agent Flow */}
              <div className="space-y-1.5">
                {plan ? (
                  <AnimatePresence mode="popLayout">
                    {plan.steps.map((step, index) => {
                      const result = agentResults.find(r => r.agent === step.agent)
                      const status = step.agent === currentAgent && !result ? 'running' :
                        result?.status || 'idle'
                      
                      return (
                        <div key={`${step.agent}-${index}`}>
                          <AgentFlowCard agentType={step.agent} status={status} reason={step.reason} />
                          {index < plan.steps.length - 1 && (
                            <div className="flex justify-center py-0.5">
                              <ArrowRight className="h-2.5 w-2.5 text-muted-foreground/30 rotate-90" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </AnimatePresence>
                ) : (
                  <div className="text-center py-6 space-y-2">
                    <div className="flex justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/30">
                        <Brain className="h-6 w-6 text-muted-foreground/30" />
                      </div>
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">Nenhum plano ativo</p>
                    <p className="text-[10px] text-muted-foreground/70">
                      Insira o código e clique em &quot;Iniciar Debug&quot;
                    </p>
                  </div>
                )}
              </div>

              {/* Dynamic Adjustments */}
              {store.dynamicAdjustments.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-1.5 p-2.5 rounded-lg border border-orange-500/20 bg-orange-500/5"
                >
                  <div className="flex items-center gap-1.5 text-xs font-medium text-orange-600 dark:text-orange-400">
                    <Clock className="h-3.5 w-3.5" />
                    Ajustes Dinâmicos
                  </div>
                  {store.dynamicAdjustments.map((adj, i) => (
                    <p key={i} className="text-[10px] text-muted-foreground">
                      Re-executando <span className="font-medium">{adj.agent}</span>: {adj.reason}
                    </p>
                  ))}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right - Agent Outputs */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/10">
                  <ClipboardList className="h-3.5 w-3.5 text-teal-500" />
                </div>
                Resultados dos Agentes
                {agentResults.length > 0 && (
                  <Badge variant="secondary" className="text-[9px] h-4 ml-1">
                    {agentResults.filter(r => r.status === 'completed').length} concluídos
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {agentResults.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <div className="flex justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/30">
                      <ClipboardList className="h-6 w-6 text-muted-foreground/30" />
                    </div>
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">Nenhum resultado ainda</p>
                  <p className="text-[10px] text-muted-foreground/70">
                    Os resultados aparecerão conforme os agentes forem executados
                  </p>
                </div>
              ) : (
                <ScrollArea className="max-h-[calc(100vh-420px)]">
                  <div className="space-y-2.5 pr-2">
                    {agentResults.map((result) => (
                      <AgentOutputCard
                        key={result.agent}
                        agentType={result.agent}
                        output={result.output}
                        status={result.status}
                        duration={result.duration}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Final Result */}
      {finalResult && <FinalResultCard />}
    </div>
  )
}
