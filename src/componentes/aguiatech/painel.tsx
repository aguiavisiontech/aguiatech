'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  MessageSquare,
  Sparkles,
  Brain,
  Wrench,
  Plus,
  Activity,
  TrendingUp,
  Zap,
  Bot,
  Cpu,
  Settings,
  CheckCircle2,
  XCircle,
  Star,
  ChevronRight,
  Globe,
  Layers,
  Clock,
  Server,
  Wifi,
  Shield,
  Database,
  Radio,
  MessageCircle,
  BookOpen,
  Lightbulb,
  ArrowRight,
  Inbox,
  Search,
  Code,
  Headphones,
  Zap as ZapIcon,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip as ShadcnTooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Progress } from '@/components/ui/progress'
import { useEstadoAguiatech } from '@/lib/estado'
import { MODELOS_GRATUITOS, obterNomeCurtoModelo, modeloEhGratis } from '@/lib/openrouter'

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Estatisticas {
  totalConversas: number
  totalHabilidades: number
  totalMemorias: number
  ferramentasAtivas: number
}

interface AtividadeRecente {
  id: string
  tipo: string
  descricao: string
  timestamp: string
}

interface Conversa {
  id: string
  titulo: string
  totalTokensIn: number
  totalTokensOut: number
  totalMensagens: number
}

interface AgenteCard {
  id: string
  nome: string
  descricao?: string | null
  avatar?: string | null
  modelo: string
  provedorModelo: string
  personalidade: string
  categoria: string
  cor: string
  habilidadeIds?: string | null
  ativo: boolean
  conversasTotal: number
}

// ─── Animated Counter Hook (ref-based, no setState in useEffect) ──────────────

function useContadorAnimado(fim: number, duracao = 1200) {
  const ref = useRef<HTMLSpanElement>(null)
  const animacaoRef = useRef<number>(0)

  useEffect(() => {
    const elemento = ref.current
    if (!elemento) return

    if (fim === 0) {
      elemento.textContent = '0'
      return
    }

    const valorInicial = parseInt(elemento.textContent || '0', 10) || 0
    const startTime = performance.now()

    const animar = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progresso = Math.min(elapsed / duracao, 1)
      // Easing cubic out
      const eased = 1 - Math.pow(1 - progresso, 3)
      const atual = Math.floor(valorInicial + (fim - valorInicial) * eased)

      if (elemento) {
        elemento.textContent = String(atual)
      }

      if (progresso < 1) {
        animacaoRef.current = requestAnimationFrame(animar)
      }
    }

    animacaoRef.current = requestAnimationFrame(animar)

    return () => {
      if (animacaoRef.current) {
        cancelAnimationFrame(animacaoRef.current)
      }
    }
  }, [fim, duracao])

  return ref
}

// ─── Live Clock Hook (ref-based DOM update) ───────────────────────────────────

function useRelogioAoVivo() {
  const ref = useRef<HTMLSpanElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined)

  const atualizarRelogio = useCallback(() => {
    if (!ref.current) return
    const agora = new Date()
    const opcoes: Intl.DateTimeFormatOptions = {
      timeZone: 'America/Recife',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour12: false,
    }
    const partes = new Intl.DateTimeFormat('pt-BR', opcoes).formatToParts(agora)
    const get = (tipo: string) => partes.find(p => p.type === tipo)?.value ?? ''
    ref.current.textContent = `${get('hour')}:${get('minute')}:${get('second')} - ${get('day')}/${get('month')}/${get('year')}`
  }, [])

  useEffect(() => {
    atualizarRelogio()
    timerRef.current = setInterval(atualizarRelogio, 1000)
    return () => clearInterval(timerRef.current)
  }, [atualizarRelogio])

  return ref
}

// ─── Relative Time Formatter ──────────────────────────────────────────────────

function formatarTempoRelativo(timestamp: string): string {
  try {
    // Parse pt-BR format: dd/MM/yyyy, HH:mm:ss
    const match = timestamp.match(/(\d{2})\/(\d{2})\/(\d{4}),?\s+(\d{2}):(\d{2}):(\d{2})/)
    if (!match) return timestamp

    const [, dia, mes, ano, hora, min, seg] = match
    const data = new Date(`${ano}-${mes}-${dia}T${hora}:${min}:${seg}`)
    const agora = new Date()
    const diffMs = agora.getTime() - data.getTime()
    const diffSeg = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSeg / 60)
    const diffHora = Math.floor(diffMin / 60)
    const diffDia = Math.floor(diffHora / 24)

    if (diffSeg < 60) return 'agora mesmo'
    if (diffMin < 60) return `há ${diffMin}min`
    if (diffHora < 24) return `há ${diffHora}h`
    if (diffDia < 7) return `há ${diffDia}d`
    return timestamp
  } catch {
    return timestamp
  }
}

// ─── Time-of-day Greeting ─────────────────────────────────────────────────────

function obterSaudacao(): string {
  const agora = new Date()
  const hora = agora.getHours()
  if (hora >= 5 && hora < 12) return 'Bom dia'
  if (hora >= 12 && hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

// ─── Activity Type Config ─────────────────────────────────────────────────────

const configTipoAtividade: Record<string, {
  corBorda: string
  icone: React.ElementType
  corIcone: string
  corFundo: string
}> = {
  conversa: {
    corBorda: 'border-l-sky-500',
    icone: MessageCircle,
    corIcone: 'text-sky-500',
    corFundo: 'bg-sky-50 dark:bg-sky-900/20',
  },
  habilidade: {
    corBorda: 'border-l-emerald-500',
    icone: Sparkles,
    corIcone: 'text-emerald-500',
    corFundo: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
  memoria: {
    corBorda: 'border-l-purple-500',
    icone: Brain,
    corIcone: 'text-purple-500',
    corFundo: 'bg-purple-50 dark:bg-purple-900/20',
  },
  ferramenta: {
    corBorda: 'border-l-orange-500',
    icone: Wrench,
    corIcone: 'text-orange-500',
    corFundo: 'bg-orange-50 dark:bg-orange-900/20',
  },
  mensagem: {
    corBorda: 'border-l-amber-500',
    icone: MessageSquare,
    corIcone: 'text-amber-500',
    corFundo: 'bg-amber-50 dark:bg-amber-900/20',
  },
}

function obterConfigTipo(tipo: string) {
  return configTipoAtividade[tipo] ?? {
    corBorda: 'border-l-amber-500',
    icone: Activity,
    corIcone: 'text-amber-500',
    corFundo: 'bg-amber-50 dark:bg-amber-900/20',
  }
}

// ─── Quick Action Descriptions ────────────────────────────────────────────────

const descricoesAcoes: Record<string, string> = {
  'Nova Conversa': 'Inicie um chat com o agente de IA',
  'Nova Habilidade': 'Crie uma nova habilidade para o agente',
  'Nova Memória': 'Adicione uma memória ao conhecimento',
  'Ver Ferramentas': 'Gerencie ferramentas disponíveis',
}

// ─── Conversation Tips ────────────────────────────────────────────────────────

const sugestoesConversa = [
  {
    emoji: '💻',
    titulo: 'Ajude com programação',
    descricao: 'Peça ajuda para escrever, debugar ou refatorar código',
    icone: Code,
    corGrad: 'from-sky-500 to-cyan-500',
    corBg: 'bg-sky-50 dark:bg-sky-900/20',
    corBorder: 'border-sky-200 dark:border-sky-800',
    corText: 'text-sky-600 dark:text-sky-400',
    corIconBg: 'bg-sky-100 dark:bg-sky-900/40',
  },
  {
    emoji: '🔍',
    titulo: 'Pesquise algo na web',
    descricao: 'Busque informações e pesquise sobre qualquer tema',
    icone: Search,
    corGrad: 'from-amber-500 to-orange-500',
    corBg: 'bg-amber-50 dark:bg-amber-900/20',
    corBorder: 'border-amber-200 dark:border-amber-800',
    corText: 'text-amber-600 dark:text-amber-400',
    corIconBg: 'bg-amber-100 dark:bg-amber-900/40',
  },
  {
    emoji: '🛡️',
    titulo: 'Suporte técnico',
    descricao: 'Diagnóstico e resolução de problemas técnicos',
    icone: Headphones,
    corGrad: 'from-emerald-500 to-teal-500',
    corBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    corBorder: 'border-emerald-200 dark:border-emerald-800',
    corText: 'text-emerald-600 dark:text-emerald-400',
    corIconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
  },
  {
    emoji: '💡',
    titulo: 'Me ajude com uma ideia',
    descricao: 'Brainstorming e desenvolvimento de ideias criativas',
    icone: Lightbulb,
    corGrad: 'from-purple-500 to-violet-500',
    corBg: 'bg-purple-50 dark:bg-purple-900/20',
    corBorder: 'border-purple-200 dark:border-purple-800',
    corText: 'text-purple-600 dark:text-purple-400',
    corIconBg: 'bg-purple-100 dark:bg-purple-900/40',
  },
]

// ─── Agent Color Map ──────────────────────────────────────────────────────────

const corAgenteMapa: Record<string, { bg: string; text: string; border: string; ring: string }> = {
  amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-700', ring: 'ring-amber-300' },
  emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-700', ring: 'ring-emerald-300' },
  sky: { bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-sky-600 dark:text-sky-400', border: 'border-sky-200 dark:border-sky-700', ring: 'ring-sky-300' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-700', ring: 'ring-purple-300' },
  rose: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-700', ring: 'ring-rose-300' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-700', ring: 'ring-orange-300' },
  teal: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-700', ring: 'ring-teal-300' },
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-700', ring: 'ring-blue-300' },
}

function obterCoresAgente(cor: string) {
  return corAgenteMapa[cor] ?? corAgenteMapa.amber
}

// ─── Format Token Count ───────────────────────────────────────────────────────

function formatarTokens(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return String(num)
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function Painel() {
  const { setSecaoAtiva, setAgenteIdParaConversa } = useEstadoAguiatech()
  const queryClient = useQueryClient()
  const relogioRef = useRelogioAoVivo()

  const { data: estatisticas, isLoading: carregandoStats } = useQuery<Estatisticas>({
    queryKey: ['estatisticas'],
    queryFn: () => fetch('/api/estatisticas').then(r => r.json()),
  })

  const { data: atividades, isLoading: carregandoAtividades } = useQuery<AtividadeRecente[]>({
    queryKey: ['atividades-recentes'],
    queryFn: () => fetch('/api/atividades-recentes').then(r => r.json()),
  })

  const { data: agente, isLoading: carregandoAgente } = useQuery<AgenteCard>({
    queryKey: ['agente'],
    queryFn: () => fetch('/api/agente').then(r => r.json()),
  })

  const { data: conversasParaGrafico } = useQuery<Conversa[]>({
    queryKey: ['conversas-grafico'],
    queryFn: () => fetch('/api/conversas').then(r => r.json()),
  })

  const { data: agentesLista, isLoading: carregandoAgentes } = useQuery<AgenteCard[]>({
    queryKey: ['agentes-painel'],
    queryFn: () => fetch('/api/agentes').then(r => r.json()),
  })

  // Verificar status da API Key
  const { data: configData } = useQuery<Record<string, string>>({
    queryKey: ['config'],
    queryFn: () => fetch('/api/config').then(r => r.json()),
  })

  const apiKeyConfigurada = !!configData?.openrouter_api_key

  // API de IA status - if estatisticas loads, API is reachable
  const apiIaOnline = !!estatisticas

  // Token usage summary
  const totalTokensIn = useMemo(() =>
    conversasParaGrafico?.reduce((acc, c) => acc + c.totalTokensIn, 0) ?? 0,
    [conversasParaGrafico]
  )
  const totalTokensOut = useMemo(() =>
    conversasParaGrafico?.reduce((acc, c) => acc + c.totalTokensOut, 0) ?? 0,
    [conversasParaGrafico]
  )
  const totalTokens = totalTokensIn + totalTokensOut

  // Active agents list
  const agentesAtivos = useMemo(() =>
    agentesLista?.filter(a => a.ativo) ?? [],
    [agentesLista]
  )

  // Atualizar modelo do agente
  const atualizarModelo = useMutation({
    mutationFn: (modelo: string) =>
      fetch('/api/config/agente', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelo }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agente'] })
      queryClient.invalidateQueries({ queryKey: ['config', 'agente'] })
    },
  })

  // Animated counter hooks for stat cards
  const contadorConversas = useContadorAnimado(estatisticas?.totalConversas ?? 0)
  const contadorHabilidades = useContadorAnimado(estatisticas?.totalHabilidades ?? 0)
  const contadorMemorias = useContadorAnimado(estatisticas?.totalMemorias ?? 0)
  const contadorFerramentas = useContadorAnimado(estatisticas?.ferramentasAtivas ?? 0)

  const dadosGrafico = conversasParaGrafico
    ?.filter(c => (c.totalTokensIn + c.totalTokensOut) > 0)
    .slice(0, 6)
    .map(c => ({
      nome: c.titulo.length > 12 ? c.titulo.substring(0, 12) + '...' : c.titulo,
      entrada: c.totalTokensIn,
      saida: c.totalTokensOut,
    }))

  const cards = [
    {
      titulo: 'Total de Conversas',
      contadorRef: contadorConversas,
      icone: MessageSquare,
      cor: 'text-amber-600 dark:text-amber-400',
      bgCor: 'bg-amber-50 dark:bg-amber-900/20',
      bordaCor: 'border-l-amber-500',
      gradHover: 'hover:bg-gradient-to-br hover:from-amber-50 hover:to-amber-100/50 dark:hover:from-amber-900/30 dark:hover:to-amber-800/20',
      onClick: () => setSecaoAtiva('conversas'),
    },
    {
      titulo: 'Total de Habilidades',
      contadorRef: contadorHabilidades,
      icone: Sparkles,
      cor: 'text-emerald-600 dark:text-emerald-400',
      bgCor: 'bg-emerald-50 dark:bg-emerald-900/20',
      bordaCor: 'border-l-emerald-500',
      gradHover: 'hover:bg-gradient-to-br hover:from-emerald-50 hover:to-emerald-100/50 dark:hover:from-emerald-900/30 dark:hover:to-emerald-800/20',
      onClick: () => setSecaoAtiva('habilidades'),
    },
    {
      titulo: 'Total de Memórias',
      contadorRef: contadorMemorias,
      icone: Brain,
      cor: 'text-purple-600 dark:text-purple-400',
      bgCor: 'bg-purple-50 dark:bg-purple-900/20',
      bordaCor: 'border-l-purple-500',
      gradHover: 'hover:bg-gradient-to-br hover:from-purple-50 hover:to-purple-100/50 dark:hover:from-purple-900/30 dark:hover:to-purple-800/20',
      onClick: () => setSecaoAtiva('memorias'),
    },
    {
      titulo: 'Ferramentas Ativas',
      contadorRef: contadorFerramentas,
      icone: Wrench,
      cor: 'text-teal-600 dark:text-teal-400',
      bgCor: 'bg-teal-50 dark:bg-teal-900/20',
      bordaCor: 'border-l-teal-500',
      gradHover: 'hover:bg-gradient-to-br hover:from-teal-50 hover:to-teal-100/50 dark:hover:from-teal-900/30 dark:hover:to-teal-800/20',
      onClick: () => setSecaoAtiva('ferramentas'),
    },
  ]

  const acoesRapidas = [
    { rotulo: 'Nova Conversa', icone: MessageSquare, secao: 'conversas' as const, gradHover: 'hover:bg-gradient-to-r hover:from-sky-500 hover:to-blue-600 hover:text-white hover:border-sky-400' },
    { rotulo: 'Nova Habilidade', icone: Sparkles, secao: 'habilidades' as const, gradHover: 'hover:bg-gradient-to-r hover:from-emerald-500 hover:to-teal-600 hover:text-white hover:border-emerald-400' },
    { rotulo: 'Nova Memória', icone: Brain, secao: 'memorias' as const, gradHover: 'hover:bg-gradient-to-r hover:from-purple-500 hover:to-violet-600 hover:text-white hover:border-purple-400' },
    { rotulo: 'Ver Ferramentas', icone: Wrench, secao: 'ferramentas' as const, gradHover: 'hover:bg-gradient-to-r hover:from-orange-500 hover:to-amber-600 hover:text-white hover:border-orange-400' },
  ]

  // Health indicators
  const indicadoresSaude = [
    {
      titulo: 'Servidor',
      icone: Server,
      status: 'Operacional',
      online: true,
      corIcone: 'text-emerald-500',
      corFundo: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      titulo: 'Banco de Dados',
      icone: Database,
      status: 'Conectado',
      online: true,
      corIcone: 'text-emerald-500',
      corFundo: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      titulo: 'API de IA',
      icone: Radio,
      status: apiIaOnline ? 'Operacional' : 'Indisponível',
      online: apiIaOnline,
      corIcone: apiIaOnline ? 'text-emerald-500' : 'text-red-500',
      corFundo: apiIaOnline ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20',
    },
  ]

  // Handler for "Conversar" button on agent cards
  const conversarComAgente = useCallback((agenteId: string) => {
    setAgenteIdParaConversa(agenteId)
    setSecaoAtiva('conversas')
  }, [setAgenteIdParaConversa, setSecaoAtiva])

  // Handler for conversation suggestion cards
  const iniciarSugestao = useCallback(() => {
    setSecaoAtiva('conversas')
  }, [setSecaoAtiva])

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Hero com Gradiente Animado + Relógio + Saudação */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl p-[2px]"
      >
        {/* Animated gradient border */}
        <div
          className="absolute inset-0 rounded-xl"
          style={{
            background: 'linear-gradient(90deg, #f59e0b, #ef4444, #f59e0b, #ef4444)',
            backgroundSize: '300% 100%',
            animation: 'gradientBorder 4s ease infinite',
          }}
        />
        <div className="relative rounded-[10px] bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 p-6 text-white">
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
          <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-white/5 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">🦅</span>
                <div>
                  <h1 className="text-2xl font-bold">
                    {obterSaudacao()}! 👋
                  </h1>
                  <p className="text-amber-100 text-sm">Painel do Aguiatech — O Agente de IA que Cresce com Você</p>
                </div>
              </div>
              {/* Live Clock Widget */}
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
                <Clock className="size-4 text-amber-200" />
                <span
                  ref={relogioRef}
                  className="text-xs font-mono font-medium tracking-wide tabular-nums"
                >
                  --:--:-- - --/--/----
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              {/* Status Online */}
              <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1">
                <div className="size-2 bg-emerald-300 rounded-full animate-pulse" />
                <span className="text-xs font-medium">Online</span>
              </div>
              {/* Provedor */}
              <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1">
                <Globe className="size-3" />
                <span className="text-xs font-medium">OpenRouter</span>
              </div>
              {/* Modelo Atual */}
              <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1">
                <Cpu className="size-3" />
                <span className="text-xs font-medium">
                  {agente ? obterNomeCurtoModelo(agente.modelo) : '...'}
                </span>
              </div>
              {/* Badge Gratuito */}
              {agente && modeloEhGratis(agente.modelo) && (
                <div className="flex items-center gap-1 bg-emerald-500/30 rounded-full px-2.5 py-1 border border-emerald-400/30">
                  <span className="text-xs">🆓</span>
                  <span className="text-xs font-medium">Gratuito</span>
                </div>
              )}
              {/* Status API Key */}
              <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1">
                {apiKeyConfigurada ? (
                  <>
                    <CheckCircle2 className="size-3 text-emerald-300" />
                    <span className="text-xs font-medium">API Key configurada</span>
                  </>
                ) : (
                  <>
                    <XCircle className="size-3 text-red-300" />
                    <span className="text-xs font-medium">API Key não configurada</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Token Usage Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card className="overflow-hidden border-2 border-amber-200 dark:border-amber-800">
          <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row items-stretch">
              {/* Main token display */}
              <div className="flex-1 p-5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="rounded-lg p-1.5 bg-amber-100 dark:bg-amber-900/40">
                    <Zap className="size-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                    Total de Tokens Consumidos
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-amber-900 dark:text-amber-100 tabular-nums">
                    {formatarTokens(totalTokens)}
                  </span>
                  <span className="text-sm text-amber-600 dark:text-amber-400">tokens</span>
                </div>
                {/* Token breakdown */}
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5">
                    <div className="size-2.5 rounded-full bg-amber-500" />
                    <span className="text-xs text-muted-foreground">Entrada: {formatarTokens(totalTokensIn)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="size-2.5 rounded-full bg-orange-500" />
                    <span className="text-xs text-muted-foreground">Saída: {formatarTokens(totalTokensOut)}</span>
                  </div>
                </div>
              </div>
              {/* Visual progress section */}
              <div className="sm:w-56 p-5 bg-background border-t sm:border-t-0 sm:border-l border-border">
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Entrada</span>
                      <span className="text-xs font-medium tabular-nums">
                        {totalTokens > 0 ? Math.round((totalTokensIn / totalTokens) * 100) : 0}%
                      </span>
                    </div>
                    <Progress value={totalTokens > 0 ? (totalTokensIn / totalTokens) * 100 : 0} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Saída</span>
                      <span className="text-xs font-medium tabular-nums">
                        {totalTokens > 0 ? Math.round((totalTokensOut / totalTokens) * 100) : 0}%
                      </span>
                    </div>
                    <Progress value={totalTokens > 0 ? (totalTokensOut / totalTokens) * 100 : 0} className="h-2" />
                  </div>
                  <div className="pt-1 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Conversas</span>
                      <span className="text-xs font-semibold tabular-nums">{conversasParaGrafico?.length ?? 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Cards de Estatísticas com Contadores Animados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.titulo}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
          >
            <Card
              className={`cursor-pointer hover:shadow-lg hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 group border-l-4 ${card.bordaCor} ${card.gradHover}`}
              onClick={card.onClick}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.titulo}
                </CardTitle>
                <div className={`rounded-lg p-2 ${card.bgCor}`}>
                  <card.icone className={`size-4 ${card.cor}`} />
                </div>
              </CardHeader>
              <CardContent>
                {carregandoStats ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="flex items-center gap-2">
                    <span ref={card.contadorRef} className="text-2xl font-bold tabular-nums">0</span>
                    <TrendingUp className="size-4 text-muted-foreground group-hover:text-amber-500 transition-colors" />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Seção de Agentes Ativos */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bot className="size-5 text-amber-600 dark:text-amber-400" />
            Agentes Ativos
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 gap-1"
            onClick={() => setSecaoAtiva('agentes')}
          >
            Ver todos
            <ChevronRight className="size-3" />
          </Button>
        </div>
        {carregandoAgentes ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : agentesAtivos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {agentesAtivos.map((agenteItem, index) => {
              const cores = obterCoresAgente(agenteItem.cor)
              const skillsCount = (() => {
                try {
                  if (!agenteItem.habilidadeIds) return 0
                  const parsed = JSON.parse(agenteItem.habilidadeIds)
                  return Array.isArray(parsed) ? parsed.length : 0
                } catch {
                  return 0
                }
              })()
              return (
                <motion.div
                  key={agenteItem.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.07 }}
                >
                  <Card className={`group hover:shadow-md transition-all duration-200 border ${cores.border}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className={`size-10 rounded-full flex items-center justify-center text-lg ${cores.bg} flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                          {agenteItem.avatar || '🤖'}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{agenteItem.nome}</p>
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            <Badge variant="outline" className="text-[10px] h-4 px-1.5 gap-0.5">
                              <Cpu className="size-2.5" />
                              {obterNomeCurtoModelo(agenteItem.modelo)}
                            </Badge>
                            {skillsCount > 0 && (
                              <Badge className={`text-[10px] h-4 px-1.5 gap-0.5 ${cores.bg} ${cores.text} border-0`}>
                                <Zap className="size-2.5" />
                                {skillsCount} skills
                              </Badge>
                            )}
                          </div>
                        </div>
                        {/* Conversar button */}
                        <Button
                          size="sm"
                          variant="outline"
                          className={`text-xs gap-1 ${cores.border} ${cores.text} hover:${cores.bg} flex-shrink-0`}
                          onClick={(e) => {
                            e.stopPropagation()
                            conversarComAgente(agenteItem.id)
                          }}
                        >
                          <MessageCircle className="size-3" />
                          <span className="hidden sm:inline">Conversar</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-8 flex flex-col items-center justify-center text-center">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Bot className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Nenhum agente ativo encontrado</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 gap-1.5"
                onClick={() => setSecaoAtiva('agentes')}
              >
                <Plus className="size-3.5" />
                Criar Agente
              </Button>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Sugestões de Conversa */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Lightbulb className="size-5 text-amber-600 dark:text-amber-400" />
          Comece uma Conversa
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {sugestoesConversa.map((sugestao, index) => (
            <motion.div
              key={sugestao.titulo}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.08 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Card
                className={`cursor-pointer hover:shadow-md transition-all duration-200 border ${sugestao.corBorder} group overflow-hidden`}
                onClick={iniciarSugestao}
              >
                {/* Gradient top accent */}
                <div className={`h-1 bg-gradient-to-r ${sugestao.corGrad}`} />
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`rounded-lg p-2 ${sugestao.corIconBg} flex-shrink-0`}>
                      <sugestao.icone className={`size-4 ${sugestao.corText}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold flex items-center gap-1.5">
                        <span>{sugestao.emoji}</span>
                        {sugestao.titulo}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {sugestao.descricao}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end mt-3">
                    <span className={`text-xs font-medium ${sugestao.corText} opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1`}>
                      Iniciar
                      <ArrowRight className="size-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Acesso Rápido - Modelos */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Layers className="size-5 text-amber-600 dark:text-amber-400" />
            Acesso Rápido
          </h2>
          <span className="text-xs text-muted-foreground">Clique para trocar de modelo</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {MODELOS_GRATUITOS.map((modelo) => {
            const ehModeloAtivo = agente?.modelo === modelo.id
            return (
              <motion.button
                key={modelo.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => atualizarModelo.mutate(modelo.id)}
                className={`
                  flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 cursor-pointer
                  ${ehModeloAtivo
                    ? 'bg-amber-50 border-amber-400 dark:bg-amber-900/30 dark:border-amber-600 shadow-sm ring-1 ring-amber-400/30'
                    : 'bg-background border-border hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-sm'
                  }
                `}
              >
                <div className={`size-6 rounded-md ${modelo.cor} flex items-center justify-center text-white text-[10px] font-bold`}>
                  {modelo.nome.charAt(0)}
                </div>
                <div className="flex flex-col items-start">
                  <span className={`text-xs font-medium leading-tight ${ehModeloAtivo ? 'text-amber-700 dark:text-amber-300' : ''}`}>
                    {modelo.nome}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{modelo.provedor}</span>
                </div>
                <span className="text-[10px]">🆓</span>
                {modelo.destaque && (
                  <Star className="size-3 text-amber-500 fill-amber-500" />
                )}
                {ehModeloAtivo && (
                  <Badge className="text-[9px] h-4 px-1 bg-amber-500 text-white hover:bg-amber-600">
                    Ativo
                  </Badge>
                )}
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* Indicadores de Saúde do Sistema */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Shield className="size-5 text-amber-600 dark:text-amber-400" />
          Saúde do Sistema
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {indicadoresSaude.map((indicador) => (
            <Card key={indicador.titulo} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2.5 ${indicador.corFundo}`}>
                    <indicador.icone className={`size-5 ${indicador.corIcone}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">{indicador.titulo}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className={`size-2 rounded-full ${indicador.online ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                      <span className={`text-sm font-semibold ${indicador.online ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {indicador.status}
                      </span>
                    </div>
                  </div>
                  {indicador.online ? (
                    <CheckCircle2 className="size-5 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="size-5 text-red-500 flex-shrink-0" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Ações Rápidas com Glassmorphism */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Zap className="size-5 text-amber-600 dark:text-amber-400" />
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {acoesRapidas.map((acao) => (
            <ShadcnTooltip key={acao.rotulo}>
              <TooltipTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`
                    flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-amber-200 dark:border-amber-800
                    bg-white/60 dark:bg-gray-900/60 backdrop-blur-md
                    transition-all duration-300 cursor-pointer
                    ${acao.gradHover}
                    group
                  `}
                  onClick={() => setSecaoAtiva(acao.secao)}
                >
                  <div className="relative">
                    <acao.icone className="size-6 text-amber-600 dark:text-amber-400 transition-transform duration-300 group-hover:animate-bounce" />
                  </div>
                  <span className="text-sm font-medium group-hover:text-inherit">{acao.rotulo}</span>
                  <ArrowRight className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{descricoesAcoes[acao.rotulo]}</p>
              </TooltipContent>
            </ShadcnTooltip>
          ))}
        </div>
      </motion.div>

      {/* Gráfico de Uso de Tokens */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="size-4 text-amber-600 dark:text-amber-400" />
            Uso de Tokens
          </CardTitle>
          <CardDescription>Consumo de tokens por conversa</CardDescription>
        </CardHeader>
        <CardContent>
          {dadosGrafico && dadosGrafico.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosGrafico}>
                  <XAxis dataKey="nome" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: '1px solid oklch(0.75 0.15 70 / 30%)',
                    }}
                  />
                  <Bar dataKey="entrada" fill="oklch(0.55 0.16 65)" radius={[4, 4, 0, 0]} name="Entrada" />
                  <Bar dataKey="saida" fill="oklch(0.75 0.15 70)" radius={[4, 4, 0, 0]} name="Saída" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum dado de tokens disponível ainda. Comece uma conversa! 💬
            </p>
          )}
        </CardContent>
      </Card>

      {/* Seção Inferior: Atividade Recente + Status do Agente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Atividade Recente Aprimorada */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="size-4 text-amber-600 dark:text-amber-400" />
              Atividade Recente
            </CardTitle>
            <CardDescription>Últimas ações realizadas pelo agente</CardDescription>
          </CardHeader>
          <CardContent>
            {carregandoAtividades ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
                    <Skeleton className="size-8 rounded-md flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-3/4" />
                      <Skeleton className="h-2.5 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : atividades && atividades.length > 0 ? (
              <ScrollArea className="max-h-96">
                <div className="space-y-2 pr-3">
                  {atividades.map((atividade, index) => {
                    const config = obterConfigTipo(atividade.tipo)
                    const IconeTipo = config.icone
                    return (
                      <motion.div
                        key={atividade.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`
                          flex items-center gap-3 p-3 rounded-lg border-l-4 ${config.corBorda}
                          bg-muted/30 hover:bg-muted/60 transition-colors group
                        `}
                      >
                        <div className={`rounded-md p-1.5 ${config.corFundo} flex-shrink-0`}>
                          <IconeTipo className={`size-3.5 ${config.corIcone}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{atividade.descricao}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {atividade.tipo.charAt(0).toUpperCase() + atividade.tipo.slice(1)}
                          </p>
                        </div>
                        <span className="text-[11px] text-muted-foreground flex-shrink-0 whitespace-nowrap">
                          {formatarTempoRelativo(atividade.timestamp)}
                        </span>
                      </motion.div>
                    )
                  })}
                </div>
              </ScrollArea>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-10 text-center"
              >
                <div className="relative mb-4">
                  <div className="size-16 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                    <Inbox className="size-7 text-amber-400" />
                  </div>
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    className="absolute -top-1 -right-1 size-5 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center"
                  >
                    <Plus className="size-3 text-amber-500" />
                  </motion.div>
                </div>
                <p className="text-sm font-medium text-muted-foreground">Nenhuma atividade ainda</p>
                <p className="text-xs text-muted-foreground mt-1">Comece uma conversa para ver atividades aqui</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 gap-1.5 border-amber-300 hover:bg-amber-50 hover:border-amber-400 dark:border-amber-700 dark:hover:bg-amber-900/20 dark:hover:border-amber-600"
                  onClick={() => setSecaoAtiva('conversas')}
                >
                  <MessageSquare className="size-3.5" />
                  Iniciar Conversa
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Status do Agente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="size-4 text-amber-600 dark:text-amber-400" />
              Status do Agente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {carregandoAgente ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : agente ? (
              <div className="space-y-4">
                {/* Informações principais */}
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-xl">
                    A
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-lg">{agente.nome}</p>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      {/* Provedor com ícone */}
                      <Badge variant="outline" className="text-[10px] gap-1 border-amber-300 dark:border-amber-700">
                        <Globe className="size-3" />
                        {agente.provedorModelo === 'openrouter' ? 'OpenRouter' : agente.provedorModelo}
                      </Badge>
                      {/* Modelo */}
                      <Badge variant="outline" className="text-[10px] gap-1 border-border">
                        <Cpu className="size-3" />
                        {obterNomeCurtoModelo(agente.modelo)}
                      </Badge>
                      {/* Badge Gratuito */}
                      {modeloEhGratis(agente.modelo) && (
                        <Badge className="text-[10px] gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 border-emerald-200 dark:border-emerald-800">
                          🆓 Gratuito
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status da API Key */}
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                  {apiKeyConfigurada ? (
                    <>
                      <CheckCircle2 className="size-4 text-emerald-500" />
                      <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">API Key configurada</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="size-4 text-red-500" />
                      <span className="text-xs text-red-700 dark:text-red-400 font-medium">API Key não configurada</span>
                    </>
                  )}
                </div>

                {/* Personalidade */}
                <p className="text-xs text-muted-foreground line-clamp-2 bg-muted/50 p-2.5 rounded">
                  {agente.personalidade}
                </p>

                {/* Botão Configurar */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 border-amber-300 hover:bg-amber-50 hover:border-amber-400 dark:border-amber-700 dark:hover:bg-amber-900/20 dark:hover:border-amber-600"
                  onClick={() => setSecaoAtiva('config')}
                >
                  <Settings className="size-4" />
                  Configurar Agente
                  <ChevronRight className="size-3 ml-auto" />
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Agente não configurado</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modelos Disponíveis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Cpu className="size-4 text-amber-600 dark:text-amber-400" />
            Modelos Disponíveis
          </CardTitle>
          <CardDescription>
            Modelos gratuitos via OpenRouter — clique para definir como modelo ativo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-80">
            <div className="space-y-2 pr-3">
              {MODELOS_GRATUITOS.map((modelo) => {
                const ehModeloAtivo = agente?.modelo === modelo.id
                return (
                  <motion.button
                    key={modelo.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => atualizarModelo.mutate(modelo.id)}
                    disabled={atualizarModelo.isPending}
                    className={`
                      w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer text-left
                      ${ehModeloAtivo
                        ? 'bg-amber-50 border-amber-400 dark:bg-amber-900/30 dark:border-amber-600 shadow-sm ring-1 ring-amber-400/20'
                        : 'bg-background border-border hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-sm'
                      }
                      ${atualizarModelo.isPending ? 'opacity-60 pointer-events-none' : ''}
                    `}
                  >
                    {/* Ícone do modelo */}
                    <div className={`size-9 rounded-lg ${modelo.cor} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                      {modelo.nome.charAt(0)}
                    </div>

                    {/* Informações */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${ehModeloAtivo ? 'text-amber-700 dark:text-amber-300' : ''}`}>
                          {modelo.nome}
                        </span>
                        <span className="text-xs">🆓</span>
                        {modelo.destaque && (
                          <Badge className="text-[9px] h-4 px-1.5 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 hover:bg-amber-200 border-amber-200 dark:border-amber-800">
                            <Star className="size-2.5 mr-0.5 fill-amber-500 text-amber-500" />
                            Popular
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{modelo.provedor}</p>
                    </div>

                    {/* Indicador de modelo ativo */}
                    {ehModeloAtivo ? (
                      <Badge className="text-[10px] h-5 px-2 bg-amber-500 text-white hover:bg-amber-600 flex-shrink-0">
                        Ativo
                      </Badge>
                    ) : (
                      <ChevronRight className="size-4 text-muted-foreground flex-shrink-0" />
                    )}
                  </motion.button>
                )
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* CSS Keyframe Animations */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes gradientBorder {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  )
}
