'use client'

import { useOrchestratorStore, AGENT_CONFIG, type AgentType } from '@/lib/orchestrator-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  ClipboardList,
  Clock,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'

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
      className="rounded-xl border border-border/50 bg-card/50 overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors"
      >
        <span className="text-base">{config.icon}</span>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{config.name}</span>
            {status === 'completed' && (
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            )}
            {status === 'error' && (
              <XCircle className="h-3.5 w-3.5 text-red-500" />
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">{config.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {duration && (
            <Badge variant="outline" className="text-[9px] h-4 px-1.5 gap-1">
              <Clock className="h-2.5 w-2.5" />
              {(duration / 1000).toFixed(1)}s
            </Badge>
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && output && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-3 pb-3 pt-0">
              <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed p-3 rounded-lg bg-background/50 border border-border/30 overflow-hidden">
                <ReactMarkdown>{output}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function AgentOutput() {
  const store = useOrchestratorStore()
  const agentResults = store.agentResults
  const finalResult = store.finalResult

  if (agentResults.length === 0 && !finalResult) {
    return (
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10">
              <ClipboardList className="h-4 w-4 text-teal-500" />
            </div>
            Resultados dos Agentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 space-y-3">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/30">
                <ClipboardList className="h-8 w-8 text-muted-foreground/30" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nenhum resultado ainda</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Os resultados aparecerão aqui conforme os agentes forem executados
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10">
            <ClipboardList className="h-4 w-4 text-teal-500" />
          </div>
          Resultados dos Agentes
          {agentResults.length > 0 && (
            <Badge variant="secondary" className="text-[10px] h-4 ml-1">
              {agentResults.filter(r => r.status === 'completed').length} concluídos
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-y-auto max-h-[calc(100vh-240px)] pr-1">
        <div className="space-y-3">
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
      </CardContent>
    </Card>
  )
}
