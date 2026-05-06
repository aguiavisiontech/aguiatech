'use client'

import { useOrchestratorStore } from '@/lib/orchestrator-state'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle2,
  Bug,
  Target,
  Wrench,
  FileCode,
  Shield,
  Copy,
  Check,
} from 'lucide-react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'

export function FinalResult() {
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

  if (!finalResult) {
    return null
  }

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
        {/* Header with success badge */}
        <div className="px-6 pt-5 pb-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 border border-green-500/20">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Resultado Final Consolidado</h3>
                <p className="text-xs text-muted-foreground">Solução gerada pelo sistema multi-agente</p>
              </div>
            </div>
            <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
              Concluído
            </Badge>
          </div>
        </div>

        <CardContent className="p-6 space-y-4">
          {/* Info sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sections.map((section) => {
              const colors = colorMap[section.color] || colorMap.amber
              return (
                <motion.div
                  key={section.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-4 rounded-xl border border-border/50 ${colors.bg}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <section.icon className={`h-4 w-4 ${colors.icon}`} />
                    <span className={`text-sm font-semibold ${colors.text}`}>{section.label}</span>
                  </div>
                  <div className="text-sm text-muted-foreground leading-relaxed prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{section.content}</ReactMarkdown>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Corrected Code */}
          {finalResult.correctedCode && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border/50 bg-background/50 overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">Código Corrigido</span>
                </div>
                <button
                  onClick={copyCode}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted/50"
                >
                  {copiedCode ? (
                    <>
                      <Check className="h-3 w-3 text-green-500" />
                      <span className="text-green-500">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copiar
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed">
                <code>{finalResult.correctedCode}</code>
              </pre>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
