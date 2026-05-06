'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wrench,
  Search,
  Shield,
  ShieldCheck,
  Power,
  PowerOff,
  Database,
  ChevronDown,
  CheckCircle2,
  Activity,
  Zap,
  Filter,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Layers,
  Package,
  TestTube,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useEstadoAguiatech } from '@/lib/estado'
import { useAgente } from '@/lib/use-agente'
import { toast } from 'sonner'

interface Ferramenta {
  id: string
  nome: string
  categoria: string
  descricao: string
  toolset: string | null
  parametros: string | null
  requerAprovacao: boolean
  ativa: boolean
  createdAt: string
  updatedAt: string
}

const categorias = [
  { id: 'todas', label: 'Todas', icon: Filter, color: 'from-amber-500 to-orange-600' },
  { id: 'nucleo', label: 'Núcleo', icon: Zap, color: 'from-amber-500 to-amber-600' },
  { id: 'avancado', label: 'Avançado', icon: Activity, color: 'from-emerald-500 to-emerald-600' },
  { id: 'experimental', label: 'Experimental', icon: TestTube, color: 'from-orange-500 to-amber-500' },
  { id: 'geral', label: 'Geral', icon: Database, color: 'from-slate-400 to-slate-500' },
]

const categoriaBorderColor: Record<string, string> = {
  nucleo: 'border-l-amber-500 dark:border-l-amber-400',
  avancado: 'border-l-emerald-500 dark:border-l-emerald-400',
  experimental: 'border-l-orange-500 dark:border-l-orange-400',
  geral: 'border-l-slate-400 dark:border-l-slate-500',
}

const categoriaGlowColor: Record<string, string> = {
  nucleo: 'shadow-amber-100 dark:shadow-amber-900/30',
  avancado: 'shadow-emerald-100 dark:shadow-emerald-900/30',
  experimental: 'shadow-orange-100 dark:shadow-orange-900/30',
  geral: 'shadow-slate-100 dark:shadow-slate-900/30',
}

const categoriaHoverBorder: Record<string, string> = {
  nucleo: 'hover:border-amber-300 dark:hover:border-amber-700',
  avancado: 'hover:border-emerald-300 dark:hover:border-emerald-700',
  experimental: 'hover:border-orange-300 dark:hover:border-orange-700',
  geral: 'hover:border-slate-300 dark:hover:border-slate-600',
}

/* ── Animated Counter ── */
function AnimatedCounter({ value, duration = 800 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)
  const [prevValue, setPrevValue] = useState(value)

  if (prevValue !== value) {
    setPrevValue(value)
    const startTime = performance.now()
    const startVal = display

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(startVal + (value - startVal) * eased))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }

  return <>{display}</>
}

export function Ferramentas() {
  const { filtroCategoriaFerramenta, setFiltroCategoriaFerramenta } = useEstadoAguiatech()
  const { obterIconeCategoria, obterCorCategoria } = useAgente()
  const queryClient = useQueryClient()
  const [busca, setBusca] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [expandido, setExpandido] = useState<string | null>(null)

  const { data: ferramentas, isLoading } = useQuery<Ferramenta[]>({
    queryKey: ['ferramentas'],
    queryFn: () => fetch('/api/ferramentas').then(r => r.json()),
  })

  const toggleFerramenta = useMutation({
    mutationFn: ({ id, ativa }: { id: string; ativa: boolean }) =>
      fetch(`/api/ferramentas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativa }),
      }).then(r => r.json()),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ferramentas'] })
      toast.success(variables.ativa ? 'Ferramenta ativada!' : 'Ferramenta desativada!', {
        description: variables.ativa ? 'A ferramenta agora está disponível para o agente.' : 'A ferramenta foi desativada.',
      })
    },
  })

  const seedFerramentas = useMutation({
    mutationFn: () => fetch('/api/ferramentas/seed', { method: 'POST' }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ferramentas'] })
      toast.success('Ferramentas padrão carregadas!', { description: 'As ferramentas foram adicionadas ao sistema.' })
    },
  })

  const filtradas = ferramentas?.filter((f) => {
    const matchCategoria = filtroCategoriaFerramenta === 'todas' || f.categoria === filtroCategoriaFerramenta
    const matchBusca = f.nome.toLowerCase().includes(busca.toLowerCase()) ||
      f.descricao.toLowerCase().includes(busca.toLowerCase())
    return matchCategoria && matchBusca
  }) ?? []

  const ativasCount = ferramentas?.filter(f => f.ativa).length ?? 0
  const totalCount = ferramentas?.length ?? 0
  const nucleoCount = ferramentas?.filter(f => f.categoria === 'nucleo').length ?? 0
  const avancadoCount = ferramentas?.filter(f => f.categoria === 'avancado').length ?? 0
  const experimentalCount = ferramentas?.filter(f => f.categoria === 'experimental').length ?? 0
  const aprovacaoCount = ferramentas?.filter(f => f.requerAprovacao).length ?? 0

  const ativasNaFiltragem = useMemo(() => filtradas.filter(f => f.ativa).length, [filtradas])

  // Stat cards config
  const statCards = useMemo(() => [
    { label: 'Total', value: totalCount, icon: Package, color: 'from-amber-500 to-orange-600', trend: 'up' as const },
    { label: 'Ativas', value: ativasCount, icon: CheckCircle2, color: 'from-emerald-500 to-green-600', trend: 'up' as const },
    { label: 'Núcleo', value: nucleoCount, icon: Zap, color: 'from-amber-400 to-amber-600', trend: 'neutral' as const },
    { label: 'Avançado', value: avancadoCount, icon: Activity, color: 'from-emerald-400 to-emerald-600', trend: 'neutral' as const },
    { label: 'Experimental', value: experimentalCount, icon: TestTube, color: 'from-orange-400 to-orange-600', trend: 'neutral' as const },
    { label: 'Aprovação', value: aprovacaoCount, icon: ShieldCheck, color: 'from-amber-600 to-red-500', trend: 'down' as const },
  ], [totalCount, ativasCount, nucleoCount, avancadoCount, experimentalCount, aprovacaoCount])

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* ═══ Hero Banner ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-xl"
      >
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-600/10 dark:from-amber-500/5 dark:via-orange-500/3 dark:to-amber-600/5" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 hero-grid-pattern opacity-40" />
        
        {/* Shimmer border */}
        <div className="absolute inset-0 rounded-xl p-[1px]">
          <div className="absolute inset-0 rounded-xl animate-gradient-shimmer opacity-30" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6">
          <div>
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 mb-3"
            >
              <Sparkles className="h-3 w-3 text-amber-500" />
              <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">Caixa de Ferramentas IA</span>
            </motion.div>
            <h1 className="text-2xl font-bold flex items-center gap-2.5">
              <div className="size-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-amber-200 dark:shadow-amber-900/30">
                <Wrench className="size-4 text-white" />
              </div>
              Ferramentas
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Gerencie as ferramentas disponíveis para o agente
            </p>
          </div>
          <Button
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white gap-2 shadow-md shadow-amber-200 dark:shadow-amber-900/30 font-semibold"
            onClick={() => seedFerramentas.mutate()}
            disabled={seedFerramentas.isPending}
          >
            <Database className="size-4" />
            {seedFerramentas.isPending ? 'Carregando...' : 'Carregar Padrão'}
          </Button>
        </div>
      </motion.div>

      {/* ═══ Stat Cards ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -3, scale: 1.02 }}
              className="stat-card-gradient-border rounded-xl p-3 cursor-default hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`size-7 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <Icon className="size-3.5 text-white" />
                </div>
                {stat.trend === 'up' && <ArrowUpRight className="size-3 text-emerald-500" />}
                {stat.trend === 'down' && <ArrowDownRight className="size-3 text-red-500" />}
                {stat.trend === 'neutral' && <Minus className="size-3 text-muted-foreground/40" />}
              </div>
              <div className="text-lg font-bold stat-number-glow text-foreground">
                <AnimatedCounter value={stat.value} />
              </div>
              <div className="text-[10px] text-muted-foreground font-medium">{stat.label}</div>
            </motion.div>
          )
        })}
      </div>

      {/* ═══ Search & Filters ═══ */}
      <div className="space-y-3">
        {/* Search with magnifying glass animation */}
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 size-4 transition-all duration-300 ${
            searchFocused ? 'text-amber-500 scale-110' : 'text-muted-foreground'
          } ${busca ? 'animate-search-magnify' : ''}`} />
          <Input
            placeholder="Buscar ferramentas por nome ou descrição..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="pl-9 h-10 bg-background border-border/60 focus-visible:ring-amber-500/30 focus-visible:border-amber-500 transition-all duration-200"
          />
          {busca && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={() => setBusca('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-sm p-0.5 rounded-full hover:bg-muted/50"
            >
              ✕
            </motion.button>
          )}
        </div>

        {/* Category Pills with hover animations */}
        <div className="flex gap-2 flex-wrap">
          {categorias.map((cat, idx) => {
            const Icon = cat.icon
            const isActive = filtroCategoriaFerramenta === cat.id
            const catCount = cat.id !== 'todas' ? ferramentas?.filter(f => f.categoria === cat.id).length ?? 0 : 0
            return (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                onClick={() => setFiltroCategoriaFerramenta(cat.id)}
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.96 }}
                className={`
                  flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium
                  transition-all duration-300 border animate-pill-shimmer
                  ${isActive
                    ? `bg-gradient-to-r ${cat.color} text-white border-transparent shadow-md shadow-amber-200 dark:shadow-amber-900/40`
                    : 'bg-background text-muted-foreground border-border hover:border-amber-300 hover:text-amber-700 dark:hover:border-amber-700 dark:hover:text-amber-400'
                  }
                `}
              >
                <Icon className={`size-3.5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                {cat.label}
                {cat.id !== 'todas' && ferramentas && (
                  <span className={`text-[10px] ml-0.5 px-1.5 py-0 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                  }`}>
                    {catCount}
                  </span>
                )}
              </motion.button>
            )
          })}
        </div>

        {/* Filter summary */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Layers className="size-3" />
          <span>Exibindo {filtradas.length} de {totalCount} ferramentas</span>
          {ativasNaFiltragem > 0 && (
            <>
              <Separator orientation="vertical" className="h-3" />
              <Badge className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 gap-0.5 px-1.5">
                {ativasNaFiltragem} ativa{ativasNaFiltragem !== 1 ? 's' : ''}
              </Badge>
            </>
          )}
        </div>
      </div>

      {/* ═══ Lista de Ferramentas ═══ */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-3 p-4 rounded-lg border relative overflow-hidden">
              <div className="absolute inset-0 animate-shimmer" />
              <div className="relative flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="size-5 rounded" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filtradas.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center space-y-4"
            >
              <div className="relative inline-block">
                <div className="size-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto">
                  <Wrench className="size-8 text-amber-600/40" />
                </div>
                <div className="absolute -right-1 -top-1 size-5 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Search className="size-2.5 text-amber-500/60" />
                </div>
              </div>
              <div>
                <p className="font-medium text-sm">Nenhuma ferramenta encontrada</p>
                <p className="text-xs mt-1 text-muted-foreground/70">
                  {busca ? `Nenhum resultado para "${busca}"` : 'Carregue as ferramentas padrão para começar'}
                </p>
              </div>
              <Button
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white gap-2 shadow-md shadow-amber-200 dark:shadow-amber-900/30"
                onClick={() => busca ? setBusca('') : seedFerramentas.mutate()}
                disabled={seedFerramentas.isPending}
              >
                <Database className="size-4" />
                {busca ? 'Limpar Busca' : 'Carregar Padrão'}
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtradas.map((ferramenta, i) => {
              const borderColor = categoriaBorderColor[ferramenta.categoria] || 'border-l-slate-300'
              const glowColor = categoriaGlowColor[ferramenta.categoria] || ''
              const hoverBorder = categoriaHoverBorder[ferramenta.categoria] || ''

              return (
                <motion.div
                  key={ferramenta.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ y: -3 }}
                >
                  <Card className={`
                    border-l-4 ${borderColor}
                    hover:shadow-lg ${glowColor}
                    transition-all duration-300 ${hoverBorder}
                    ${ferramenta.ativa
                      ? ''
                      : 'opacity-60 hover:opacity-80'
                    }
                  `}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm flex items-center gap-2">
                            {ferramenta.ativa ? (
                              <Power className="size-3.5 text-emerald-500" />
                            ) : (
                              <PowerOff className="size-3.5 text-muted-foreground" />
                            )}
                            <span className="truncate">{ferramenta.nome}</span>
                            {ferramenta.ativa && (
                              <Badge className="text-[9px] px-1.5 py-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 shrink-0">
                                ● Ativa
                              </Badge>
                            )}
                          </CardTitle>
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <Badge className={`text-[10px] ${obterCorCategoria(ferramenta.categoria)}`}>
                              {obterIconeCategoria(ferramenta.categoria)} {ferramenta.categoria}
                            </Badge>
                            {ferramenta.requerAprovacao && (
                              <Badge variant="outline" className="text-[10px] gap-1 text-amber-700 border-amber-300 dark:text-amber-400 dark:border-amber-700">
                                <ShieldCheck className="size-2.5" />
                                Aprovação
                              </Badge>
                            )}
                            {ferramenta.toolset && (
                              <Badge variant="outline" className="text-[10px]">
                                {ferramenta.toolset}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center shrink-0">
                          <div className="relative">
                            <Switch
                              checked={ferramenta.ativa}
                              onCheckedChange={(checked) =>
                                toggleFerramenta.mutate({ id: ferramenta.id, ativa: checked })
                              }
                              className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-muted-foreground/30 scale-110"
                            />
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <CardDescription className="text-xs line-clamp-2">
                        {ferramenta.descricao}
                      </CardDescription>

                      {/* Parâmetros */}
                      {ferramenta.parametros && (
                        <div>
                          <button
                            onClick={() => setExpandido(expandido === ferramenta.id ? null : ferramenta.id)}
                            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <ChevronDown className={`size-2.5 transition-transform duration-200 ${expandido === ferramenta.id ? 'rotate-180' : ''}`} />
                            Parâmetros
                          </button>
                          <AnimatePresence>
                            {expandido === ferramenta.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                              >
                                <pre className="mt-2 text-[10px] bg-muted p-2 rounded overflow-x-auto">
                                  {(() => {
                                    try {
                                      return JSON.stringify(JSON.parse(ferramenta.parametros), null, 2)
                                    } catch {
                                      return ferramenta.parametros
                                    }
                                  })()}
                                </pre>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}

                      {ferramenta.requerAprovacao && (
                        <div className="flex items-center gap-1.5 text-[10px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                          <Shield className="size-3" />
                          Requer aprovação do usuário antes de executar
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
