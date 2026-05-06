'use client'

import { useOrchestratorStore } from '@/lib/orchestrator-state'
import { useOrchestrator } from '@/hooks/use-orchestrator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Code2, 
  Play, 
  Square, 
  RotateCcw, 
  FileCode, 
  AlertTriangle, 
  Target, 
  Zap,
  Loader2,
} from 'lucide-react'
import { motion } from 'framer-motion'

const LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'Go', 'Rust',
  'Ruby', 'PHP', 'Swift', 'Kotlin', 'SQL', 'HTML/CSS', 'Shell/Bash', 'Outro',
]

export function DebugInput() {
  const store = useOrchestratorStore()
  const { startOrchestration, stopOrchestration } = useOrchestrator()
  const isRunning = store.isRunning

  const handleSubmit = () => {
    if (!store.codigo.trim()) return
    startOrchestration()
  }

  const handleStop = () => {
    stopOrchestration()
  }

  const handleReset = () => {
    stopOrchestration()
    store.resetAll()
    store.resetInput()
  }

  const canSubmit = store.codigo.trim().length > 0 && !isRunning

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
            <Code2 className="h-4 w-4 text-amber-500" />
          </div>
          Contexto do Problema
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 overflow-y-auto max-h-[calc(100vh-240px)] pr-1">
        {/* Language selector */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Linguagem</Label>
          <Select value={store.linguagem} onValueChange={store.setLinguagem} disabled={isRunning}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Selecione a linguagem" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map(lang => (
                <SelectItem key={lang} value={lang.toLowerCase()}>{lang}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Code input */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <FileCode className="h-3 w-3" />
            Código
            <Badge variant="destructive" className="h-4 px-1 text-[9px] ml-1">Obrigatório</Badge>
          </Label>
          <Textarea
            value={store.codigo}
            onChange={(e) => store.setCodigo(e.target.value)}
            placeholder="Cole o código com problema aqui..."
            className="min-h-[200px] font-mono text-sm bg-background/50 resize-y leading-relaxed"
            disabled={isRunning}
          />
        </div>

        {/* Expected result */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Target className="h-3 w-3" />
            Resultado Esperado
          </Label>
          <Input
            value={store.resultadoEsperado}
            onChange={(e) => store.setResultadoEsperado(e.target.value)}
            placeholder="O que o código deveria fazer?"
            className="h-9 bg-background/50"
            disabled={isRunning}
          />
        </div>

        {/* Current result */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <AlertTriangle className="h-3 w-3" />
            Resultado Atual
          </Label>
          <Input
            value={store.resultadoAtual}
            onChange={(e) => store.setResultadoAtual(e.target.value)}
            placeholder="O que está acontecendo de errado?"
            className="h-9 bg-background/50"
            disabled={isRunning}
          />
        </div>

        {/* Errors */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Zap className="h-3 w-3" />
            Mensagens de Erro
          </Label>
          <Textarea
            value={store.erros}
            onChange={(e) => store.setErros(e.target.value)}
            placeholder="Mensagens de erro, stack traces, logs..."
            className="min-h-[80px] font-mono text-xs bg-background/50 resize-y leading-relaxed"
            disabled={isRunning}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {isRunning ? (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
              <Button
                onClick={handleStop}
                variant="destructive"
                className="w-full h-10 font-medium gap-2"
              >
                <Square className="h-4 w-4" />
                Parar
              </Button>
            </motion.div>
          ) : (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full h-10 bg-amber-500 hover:bg-amber-600 text-white font-medium gap-2"
              >
                <Play className="h-4 w-4" />
                Iniciar Debug
              </Button>
            </motion.div>
          )}
          <Button
            onClick={handleReset}
            variant="outline"
            disabled={isRunning}
            className="h-10 gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Limpar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
