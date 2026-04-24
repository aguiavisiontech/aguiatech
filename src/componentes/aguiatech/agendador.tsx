'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock,
  Plus,
  Pencil,
  Trash2,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Timer,
  CalendarClock,
  Activity,
  Zap,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface TarefaAgendada {
  id: string
  nome: string
  descricao: string | null
  cron: string
  ativa: boolean
  ultimaExecucao: string | null
  proximaExecucao: string | null
  createdAt: string
  updatedAt: string
  historico?: HistoricoTarefa[]
}

interface HistoricoTarefa {
  id: string
  tarefaId: string
  status: string
  resultado: string | null
  erro: string | null
  duracao: number | null
  executadaEm: string
}

function BadgeStatus({ status }: { status: string }) {
  switch (status) {
    case 'sucesso':
      return (
        <Badge className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
          <CheckCircle2 className="size-2.5 mr-1" />
          Sucesso
        </Badge>
      )
    case 'erro':
      return (
        <Badge className="text-[10px] bg-destructive/10 text-destructive dark:bg-destructive/20">
          <XCircle className="size-2.5 mr-1" />
          Erro
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="text-[10px]">
          <AlertCircle className="size-2.5 mr-1" />
          Pendente
        </Badge>
      )
  }
}

// Helper to describe cron in Portuguese
function descreverCron(cron: string): string {
  if (!cron) return ''
  const parts = cron.trim().split(/\s+/)
  if (parts.length < 5) return cron

  const [minuto, hora, diaMes, mes, diaSemana] = parts

  if (minuto.startsWith('*/')) return `A cada ${minuto.slice(2)} minutos`
  if (hora.startsWith('*/')) return `A cada ${hora.slice(2)} horas`
  if (minuto === '0' && hora === '0' && diaMes === '*' && mes === '*' && diaSemana === '*') return 'Diariamente à meia-noite'
  if (minuto === '0' && hora !== '*' && diaMes === '*' && mes === '*' && diaSemana === '*') return `Diariamente às ${hora}:00`
  if (diaSemana === '1' && minuto === '0' && hora !== '*') return `Toda segunda às ${hora}:00`
  return cron
}

export function Agendador() {
  const queryClient = useQueryClient()
  const [dialogoAberto, setDialogoAberto] = useState(false)
  const [editando, setEditando] = useState<TarefaAgendada | null>(null)
  const [formulario, setFormulario] = useState({
    nome: '',
    descricao: '',
    cron: '',
  })

  const { data: tarefas, isLoading } = useQuery<TarefaAgendada[]>({
    queryKey: ['tarefas-agendadas'],
    queryFn: () => fetch('/api/tarefas-agendadas').then(r => r.json()),
  })

  const criarTarefa = useMutation({
    mutationFn: (dados: typeof formulario) =>
      fetch('/api/tarefas-agendadas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas-agendadas'] })
      setDialogoAberto(false)
      resetFormulario()
    },
  })

  const atualizarTarefa = useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: Partial<typeof formulario & { ativa?: boolean }> }) =>
      fetch(`/api/tarefas-agendadas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas-agendadas'] })
      setDialogoAberto(false)
      setEditando(null)
      resetFormulario()
    },
  })

  const deletarTarefa = useMutation({
    mutationFn: (id: string) => fetch(`/api/tarefas-agendadas/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas-agendadas'] })
    },
  })

  const toggleTarefa = useMutation({
    mutationFn: ({ id, ativa }: { id: string; ativa: boolean }) =>
      fetch(`/api/tarefas-agendadas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativa }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefas-agendadas'] })
    },
  })

  const resetFormulario = () => {
    setFormulario({ nome: '', descricao: '', cron: '' })
  }

  const abrirEdicao = (tarefa: TarefaAgendada) => {
    setEditando(tarefa)
    setFormulario({
      nome: tarefa.nome,
      descricao: tarefa.descricao ?? '',
      cron: tarefa.cron,
    })
    setDialogoAberto(true)
  }

  // Computed stats
  const totalTarefas = tarefas?.length ?? 0
  const tarefasAtivas = tarefas?.filter(t => t.ativa).length ?? 0
  const tarefasConcluidas = tarefas?.filter(t => t.ultimaExecucao).length ?? 0

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header com gradiente */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-br from-rose-600 via-rose-700 to-pink-800 p-5 text-white dark:from-rose-500 dark:via-rose-600 dark:to-pink-700"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-white/5 rounded-full" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-white/20 flex items-center justify-center shadow-md backdrop-blur-sm">
              <CalendarClock className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Agendador</h1>
              <p className="text-rose-200 text-sm">Gerencie tarefas agendadas e automatizadas</p>
            </div>
          </div>
          <Dialog open={dialogoAberto} onOpenChange={(aberto) => {
            setDialogoAberto(aberto)
            if (!aberto) { setEditando(null); resetFormulario() }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-white/20 hover:bg-white/30 text-white gap-2 backdrop-blur-sm border border-white/20">
                <Plus className="size-4" />
                Nova Tarefa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editando ? 'Editar Tarefa' : 'Nova Tarefa Agendada'}</DialogTitle>
                <DialogDescription>
                  {editando ? 'Altere os dados da tarefa' : 'Configure uma nova tarefa automatizada'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Zap className="size-3.5 text-amber-600 dark:text-amber-400" />
                    Nome
                  </Label>
                  <Input
                    value={formulario.nome}
                    onChange={(e) => setFormulario(f => ({ ...f, nome: e.target.value }))}
                    placeholder="Nome da tarefa"
                    className="focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={formulario.descricao}
                    onChange={(e) => setFormulario(f => ({ ...f, descricao: e.target.value }))}
                    placeholder="Descrição do que a tarefa faz"
                    rows={2}
                    className="focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Clock className="size-3.5 text-amber-600 dark:text-amber-400" />
                    Expressão Cron
                  </Label>
                  <Input
                    value={formulario.cron}
                    onChange={(e) => setFormulario(f => ({ ...f, cron: e.target.value }))}
                    placeholder="*/5 * * * * (a cada 5 minutos)"
                    className="font-mono focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Formato: minuto hora dia-mês mês dia-semana — {formulario.cron ? descreverCron(formulario.cron) : 'ex: a cada 5 minutos'}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setDialogoAberto(false); setEditando(null); resetFormulario() }}>
                  Cancelar
                </Button>
                <Button
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={() => {
                    if (editando) {
                      atualizarTarefa.mutate({ id: editando.id, dados: formulario })
                    } else {
                      criarTarefa.mutate(formulario)
                    }
                  }}
                  disabled={!formulario.nome || !formulario.cron}
                >
                  {editando ? 'Salvar' : 'Criar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/50 border border-border/50">
            <div className="size-8 rounded-md bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
              <CalendarClock className="size-4 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-lg font-bold">{isLoading ? '-' : totalTarefas}</p>
              <p className="text-[10px] text-muted-foreground">Total</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/50 border border-border/50">
            <div className="size-8 rounded-md bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Play className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-lg font-bold">{isLoading ? '-' : tarefasAtivas}</p>
              <p className="text-[10px] text-muted-foreground">Ativas</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/50 border border-border/50">
            <div className="size-8 rounded-md bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <CheckCircle2 className="size-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-lg font-bold">{isLoading ? '-' : tarefasConcluidas}</p>
              <p className="text-[10px] text-muted-foreground">Executadas</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Lista de Tarefas */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3 p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <Skeleton className="size-5 rounded" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <Skeleton className="h-3 w-48" />
            </div>
          ))}
        </div>
      ) : !tarefas || tarefas.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <div className="relative mb-4">
                <div className="size-20 rounded-full bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center">
                  <CalendarClock className="size-10 text-rose-400 dark:text-rose-500" />
                </div>
                <div className="absolute -bottom-1 -right-1 size-7 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center border-2 border-background">
                  <Plus className="size-3.5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <p className="font-medium text-foreground">Nenhuma tarefa agendada</p>
              <p className="text-xs mt-1 max-w-xs text-center">Crie tarefas automatizadas para executar ações periódicas como limpeza de memória, relatórios e mais</p>
              <Button
                variant="outline"
                className="mt-4 gap-2 border-rose-300 hover:bg-rose-50 dark:border-rose-700 dark:hover:bg-rose-900/20"
                onClick={() => setDialogoAberto(true)}
              >
                <Plus className="size-4" />
                Criar Primeira Tarefa
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {tarefas.map((tarefa, i) => (
              <motion.div
                key={tarefa.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className={`hover:shadow-md transition-all border-l-4 ${
                  tarefa.ativa
                    ? 'border-l-rose-500 hover:border-rose-300 dark:hover:border-rose-700'
                    : 'border-l-slate-300 dark:border-l-slate-700 opacity-60'
                }`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Visual status indicator */}
                        <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${
                          tarefa.ativa
                            ? 'bg-emerald-100 dark:bg-emerald-900/30'
                            : 'bg-muted/50'
                        }`}>
                          {tarefa.ativa ? (
                            <Play className="size-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Pause className="size-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm flex items-center gap-2">
                            {tarefa.nome}
                            {tarefa.ativa && (
                              <Badge className="text-[9px] h-4 px-1.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-0">
                                <div className="size-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                                Ativa
                              </Badge>
                            )}
                          </CardTitle>
                          {tarefa.descricao && (
                            <CardDescription className="text-xs mt-0.5">
                              {tarefa.descricao}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Switch
                          checked={tarefa.ativa}
                          onCheckedChange={(checked) =>
                            toggleTarefa.mutate({ id: tarefa.id, ativa: checked })
                          }
                          className="data-[state=checked]:bg-amber-600"
                        />
                        <Badge variant="outline" className="text-[10px] font-mono border-rose-300 text-rose-700 dark:border-rose-700 dark:text-rose-400">
                          {tarefa.cron}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-amber-600"
                          onClick={() => abrirEdicao(tarefa)}
                        >
                          <Pencil className="size-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-destructive">
                              <Trash2 className="size-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deletarTarefa.mutate(tarefa.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Cron description */}
                    <div className="flex items-center gap-2 text-xs">
                      <Clock className="size-3 text-rose-500" />
                      <span className="text-muted-foreground">{descreverCron(tarefa.cron)}</span>
                    </div>

                    {/* Execution times */}
                    <div className="flex items-center gap-4 text-[10px] text-muted-foreground flex-wrap">
                      {tarefa.ultimaExecucao && (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="size-2.5 text-emerald-500" />
                          Última: {new Date(tarefa.ultimaExecucao).toLocaleString('pt-BR')}
                        </span>
                      )}
                      {tarefa.proximaExecucao && tarefa.ativa && (
                        <span className="flex items-center gap-1">
                          <Timer className="size-2.5 text-amber-500" />
                          Próxima: {new Date(tarefa.proximaExecucao).toLocaleString('pt-BR')}
                        </span>
                      )}
                      {!tarefa.ultimaExecucao && !tarefa.proximaExecucao && (
                        <span className="flex items-center gap-1">
                          <Activity className="size-2.5" />
                          Ainda não executada
                        </span>
                      )}
                    </div>

                    {/* Histórico de Execuções */}
                    {tarefa.historico && tarefa.historico.length > 0 && (
                      <Accordion type="single" collapsible>
                        <AccordionItem value="historico" className="border-none">
                          <AccordionTrigger className="py-2 text-xs hover:no-underline">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <Timer className="size-3" />
                              Histórico de Execuções ({tarefa.historico.length})
                              <Badge variant="outline" className="text-[9px] h-4 ml-1">
                                {tarefa.historico.filter(h => h.status === 'sucesso').length}/{tarefa.historico.length} sucessos
                              </Badge>
                            </span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {tarefa.historico.map((hist) => (
                                <div key={hist.id} className="flex items-start gap-2 p-2.5 bg-muted/50 rounded-md border border-border/30">
                                  <BadgeStatus status={hist.status} />
                                  <div className="flex-1 min-w-0">
                                    <p className="truncate text-xs text-muted-foreground">
                                      {hist.resultado || hist.erro || 'Sem resultado'}
                                    </p>
                                    <div className="flex gap-3 mt-0.5 text-[10px] text-muted-foreground">
                                      <span>{new Date(hist.executadaEm).toLocaleString('pt-BR')}</span>
                                      {hist.duracao && <span>{hist.duracao.toFixed(1)}s</span>}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
