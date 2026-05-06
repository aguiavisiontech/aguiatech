'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain,
  Minimize2,
  Scissors,
  Target,
  MessageCircle,
  GraduationCap,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BookOpen,
  Lightbulb,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Database,
  Code2,
  ArrowRight,
  Sparkles,
  Shield,
  Eye,
  EyeOff,
  Flame,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'

// ===== Types =====
interface ExemploDiretriz {
  id: string
  diretrizId: number
  tipo: 'bom' | 'ruim'
  titulo: string
  descricao: string
  codigo?: string | null
  explicacao?: string | null
  ordem: number
  ativo: boolean
}

interface DiretrizIA {
  id: string
  principio: number
  nome: string
  icone: string
  cor: string
  descricao: string
  detalhes: string | null
  ativa: boolean
  aderencia: number
  usoContagem: number
  observacoes: string | null
  createdAt: string
  updatedAt: string
  exemplos: ExemploDiretriz[]
}

// ===== Constants =====
const ICONE_MAP: Record<string, React.ElementType> = {
  Brain,
  Minimize2,
  Scissors,
  Target,
  MessageCircle,
}

const COR_MAP: Record<string, {
  bg: string
  text: string
  border: string
  lightBg: string
  badge: string
  progress: string
  ring: string
}> = {
  amber: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-300 dark:border-amber-700',
    lightBg: 'bg-amber-50 dark:bg-amber-900/10',
    badge: 'border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400',
    progress: '[&>div]:bg-amber-500',
    ring: 'ring-amber-300',
  },
  emerald: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-300 dark:border-emerald-700',
    lightBg: 'bg-emerald-50 dark:bg-emerald-900/10',
    badge: 'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400',
    progress: '[&>div]:bg-emerald-500',
    ring: 'ring-emerald-300',
  },
  sky: {
    bg: 'bg-sky-100 dark:bg-sky-900/30',
    text: 'text-sky-600 dark:text-sky-400',
    border: 'border-sky-300 dark:border-sky-700',
    lightBg: 'bg-sky-50 dark:bg-sky-900/10',
    badge: 'border-sky-300 text-sky-700 dark:border-sky-700 dark:text-sky-400',
    progress: '[&>div]:bg-sky-500',
    ring: 'ring-sky-300',
  },
  rose: {
    bg: 'bg-rose-100 dark:bg-rose-900/30',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-300 dark:border-rose-700',
    lightBg: 'bg-rose-50 dark:bg-rose-900/10',
    badge: 'border-rose-300 text-rose-700 dark:border-rose-700 dark:text-rose-400',
    progress: '[&>div]:bg-rose-500',
    ring: 'ring-rose-300',
  },
  violet: {
    bg: 'bg-violet-100 dark:bg-violet-900/30',
    text: 'text-violet-600 dark:text-violet-400',
    border: 'border-violet-300 dark:border-violet-700',
    lightBg: 'bg-violet-50 dark:bg-violet-900/10',
    badge: 'border-violet-300 text-violet-700 dark:border-violet-700 dark:text-violet-400',
    progress: '[&>div]:bg-violet-500',
    ring: 'ring-violet-300',
  },
}

// ===== Helpers =====
function parseJSON<T>(str: string | null, fallback: T): T {
  if (!str) return fallback
  try { return JSON.parse(str) } catch { return fallback }
}

function getAderenciaLabel(val: number): { label: string; cor: string } {
  if (val >= 90) return { label: 'Excelente', cor: 'text-emerald-600 dark:text-emerald-400' }
  if (val >= 75) return { label: 'Bom', cor: 'text-amber-600 dark:text-amber-400' }
  if (val >= 50) return { label: 'Moderado', cor: 'text-yellow-600 dark:text-yellow-400' }
  return { label: 'Precisa Melhorar', cor: 'text-red-600 dark:text-red-400' }
}

// ===== Principle Card =====
function CartaoPrincipio({
  diretriz,
  expandido,
  onToggle,
}: {
  diretriz: DiretrizIA
  expandido: boolean
  onToggle: () => void
}) {
  const cores = COR_MAP[diretriz.cor] ?? COR_MAP.amber
  const Icon = ICONE_MAP[diretriz.icone] ?? Brain
  const detalhes = parseJSON<{ pontos: string[]; teste: string }>(diretriz.detalhes, { pontos: [], teste: '' })
  const aderenciaInfo = getAderenciaLabel(diretriz.aderencia)
  const exemplosBons = diretriz.exemplos.filter(e => e.tipo === 'bom')
  const exemplosRuins = diretriz.exemplos.filter(e => e.tipo === 'ruim')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (diretriz.principio - 1) * 0.08 }}
    >
      <Card className={`overflow-hidden border-l-4 ${cores.border} hover:shadow-lg transition-all duration-300`}>
        {/* Header */}
        <CardHeader className="pb-3 cursor-pointer" onClick={onToggle}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`size-11 rounded-xl flex items-center justify-center shrink-0 ${cores.bg} ring-2 ${cores.ring} ring-offset-2 ring-offset-background`}>
                <Icon className={`size-5 ${cores.text}`} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-[9px] h-4 px-1.5 font-mono ${cores.badge}`}>
                    #{diretriz.principio}
                  </Badge>
                  <CardTitle className="text-base">{diretriz.nome}</CardTitle>
                </div>
                <CardDescription className="text-xs mt-0.5 line-clamp-2">{diretriz.descricao}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Aderência mini */}
              <div className="flex flex-col items-end gap-1">
                <span className={`text-xs font-semibold ${aderenciaInfo.cor}`}>
                  {diretriz.aderencia}%
                </span>
                <span className="text-[8px] text-muted-foreground">{aderenciaInfo.label}</span>
              </div>
              {expandido ? (
                <ChevronDown className="size-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="size-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CardHeader>

        {/* Progress bar */}
        <div className="px-6 -mt-1">
          <Progress value={diretriz.aderencia} className={`h-1.5 ${cores.progress}`} />
        </div>

        {/* Expandable content */}
        <AnimatePresence>
          {expandido && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <CardContent className="pt-4 space-y-4">
                {/* Key Points */}
                {detalhes.pontos.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="size-3" />
                      Pontos-Chave
                    </h4>
                    <div className="space-y-1.5">
                      {detalhes.pontos.map((ponto, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <CheckCircle2 className={`size-3.5 shrink-0 mt-0.5 ${cores.text}`} />
                          <span className="text-foreground/80">{ponto}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Test criterion */}
                {detalhes.teste && (
                  <div className={`rounded-lg p-3 ${cores.lightBg} border ${cores.border}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Shield className={`size-3 ${cores.text}`} />
                      <span className="text-xs font-semibold">Teste de Verificação</span>
                    </div>
                    <p className="text-xs text-foreground/70">{detalhes.teste}</p>
                  </div>
                )}

                {/* Examples */}
                {(exemplosRuins.length > 0 || exemplosBons.length > 0) && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Code2 className="size-3" />
                      Exemplos Práticos
                    </h4>
                    
                    {/* Bad examples */}
                    {exemplosRuins.map((ex) => (
                      <div key={ex.id} className="rounded-lg border border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-900/10 overflow-hidden">
                        <div className="px-3 py-2 bg-red-100/80 dark:bg-red-900/20 flex items-center gap-2">
                          <XCircle className="size-3.5 text-red-500" />
                          <span className="text-xs font-semibold text-red-700 dark:text-red-400">{ex.titulo}</span>
                          <Badge variant="outline" className="text-[8px] h-3.5 border-red-300 text-red-600 dark:border-red-700 dark:text-red-400">
                            RUIM
                          </Badge>
                        </div>
                        <div className="px-3 py-2.5 space-y-2">
                          <p className="text-xs text-foreground/70">{ex.descricao}</p>
                          {ex.codigo && (
                            <pre className="text-[10px] font-mono bg-muted/60 p-2 rounded-md overflow-x-auto text-foreground/60">
                              <code>{ex.codigo}</code>
                            </pre>
                          )}
                          {ex.explicacao && (
                            <p className="text-[10px] text-red-600/80 dark:text-red-400/80 italic">
                              {ex.explicacao}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Good examples */}
                    {exemplosBons.map((ex) => (
                      <div key={ex.id} className="rounded-lg border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-900/10 overflow-hidden">
                        <div className="px-3 py-2 bg-emerald-100/80 dark:bg-emerald-900/20 flex items-center gap-2">
                          <CheckCircle2 className="size-3.5 text-emerald-500" />
                          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">{ex.titulo}</span>
                          <Badge variant="outline" className="text-[8px] h-3.5 border-emerald-300 text-emerald-600 dark:border-emerald-700 dark:text-emerald-400">
                            BOM
                          </Badge>
                        </div>
                        <div className="px-3 py-2.5 space-y-2">
                          <p className="text-xs text-foreground/70">{ex.descricao}</p>
                          {ex.codigo && (
                            <pre className="text-[10px] font-mono bg-muted/60 p-2 rounded-md overflow-x-auto text-foreground/60">
                              <code>{ex.codigo}</code>
                            </pre>
                          )}
                          {ex.explicacao && (
                            <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 italic">
                              {ex.explicacao}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Usage stats */}
                <div className="flex items-center gap-4 pt-2 border-t border-border/50 text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Flame className="size-3" />
                    <span>{diretriz.usoContagem} referências</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="size-3" />
                    <span>Aderência: {diretriz.aderencia}%</span>
                  </div>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}

// ===== Main Component =====
export function DiretrizesIA() {
  const queryClient = useQueryClient()
  const [principioExpandido, setPrincipioExpandido] = useState<number | null>(null)

  const { data: diretrizes, isLoading } = useQuery<DiretrizIA[]>({
    queryKey: ['diretrizes-ia'],
    queryFn: () => fetch('/api/diretrizes-ia').then(r => r.json()),
  })

  const seedMutation = useMutation({
    mutationFn: () => fetch('/api/diretrizes-ia/seed', { method: 'POST' }).then(r => r.json()),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['diretrizes-ia'] })
      toast.success(data.mensagem || 'Diretrizes semeadas!', {
        description: `${data.diretrizes} princípios, ${data.exemplos} exemplos`,
      })
    },
    onError: () => toast.error('Erro ao semear diretrizes'),
  })

  const togglePrincipio = (num: number) => {
    setPrincipioExpandido(prev => prev === num ? null : num)
  }

  // Computed stats
  const aderenciaMedia = useMemo(() => {
    if (!diretrizes || diretrizes.length === 0) return 0
    return Math.round(diretrizes.reduce((acc, d) => acc + d.aderencia, 0) / diretrizes.length)
  }, [diretrizes])

  const totalReferencias = useMemo(() => {
    if (!diretrizes) return 0
    return diretrizes.reduce((acc, d) => acc + d.usoContagem, 0)
  }, [diretrizes])

  const totalExemplos = useMemo(() => {
    if (!diretrizes) return 0
    return diretrizes.reduce((acc, d) => acc + d.exemplos.length, 0)
  }, [diretrizes])

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl"
      >
        <div
          className="absolute inset-0 rounded-xl"
          style={{
            background: 'linear-gradient(90deg, #8b5cf6, #ec4899, #8b5cf6, #ec4899)',
            backgroundSize: '300% 100%',
            animation: 'gradientBorder 4s ease infinite',
          }}
        />
        <div className="relative rounded-[10px] bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-6 text-white">
          {/* Shimmer overlay */}
          <div
            className="absolute inset-0 rounded-[10px] overflow-hidden pointer-events-none"
            style={{
              background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.15) 55%, transparent 60%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 3s ease-in-out infinite',
            }}
          />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎓</span>
                <div>
                  <h1 className="text-2xl font-bold">Diretrizes de IA</h1>
                  <p className="text-violet-100 text-sm">Aguiavisiontech Skills — Fork Cognitivo pt-BR</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {diretrizes && diretrizes.length === 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs h-8 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
                    onClick={() => seedMutation.mutate()}
                    disabled={seedMutation.isPending}
                  >
                    <Database className="size-3" />
                    {seedMutation.isPending ? 'Semeando...' : 'Carregar Dados'}
                  </Button>
                )}
              </div>
            </div>
            <p className="text-violet-100 text-xs max-w-xl">
              Cinco princípios comportamentais para reduzir erros comuns de LLMs em codificação.
              Baseado nas observações de Aguiavisiontech, traduzido e expandido com o 5º princípio
              inédito: <strong>Comunicação Contínua</strong>.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            titulo: 'Princípios',
            valor: diretrizes?.length ?? 0,
            icone: GraduationCap,
            cor: 'text-violet-600 dark:text-violet-400',
            bgCor: 'bg-violet-50 dark:bg-violet-900/20',
            borda: 'border-l-violet-500',
          },
          {
            titulo: 'Aderência Média',
            valor: `${aderenciaMedia}%`,
            icone: TrendingUp,
            cor: 'text-emerald-600 dark:text-emerald-400',
            bgCor: 'bg-emerald-50 dark:bg-emerald-900/20',
            borda: 'border-l-emerald-500',
          },
          {
            titulo: 'Exemplos',
            valor: totalExemplos,
            icone: Code2,
            cor: 'text-rose-600 dark:text-rose-400',
            bgCor: 'bg-rose-50 dark:bg-rose-900/20',
            borda: 'border-l-rose-500',
          },
          {
            titulo: 'Referências',
            valor: totalReferencias,
            icone: BookOpen,
            cor: 'text-amber-600 dark:text-amber-400',
            bgCor: 'bg-amber-50 dark:bg-amber-900/20',
            borda: 'border-l-amber-500',
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.titulo}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
          >
            <Card className={`border-l-4 ${stat.borda} hover:shadow-md transition-shadow`}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className={`size-9 rounded-lg flex items-center justify-center ${stat.bgCor}`}>
                  <stat.icone className={`size-4 ${stat.cor}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.titulo}</p>
                  <p className="text-lg font-bold tabular-nums">{stat.valor}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Aderência Overview Bar */}
      {diretrizes && diretrizes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="size-4 text-violet-500" />
                Visão Geral de Aderência
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {diretrizes.map((d) => {
                  const cores = COR_MAP[d.cor] ?? COR_MAP.amber
                  const Icon = ICONE_MAP[d.icone] ?? Brain
                  return (
                    <div key={d.id} className="flex items-center gap-3">
                      <div className={`size-7 rounded-md flex items-center justify-center shrink-0 ${cores.bg}`}>
                        <Icon className={`size-3.5 ${cores.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-medium truncate">{d.nome}</span>
                          <span className="text-xs font-semibold tabular-nums">{d.aderencia}%</span>
                        </div>
                        <Progress value={d.aderencia} className={`h-1.5 ${cores.progress}`} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Principles Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Lightbulb className="size-5 text-violet-600 dark:text-violet-400" />
            Os Cinco Princípios
          </h2>
          <div className="flex items-center gap-2">
            {diretrizes && diretrizes.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs gap-1 text-muted-foreground hover:text-violet-600"
                    onClick={() => setPrincipioExpandido(prev => prev === null ? 1 : null)}
                  >
                    {principioExpandido === null ? (
                      <>
                        <Eye className="size-3" />
                        Expandir Todos
                      </>
                    ) : (
                      <>
                        <EyeOff className="size-3" />
                        Recolher Todos
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Expandir/recolher todos os princípios</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded w-48 mb-2" />
                  <div className="h-4 bg-muted rounded w-80" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : diretrizes && diretrizes.length > 0 ? (
          <div className="space-y-3">
            {diretrizes.map((d) => (
              <CartaoPrincipio
                key={d.id}
                diretriz={d}
                expandido={principioExpandido === d.principio}
                onToggle={() => togglePrincipio(d.principio)}
              />
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2">
            <CardContent className="py-12 flex flex-col items-center justify-center text-center">
              <div className="size-16 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4">
                <GraduationCap className="size-7 text-violet-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhuma diretriz carregada</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md">
                Carregue os 5 princípios Aguiavisiontech Skills para começar a acompanhar
                a aderência do seu agente de IA às melhores práticas de codificação.
              </p>
              <Button
                onClick={() => seedMutation.mutate()}
                disabled={seedMutation.isPending}
                className="gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white"
              >
                {seedMutation.isPending ? (
                  <RefreshCw className="size-4 animate-spin" />
                ) : (
                  <Database className="size-4" />
                )}
                {seedMutation.isPending ? 'Carregando...' : 'Carregar Princípios'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Aguiavisiontech Quote */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-gradient-to-br from-violet-50/50 to-fuchsia-50/50 dark:from-violet-900/10 dark:to-fuchsia-900/10 border-violet-200/50 dark:border-violet-800/30">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="size-8 rounded-full bg-violet-200/50 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                <Sparkles className="size-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <blockquote className="text-sm text-foreground/80 italic leading-relaxed">
                  &quot;LLMs são excepcionalmente bons em executar em loop até atingir objetivos específicos...
                  Não diga o que fazer; dê critérios de sucesso e observe.&quot;
                </blockquote>
                <p className="text-xs text-muted-foreground mt-2">
                  — Aguiavisiontech
                </p>
                <Separator className="my-3" />
                <p className="text-[10px] text-muted-foreground">
                  Fork cognitivo de{' '}
                  <span className="font-medium text-violet-600 dark:text-violet-400">
                    aguiavisiontech/aguiavisiontech-skills
                  </span>
                  , traduzido e expandido para o ecossistema brasileiro com o 5º princípio inédito.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
