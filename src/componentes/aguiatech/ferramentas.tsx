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
  { id: 'todas', label: 'Todas', icon: Filter },
  { id: 'nucleo', label: 'Núcleo', icon: Zap },
  { id: 'avancado', label: 'Avançado', icon: Activity },
  { id: 'experimental', label: 'Experimental', icon: Search },
  { id: 'geral', label: 'Geral', icon: Database },
]

const categoriaBorderColor: Record<string, string> = {
  nucleo: 'border-l-amber-500 dark:border-l-amber-400',
  avancado: 'border-l-emerald-500 dark:border-l-emerald-400',
  experimental: 'border-l-purple-500 dark:border-l-purple-400',
  geral: 'border-l-slate-400 dark:border-l-slate-500',
}

const categoriaGlowColor: Record<string, string> = {
  nucleo: 'shadow-amber-100 dark:shadow-amber-900/30',
  avancado: 'shadow-emerald-100 dark:shadow-emerald-900/30',
  experimental: 'shadow-purple-100 dark:shadow-purple-900/30',
  geral: 'shadow-slate-100 dark:shadow-slate-900/30',
}

export function Ferramentas() {
  const { filtroCategoriaFerramenta, setFiltroCategoriaFerramenta } = useEstadoAguiatech()
  const { obterIconeCategoria, obterCorCategoria } = useAgente()
  const queryClient = useQueryClient()
  const [busca, setBusca] = useState('')
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

  const ativasNaFiltragem = useMemo(() => filtradas.filter(f => f.ativa).length, [filtradas])

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <div className="size-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Wrench className="size-4 text-white" />
            </div>
            Ferramentas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
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

      {/* Barra de Estatísticas */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50 dark:border-amber-800/30">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {ativasCount} <span className="text-muted-foreground font-normal">ferramentas ativas de</span> {totalCount} <span className="text-muted-foreground font-normal">total</span>
            </p>
          </div>
        </div>
        <Separator orientation="vertical" className="h-6" />
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Filtragem:</span>
          <Badge variant="outline" className="text-[10px] gap-1">
            {filtradas.length} ferramenta{filtradas.length !== 1 ? 's' : ''}
          </Badge>
          <Badge className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 gap-0.5">
            {ativasNaFiltragem} ativa{ativasNaFiltragem !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {/* Filtros com Pills */}
      <div className="space-y-3">
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar ferramentas por nome ou descrição..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9 h-10 bg-background border-border/60 focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
          />
          {busca && (
            <button
              onClick={() => setBusca('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 flex-wrap">
          {categorias.map((cat) => {
            const Icon = cat.icon
            const isActive = filtroCategoriaFerramenta === cat.id
            return (
              <motion.button
                key={cat.id}
                onClick={() => setFiltroCategoriaFerramenta(cat.id)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={`
                  flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium
                  transition-all duration-200 border
                  ${isActive
                    ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-200 dark:shadow-amber-900/40'
                    : 'bg-background text-muted-foreground border-border hover:border-amber-300 hover:text-amber-700 dark:hover:border-amber-700 dark:hover:text-amber-400'
                  }
                `}
              >
                <Icon className="size-3.5" />
                {cat.label}
                {cat.id !== 'todas' && ferramentas && (
                  <span className={`text-[10px] ml-0.5 ${isActive ? 'text-amber-100' : 'text-muted-foreground'}`}>
                    {ferramentas.filter(f => f.categoria === cat.id).length}
                  </span>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Lista de Ferramentas */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-3 p-4 rounded-lg border">
              <div className="flex items-center justify-between">
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
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Wrench className="size-12 mb-3 text-amber-600/30" />
            <p className="font-medium">Nenhuma ferramenta encontrada</p>
            <p className="text-xs mt-1">Carregue as ferramentas padrão para começar</p>
            <Button
              className="mt-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white gap-2"
              onClick={() => seedFerramentas.mutate()}
              disabled={seedFerramentas.isPending}
            >
              <Database className="size-4" />
              Carregar Padrão
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtradas.map((ferramenta, i) => {
              const borderColor = categoriaBorderColor[ferramenta.categoria] || 'border-l-slate-300'
              const glowColor = categoriaGlowColor[ferramenta.categoria] || ''

              return (
                <motion.div
                  key={ferramenta.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card className={`
                    border-l-4 ${borderColor}
                    hover:shadow-lg ${glowColor}
                    transition-all duration-200
                    ${ferramenta.ativa
                      ? 'hover:border-t-amber-200 dark:hover:border-t-amber-800'
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
                            <ChevronDown className={`size-2.5 transition-transform ${expandido === ferramenta.id ? 'rotate-180' : ''}`} />
                            Parâmetros
                          </button>
                          {expandido === ferramenta.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
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
