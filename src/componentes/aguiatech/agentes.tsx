'use client'

import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Search,
  Thermometer,
  Hash,
  Clock,
  Loader2,
  LayoutTemplate,
  ChevronRight,
  X,
  Palette,
  Cpu,
  MessageSquare,
  Users,
  CheckCircle2,
  Activity,
  Brain,
  Zap,
  Shield,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

// ─── Types ───────────────────────────────────────────────────────────────────

interface Agente {
  id: string
  nome: string
  descricao: string | null
  avatar: string | null
  modelo: string
  provedorModelo: string
  personalidade: string
  diretorioTrabalho: string
  temperatura: number
  maxTokens: number
  categoria: string
  cor: string
  habilidadeIds: string | null
  ferramentaIds: string | null
  ativo: boolean
  ehTemplate: boolean
  conversasTotal: number
  ultimaConversa: string | null
  createdAt: string
  updatedAt: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const emojisGrid = [
  '🤖', '💻', '✍️', '📊', '🌍', '🎓', '🔬', '🎨',
  '🧠', '⚡', '🎯', '🚀', '💡', '🛡️', '📱', '🔧',
  '🎵', '📷', '🎮', '🌟', '📚', '🔥', '💎', '🌈',
]

const categoriasOpcoes = [
  { valor: 'geral', rotulo: 'Geral', icone: '📦' },
  { valor: 'tecnologia', rotulo: 'Tecnologia', icone: '💻' },
  { valor: 'criativo', rotulo: 'Criativo', icone: '✨' },
  { valor: 'analise', rotulo: 'Análise', icone: '📊' },
  { valor: 'idiomas', rotulo: 'Idiomas', icone: '🌍' },
  { valor: 'educacao', rotulo: 'Educação', icone: '🎓' },
  { valor: 'pesquisa', rotulo: 'Pesquisa', icone: '🔬' },
]

const coresOpcoes = [
  { valor: 'amber', rotulo: 'Âmbar' },
  { valor: 'emerald', rotulo: 'Esmeralda' },
  { valor: 'purple', rotulo: 'Roxo' },
  { valor: 'sky', rotulo: 'Céu' },
  { valor: 'cyan', rotulo: 'Ciano' },
  { valor: 'rose', rotulo: 'Rosa' },
  { valor: 'violet', rotulo: 'Violeta' },
  { valor: 'fuchsia', rotulo: 'Fúcsia' },
]

const corClasses: Record<string, { bg: string; text: string; border: string }> = {
  amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500' },
  emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500' },
  sky: { bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-sky-600 dark:text-sky-400', border: 'border-sky-500' },
  cyan: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500' },
  rose: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500' },
  violet: { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-500' },
  fuchsia: { bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/30', text: 'text-fuchsia-600 dark:text-fuchsia-400', border: 'border-fuchsia-500' },
}

const categoriaBadgeClasses: Record<string, string> = {
  geral: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300',
  tecnologia: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  criativo: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  analise: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  idiomas: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  educacao: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  pesquisa: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function tempoRelativo(data: string): string {
  const diff = Date.now() - new Date(data).getTime()
  const minutos = Math.floor(diff / 60000)
  if (minutos < 1) return 'agora'
  if (minutos < 60) return `${minutos}min`
  const horas = Math.floor(minutos / 60)
  if (horas < 24) return `${horas}h`
  const dias = Math.floor(horas / 24)
  return `${dias}d`
}

function obterCor(cor: string) {
  return corClasses[cor] || corClasses.amber
}

function obterCategoriaBadge(categoria: string) {
  return categoriaBadgeClasses[categoria] || categoriaBadgeClasses.geral
}

function obterCategoriaRotulo(categoria: string) {
  return categoriasOpcoes.find(c => c.valor === categoria)?.rotulo ?? categoria
}

// ─── Habilidade type ─────────────────────────────────────────────────────────

interface HabilidadeSimples {
  id: string
  nome: string
  categoria: string
  descricao: string | null
  ativa: boolean
}

// ─── Form type ───────────────────────────────────────────────────────────────

interface FormularioAgente {
  nome: string
  descricao: string
  avatar: string
  categoria: string
  cor: string
  personalidade: string
  temperatura: number
  maxTokens: number
  modelo: string
  provedorModelo: string
}

const formularioVazio: FormularioAgente = {
  nome: '',
  descricao: '',
  avatar: '🤖',
  categoria: 'geral',
  cor: 'amber',
  personalidade: '',
  temperatura: 0.7,
  maxTokens: 4096,
  modelo: 'meta-llama/llama-3.3-70b-instruct:free',
  provedorModelo: 'openrouter',
}

// ─── Component ───────────────────────────────────────────────────────────────

export function Agentes() {
  const queryClient = useQueryClient()
  const { setAgenteIdParaConversa, setSecaoAtiva } = useEstadoAguiatech()
  const [busca, setBusca] = useState('')
  const [dialogoAberto, setDialogoAberto] = useState(false)
  const [editando, setEditando] = useState<Agente | null>(null)
  const [formulario, setFormulario] = useState<FormularioAgente>({ ...formularioVazio })
  const [emojiPickerAberto, setEmojiPickerAberto] = useState(false)
  const [abaFormulario, setAbaFormulario] = useState('identidade')
  const [habilidadesAgenteDialogo, setHabilidadesAgenteDialogo] = useState<Agente | null>(null)

  // ─── Queries ─────────────────────────────────────────────────────────────

  const { data: agentes, isLoading } = useQuery<Agente[]>({
    queryKey: ['agentes'],
    queryFn: () => fetch('/api/agentes').then(r => r.json()),
  })

  const { data: templates } = useQuery<Agente[]>({
    queryKey: ['agentes-templates'],
    queryFn: () => fetch('/api/agentes/templates').then(r => r.json()),
  })

  const { data: todasHabilidades, isLoading: carregandoHabilidades } = useQuery<HabilidadeSimples[]>({
    queryKey: ['habilidades-agentes'],
    queryFn: () => fetch('/api/habilidades').then(r => r.json()),
    enabled: !!habilidadesAgenteDialogo,
  })

  // ─── Mutations ───────────────────────────────────────────────────────────

  const criarAgente = useMutation({
    mutationFn: (dados: FormularioAgente) =>
      fetch('/api/agentes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentes'] })
      fecharDialogo()
    },
  })

  const atualizarAgente = useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: Partial<FormularioAgente> }) =>
      fetch(`/api/agentes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentes'] })
      fecharDialogo()
    },
  })

  const deletarAgente = useMutation({
    mutationFn: (id: string) => fetch(`/api/agentes/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentes'] })
    },
  })

  const toggleAtivo = useMutation({
    mutationFn: ({ id, ativa }: { id: string; ativa: boolean }) =>
      fetch(`/api/agentes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativa }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentes'] })
    },
  })

  const duplicarAgente = useMutation({
    mutationFn: (agente: Agente) =>
      fetch('/api/agentes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: `${agente.nome} (Cópia)`,
          descricao: agente.descricao,
          avatar: agente.avatar,
          modelo: agente.modelo,
          provedorModelo: agente.provedorModelo,
          personalidade: agente.personalidade,
          diretorioTrabalho: agente.diretorioTrabalho,
          temperatura: agente.temperatura,
          maxTokens: agente.maxTokens,
          categoria: agente.categoria,
          cor: agente.cor,
          habilidadeIds: agente.habilidadeIds,
          ferramentaIds: agente.ferramentaIds,
        }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentes'] })
    },
  })

  const seedTemplates = useMutation({
    mutationFn: () =>
      fetch('/api/agentes/templates', { method: 'POST' }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agentes-templates'] })
    },
  })

  // ─── Computed ────────────────────────────────────────────────────────────

  const filtrados = useMemo(() => {
    if (!agentes) return []
    return agentes.filter((a) => {
      const matchBusca = a.nome.toLowerCase().includes(busca.toLowerCase()) ||
        (a.descricao?.toLowerCase().includes(busca.toLowerCase()) ?? false)
      return matchBusca
    })
  }, [agentes, busca])

  const totalAgentes = agentes?.length ?? 0
  const totalAtivos = useMemo(() => agentes?.filter(a => a.ativo).length ?? 0, [agentes])
  const totalTemplates = templates?.length ?? 0
  const totalConversas = useMemo(() => agentes?.reduce((acc, a) => acc + a.conversasTotal, 0) ?? 0, [agentes])

  const habilidadesDoAgente = useMemo(() => {
    if (!habilidadesAgenteDialogo || !todasHabilidades) return []
    try {
      const ids: string[] = JSON.parse(habilidadesAgenteDialogo.habilidadeIds || '[]')
      return todasHabilidades.filter(h => ids.includes(h.id))
    } catch { return [] }
  }, [habilidadesAgenteDialogo, todasHabilidades])

  const habilidadesPorCategoria = useMemo(() => {
    const grupos: Record<string, HabilidadeSimples[]> = {}
    for (const h of habilidadesDoAgente) {
      const cat = h.categoria || 'geral'
      if (!grupos[cat]) grupos[cat] = []
      grupos[cat].push(h)
    }
    return grupos
  }, [habilidadesDoAgente])

  // ─── Handlers ────────────────────────────────────────────────────────────

  const fecharDialogo = () => {
    setDialogoAberto(false)
    setEditando(null)
    setFormulario({ ...formularioVazio })
    setEmojiPickerAberto(false)
    setAbaFormulario('identidade')
  }

  const abrirCriacao = () => {
    setEditando(null)
    setFormulario({ ...formularioVazio })
    setAbaFormulario('identidade')
    setDialogoAberto(true)
  }

  const abrirEdicao = (agente: Agente) => {
    setEditando(agente)
    setFormulario({
      nome: agente.nome,
      descricao: agente.descricao ?? '',
      avatar: agente.avatar ?? '🤖',
      categoria: agente.categoria,
      cor: agente.cor,
      personalidade: agente.personalidade,
      temperatura: agente.temperatura,
      maxTokens: agente.maxTokens,
      modelo: agente.modelo,
      provedorModelo: agente.provedorModelo,
    })
    setAbaFormulario('identidade')
    setDialogoAberto(true)
  }

  const usarTemplate = (template: Agente) => {
    setEditando(null)
    setFormulario({
      nome: template.nome,
      descricao: template.descricao ?? '',
      avatar: template.avatar ?? '🤖',
      categoria: template.categoria,
      cor: template.cor,
      personalidade: template.personalidade,
      temperatura: template.temperatura,
      maxTokens: template.maxTokens,
      modelo: template.modelo,
      provedorModelo: template.provedorModelo,
    })
    setAbaFormulario('identidade')
    setDialogoAberto(true)
  }

  const salvarAgente = () => {
    if (!formulario.nome.trim() || !formulario.personalidade.trim()) return
    if (editando) {
      atualizarAgente.mutate({ id: editando.id, dados: formulario })
    } else {
      criarAgente.mutate(formulario)
    }
  }

  const formularioValido = formulario.nome.trim() !== '' && formulario.personalidade.trim() !== ''

  // Conversar com agente
  const conversarComAgente = useCallback((agenteId: string) => {
    setAgenteIdParaConversa(agenteId)
    setSecaoAtiva('conversas')
  }, [setAgenteIdParaConversa, setSecaoAtiva])

  // Conversar com template (cria agente primeiro)
  const conversarComTemplate = useCallback(async (template: Agente) => {
    try {
      const resposta = await fetch('/api/agentes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: template.nome,
          descricao: template.descricao,
          avatar: template.avatar,
          modelo: template.modelo,
          provedorModelo: template.provedorModelo,
          personalidade: template.personalidade,
          categoria: template.categoria,
          cor: template.cor,
          temperatura: template.temperatura,
          maxTokens: template.maxTokens,
          habilidadeIds: template.habilidadeIds,
          ferramentaIds: template.ferramentaIds,
        }),
      })
      const agenteCriado = await resposta.json()
      if (agenteCriado?.id) {
        setAgenteIdParaConversa(agenteCriado.id)
        setSecaoAtiva('conversas')
        queryClient.invalidateQueries({ queryKey: ['agentes'] })
      }
    } catch {
      // Fallback silencioso
    }
  }, [setAgenteIdParaConversa, setSecaoAtiva, queryClient])

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* ─── Hero Banner ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-600 p-6 text-white"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-white/5 rounded-full" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Bot className="size-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Construtor de Agentes</h1>
              <p className="text-teal-100 text-sm">Crie agentes inteligentes personalizados</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5 bg-white/20 hover:bg-white/30 text-white border-white/20"
              onClick={() => {
                if (templates && templates.length === 0) {
                  seedTemplates.mutate()
                }
              }}
              disabled={seedTemplates.isPending}
            >
              {seedTemplates.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <LayoutTemplate className="size-3.5" />
              )}
              Usar Template
            </Button>
            <Button
              className="gap-2 bg-white/20 hover:bg-white/30 text-white border border-white/20 font-semibold shadow-lg"
              onClick={abrirCriacao}
            >
              <Plus className="size-4" />
              Novo Agente
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ─── Stats Bar ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-teal-500 bg-gradient-to-br from-teal-50/50 to-emerald-50/50 dark:from-teal-950/20 dark:to-emerald-950/20">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="size-9 rounded-lg bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
              <Users className="size-4 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-teal-600 dark:text-teal-400">{totalAgentes}</p>
              <p className="text-[10px] text-muted-foreground">Total Agentes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-50/50 to-green-50/50 dark:from-emerald-950/20 dark:to-green-950/20">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="size-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{totalAtivos}</p>
              <p className="text-[10px] text-muted-foreground">Ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50/50 to-fuchsia-50/50 dark:from-purple-950/20 dark:to-fuchsia-950/20">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="size-9 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
              <LayoutTemplate className="size-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{totalTemplates}</p>
              <p className="text-[10px] text-muted-foreground">Templates</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="size-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
              <MessageSquare className="size-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{totalConversas}</p>
              <p className="text-[10px] text-muted-foreground">Conversas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Templates Section ─────────────────────────────────────────────── */}
      {templates && templates.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <LayoutTemplate className="size-5 text-purple-600 dark:text-purple-400" />
              Templates
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-teal-600 hover:text-teal-700 dark:text-teal-400"
              onClick={() => seedTemplates.mutate()}
              disabled={seedTemplates.isPending}
            >
              {seedTemplates.isPending ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null}
              Restaurar Templates
            </Button>
          </div>
          <ScrollArea className="w-full">
            <div className="flex gap-3 pb-2">
              {templates.map((template, i) => {
                const cor = obterCor(template.cor)
                return (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="min-w-[240px] max-w-[280px] shrink-0"
                  >
                    <Card className="h-full hover:shadow-lg transition-all duration-200 border-l-4 group cursor-pointer" onClick={() => usarTemplate(template)}>
                      <div className={`h-1 bg-gradient-to-r from-teal-500 to-emerald-500`} />
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className={`size-10 rounded-lg ${cor.bg} flex items-center justify-center text-lg shrink-0`}>
                            {template.avatar ?? '🤖'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm truncate">{template.nome}</p>
                            <Badge className={`text-[9px] ${obterCategoriaBadge(template.categoria)}`}>
                              {obterCategoriaRotulo(template.categoria)}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {template.descricao ?? 'Sem descrição'}
                        </p>
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            className="flex-1 gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs h-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              conversarComTemplate(template)
                            }}
                          >
                            <MessageSquare className="size-3" />
                            Conversar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 gap-1.5 text-xs h-8 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20"
                            onClick={(e) => {
                              e.stopPropagation()
                              usarTemplate(template)
                            }}
                          >
                            <LayoutTemplate className="size-3" />
                            Usar Template
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* ─── Search ───────────────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar agentes por nome ou descrição..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9 h-11 bg-background border-border/60 focus-visible:ring-teal-500/30 focus-visible:border-teal-500"
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

      {/* ─── Agent Grid ───────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-3 p-4 rounded-lg border border-l-4 border-l-teal-400">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-2/3 mb-1" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-3 w-full" />
              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="h-12 rounded" />
                <Skeleton className="h-12 rounded" />
                <Skeleton className="h-12 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filtrados.length === 0 && (agentes?.length ?? 0) === 0 ? (
        /* ─── Empty State ─────────────────────────────────────────────────── */
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <div className="size-16 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mb-4">
              <Bot className="size-8 text-teal-600/50" />
            </div>
            <p className="font-medium text-lg">Nenhum agente criado</p>
            <p className="text-sm mt-1">Crie seu primeiro agente ou use um template</p>
            <div className="flex gap-2 mt-4">
              <Button
                className="gap-2 bg-teal-600 hover:bg-teal-700 text-white"
                onClick={abrirCriacao}
              >
                <Plus className="size-4" />
                Novo Agente
              </Button>
              <Button
                variant="outline"
                className="gap-2 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20"
                onClick={() => {
                  if (templates && templates.length === 0) {
                    seedTemplates.mutate()
                  }
                }}
                disabled={seedTemplates.isPending}
              >
                {seedTemplates.isPending ? <Loader2 className="size-4 animate-spin" /> : <LayoutTemplate className="size-4" />}
                Usar Template
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : filtrados.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Search className="size-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium">Nenhum agente encontrado</p>
            <p className="text-sm mt-1">Tente buscar com outros termos</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtrados.map((agente, i) => {
              const cor = obterCor(agente.cor)
              return (
                <motion.div
                  key={agente.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03 }}
                  layout
                >
                  <Card className={`
                    border-l-4 ${cor.border} dark:${cor.border}
                    hover:shadow-lg transition-all duration-200 group overflow-hidden
                    ${!agente.ativo ? 'opacity-60' : ''}
                  `}>
                    {/* Color header strip */}
                    <div className={`h-1.5 bg-gradient-to-r ${
                      agente.cor === 'amber' ? 'from-amber-400 to-orange-500' :
                      agente.cor === 'emerald' ? 'from-emerald-400 to-teal-500' :
                      agente.cor === 'purple' ? 'from-purple-400 to-fuchsia-500' :
                      agente.cor === 'sky' ? 'from-sky-400 to-blue-500' :
                      agente.cor === 'cyan' ? 'from-cyan-400 to-teal-500' :
                      agente.cor === 'rose' ? 'from-rose-400 to-pink-500' :
                      agente.cor === 'violet' ? 'from-violet-400 to-purple-500' :
                      'from-fuchsia-400 to-pink-500'
                    }`} />

                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {/* Avatar */}
                          <div className={`size-11 rounded-xl ${cor.bg} flex items-center justify-center text-xl shrink-0`}>
                            {agente.avatar ?? '🤖'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base flex items-center gap-2">
                              <span className="truncate">{agente.nome}</span>
                            </CardTitle>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <Badge className={`text-[9px] ${obterCategoriaBadge(agente.categoria)}`}>
                                {obterCategoriaRotulo(agente.categoria)}
                              </Badge>
                                <Badge variant="outline" className="text-[9px] gap-0.5">
                                <Cpu className="size-2.5" />
                                {agente.modelo.length > 20 ? agente.modelo.slice(0, 20) + '…' : agente.modelo}
                              </Badge>
                              {agente.habilidadeIds && (() => {
                                try {
                                  const ids = JSON.parse(agente.habilidadeIds)
                                  return ids.length > 0 ? (
                                    <Badge className="text-[9px] gap-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-0">
                                      <Shield className="size-2.5" />
                                      {ids.length} skill{ids.length !== 1 ? 's' : ''}
                                    </Badge>
                                  ) : null
                                } catch { return null }
                              })()}
                            </div>
                          </div>
                        </div>
                        {/* Active Switch */}
                        <Switch
                          checked={agente.ativo}
                          onCheckedChange={(checked) => toggleAtivo.mutate({ id: agente.id, ativa: checked })}
                          className="scale-75 origin-top-right"
                        />
                      </div>
                      {agente.descricao && (
                        <CardDescription className="mt-2 text-xs line-clamp-2">
                          {agente.descricao}
                        </CardDescription>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {/* Temperature and Max Tokens */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-1">
                            <Thermometer className="size-3 text-orange-500" />
                            <p className="text-base font-bold text-orange-600 dark:text-orange-400">
                              {agente.temperatura.toFixed(1)}
                            </p>
                          </div>
                          <p className="text-[9px] text-muted-foreground">Temperatura</p>
                        </div>
                        <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-1">
                            <Hash className="size-3 text-purple-500" />
                            <p className="text-base font-bold text-purple-600 dark:text-purple-400">
                              {agente.maxTokens.toLocaleString('pt-BR')}
                            </p>
                          </div>
                          <p className="text-[9px] text-muted-foreground">Max Tokens</p>
                        </div>
                      </div>

                      {/* Skills indicator bar */}
                      {agente.habilidadeIds && (() => {
                        try {
                          const ids = JSON.parse(agente.habilidadeIds)
                          return ids.length > 0 ? (
                            <div
                              className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 cursor-pointer hover:shadow-md transition-all duration-200"
                              onClick={() => setHabilidadesAgenteDialogo(agente)}
                            >
                              <Zap className="size-3 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                                {ids.length} skills especializadas ativas
                              </span>
                            </div>
                          ) : null
                        } catch { return null }
                      })()}

                      {/* Conversations + Last Active */}
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="size-3" />
                          {agente.conversasTotal} conversa{agente.conversasTotal !== 1 ? 's' : ''}
                        </span>
                        {agente.ultimaConversa ? (
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {tempoRelativo(agente.ultimaConversa)}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            Nunca
                          </span>
                        )}
                      </div>

                      <Separator />

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 gap-1.5 text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600 h-8 text-xs font-medium shadow-sm"
                          onClick={() => conversarComAgente(agente.id)}
                        >
                          <MessageSquare className="size-3" />
                          Conversar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 gap-1.5 text-muted-foreground hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 h-8 text-xs"
                          onClick={() => abrirEdicao(agente)}
                        >
                          <Pencil className="size-3" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 gap-1.5 text-muted-foreground hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 h-8 text-xs"
                          onClick={() => duplicarAgente.mutate(agente)}
                          disabled={duplicarAgente.isPending}
                        >
                          {duplicarAgente.isPending ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                          Duplicar
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive">
                              <Trash2 className="size-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir agente?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. O agente &quot;{agente.nome}&quot; será removido permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deletarAgente.mutate(agente.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ─── Skills Detail Dialog ────────────────────────────────────────────── */}
      <Dialog open={!!habilidadesAgenteDialogo} onOpenChange={(aberto) => {
        if (!aberto) setHabilidadesAgenteDialogo(null)
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="size-5 text-emerald-600 dark:text-emerald-400" />
              Skills do Agente "{habilidadesAgenteDialogo?.nome}"
            </DialogTitle>
            <DialogDescription>
              {habilidadesDoAgente.length} skill{habilidadesDoAgente.length !== 1 ? 's' : ''} especializada{habilidadesDoAgente.length !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-1">
            {carregandoHabilidades ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-6 animate-spin text-emerald-600" />
                <span className="ml-2 text-sm text-muted-foreground">Carregando skills...</span>
              </div>
            ) : habilidadesDoAgente.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Shield className="size-10 text-muted-foreground/40 mb-3" />
                <p className="font-medium">Nenhuma skill encontrada</p>
                <p className="text-sm mt-1">As skills vinculadas a este agente não foram encontradas</p>
              </div>
            ) : (
              <div className="space-y-5">
                {Object.entries(habilidadesPorCategoria).map(([categoria, habilidades]) => {
                  const categoriaIcone: Record<string, string> = {
                    diagnostico: '🔍',
                    resolucao: '🛠️',
                    infraestrutura: '🏗️',
                    seguranca: '🔒',
                    otimizacao: '⚡',
                    comunicacao: '💬',
                    prevencao: '🛡️',
                    qualidade: '✅',
                    geral: '📦',
                  }
                  const categoriaCor: Record<string, string> = {
                    diagnostico: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
                    resolucao: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
                    infraestrutura: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
                    seguranca: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
                    otimizacao: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
                    comunicacao: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
                    prevencao: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
                    qualidade: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
                    geral: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300',
                  }
                  const badgeClass = categoriaCor[categoria] || categoriaCor.geral
                  const icone = categoriaIcone[categoria] || '📦'
                  return (
                    <div key={categoria}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm">{icone}</span>
                        <h3 className="text-sm font-semibold capitalize">{categoria}</h3>
                        <Badge className={`text-[9px] ${badgeClass}`}>
                          {habilidades.length} skill{habilidades.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {habilidades.map((habilidade) => (
                          <div
                            key={habilidade.id}
                            className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <p className="text-sm font-medium truncate">{habilidade.nome}</p>
                              {habilidade.ativa ? (
                                <Badge className="text-[8px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-0 shrink-0">
                                  Ativa
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[8px] shrink-0">
                                  Inativa
                                </Badge>
                              )}
                            </div>
                            {habilidade.descricao && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {habilidade.descricao}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <DialogFooter className="shrink-0 pt-2 border-t">
            <Button
              variant="outline"
              onClick={() => setHabilidadesAgenteDialogo(null)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Create/Edit Dialog ─────────────────────────────────────────────── */}
      <Dialog open={dialogoAberto} onOpenChange={(aberto) => {
        if (!aberto) fecharDialogo()
        else setDialogoAberto(true)
      }}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editando ? (
                <><Pencil className="size-4 text-teal-600" /> Editar Agente</>
              ) : (
                <><Plus className="size-4 text-teal-600" /> Novo Agente</>
              )}
            </DialogTitle>
            <DialogDescription>
              {editando ? 'Altere os dados do agente' : 'Configure seu novo agente de IA'}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={abaFormulario} onValueChange={setAbaFormulario} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-3 shrink-0">
              <TabsTrigger value="identidade" className="gap-1.5 text-xs">
                <Bot className="size-3" />
                Identidade
              </TabsTrigger>
              <TabsTrigger value="personalidade" className="gap-1.5 text-xs">
                <Brain className="size-3" />
                Personalidade
              </TabsTrigger>
              <TabsTrigger value="modelo" className="gap-1.5 text-xs">
                <Cpu className="size-3" />
                Modelo
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-4 pr-1">
              {/* ─── Identidade Tab ────────────────────────────────────────── */}
              <TabsContent value="identidade" className="space-y-4 mt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <Bot className="size-3.5 text-teal-600" />
                      Nome *
                    </Label>
                    <Input
                      value={formulario.nome}
                      onChange={(e) => setFormulario(f => ({ ...f, nome: e.target.value }))}
                      placeholder="Nome do agente"
                      className="focus-visible:ring-teal-500/30 focus-visible:border-teal-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <Palette className="size-3.5 text-teal-600" />
                      Avatar
                    </Label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setEmojiPickerAberto(!emojiPickerAberto)}
                        className={`flex items-center gap-2 h-9 w-full rounded-md border border-input bg-background px-3 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors ${emojiPickerAberto ? 'ring-2 ring-teal-500/30 border-teal-500' : ''}`}
                      >
                        <span className="text-lg">{formulario.avatar}</span>
                        <span className="text-muted-foreground text-xs">Clique para alterar</span>
                      </button>
                      {emojiPickerAberto && (
                        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-popover border rounded-lg shadow-lg p-2">
                          <div className="grid grid-cols-8 gap-1">
                            {emojisGrid.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => {
                                  setFormulario(f => ({ ...f, avatar: emoji }))
                                  setEmojiPickerAberto(false)
                                }}
                                className={`size-9 flex items-center justify-center rounded-md text-lg hover:bg-accent transition-colors ${formulario.avatar === emoji ? 'bg-teal-100 dark:bg-teal-900/30 ring-1 ring-teal-500' : ''}`}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Descrição</Label>
                  <Input
                    value={formulario.descricao}
                    onChange={(e) => setFormulario(f => ({ ...f, descricao: e.target.value }))}
                    placeholder="Descrição breve do agente"
                    className="focus-visible:ring-teal-500/30 focus-visible:border-teal-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Categoria</Label>
                    <Select value={formulario.categoria} onValueChange={(v) => setFormulario(f => ({ ...f, categoria: v }))}>
                      <SelectTrigger className="focus:ring-teal-500/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriasOpcoes.map((cat) => (
                          <SelectItem key={cat.valor} value={cat.valor}>
                            {cat.icone} {cat.rotulo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Cor</Label>
                    <Select value={formulario.cor} onValueChange={(v) => setFormulario(f => ({ ...f, cor: v }))}>
                      <SelectTrigger className="focus:ring-teal-500/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {coresOpcoes.map((cor) => {
                          const classes = obterCor(cor.valor)
                          return (
                            <SelectItem key={cor.valor} value={cor.valor}>
                              <span className="flex items-center gap-2">
                                <span className={`inline-block size-3 rounded-full ${classes.bg}`} />
                                {cor.rotulo}
                              </span>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Preview */}
                <div className="p-3 rounded-lg border border-dashed bg-muted/30 space-y-2">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Pré-visualização</p>
                  <div className="flex items-center gap-3">
                    <div className={`size-10 rounded-lg ${obterCor(formulario.cor).bg} flex items-center justify-center text-lg`}>
                      {formulario.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{formulario.nome || 'Nome do Agente'}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge className={`text-[9px] ${obterCategoriaBadge(formulario.categoria)}`}>
                          {obterCategoriaRotulo(formulario.categoria)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ─── Personalidade Tab ─────────────────────────────────────── */}
              <TabsContent value="personalidade" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Activity className="size-3.5 text-teal-600" />
                    Personalidade / Prompt do Sistema *
                  </Label>
                  <Textarea
                    value={formulario.personalidade}
                    onChange={(e) => setFormulario(f => ({ ...f, personalidade: e.target.value }))}
                    placeholder="Descreva a personalidade e o comportamento do agente. Este será o prompt do sistema que guiará suas respostas."
                    rows={5}
                    className="focus-visible:ring-teal-500/30 focus-visible:border-teal-500"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    {formulario.personalidade.length} caracteres
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium flex items-center gap-1.5">
                        <Thermometer className="size-3.5 text-orange-500" />
                        Temperatura
                      </Label>
                      <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                        {formulario.temperatura.toFixed(1)}
                      </span>
                    </div>
                    <Slider
                      value={[formulario.temperatura]}
                      onValueChange={([v]) => setFormulario(f => ({ ...f, temperatura: v }))}
                      min={0}
                      max={1}
                      step={0.1}
                      className="[&_[role=slider]]:bg-orange-500 [&_.relative]:bg-orange-200 dark:[&_.relative]:bg-orange-900/30"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Preciso (0)</span>
                      <span>Criativo (1)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Hash className="size-3.5 text-purple-500" />
                    Max Tokens
                  </Label>
                  <Input
                    type="number"
                    value={formulario.maxTokens}
                    onChange={(e) => setFormulario(f => ({ ...f, maxTokens: parseInt(e.target.value) || 4096 }))}
                    min={256}
                    max={32768}
                    step={256}
                    className="focus-visible:ring-teal-500/30 focus-visible:border-teal-500"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Quantidade máxima de tokens na resposta (256–32768)
                  </p>
                </div>
              </TabsContent>

              {/* ─── Modelo Tab ────────────────────────────────────────────── */}
              <TabsContent value="modelo" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Cpu className="size-3.5 text-teal-600" />
                    Modelo
                  </Label>
                  <Input
                    value={formulario.modelo}
                    onChange={(e) => setFormulario(f => ({ ...f, modelo: e.target.value }))}
                    placeholder="meta-llama/llama-3.3-70b-instruct:free"
                    className="focus-visible:ring-teal-500/30 focus-visible:border-teal-500 font-mono text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Identificador do modelo no provedor
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Provedor do Modelo</Label>
                  <Select value={formulario.provedorModelo} onValueChange={(v) => setFormulario(f => ({ ...f, provedorModelo: v }))}>
                    <SelectTrigger className="focus:ring-teal-500/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openrouter">OpenRouter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Model info card */}
                <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Configuração do Modelo</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <Cpu className="size-4 text-teal-600 dark:text-teal-400" />
                      <div>
                        <p className="text-xs font-medium">Modelo</p>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">{formulario.modelo || 'Não definido'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="size-4 text-orange-500" />
                      <div>
                        <p className="text-xs font-medium">Temperatura</p>
                        <p className="text-[10px] text-muted-foreground">{formulario.temperatura.toFixed(1)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hash className="size-4 text-purple-500" />
                      <div>
                        <p className="text-xs font-medium">Max Tokens</p>
                        <p className="text-[10px] text-muted-foreground">{formulario.maxTokens.toLocaleString('pt-BR')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bot className="size-4 text-teal-600" />
                      <div>
                        <p className="text-xs font-medium">Provedor</p>
                        <p className="text-[10px] text-muted-foreground capitalize">{formulario.provedorModelo}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter className="gap-2 shrink-0 pt-2 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mr-auto">
              {!formulario.nome.trim() && <span className="text-destructive">Nome é obrigatório</span>}
              {formulario.nome.trim() && !formulario.personalidade.trim() && <span className="text-destructive">Personalidade é obrigatória</span>}
            </div>
            <Button variant="outline" onClick={fecharDialogo}>
              Cancelar
            </Button>
            {abaFormulario !== 'modelo' ? (
              <Button
                className="bg-teal-600 hover:bg-teal-700 text-white"
                onClick={() => {
                  if (abaFormulario === 'identidade') setAbaFormulario('personalidade')
                  else if (abaFormulario === 'personalidade') setAbaFormulario('modelo')
                }}
              >
                Próximo
                <ChevronRight className="size-4 ml-1" />
              </Button>
            ) : (
              <Button
                className="bg-teal-600 hover:bg-teal-700 text-white"
                onClick={salvarAgente}
                disabled={!formularioValido || criarAgente.isPending || atualizarAgente.isPending}
              >
                {(criarAgente.isPending || atualizarAgente.isPending) && (
                  <Loader2 className="size-4 animate-spin mr-1" />
                )}
                {editando ? 'Salvar Alterações' : 'Criar Agente'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
