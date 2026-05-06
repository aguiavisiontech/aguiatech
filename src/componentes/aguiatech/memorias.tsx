'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain,
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  CheckCircle2,
  TrendingUp,
  Filter,
  Activity,
  ToggleLeft,
  X,
  Pin,
  Zap,
  BookOpen,
  Link2,
  BookHeart,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Skeleton } from '@/components/ui/skeleton'
import { useEstadoAguiatech } from '@/lib/estado'
import { useAgente } from '@/lib/use-agente'

interface Memoria {
  id: string
  tipo: string
  categoria: string
  conteudo: string
  importancia: number
  origem: string | null
  ativa: boolean
  acessos: number
  createdAt: string
  updatedAt: string
}

const tiposMemoria = ['todas', 'fato', 'curto_prazo', 'longo_prazo', 'semantica', 'episodica']

// Map type to icon component for filter pills
const tipoIconMap: Record<string, React.ReactNode> = {
  todas: <Filter className="size-3.5" />,
  fato: <Pin className="size-3.5" />,
  curto_prazo: <Zap className="size-3.5" />,
  longo_prazo: <BookOpen className="size-3.5" />,
  semantica: <Link2 className="size-3.5" />,
  episodica: <BookHeart className="size-3.5" />,
}

// Map type to left border color
const tipoBorderMap: Record<string, string> = {
  fato: 'border-l-purple-500',
  curto_prazo: 'border-l-amber-500',
  longo_prazo: 'border-l-emerald-500',
  semantica: 'border-l-sky-500',
  episodica: 'border-l-rose-500',
}

// Map type to hover shadow glow
const tipoShadowMap: Record<string, string> = {
  fato: 'hover:shadow-purple-200/60 dark:hover:shadow-purple-900/30',
  curto_prazo: 'hover:shadow-amber-200/60 dark:hover:shadow-amber-900/30',
  longo_prazo: 'hover:shadow-emerald-200/60 dark:hover:shadow-emerald-900/30',
  semantica: 'hover:shadow-sky-200/60 dark:hover:shadow-sky-900/30',
  episodica: 'hover:shadow-rose-200/60 dark:hover:shadow-rose-900/30',
}

// Map type to progress bar color (using CSS classes on indicator)
const tipoProgressColorMap: Record<string, string> = {
  fato: '[&>div]:bg-purple-500',
  curto_prazo: '[&>div]:bg-amber-500',
  longo_prazo: '[&>div]:bg-emerald-500',
  semantica: '[&>div]:bg-sky-500',
  episodica: '[&>div]:bg-rose-500',
}

// Map type to icon color for card header
const tipoIconColorMap: Record<string, string> = {
  fato: 'text-purple-500',
  curto_prazo: 'text-amber-500',
  longo_prazo: 'text-emerald-500',
  semantica: 'text-sky-500',
  episodica: 'text-rose-500',
}

const tipoLabelMap: Record<string, string> = {
  todas: 'Todas',
  fato: 'Fato',
  curto_prazo: 'Curto Prazo',
  longo_prazo: 'Longo Prazo',
  semantica: 'Semântica',
  episodica: 'Episódica',
}

export function Memorias() {
  const { filtroTipoMemoria, setFiltroTipoMemoria } = useEstadoAguiatech()
  const { obterIconeTipoMemoria, obterCorTipoMemoria } = useAgente()
  const queryClient = useQueryClient()
  const [busca, setBusca] = useState('')
  const [dialogoAberto, setDialogoAberto] = useState(false)
  const [editando, setEditando] = useState<Memoria | null>(null)
  const [formulario, setFormulario] = useState({
    tipo: 'fato',
    categoria: 'geral',
    conteudo: '',
    importancia: 0.5,
    origem: '',
  })

  const { data: memorias, isLoading } = useQuery<Memoria[]>({
    queryKey: ['memorias'],
    queryFn: () => fetch('/api/memorias').then(r => r.json()),
  })

  const criarMemoria = useMutation({
    mutationFn: (dados: typeof formulario) =>
      fetch('/api/memorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memorias'] })
      setDialogoAberto(false)
      resetFormulario()
    },
  })

  const atualizarMemoria = useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: Record<string, unknown> }) =>
      fetch(`/api/memorias/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memorias'] })
      setDialogoAberto(false)
      setEditando(null)
      resetFormulario()
    },
  })

  const deletarMemoria = useMutation({
    mutationFn: (id: string) => fetch(`/api/memorias/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memorias'] })
    },
  })

  const toggleAtiva = useMutation({
    mutationFn: ({ id, ativa }: { id: string; ativa: boolean }) =>
      fetch(`/api/memorias/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativa }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memorias'] })
    },
  })

  const resetFormulario = () => {
    setFormulario({ tipo: 'fato', categoria: 'geral', conteudo: '', importancia: 0.5, origem: '' })
  }

  const abrirEdicao = (memoria: Memoria) => {
    setEditando(memoria)
    setFormulario({
      tipo: memoria.tipo,
      categoria: memoria.categoria,
      conteudo: memoria.conteudo,
      importancia: memoria.importancia,
      origem: memoria.origem ?? '',
    })
    setDialogoAberto(true)
  }

  const filtradas = memorias?.filter((m) => {
    const matchTipo = filtroTipoMemoria === 'todas' || m.tipo === filtroTipoMemoria
    const matchBusca = m.conteudo.toLowerCase().includes(busca.toLowerCase()) ||
      (m.origem?.toLowerCase().includes(busca.toLowerCase()) ?? false)
    return matchTipo && matchBusca
  }) ?? []

  // Stats computation
  const stats = useMemo(() => {
    if (!memorias) return { total: 0, ativas: 0, importanciaMedia: 0 }
    const total = memorias.length
    const ativas = memorias.filter(m => m.ativa).length
    const importanciaMedia = total > 0 ? memorias.reduce((acc, m) => acc + m.importancia, 0) / total : 0
    return { total, ativas, importanciaMedia }
  }, [memorias])

  // Count per type for filter pills
  const contagemPorTipo = useMemo(() => {
    if (!memorias) return {} as Record<string, number>
    const counts: Record<string, number> = { todas: memorias.length }
    for (const tipo of tiposMemoria) {
      if (tipo !== 'todas') {
        counts[tipo] = memorias.filter(m => m.tipo === tipo).length
      }
    }
    return counts
  }, [memorias])

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* 1. Gradient Header Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-fuchsia-500 p-6 md:p-8">
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 size-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 -left-12 size-40 rounded-full bg-white/5" />
        <div className="absolute top-4 right-20 size-16 rounded-full bg-white/5" />
        <div className="absolute bottom-2 right-40 size-8 rounded-full bg-white/10" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Brain className="size-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Memórias</h1>
              <p className="text-sm text-white/80 mt-0.5">
                Gerencie o conhecimento do seu agente
              </p>
            </div>
          </div>
          <Dialog open={dialogoAberto} onOpenChange={(aberto) => {
            setDialogoAberto(aberto)
            if (!aberto) { setEditando(null); resetFormulario() }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border border-white/30 gap-2 shadow-lg">
                <Plus className="size-4" />
                Nova Memória
              </Button>
            </DialogTrigger>
            {/* 7. Form improvements - wider dialog, two-column layout */}
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Brain className="size-5 text-purple-500" />
                  {editando ? 'Editar Memória' : 'Nova Memória'}
                </DialogTitle>
                <DialogDescription>
                  {editando ? 'Altere os dados da memória' : 'Adicione um novo conhecimento ao agente'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-5">
                {/* Two-column layout for Tipo + Categoria */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-sm font-medium">
                      <Activity className="size-3.5 text-purple-500" />
                      Tipo
                    </Label>
                    <Select value={formulario.tipo} onValueChange={(v) => setFormulario(f => ({ ...f, tipo: v }))}>
                      <SelectTrigger className="focus:ring-purple-500/30 focus:border-purple-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fato">📌 Fato</SelectItem>
                        <SelectItem value="curto_prazo">⚡ Curto Prazo</SelectItem>
                        <SelectItem value="longo_prazo">🧠 Longo Prazo</SelectItem>
                        <SelectItem value="semantica">🔗 Semântica</SelectItem>
                        <SelectItem value="episodica">📖 Episódica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-sm font-medium">
                      <Filter className="size-3.5 text-purple-500" />
                      Categoria
                    </Label>
                    <Input
                      value={formulario.categoria}
                      onChange={(e) => setFormulario(f => ({ ...f, categoria: e.target.value }))}
                      placeholder="geral"
                      className="focus:ring-purple-500/30 focus:border-purple-400"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm font-medium">
                    <Pencil className="size-3.5 text-purple-500" />
                    Conteúdo
                  </Label>
                  <Textarea
                    value={formulario.conteudo}
                    onChange={(e) => setFormulario(f => ({ ...f, conteudo: e.target.value }))}
                    placeholder="Conteúdo da memória..."
                    rows={4}
                    className="focus:ring-purple-500/30 focus:border-purple-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm font-medium">
                    <TrendingUp className="size-3.5 text-purple-500" />
                    Importância: {formulario.importancia.toFixed(1)}
                  </Label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={formulario.importancia}
                    onChange={(e) => setFormulario(f => ({ ...f, importancia: parseFloat(e.target.value) }))}
                    className="w-full accent-purple-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm font-medium">
                    <Eye className="size-3.5 text-purple-500" />
                    Origem
                  </Label>
                  <Input
                    value={formulario.origem}
                    onChange={(e) => setFormulario(f => ({ ...f, origem: e.target.value }))}
                    placeholder="Fonte da memória (opcional)"
                    className="focus:ring-purple-500/30 focus:border-purple-400"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setDialogoAberto(false); setEditando(null); resetFormulario() }}>
                  Cancelar
                </Button>
                <Button
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => {
                    if (editando) {
                      atualizarMemoria.mutate({ id: editando.id, dados: formulario })
                    } else {
                      criarMemoria.mutate(formulario)
                    }
                  }}
                  disabled={!formulario.conteudo}
                >
                  {editando ? 'Salvar' : 'Criar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 2. Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-purple-200 dark:border-purple-800/40">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Brain className="size-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total memórias</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-emerald-200 dark:border-emerald-800/40">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats.ativas}</p>
                <p className="text-xs text-muted-foreground">Ativas</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-amber-200 dark:border-amber-800/40">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <TrendingUp className="size-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{(stats.importanciaMedia * 100).toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">Importância média</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* 3. Filter pills redesign + 6. Search input improvements */}
      <div className="flex flex-col gap-3">
        {/* Enhanced search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar memórias por conteúdo ou origem..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9 h-11 focus:ring-purple-500/30 focus:border-purple-400 pr-9"
          />
          {busca && (
            <button
              onClick={() => setBusca('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        {/* Pill-shaped filters */}
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-1">
            {tiposMemoria.map((tipo) => {
              const isActive = filtroTipoMemoria === tipo
              return (
                <motion.div
                  key={tipo}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  <button
                    onClick={() => setFiltroTipoMemoria(tipo)}
                    className={`
                      inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium
                      transition-colors whitespace-nowrap border
                      ${isActive
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-200/50 dark:shadow-purple-900/30'
                        : 'bg-background text-muted-foreground border-border hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 dark:hover:bg-purple-950/30 dark:hover:text-purple-300 dark:hover:border-purple-700'
                      }
                    `}
                  >
                    {tipoIconMap[tipo]}
                    {tipoLabelMap[tipo]}
                    <span className={`
                      ml-0.5 inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none
                      ${isActive
                        ? 'bg-white/25 text-white'
                        : 'bg-muted text-muted-foreground'
                      }
                    `}>
                      {contagemPorTipo[tipo] ?? 0}
                    </span>
                  </button>
                </motion.div>
              )
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Lista de Memórias */}
      {isLoading ? (
        // 8. Enhanced loading skeleton matching new card structure
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-3 p-4 rounded-lg border border-l-4 border-l-purple-300 dark:border-l-purple-700">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-2 w-full rounded" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : filtradas.length === 0 ? (
        // 5. Empty state - dashed border card with Brain icon
        <Card className="border-2 border-dashed border-purple-300 dark:border-purple-700">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <div className="relative mb-4">
              <div className="flex size-20 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                <Brain className="size-10 text-purple-500 dark:text-purple-400" />
              </div>
              <div className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg">
                <Plus className="size-4" />
              </div>
            </div>
            <p className="text-lg font-medium text-foreground">Nenhuma memória encontrada</p>
            <p className="text-sm mt-1">Adicione conhecimentos para o agente lembrar</p>
            <Button
              className="mt-4 bg-purple-600 hover:bg-purple-700 text-white gap-2"
              onClick={() => setDialogoAberto(true)}
            >
              <Plus className="size-4" />
              Criar Primeira Memória
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filtradas.map((memoria, i) => {
              const borderColor = tipoBorderMap[memoria.tipo] ?? 'border-l-gray-400'
              const shadowColor = tipoShadowMap[memoria.tipo] ?? ''
              const progressColor = tipoProgressColorMap[memoria.tipo] ?? ''
              const iconColor = tipoIconColorMap[memoria.tipo] ?? 'text-gray-500'
              const tipoIcon = tipoIconMap[memoria.tipo] ?? <Brain className="size-3.5" />

              return (
                <motion.div
                  key={memoria.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                >
                  {/* 4. Memory card improvements */}
                  <Card className={`
                    border-l-4 ${borderColor}
                    hover:shadow-lg ${shadowColor}
                    transition-all duration-200
                    hover:border-l-[6px]
                  `}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`${iconColor}`}>
                            {tipoIcon}
                          </div>
                          <Badge className={`text-[10px] ${obterCorTipoMemoria(memoria.tipo)}`}>
                            {obterIconeTipoMemoria(memoria.tipo)} {memoria.tipo.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {memoria.categoria}
                          </Badge>
                          {/* Ativa badge */}
                          {memoria.ativa && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                              <span className="size-1.5 rounded-full bg-emerald-500" />
                              Ativa
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Toggle switch for ativa/inativa */}
                          <div className="flex items-center gap-1.5 mr-1">
                            <Switch
                              checked={memoria.ativa}
                              onCheckedChange={(checked) => toggleAtiva.mutate({ id: memoria.id, ativa: checked })}
                              className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-purple-600"
                            onClick={() => abrirEdicao(memoria)}
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
                                <AlertDialogTitle>Excluir memória?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. A memória será removida permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deletarMemoria.mutate(memoria.id)}
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
                      <p className="text-sm line-clamp-3">{memoria.conteudo}</p>

                      {/* Barra de Importância - type-specific color */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>Importância</span>
                          <span>{(memoria.importancia * 100).toFixed(0)}%</span>
                        </div>
                        <Progress value={memoria.importancia * 100} className={`h-1.5 ${progressColor}`} />
                      </div>

                      {/* Metadados */}
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="size-2.5" />
                          {memoria.acessos} acessos
                        </span>
                        {memoria.origem && (
                          <span>Fonte: {memoria.origem}</span>
                        )}
                      </div>
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
