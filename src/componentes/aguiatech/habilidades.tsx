'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Plus,
  Search,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Play,
  Filter,
  Zap,
  Activity,
  Database,
  Hash,
  Code2,
  TrendingUp,
  Globe,
  MessageSquare,
  Image,
  Brain,
  Eye,
  Mic,
  FileText,
  Languages,
  Heart,
  Terminal,
  Table2,
  BookOpen,
  RotateCcw,
  ChevronDown,
  Rocket,
  FlaskConical,
  Package,
  Shield,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
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

interface Habilidade {
  id: string
  nome: string
  categoria: string
  descricao: string | null
  conteudo: string
  parametros: string | null
  versao: number
  usoContagem: number
  taxaSucesso: number
  criadaPorAgente: boolean
  ativa: boolean
  createdAt: string
  updatedAt: string
  execucoes?: ExecucaoHabilidade[]
}

interface ExecucaoHabilidade {
  id: string
  habilidadeId: string
  entrada: string
  saida: string | null
  sucesso: boolean
  duracao: number | null
  feedback: string | null
  createdAt: string
}

// Skill type icons mapping
const iconeTipoHabilidade: Record<string, { icone: React.ElementType; cor: string; bgCor: string }> = {
  web_search: { icone: Globe, cor: 'text-sky-600 dark:text-sky-400', bgCor: 'bg-sky-100 dark:bg-sky-900/30' },
  llm_chat: { icone: MessageSquare, cor: 'text-amber-600 dark:text-amber-400', bgCor: 'bg-amber-100 dark:bg-amber-900/30' },
  image_generation: { icone: Image, cor: 'text-fuchsia-600 dark:text-fuchsia-400', bgCor: 'bg-fuchsia-100 dark:bg-fuchsia-900/30' },
  vlm_analysis: { icone: Eye, cor: 'text-indigo-600 dark:text-indigo-400', bgCor: 'bg-indigo-100 dark:bg-indigo-900/30' },
  tts: { icone: Mic, cor: 'text-rose-600 dark:text-rose-400', bgCor: 'bg-rose-100 dark:bg-rose-900/30' },
  asr: { icone: FileText, cor: 'text-teal-600 dark:text-teal-400', bgCor: 'bg-teal-100 dark:bg-teal-900/30' },
  resumo: { icone: FileText, cor: 'text-orange-600 dark:text-orange-400', bgCor: 'bg-orange-100 dark:bg-orange-900/30' },
  traducao: { icone: Languages, cor: 'text-cyan-600 dark:text-cyan-400', bgCor: 'bg-cyan-100 dark:bg-cyan-900/30' },
  sentimento: { icone: Heart, cor: 'text-pink-600 dark:text-pink-400', bgCor: 'bg-pink-100 dark:bg-pink-900/30' },
  codigo: { icone: Terminal, cor: 'text-emerald-600 dark:text-emerald-400', bgCor: 'bg-emerald-100 dark:bg-emerald-900/30' },
  extracao: { icone: Table2, cor: 'text-violet-600 dark:text-violet-400', bgCor: 'bg-violet-100 dark:bg-violet-900/30' },
  web_reader: { icone: BookOpen, cor: 'text-blue-600 dark:text-blue-400', bgCor: 'bg-blue-100 dark:bg-blue-900/30' },
}

// Skill name to tipo mapping
function obterTipoHabilidade(habilidade: Habilidade): string {
  if (habilidade.parametros) {
    try {
      const params = JSON.parse(habilidade.parametros)
      return params.tipo || 'desconhecido'
    } catch {
      return 'desconhecido'
    }
  }
  return 'desconhecido'
}

function obterIconeTipo(tipo: string): { icone: React.ElementType; cor: string; bgCor: string } {
  return iconeTipoHabilidade[tipo] || { icone: Sparkles, cor: 'text-gray-600 dark:text-gray-400', bgCor: 'bg-gray-100 dark:bg-gray-900/30' }
}

// Format relative time
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

// Category info map with labels, icons, and emojis
const categoriaInfo: Record<string, { label: string; icon: React.ElementType; emoji: string }> = {
  nucleo: { label: 'Núcleo', icon: Zap, emoji: '⭐' },
  avancado: { label: 'Avançado', icon: Rocket, emoji: '🚀' },
  experimental: { label: 'Experimental', icon: FlaskConical, emoji: '🧪' },
  geral: { label: 'Geral', icon: Package, emoji: '📦' },
  diagnostico: { label: 'Diagnóstico', icon: Activity, emoji: '🔍' },
  resolucao: { label: 'Resolução', icon: CheckCircle2, emoji: '🛠️' },
  infraestrutura: { label: 'Infraestrutura', icon: Database, emoji: '🏗️' },
  seguranca: { label: 'Segurança', icon: Shield, emoji: '🔐' },
  otimizacao: { label: 'Otimização', icon: TrendingUp, emoji: '⚡' },
  comunicacao: { label: 'Comunicação', icon: MessageSquare, emoji: '💬' },
  prevencao: { label: 'Prevenção', icon: Shield, emoji: '🛡️' },
  qualidade: { label: 'Qualidade', icon: CheckCircle2, emoji: '✅' },
  estrategia: { label: 'Estratégia', icon: Rocket, emoji: '🎯' },
  criatividade: { label: 'Criatividade', icon: Sparkles, emoji: '🔥' },
  conteudo: { label: 'Conteúdo', icon: FileText, emoji: '🏗️' },
  psicologia: { label: 'Psicologia', icon: Brain, emoji: '🧠' },
  crescimento: { label: 'Crescimento', icon: TrendingUp, emoji: '📈' },
  inovacao: { label: 'Inovação', icon: FlaskConical, emoji: '💡' },
  orquestracao: { label: 'Orquestração', icon: Zap, emoji: '🧭' },
  analise: { label: 'Análise', icon: Activity, emoji: '🔍' },
  investigacao: { label: 'Investigação', icon: Eye, emoji: '📡' },
  validacao: { label: 'Validação', icon: CheckCircle2, emoji: '🧪' },
  critica: { label: 'Crítica', icon: Shield, emoji: '🛡️' },
  documentacao: { label: 'Documentação', icon: FileText, emoji: '📚' },
  marketing: { label: 'Marketing', icon: Rocket, emoji: '📣' },
}

const categoriaBorderColor: Record<string, string> = {
  nucleo: 'border-l-amber-500 dark:border-l-amber-400',
  avancado: 'border-l-emerald-500 dark:border-l-emerald-400',
  experimental: 'border-l-purple-500 dark:border-l-purple-400',
  geral: 'border-l-slate-400 dark:border-l-slate-500',
  diagnostico: 'border-l-sky-500 dark:border-l-sky-400',
  resolucao: 'border-l-emerald-500 dark:border-l-emerald-400',
  infraestrutura: 'border-l-slate-500 dark:border-l-slate-400',
  seguranca: 'border-l-rose-500 dark:border-l-rose-400',
  otimizacao: 'border-l-amber-500 dark:border-l-amber-400',
  comunicacao: 'border-l-cyan-500 dark:border-l-cyan-400',
  prevencao: 'border-l-teal-500 dark:border-l-teal-400',
  qualidade: 'border-l-purple-500 dark:border-l-purple-400',
  estrategia: 'border-l-pink-500 dark:border-l-pink-400',
  criatividade: 'border-l-orange-500 dark:border-l-orange-400',
  conteudo: 'border-l-violet-500 dark:border-l-violet-400',
  psicologia: 'border-l-fuchsia-500 dark:border-l-fuchsia-400',
  crescimento: 'border-l-emerald-500 dark:border-l-emerald-400',
  inovacao: 'border-l-amber-500 dark:border-l-amber-400',
  orquestracao: 'border-l-sky-500 dark:border-l-sky-400',
  analise: 'border-l-cyan-500 dark:border-l-cyan-400',
  investigacao: 'border-l-indigo-500 dark:border-l-indigo-400',
  validacao: 'border-l-teal-500 dark:border-l-teal-400',
  critica: 'border-l-rose-500 dark:border-l-rose-400',
  documentacao: 'border-l-slate-500 dark:border-l-slate-400',
  marketing: 'border-l-pink-500 dark:border-l-pink-400',
}

const categoriaGlowColor: Record<string, string> = {
  nucleo: 'shadow-amber-100 dark:shadow-amber-900/30',
  avancado: 'shadow-emerald-100 dark:shadow-emerald-900/30',
  experimental: 'shadow-purple-100 dark:shadow-purple-900/30',
  geral: 'shadow-slate-100 dark:shadow-slate-900/30',
  diagnostico: 'shadow-sky-100 dark:shadow-sky-900/30',
  resolucao: 'shadow-emerald-100 dark:shadow-emerald-900/30',
  infraestrutura: 'shadow-slate-100 dark:shadow-slate-900/30',
  seguranca: 'shadow-rose-100 dark:shadow-rose-900/30',
  otimizacao: 'shadow-amber-100 dark:shadow-amber-900/30',
  comunicacao: 'shadow-cyan-100 dark:shadow-cyan-900/30',
  prevencao: 'shadow-teal-100 dark:shadow-teal-900/30',
  qualidade: 'shadow-purple-100 dark:shadow-purple-900/30',
  estrategia: 'shadow-pink-100 dark:shadow-pink-900/30',
  criatividade: 'shadow-orange-100 dark:shadow-orange-900/30',
  conteudo: 'shadow-violet-100 dark:shadow-violet-900/30',
  psicologia: 'shadow-fuchsia-100 dark:shadow-fuchsia-900/30',
  crescimento: 'shadow-emerald-100 dark:shadow-emerald-900/30',
  inovacao: 'shadow-amber-100 dark:shadow-amber-900/30',
  orquestracao: 'shadow-sky-100 dark:shadow-sky-900/30',
  analise: 'shadow-cyan-100 dark:shadow-cyan-900/30',
  investigacao: 'shadow-indigo-100 dark:shadow-indigo-900/30',
  validacao: 'shadow-teal-100 dark:shadow-teal-900/30',
  critica: 'shadow-rose-100 dark:shadow-rose-900/30',
  documentacao: 'shadow-slate-100 dark:shadow-slate-900/30',
  marketing: 'shadow-pink-100 dark:shadow-pink-900/30',
}

const categoriaProgressColor: Record<string, string> = {
  nucleo: '[&>div]:bg-amber-500',
  avancado: '[&>div]:bg-emerald-500',
  experimental: '[&>div]:bg-purple-500',
  geral: '[&>div]:bg-slate-400',
  diagnostico: '[&>div]:bg-sky-500',
  resolucao: '[&>div]:bg-emerald-500',
  infraestrutura: '[&>div]:bg-slate-500',
  seguranca: '[&>div]:bg-rose-500',
  otimizacao: '[&>div]:bg-amber-500',
  comunicacao: '[&>div]:bg-cyan-500',
  prevencao: '[&>div]:bg-teal-500',
  qualidade: '[&>div]:bg-purple-500',
  estrategia: '[&>div]:bg-pink-500',
  criatividade: '[&>div]:bg-orange-500',
  conteudo: '[&>div]:bg-violet-500',
  psicologia: '[&>div]:bg-fuchsia-500',
  crescimento: '[&>div]:bg-emerald-500',
  inovacao: '[&>div]:bg-amber-500',
  orquestracao: '[&>div]:bg-sky-500',
  analise: '[&>div]:bg-cyan-500',
  investigacao: '[&>div]:bg-indigo-500',
  validacao: '[&>div]:bg-teal-500',
  critica: '[&>div]:bg-rose-500',
  documentacao: '[&>div]:bg-slate-500',
  marketing: '[&>div]:bg-pink-500',
}

const categoriaHeaderGradient: Record<string, string> = {
  nucleo: 'from-amber-500 to-orange-600',
  avancado: 'from-emerald-500 to-teal-600',
  experimental: 'from-purple-500 to-fuchsia-600',
  geral: 'from-slate-400 to-slate-500',
  diagnostico: 'from-sky-500 to-blue-600',
  resolucao: 'from-emerald-500 to-green-600',
  infraestrutura: 'from-slate-500 to-gray-600',
  seguranca: 'from-rose-500 to-red-600',
  otimizacao: 'from-amber-500 to-yellow-600',
  comunicacao: 'from-cyan-500 to-sky-600',
  prevencao: 'from-teal-500 to-emerald-600',
  qualidade: 'from-purple-500 to-violet-600',
  estrategia: 'from-pink-500 to-rose-600',
  criatividade: 'from-orange-500 to-amber-600',
  conteudo: 'from-violet-500 to-purple-600',
  psicologia: 'from-fuchsia-500 to-pink-600',
  crescimento: 'from-emerald-500 to-green-600',
  inovacao: 'from-amber-500 to-yellow-600',
  orquestracao: 'from-sky-500 to-blue-600',
  analise: 'from-cyan-500 to-teal-600',
  investigacao: 'from-indigo-500 to-blue-600',
  validacao: 'from-teal-500 to-cyan-600',
  critica: 'from-rose-500 to-red-600',
  documentacao: 'from-slate-500 to-gray-600',
  marketing: 'from-pink-500 to-fuchsia-600',
}

export function Habilidades() {
  const { filtroCategoriaHabilidade, setFiltroCategoriaHabilidade } = useEstadoAguiatech()
  const { obterIconeCategoria, obterCorCategoria } = useAgente()
  const queryClient = useQueryClient()
  const [busca, setBusca] = useState('')
  const [dialogoAberto, setDialogoAberto] = useState(false)
  const [editando, setEditando] = useState<Habilidade | null>(null)
  const [formulario, setFormulario] = useState({
    nome: '',
    categoria: 'geral',
    descricao: '',
    conteudo: '',
    parametros: '',
  })

  // Testar Habilidade state
  const [testarDialogoAberto, setTestarDialogoAberto] = useState(false)
  const [testarHabilidade, setTestarHabilidade] = useState<Habilidade | null>(null)
  const [testarEntrada, setTestarEntrada] = useState('')
  const [testarResultado, setTestarResultado] = useState<{ saida: string; duracao: number; tipo?: string } | null>(null)

  // Detail dialog
  const [detalheDialogoAberto, setDetalheDialogoAberto] = useState(false)
  const [detalheHabilidade, setDetalheHabilidade] = useState<Habilidade | null>(null)

  const { data: habilidades, isLoading } = useQuery<Habilidade[]>({
    queryKey: ['habilidades'],
    queryFn: () => fetch('/api/habilidades').then(r => r.json()),
  })

  // Dynamic categories computed from habilidades data
  const categoriasDinamicas = useMemo(() => {
    const resultado: { id: string; label: string; icon: React.ElementType }[] = [
      { id: 'todas', label: 'Todas', icon: Filter },
    ]
    if (!habilidades) return resultado
    const catsUsadas = new Set(habilidades.map(h => h.categoria))
    // Add known categories first (only if they exist in data)
    for (const [id, info] of Object.entries(categoriaInfo)) {
      if (catsUsadas.has(id)) {
        resultado.push({ id, label: info.label, icon: info.icon })
      }
    }
    // Add any unknown categories that aren't in the map
    for (const cat of catsUsadas) {
      if (!categoriaInfo[cat] && cat !== 'todas') {
        resultado.push({ id: cat, label: cat.charAt(0).toUpperCase() + cat.slice(1), icon: Sparkles })
      }
    }
    return resultado
  }, [habilidades])

  const criarHabilidade = useMutation({
    mutationFn: (dados: typeof formulario) =>
      fetch('/api/habilidades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habilidades'] })
      setDialogoAberto(false)
      resetFormulario()
    },
  })

  const atualizarHabilidade = useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: Partial<typeof formulario> }) =>
      fetch(`/api/habilidades/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habilidades'] })
      setDialogoAberto(false)
      setEditando(null)
      resetFormulario()
    },
  })

  const deletarHabilidade = useMutation({
    mutationFn: (id: string) => fetch(`/api/habilidades/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habilidades'] })
    },
  })

  const testarHabilidadeMutation = useMutation({
    mutationFn: ({ habilidadeId, entrada }: { habilidadeId: string; entrada: string }) =>
      fetch('/api/habilidades/testar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habilidadeId, entrada }),
      }).then(r => r.json()),
    onSuccess: (data) => {
      setTestarResultado({ saida: data.saida, duracao: data.duracao, tipo: data.tipo })
      queryClient.invalidateQueries({ queryKey: ['habilidades'] })
    },
  })

  const seedHabilidades = useMutation({
    mutationFn: () =>
      fetch('/api/habilidades/seed-habilidades', { method: 'POST' }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habilidades'] })
    },
  })

  const toggleAtiva = useMutation({
    mutationFn: ({ id, ativa }: { id: string; ativa: boolean }) =>
      fetch(`/api/habilidades/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativa }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habilidades'] })
    },
  })

  const resetFormulario = () => {
    setFormulario({ nome: '', categoria: 'geral', descricao: '', conteudo: '', parametros: '' })
  }

  const abrirEdicao = (habilidade: Habilidade) => {
    setEditando(habilidade)
    setFormulario({
      nome: habilidade.nome,
      categoria: habilidade.categoria,
      descricao: habilidade.descricao ?? '',
      conteudo: habilidade.conteudo,
      parametros: habilidade.parametros ?? '',
    })
    setDialogoAberto(true)
  }

  const abrirTestar = (habilidade: Habilidade) => {
    setTestarHabilidade(habilidade)
    setTestarEntrada('')
    setTestarResultado(null)
    setTestarDialogoAberto(true)
  }

  const abrirDetalhe = (habilidade: Habilidade) => {
    setDetalheHabilidade(habilidade)
    setDetalheDialogoAberto(true)
  }

  const filtradas = habilidades?.filter((h) => {
    const matchCategoria = filtroCategoriaHabilidade === 'todas' || h.categoria === filtroCategoriaHabilidade
    const matchBusca = h.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (h.descricao?.toLowerCase().includes(busca.toLowerCase()) ?? false)
    return matchCategoria && matchBusca
  }) ?? []

  const totalUsos = useMemo(() => habilidades?.reduce((acc, h) => acc + h.usoContagem, 0) ?? 0, [habilidades])
  const mediaSucesso = useMemo(() => {
    if (!habilidades?.length) return 0
    return habilidades.reduce((acc, h) => acc + h.taxaSucesso, 0) / habilidades.length
  }, [habilidades])
  const habilidadesAtivas = useMemo(() => habilidades?.filter(h => h.ativa).length ?? 0, [habilidades])

  // Get placeholder text for test input based on skill type
  const obterPlaceholderTeste = (habilidade: Habilidade): string => {
    const tipo = obterTipoHabilidade(habilidade)
    switch (tipo) {
      case 'web_search': return 'Ex: últimas notícias sobre inteligência artificial'
      case 'llm_chat': return 'Ex: Explique como funciona aprendizado por reforço'
      case 'image_generation': return 'Ex: Um gato astronauta no espaço com estrelas'
      case 'vlm_analysis': return 'Cole uma URL de imagem ou base64 para análise'
      case 'tts': return 'Digite o texto que deseja converter em áudio'
      case 'asr': return 'Cole o base64 do áudio para transcrição'
      case 'web_reader': return 'Cole uma URL para extrair o conteúdo'
      default: return 'Digite a entrada para testar a habilidade...'
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 p-6 text-white"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-white/5 rounded-full" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="size-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Habilidades</h1>
              <p className="text-amber-100 text-sm">Habilidades de IA prontas para executar</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5 bg-white/20 hover:bg-white/30 text-white border-white/20"
              onClick={() => seedHabilidades.mutate()}
              disabled={seedHabilidades.isPending}
            >
              {seedHabilidades.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RotateCcw className="size-3.5" />
              )}
              Restaurar Padrão
            </Button>
            <Dialog open={dialogoAberto} onOpenChange={(aberto) => {
              setDialogoAberto(aberto)
              if (!aberto) { setEditando(null); resetFormulario() }
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-white/20 hover:bg-white/30 text-white border border-white/20 font-semibold shadow-lg">
                  <Plus className="size-4" />
                  Nova Habilidade
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {editando ? (
                      <><Pencil className="size-4 text-amber-600" /> Editar Habilidade</>
                    ) : (
                      <><Plus className="size-4 text-amber-600" /> Nova Habilidade</>
                    )}
                  </DialogTitle>
                  <DialogDescription>
                    {editando ? 'Altere os dados da habilidade' : 'Crie uma nova habilidade para o agente'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Nome</Label>
                      <Input
                        value={formulario.nome}
                        onChange={(e) => setFormulario(f => ({ ...f, nome: e.target.value }))}
                        placeholder="Nome da habilidade"
                        className="focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Categoria</Label>
                      <Select value={formulario.categoria} onValueChange={(v) => setFormulario(f => ({ ...f, categoria: v }))}>
                        <SelectTrigger className="focus:ring-amber-500/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nucleo">⭐ Núcleo</SelectItem>
                          <SelectItem value="avancado">🚀 Avançado</SelectItem>
                          <SelectItem value="experimental">🧪 Experimental</SelectItem>
                          <SelectItem value="geral">📦 Geral</SelectItem>
                          <SelectItem value="diagnostico">🔍 Diagnóstico</SelectItem>
                          <SelectItem value="resolucao">🛠️ Resolução</SelectItem>
                          <SelectItem value="infraestrutura">🏗️ Infraestrutura</SelectItem>
                          <SelectItem value="seguranca">🔐 Segurança</SelectItem>
                          <SelectItem value="otimizacao">⚡ Otimização</SelectItem>
                          <SelectItem value="comunicacao">💬 Comunicação</SelectItem>
                          <SelectItem value="prevencao">🛡️ Prevenção</SelectItem>
                          <SelectItem value="qualidade">✅ Qualidade</SelectItem>
                          <SelectItem value="estrategia">🎯 Estratégia</SelectItem>
                          <SelectItem value="criatividade">🔥 Criatividade</SelectItem>
                          <SelectItem value="conteudo">🏗️ Conteúdo</SelectItem>
                          <SelectItem value="psicologia">🧠 Psicologia</SelectItem>
                          <SelectItem value="crescimento">📈 Crescimento</SelectItem>
                          <SelectItem value="inovacao">💡 Inovação</SelectItem>
                          <SelectItem value="orquestracao">🧭 Orquestração</SelectItem>
                          <SelectItem value="analise">🔍 Análise</SelectItem>
                          <SelectItem value="investigacao">📡 Investigação</SelectItem>
                          <SelectItem value="validacao">🧪 Validação</SelectItem>
                          <SelectItem value="critica">🛡️ Crítica</SelectItem>
                          <SelectItem value="documentacao">📚 Documentação</SelectItem>
                          <SelectItem value="marketing">📣 Marketing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Descrição</Label>
                    <Input
                      value={formulario.descricao}
                      onChange={(e) => setFormulario(f => ({ ...f, descricao: e.target.value }))}
                      placeholder="Descrição breve da habilidade"
                      className="focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <Code2 className="size-3.5 text-amber-600" />
                      Conteúdo / Prompt
                    </Label>
                    <Textarea
                      value={formulario.conteudo}
                      onChange={(e) => setFormulario(f => ({ ...f, conteudo: e.target.value }))}
                      placeholder="Conteúdo ou prompt da habilidade"
                      rows={5}
                      className="focus-visible:ring-amber-500/30 focus-visible:border-amber-500 font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Parâmetros (JSON)</Label>
                    <Textarea
                      value={formulario.parametros}
                      onChange={(e) => setFormulario(f => ({ ...f, parametros: e.target.value }))}
                      placeholder='{"tipo": "llm_chat", "sdk_method": "chat.completions.create"}'
                      rows={3}
                      className="focus-visible:ring-amber-500/30 focus-visible:border-amber-500 font-mono text-sm"
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => { setDialogoAberto(false); setEditando(null); resetFormulario() }}>
                    Cancelar
                  </Button>
                  <Button
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={() => {
                      if (editando) {
                        atualizarHabilidade.mutate({ id: editando.id, dados: formulario })
                      } else {
                        criarHabilidade.mutate(formulario)
                      }
                    }}
                    disabled={!formulario.nome || !formulario.conteudo}
                  >
                    {editando ? 'Salvar Alterações' : 'Criar Habilidade'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </motion.div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="size-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
              <Sparkles className="size-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{habilidades?.length ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">Habilidades</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="size-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{habilidadesAtivas}</p>
              <p className="text-[10px] text-muted-foreground">Ativas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-sky-500 bg-gradient-to-br from-sky-50/50 to-blue-50/50 dark:from-sky-950/20 dark:to-blue-950/20">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="size-9 rounded-lg bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center">
              <Hash className="size-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-sky-600 dark:text-sky-400">{totalUsos}</p>
              <p className="text-[10px] text-muted-foreground">Total de usos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50/50 to-fuchsia-50/50 dark:from-purple-950/20 dark:to-fuchsia-950/20">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="size-9 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
              <TrendingUp className="size-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{mediaSucesso.toFixed(0)}%</p>
              <p className="text-[10px] text-muted-foreground">Taxa média</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar habilidades por nome ou descrição..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9 h-11 bg-background border-border/60 focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
          />
          {busca && (
            <button
              onClick={() => setBusca('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Pills */}
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-1">
            {categoriasDinamicas.map((cat) => {
              const Icon = cat.icon
              const isActive = filtroCategoriaHabilidade === cat.id
              return (
                <motion.button
                  key={cat.id}
                  onClick={() => setFiltroCategoriaHabilidade(cat.id)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`
                    flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium
                    transition-all duration-200 border whitespace-nowrap
                    ${isActive
                      ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-200 dark:shadow-amber-900/40'
                      : 'bg-background text-muted-foreground border-border hover:border-amber-300 hover:text-amber-700 dark:hover:border-amber-700 dark:hover:text-amber-400'
                    }
                  `}
                >
                  <Icon className="size-3.5" />
                  {cat.label}
                  {cat.id !== 'todas' && habilidades && (
                    <span className={`text-[10px] ml-0.5 ${isActive ? 'text-amber-100' : 'text-muted-foreground'}`}>
                      {habilidades.filter(h => h.categoria === cat.id).length}
                    </span>
                  )}
                </motion.button>
              )
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Skills Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-3 p-4 rounded-lg border border-l-4 border-l-amber-400">
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
      ) : filtradas.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <div className="size-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
              <Sparkles className="size-8 text-amber-600/50" />
            </div>
            <p className="font-medium text-lg">Nenhuma habilidade encontrada</p>
            <p className="text-sm mt-1">Crie uma nova habilidade ou restaure as padrão</p>
            <Button
              className="mt-4 bg-amber-600 hover:bg-amber-700 text-white gap-2"
              onClick={() => seedHabilidades.mutate()}
              disabled={seedHabilidades.isPending}
            >
              <RotateCcw className="size-4" />
              Restaurar Habilidades Padrão
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtradas.map((habilidade, i) => {
              const tipo = obterTipoHabilidade(habilidade)
              const tipoIcone = obterIconeTipo(tipo)
              const TipoIcon = tipoIcone.icone
              const borderColor = categoriaBorderColor[habilidade.categoria] || 'border-l-slate-300'
              const glowColor = categoriaGlowColor[habilidade.categoria] || ''
              const progressColor = categoriaProgressColor[habilidade.categoria] || '[&>div]:bg-slate-400'
              const headerGradient = categoriaHeaderGradient[habilidade.categoria] || 'from-slate-400 to-slate-500'

              return (
                <motion.div
                  key={habilidade.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03 }}
                  layout
                >
                  <Card className={`
                    border-l-4 ${borderColor}
                    hover:shadow-lg ${glowColor}
                    transition-all duration-200
                    group overflow-hidden
                    ${!habilidade.ativa ? 'opacity-60' : ''}
                  `}>
                    {/* Skill type header strip */}
                    <div className={`h-1 bg-gradient-to-r ${headerGradient}`} />
                    
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {/* Skill type icon */}
                          <div className={`size-10 rounded-lg ${tipoIcone.bgCor} flex items-center justify-center shrink-0 mt-0.5`}>
                            <TipoIcon className={`size-5 ${tipoIcone.cor}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base flex items-center gap-2">
                              <span className="truncate">{habilidade.nome}</span>
                            </CardTitle>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <Badge className={`text-[10px] shrink-0 ${obterCorCategoria(habilidade.categoria)}`}>
                                {obterIconeCategoria(habilidade.categoria)} {habilidade.categoria}
                              </Badge>
                              <Badge variant="outline" className="text-[10px] gap-0.5 shrink-0">
                                <TipoIcon className="size-2.5" />
                                {tipo}
                              </Badge>
                              {habilidade.criadaPorAgente && (
                                <Badge variant="outline" className="text-[10px] gap-1 shrink-0">
                                  <Sparkles className="size-2.5" />
                                  IA
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* Active switch */}
                        <Switch
                          checked={habilidade.ativa}
                          onCheckedChange={(checked) => toggleAtiva.mutate({ id: habilidade.id, ativa: checked })}
                          className="scale-75 origin-top-right"
                        />
                      </div>
                      {habilidade.descricao && (
                        <CardDescription className="mt-2 text-xs line-clamp-2">
                          {habilidade.descricao}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-1">
                            <Hash className="size-3 text-amber-600 dark:text-amber-400" />
                            <p className="text-base font-bold text-amber-600 dark:text-amber-400">
                              {habilidade.usoContagem}
                            </p>
                          </div>
                          <p className="text-[9px] text-muted-foreground">Usos</p>
                        </div>
                        <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="size-3 text-emerald-600 dark:text-emerald-400" />
                            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                              {habilidade.taxaSucesso.toFixed(0)}%
                            </p>
                          </div>
                          <p className="text-[9px] text-muted-foreground">Sucesso</p>
                        </div>
                        <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-1">
                            <Code2 className="size-3 text-purple-600 dark:text-purple-400" />
                            <p className="text-base font-bold text-purple-600 dark:text-purple-400">
                              v{habilidade.versao}
                            </p>
                          </div>
                          <p className="text-[9px] text-muted-foreground">Versão</p>
                        </div>
                      </div>

                      {/* Success Rate Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-muted-foreground">Taxa de sucesso</span>
                          <span className={`font-medium ${habilidade.taxaSucesso >= 80 ? 'text-emerald-600 dark:text-emerald-400' : habilidade.taxaSucesso >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-destructive'}`}>
                            {habilidade.taxaSucesso.toFixed(1)}%
                          </span>
                        </div>
                        <Progress
                          value={habilidade.taxaSucesso}
                          className={`h-1.5 ${progressColor}`}
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1 pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 gap-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 h-8 text-xs"
                          onClick={() => abrirTestar(habilidade)}
                          disabled={!habilidade.ativa}
                        >
                          <Play className="size-3" />
                          Testar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 gap-1.5 text-muted-foreground hover:text-amber-600 h-8 text-xs"
                          onClick={() => abrirDetalhe(habilidade)}
                        >
                          <Eye className="size-3" />
                          Detalhes
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-amber-600"
                          onClick={() => abrirEdicao(habilidade)}
                        >
                          <Pencil className="size-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive">
                              <Trash2 className="size-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir habilidade?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. A habilidade &quot;{habilidade.nome}&quot; será removida permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deletarHabilidade.mutate(habilidade.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>

                      {/* Histórico de Execuções (collapsed) */}
                      {habilidade.execucoes && habilidade.execucoes.length > 0 && (
                        <Accordion type="single" collapsible>
                          <AccordionItem value="execucoes" className="border-none">
                            <AccordionTrigger className="py-2 text-xs hover:no-underline">
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="size-3" />
                                Histórico ({habilidade.execucoes.length})
                              </span>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {habilidade.execucoes.map((exec) => (
                                  <div key={exec.id} className="flex items-start gap-2 p-2 bg-muted/50 rounded text-xs">
                                    {exec.sucesso ? (
                                      <CheckCircle2 className="size-3.5 text-emerald-500 mt-0.5 shrink-0" />
                                    ) : (
                                      <XCircle className="size-3.5 text-destructive mt-0.5 shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="truncate">{exec.entrada}</p>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        {exec.duracao && (
                                          <span className="text-muted-foreground">{exec.duracao.toFixed(1)}s</span>
                                        )}
                                        <span className="text-muted-foreground">{tempoRelativo(exec.createdAt)}</span>
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
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Dialog Testar Habilidade */}
      <Dialog open={testarDialogoAberto} onOpenChange={(aberto) => {
        setTestarDialogoAberto(aberto)
        if (!aberto) {
          setTestarHabilidade(null)
          setTestarEntrada('')
          setTestarResultado(null)
        }
      }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="size-4 text-emerald-600" />
              Testar Habilidade
            </DialogTitle>
            <DialogDescription>
              {testarHabilidade && (
                <span>
                  Teste <strong>{testarHabilidade.nome}</strong> com uma entrada personalizada
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {testarHabilidade && (() => {
              const tipo = obterTipoHabilidade(testarHabilidade)
              const tipoIcone = obterIconeTipo(tipo)
              const TipoIcon = tipoIcone.icone
              return (
                <div className="flex items-center gap-2 flex-wrap">
                  <div className={`size-8 rounded-lg ${tipoIcone.bgCor} flex items-center justify-center`}>
                    <TipoIcon className={`size-4 ${tipoIcone.cor}`} />
                  </div>
                  <Badge className={`text-[10px] ${obterCorCategoria(testarHabilidade.categoria)}`}>
                    {obterIconeCategoria(testarHabilidade.categoria)} {testarHabilidade.categoria}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] gap-1">
                    {tipo}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <Hash className="size-2.5" />
                    {testarHabilidade.usoContagem} usos
                  </Badge>
                  {testarHabilidade.taxaSucesso >= 80 && (
                    <Badge className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      Confiável
                    </Badge>
                  )}
                </div>
              )
            })()}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Entrada para teste</Label>
              <Textarea
                value={testarEntrada}
                onChange={(e) => setTestarEntrada(e.target.value)}
                placeholder={testarHabilidade ? obterPlaceholderTeste(testarHabilidade) : 'Digite a entrada para testar...'}
                rows={4}
                className="focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500"
              />
            </div>

            {testarResultado && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                  Resultado
                  <Badge className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    {testarResultado.duracao.toFixed(1)}s
                  </Badge>
                  {testarResultado.tipo && (
                    <Badge variant="outline" className="text-[9px]">
                      {testarResultado.tipo}
                    </Badge>
                  )}
                </Label>
                <div className="p-3 rounded-lg bg-muted/50 border text-sm whitespace-pre-wrap max-h-64 overflow-y-auto font-mono text-xs leading-relaxed">
                  {testarResultado.saida}
                </div>
              </motion.div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setTestarDialogoAberto(false)}>
              Fechar
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              onClick={() => {
                if (testarHabilidade && testarEntrada) {
                  testarHabilidadeMutation.mutate({
                    habilidadeId: testarHabilidade.id,
                    entrada: testarEntrada,
                  })
                }
              }}
              disabled={!testarEntrada || testarHabilidadeMutation.isPending}
            >
              {testarHabilidadeMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Executando...
                </>
              ) : (
                <>
                  <Play className="size-4" />
                  Executar Teste
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalhes da Habilidade */}
      <Dialog open={detalheDialogoAberto} onOpenChange={setDetalheDialogoAberto}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {detalheHabilidade && (() => {
                const tipo = obterTipoHabilidade(detalheHabilidade)
                const tipoIcone = obterIconeTipo(tipo)
                const TipoIcon = tipoIcone.icone
                return (
                  <div className={`size-8 rounded-lg ${tipoIcone.bgCor} flex items-center justify-center`}>
                    <TipoIcon className={`size-4 ${tipoIcone.cor}`} />
                  </div>
                )
              })()}
              {detalheHabilidade?.nome}
            </DialogTitle>
            <DialogDescription>
              {detalheHabilidade?.descricao}
            </DialogDescription>
          </DialogHeader>
          {detalheHabilidade && (
            <div className="space-y-4">
              {/* Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
                  <Hash className="size-4 text-amber-600 dark:text-amber-400 mb-1" />
                  <p className="text-lg font-bold">{detalheHabilidade.usoContagem}</p>
                  <p className="text-[10px] text-muted-foreground">Usos</p>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
                  <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400 mb-1" />
                  <p className="text-lg font-bold">{detalheHabilidade.taxaSucesso.toFixed(1)}%</p>
                  <p className="text-[10px] text-muted-foreground">Sucesso</p>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
                  <Code2 className="size-4 text-purple-600 dark:text-purple-400 mb-1" />
                  <p className="text-lg font-bold">v{detalheHabilidade.versao}</p>
                  <p className="text-[10px] text-muted-foreground">Versão</p>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
                  <Clock className="size-4 text-sky-600 dark:text-sky-400 mb-1" />
                  <p className="text-lg font-bold">{tempoRelativo(detalheHabilidade.createdAt)}</p>
                  <p className="text-[10px] text-muted-foreground">Criada</p>
                </div>
              </div>

              {/* Prompt/Content */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Code2 className="size-3.5 text-amber-600" />
                  Conteúdo / Prompt do Sistema
                </Label>
                <div className="p-3 rounded-lg bg-muted/50 border text-sm whitespace-pre-wrap max-h-40 overflow-y-auto font-mono text-xs leading-relaxed">
                  {detalheHabilidade.conteudo}
                </div>
              </div>

              {/* Parameters */}
              {detalheHabilidade.parametros && (
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Activity className="size-3.5 text-purple-600" />
                    Parâmetros
                  </Label>
                  <div className="p-3 rounded-lg bg-muted/50 border text-xs font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {(() => {
                      try {
                        return JSON.stringify(JSON.parse(detalheHabilidade.parametros!), null, 2)
                      } catch {
                        return detalheHabilidade.parametros
                      }
                    })()}
                  </div>
                </div>
              )}

              {/* Execution History */}
              {detalheHabilidade.execucoes && detalheHabilidade.execucoes.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Clock className="size-3.5 text-sky-600" />
                    Histórico de Execuções ({detalheHabilidade.execucoes.length})
                  </Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {detalheHabilidade.execucoes.map((exec) => (
                      <div key={exec.id} className="p-2.5 rounded-lg bg-muted/50 border text-xs">
                        <div className="flex items-center gap-2 mb-1">
                          {exec.sucesso ? (
                            <CheckCircle2 className="size-3 text-emerald-500" />
                          ) : (
                            <XCircle className="size-3 text-destructive" />
                          )}
                          <span className="font-medium truncate">{exec.entrada}</span>
                          <span className="ml-auto text-muted-foreground shrink-0">
                            {exec.duracao?.toFixed(1)}s • {tempoRelativo(exec.createdAt)}
                          </span>
                        </div>
                        {exec.saida && (
                          <p className="text-muted-foreground line-clamp-2 mt-1">{exec.saida}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetalheDialogoAberto(false)}>
              Fechar
            </Button>
            {detalheHabilidade && (
              <Button
                className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                onClick={() => {
                  setDetalheDialogoAberto(false)
                  abrirEdicao(detalheHabilidade)
                }}
              >
                <Pencil className="size-4" />
                Editar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
