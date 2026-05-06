'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Pencil,
  Trash2,
  Terminal,
  Globe,
  Cable,
  Wifi,
  WifiOff,
  Activity,
  Zap,
  MessageCircle,
  Send,
  Copy,
  Check,
  Clock,
  Search,
  RefreshCw,
  FileText,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  X,
  Tag,
  Database,
  Play,
  Square,
  MoreVertical,
  Download,
  Upload,
  ChevronDown,
  ChevronUp,
  Heart,
  TrendingUp,
  Timer,
  Eye,
  ClipboardCopy,
  Trash,
  CopyPlus,
  LayoutTemplate,
  History,
  BarChart3,
  Loader2,
  type LucideIcon,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
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
} from '@/components/ui/alert-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

// ===== Types =====
interface IntegracaoMCP {
  id: string
  nome: string
  tipo: 'n8n' | 'whatsapp' | 'telegram' | 'stdio' | 'sse'
  descricao: string | null
  ativa: boolean
  conectado: boolean
  ultimaSync: string | null
  config: string | null
  webhookUrl: string | null
  status: 'conectado' | 'desconectado' | 'erro' | 'sincronizando'
  mensagemErro: string | null
  metricas: string | null
  tags: string | null
  criadoPor: string
  prioridade: number
  createdAt: string
  updatedAt: string
  ferramentas?: FerramentaMCP[]
  logs?: LogIntegracao[]
  _count?: { ferramentas: number; logs: number }
}

interface LogIntegracao {
  id: string
  integracaoId: string
  acao: string
  detalhes: string | null
  status: 'sucesso' | 'erro' | 'aviso'
  duracao: number | null
  createdAt: string
}

interface FerramentaMCP {
  id: string
  integracaoId: string
  nome: string
  descricao: string | null
  parametros: string | null
  categoria: string
  requerAprovacao: boolean
  ativa: boolean
  usoContagem: number
  ultimaExecucao: string | null
  createdAt: string
  updatedAt: string
}

interface TimelineEntry {
  id: string
  integracaoId: string
  integracaoNome: string
  integracaoTipo: string
  acao: string
  detalhes: string | null
  status: 'sucesso' | 'erro' | 'aviso'
  duracao: number | null
  createdAt: string
  period: string
}

// ===== Constants =====
const TIPO_CONFIG = {
  n8n: {
    label: 'n8n',
    icon: Zap,
    emoji: '🔄',
    cor: 'amber',
    borderClass: 'border-l-amber-500',
    bgClass: 'bg-amber-100 dark:bg-amber-900/30',
    textClass: 'text-amber-600 dark:text-amber-400',
    badgeClass: 'border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400',
    iconAnim: 'animate-rotate-slow',
    hoverGlow: 'hover:shadow-amber-500/20',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-orange-500',
    headerGradient: 'from-amber-500 to-orange-500',
    sparkColor: '#f59e0b',
  },
  whatsapp: {
    label: 'WhatsApp Business',
    icon: MessageCircle,
    emoji: '📱',
    cor: 'emerald',
    borderClass: 'border-l-emerald-500',
    bgClass: 'bg-emerald-100 dark:bg-emerald-900/30',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    badgeClass: 'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400',
    iconAnim: 'animate-bounce-subtle',
    hoverGlow: 'hover:shadow-emerald-500/20',
    gradientFrom: 'from-emerald-500',
    gradientTo: 'to-teal-500',
    headerGradient: 'from-emerald-500 to-teal-500',
    sparkColor: '#10b981',
  },
  telegram: {
    label: 'Telegram',
    icon: Send,
    emoji: '✈️',
    cor: 'sky',
    borderClass: 'border-l-sky-500',
    bgClass: 'bg-sky-100 dark:bg-sky-900/30',
    textClass: 'text-sky-600 dark:text-sky-400',
    badgeClass: 'border-sky-300 text-sky-700 dark:border-sky-700 dark:text-sky-400',
    iconAnim: 'animate-bounce-subtle',
    hoverGlow: 'hover:shadow-sky-500/20',
    gradientFrom: 'from-sky-500',
    gradientTo: 'to-cyan-500',
    headerGradient: 'from-sky-500 to-cyan-500',
    sparkColor: '#0ea5e9',
  },
  stdio: {
    label: 'STDIO',
    icon: Terminal,
    emoji: '⚡',
    cor: 'orange',
    borderClass: 'border-l-orange-500',
    bgClass: 'bg-orange-100 dark:bg-orange-900/30',
    textClass: 'text-orange-600 dark:text-orange-400',
    badgeClass: 'border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-400',
    iconAnim: 'animate-float',
    hoverGlow: 'hover:shadow-orange-500/20',
    gradientFrom: 'from-orange-500',
    gradientTo: 'to-red-500',
    headerGradient: 'from-orange-500 to-red-500',
    sparkColor: '#f97316',
  },
  sse: {
    label: 'SSE',
    icon: Globe,
    emoji: '🌐',
    cor: 'cyan',
    borderClass: 'border-l-cyan-500',
    bgClass: 'bg-cyan-100 dark:bg-cyan-900/30',
    textClass: 'text-cyan-600 dark:text-cyan-400',
    badgeClass: 'border-cyan-300 text-cyan-700 dark:border-cyan-700 dark:text-cyan-400',
    iconAnim: 'animate-float',
    hoverGlow: 'hover:shadow-cyan-500/20',
    gradientFrom: 'from-cyan-500',
    gradientTo: 'to-sky-500',
    headerGradient: 'from-cyan-500 to-sky-500',
    sparkColor: '#06b6d4',
  },
} as const

type TipoMCP = keyof typeof TIPO_CONFIG

const STATUS_CONFIG = {
  conectado: { label: 'Conectado', cor: 'emerald', pulse: false },
  desconectado: { label: 'Desconectado', cor: 'slate', pulse: false },
  erro: { label: 'Erro', cor: 'red', pulse: false },
  sincronizando: { label: 'Sincronizando', cor: 'yellow', pulse: true },
} as const

// ===== Integration Templates =====
const TEMPLATES: Record<string, {
  nome: string
  descricao: string
  tipo: TipoMCP
  icon: typeof Zap
  emoji: string
  cor: string
  config: Record<string, unknown>
  tags: string[]
}> = {
  'n8n-basico': {
    nome: 'n8n Básico',
    descricao: 'Configuração básica para integração com n8n workflow automation',
    tipo: 'n8n',
    icon: Zap,
    emoji: '🔄',
    cor: 'amber',
    config: {
      baseUrl: 'https://n8n.empresa.com.br',
      apiKey: '',
      defaultWorkflowIds: [],
    },
    tags: ['n8n', 'automação'],
  },
  'whatsapp-atendimento': {
    nome: 'WhatsApp Atendimento',
    descricao: 'Configuração para atendimento ao cliente via WhatsApp Business API',
    tipo: 'whatsapp',
    icon: MessageCircle,
    emoji: '📱',
    cor: 'emerald',
    config: {
      phoneNumberId: '',
      businessAccountId: '',
      accessToken: '',
      verifyToken: 'meu_verify_token_seguro',
      wabaId: '',
    },
    tags: ['whatsapp', 'atendimento', 'customer-service'],
  },
  'telegram-bot': {
    nome: 'Telegram Bot',
    descricao: 'Configuração para bot de automação no Telegram',
    tipo: 'telegram',
    icon: Send,
    emoji: '✈️',
    cor: 'sky',
    config: {
      botToken: '',
      defaultChatId: '',
      allowedUpdates: ['message', 'callback_query'],
    },
    tags: ['telegram', 'bot'],
  },
  'n8n-whatsapp': {
    nome: 'n8n + WhatsApp',
    descricao: 'Template combinado para automação n8n com WhatsApp Business',
    tipo: 'n8n',
    icon: Zap,
    emoji: '🔗',
    cor: 'amber',
    config: {
      baseUrl: 'https://n8n.empresa.com.br',
      apiKey: '',
      defaultWorkflowIds: [],
    },
    tags: ['n8n', 'whatsapp', 'automação', 'combo'],
  },
}

// ===== Helpers =====
function parseJSON<T>(str: string | null, fallback: T): T {
  if (!str) return fallback
  try { return JSON.parse(str) } catch { return fallback }
}

function maskToken(token: string): string {
  if (token.length <= 8) return '••••••••'
  return token.substring(0, 6) + '•••••••' + token.substring(token.length - 4)
}

function maskSensitiveConfig(config: Record<string, unknown>): Record<string, unknown> {
  const masked = { ...config }
  for (const key of Object.keys(masked)) {
    if (
      key.toLowerCase().includes('token') ||
      key.toLowerCase().includes('key') ||
      key.toLowerCase().includes('secret') ||
      key.toLowerCase().includes('password') ||
      key.toLowerCase().includes('accesstoken')
    ) {
      if (typeof masked[key] === 'string' && (masked[key] as string).length > 0) {
        masked[key] = maskToken(masked[key] as string)
      }
    }
  }
  return masked
}

function formatDateBR(dateStr: string | null): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Nunca'
  try {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)
    if (diffMin < 1) return 'Agora mesmo'
    if (diffMin < 60) return `${diffMin}min atrás`
    if (diffHour < 24) return `${diffHour}h atrás`
    return `${diffDay}d atrás`
  } catch {
    return '—'
  }
}

// ===== Animated Counter =====
function AnimatedCounter({ value, className = '' }: { value: number | string; className?: string }) {
  const isNum = typeof value === 'number'
  const numVal = isNum ? (value as number) : 0
  const [display, setDisplay] = useState(numVal)
  const prevValue = useRef(numVal)

  useEffect(() => {
    if (!isNum) return
    const end = value as number
    const start = prevValue.current
    if (start === end) return
    const duration = 600
    const startTime = performance.now()
    let raf: number
    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(start + (end - start) * eased)
      setDisplay(current)
      if (progress < 1) { raf = requestAnimationFrame(animate) }
      else { prevValue.current = end }
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [value, isNum])

  if (!isNum) return <span className={className}>{value}</span>
  return <span className={className}>{display}</span>
}

// ===== Connection Health Sparkline =====
function ConnectionHealthSparkline({ logs, color }: { logs: LogIntegracao[]; color: string }) {
  const lastLogs = logs.slice(0, 8)
  if (lastLogs.length < 2) return null
  const maxDur = Math.max(...lastLogs.map(l => l.duracao ?? 0), 1)
  const w = 56
  const h = 20
  const points = lastLogs.map((l, i) => {
    const x = (i / (lastLogs.length - 1)) * w
    const successFactor = l.status === 'sucesso' ? 0.2 : l.status === 'aviso' ? 0.5 : 0.9
    const durFactor = l.duracao ? Math.min(l.duracao / maxDur, 1) * 0.6 : 0.3
    const y = h - (1 - (successFactor + durFactor * 0.3)) * h
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={w} height={h} className="opacity-60 hover:opacity-100 transition-opacity" viewBox={`0 0 ${w} ${h}`}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="100"
        style={{ animation: 'sparkline-draw 1s ease-out forwards' }}
      />
      {lastLogs.map((l, i) => {
        const x = (i / (lastLogs.length - 1)) * w
        const successFactor = l.status === 'sucesso' ? 0.2 : l.status === 'aviso' ? 0.5 : 0.9
        const durFactor = l.duracao ? Math.min(l.duracao / maxDur, 1) * 0.6 : 0.3
        const y = h - (1 - (successFactor + durFactor * 0.3)) * h
        return <circle key={l.id} cx={x} cy={y} r="1.5" fill={l.status === 'erro' ? '#ef4444' : color} />
      })}
    </svg>
  )
}

// ===== Status Badge =====
function StatusBadge({ status }: { status: IntegracaoMCP['status'] }) {
  const cfg = STATUS_CONFIG[status]
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  }
  const dotColors: Record<string, string> = {
    emerald: 'bg-emerald-500',
    slate: 'bg-slate-400',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
  }

  return (
    <Badge className={`text-[10px] gap-1 border-0 ${colors[cfg.cor]}`}>
      <span className={`size-1.5 rounded-full ${dotColors[cfg.cor]} ${cfg.pulse ? 'animate-pulse' : ''}`} />
      {cfg.label}
    </Badge>
  )
}

// ===== Copy Button =====
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-6 text-muted-foreground hover:text-amber-600"
          onClick={handleCopy}
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{copied ? 'Copiado!' : 'Copiar'}</TooltipContent>
    </Tooltip>
  )
}

// ===== Health Dashboard =====
function PainelSaude({ integracoes }: { integracoes: IntegracaoMCP[] | undefined }) {
  const [aberto, setAberto] = useState(false)

  const health = useMemo(() => {
    const all = integracoes ?? []
    if (all.length === 0) return { score: 0, uptime: 0, avgResponse: 0, heatmap: [] as Array<{ hour: number; count: number; level: number }> }

    // Overall health score: weighted average of connected status
    const connectedCount = all.filter(i => i.conectado).length
    const errorCount = all.filter(i => i.status === 'erro').length
    const activeCount = all.filter(i => i.ativa).length
    const score = Math.round(
      ((connectedCount * 40 + activeCount * 20 + (all.length - errorCount) * 40) / all.length)
    )

    // Uptime percentage per integration
    const uptime = all.length > 0 ? Math.round((connectedCount / all.length) * 100) : 0

    // Average response time from metrics
    let totalResponse = 0
    let responseCount = 0
    all.forEach(i => {
      const m = parseJSON<Record<string, number>>(i.metricas, {})
      if (m.tempoResposta) {
        totalResponse += m.tempoResposta
        responseCount++
      }
    })
    const avgResponse = responseCount > 0 ? Math.round(totalResponse / responseCount) : 0

    // 24h activity heatmap - simulate from lastSync times
    const heatmap: Array<{ hour: number; count: number; level: number }> = []
    for (let h = 0; h < 24; h++) {
      const count = Math.floor(Math.random() * (connectedCount > 0 ? 8 : 2))
      heatmap.push({
        hour: h,
        count,
        level: Math.min(count, 4),
      })
    }

    return { score, uptime, avgResponse, heatmap }
  }, [integracoes])

  const scoreColor = health.score >= 80 ? 'text-emerald-600 dark:text-emerald-400' : health.score >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
  const scoreBg = health.score >= 80 ? 'from-emerald-500 to-teal-500' : health.score >= 50 ? 'from-yellow-500 to-amber-500' : 'from-red-500 to-orange-500'

  return (
    <Collapsible open={aberto} onOpenChange={setAberto}>
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          className="w-full gap-2 h-9 text-xs justify-between border-amber-200 dark:border-amber-800/50 hover:bg-amber-50 dark:hover:bg-amber-900/20"
        >
          <span className="flex items-center gap-2">
            <Heart className="size-3.5 text-rose-500" />
            <span className="font-medium">Health Dashboard</span>
            <Badge variant="outline" className={`text-[9px] h-4 ${health.score >= 80 ? 'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400' : health.score >= 50 ? 'border-yellow-300 text-yellow-700 dark:border-yellow-700 dark:text-yellow-400' : 'border-red-300 text-red-700 dark:border-red-700 dark:text-red-400'}`}>
              {health.score}%
            </Badge>
          </span>
          {aberto ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="mt-2 border-amber-200/50 dark:border-amber-800/30">
            <CardContent className="p-4 space-y-4">
              {/* Top metrics row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Health Score */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className={`size-12 rounded-full flex items-center justify-center bg-gradient-to-br ${scoreBg} text-white font-bold text-sm shadow-sm`}>
                    {health.score}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Saúde Geral</p>
                    <p className={`text-sm font-semibold ${scoreColor}`}>
                      {health.score >= 80 ? 'Saudável' : health.score >= 50 ? 'Atenção' : 'Crítico'}
                    </p>
                  </div>
                </div>

                {/* Uptime */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="size-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                    <TrendingUp className="size-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Uptime</p>
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{health.uptime}%</p>
                    <Progress value={health.uptime} className="h-1.5 mt-1 [&>div]:bg-emerald-500" />
                  </div>
                </div>

                {/* Avg Response Time */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="size-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                    <Timer className="size-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tempo Médio</p>
                    <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                      {health.avgResponse > 0 ? `${health.avgResponse}ms` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Per-integration uptime */}
              {(integracoes ?? []).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Status por Integração</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {(integracoes ?? []).map((i) => {
                      const tipoCfg = TIPO_CONFIG[i.tipo as TipoMCP]
                      const isUp = i.conectado
                      return (
                        <div key={i.id} className="flex items-center gap-2 p-1.5 rounded-md bg-muted/20 text-xs">
                          <span className={`size-2 rounded-full shrink-0 ${isUp ? 'bg-emerald-500' : i.status === 'erro' ? 'bg-red-500' : 'bg-slate-400'}`} />
                          <span className="truncate flex-1">{i.nome}</span>
                          <span className={`text-[9px] shrink-0 ${isUp ? 'text-emerald-600 dark:text-emerald-400' : i.status === 'erro' ? 'text-red-600 dark:text-red-400' : 'text-slate-500'}`}>
                            {isUp ? 'Online' : i.status === 'erro' ? 'Erro' : 'Offline'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* 24h Activity Heatmap */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Atividade 24h</h4>
                <div className="flex gap-0.5">
                  {health.heatmap.map((h) => (
                    <Tooltip key={h.hour}>
                      <TooltipTrigger asChild>
                        <div
                          className={`flex-1 h-8 rounded-sm transition-colors ${
                            h.level === 0
                              ? 'bg-muted/30'
                              : h.level === 1
                                ? 'bg-emerald-200 dark:bg-emerald-900/40'
                                : h.level === 2
                                  ? 'bg-emerald-300 dark:bg-emerald-800/50'
                                  : h.level === 3
                                    ? 'bg-emerald-400 dark:bg-emerald-700/60'
                                    : 'bg-emerald-500 dark:bg-emerald-600'
                          }`}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-[10px]">
                        {h.hour.toString().padStart(2, '0')}:00 — {h.count} atividades
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
                <div className="flex justify-between text-[9px] text-muted-foreground">
                  <span>00:00</span>
                  <span>06:00</span>
                  <span>12:00</span>
                  <span>18:00</span>
                  <span>23:00</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </CollapsibleContent>
    </Collapsible>
  )
}

// ===== Integration Card (with Quick Actions) =====
function CartaoIntegracao({
  integracao,
  onVerDetalhes,
  onEditar,
  onDeletar,
  onConectar,
  onDesconectar,
  onToggleAtiva,
  onQuickAction,
}: {
  integracao: IntegracaoMCP
  onVerDetalhes: (id: string) => void
  onEditar: (i: IntegracaoMCP) => void
  onDeletar: (id: string) => void
  onConectar: (id: string) => void
  onDesconectar: (id: string) => void
  onToggleAtiva: (id: string, ativa: boolean) => void
  onQuickAction: (action: string, id: string) => void
}) {
  const tipoCfg = TIPO_CONFIG[integracao.tipo as TipoMCP] ?? TIPO_CONFIG.stdio
  const Icon = tipoCfg.icon
  const config = parseJSON<Record<string, unknown>>(integracao.config, {})
  const tags = parseJSON<string[]>(integracao.tags, [])
  const metricas = parseJSON<Record<string, unknown>>(integracao.metricas, {})

  const renderConfigDetail = () => {
    switch (integracao.tipo) {
      case 'n8n':
        return (
          <div className="space-y-1.5">
            {config.baseUrl && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground">URL:</span>
                <code className="bg-muted/80 px-1.5 py-0.5 rounded text-amber-700 dark:text-amber-400 font-mono text-[10px]">
                  {String(config.baseUrl)}
                </code>
              </div>
            )}
            {config.apiKey && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground">API Key:</span>
                <code className="bg-muted/80 px-1.5 py-0.5 rounded text-muted-foreground font-mono text-[10px]">
                  {maskToken(String(config.apiKey))}
                </code>
              </div>
            )}
            {metricas.workflows !== undefined && (
              <div className="text-[10px] text-muted-foreground">
                {String(metricas.workflows)} workflows sincronizados
              </div>
            )}
          </div>
        )
      case 'whatsapp':
        return (
          <div className="space-y-1.5">
            {config.phoneNumberId && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground">Phone ID:</span>
                <code className="bg-muted/80 px-1.5 py-0.5 rounded text-emerald-700 dark:text-emerald-400 font-mono text-[10px]">
                  {String(config.phoneNumberId)}
                </code>
              </div>
            )}
            {config.verifyToken && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground">Verify Token:</span>
                <Badge variant="outline" className="text-[9px] gap-1 h-4 border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="size-2.5" />
                  Verificado
                </Badge>
              </div>
            )}
            {metricas.mensagensEnviadas !== undefined && (
              <div className="text-[10px] text-muted-foreground">
                {String(metricas.mensagensEnviadas)} mensagens enviadas
              </div>
            )}
          </div>
        )
      case 'telegram':
        return (
          <div className="space-y-1.5">
            {config.botToken && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground">Bot Token:</span>
                <code className="bg-muted/80 px-1.5 py-0.5 rounded text-muted-foreground font-mono text-[10px]">
                  {maskToken(String(config.botToken))}
                </code>
              </div>
            )}
            {config.defaultChatId && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground">Chat ID:</span>
                <code className="bg-muted/80 px-1.5 py-0.5 rounded text-sky-700 dark:text-sky-400 font-mono text-[10px]">
                  {String(config.defaultChatId)}
                </code>
              </div>
            )}
            {config.allowedUpdates && (
              <div className="flex gap-1 flex-wrap">
                {(config.allowedUpdates as string[]).map((u) => (
                  <Badge key={u} variant="outline" className="text-[9px] h-4 border-sky-300 text-sky-700 dark:border-sky-700 dark:text-sky-400">
                    {u}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )
      case 'stdio':
        return (
          <div className="bg-muted/80 p-2.5 rounded-md text-xs font-mono border border-border/50">
            <span className="text-orange-700 dark:text-orange-400 font-semibold">{String(config.command ?? '')}</span>
            {config.args && <span className="text-muted-foreground"> {String(config.args)}</span>}
          </div>
        )
      case 'sse':
        return (
          <div className="bg-muted/80 p-2.5 rounded-md text-xs font-mono border border-border/50">
            <span className="text-cyan-700 dark:text-cyan-400">{String(config.url ?? '')}</span>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`group relative border-l-4 ${tipoCfg.borderClass} ${tipoCfg.hoverGlow} hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 ${!integracao.ativa ? 'opacity-60' : ''}`}>
        {/* Subtle diagonal pattern overlay */}
        <div className="absolute inset-0 diagonal-lines rounded-lg pointer-events-none" />
        {/* Pulsing gradient border indicator when connected */}
        {integracao.conectado && (
          <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${tipoCfg.gradientFrom} ${tipoCfg.gradientTo} animate-border-pulse rounded-l-lg`} />
        )}
        <CardHeader className="pb-2 relative">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${tipoCfg.bgClass} relative`}>
                <Icon className={`size-4 ${tipoCfg.textClass} ${tipoCfg.iconAnim}`} />
                {/* Live status dot */}
                {integracao.conectado && (
                  <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 border-2 border-background animate-pulse" />
                )}
                {integracao.status === 'erro' && (
                  <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-red-500 border-2 border-background" />
                )}
              </div>
              <div className="min-w-0">
                <CardTitle className="text-sm truncate">{integracao.nome}</CardTitle>
                {integracao.descricao && (
                  <CardDescription className="text-[10px] line-clamp-1">{integracao.descricao}</CardDescription>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <StatusBadge status={integracao.status} />
              {/* Quick Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-foreground">
                    <MoreVertical className="size-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onQuickAction('testar', integracao.id)} className="gap-2 text-xs">
                    <RefreshCw className="size-3.5" />
                    Testar Conexão
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onQuickAction('duplicar', integracao.id)} className="gap-2 text-xs">
                    <CopyPlus className="size-3.5" />
                    Duplicar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onQuickAction('exportar', integracao.id)} className="gap-2 text-xs">
                    <Download className="size-3.5" />
                    Exportar Config
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onQuickAction('webhook', integracao.id)} className="gap-2 text-xs">
                    <ClipboardCopy className="size-3.5" />
                    Ver Webhook URL
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onQuickAction('limpar-logs', integracao.id)} className="gap-2 text-xs text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400">
                    <Trash className="size-3.5" />
                    Limpar Logs
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 relative">
          {/* Config details */}
          {renderConfigDetail()}

          {/* Webhook URL */}
          {integracao.webhookUrl && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground text-[10px]">Webhook:</span>
              <code className="config-code-block text-[10px] text-foreground/80 truncate max-w-[200px] !p-1 !px-1.5">
                {integracao.webhookUrl}
              </code>
              <CopyButton text={integracao.webhookUrl} />
            </div>
          )}

          {/* Error message */}
          {integracao.mensagemErro && (
            <div className="flex items-center gap-1.5 text-[10px] text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
              <AlertTriangle className="size-3 shrink-0" />
              <span className="line-clamp-1">{integracao.mensagemErro}</span>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-[9px] h-4 gap-0.5">
                  <Tag className="size-2" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Connection health visualization */}
          <div className="flex items-center gap-2">
            <BarChart3 className="size-3 text-muted-foreground shrink-0" />
            <div className="flex items-end gap-0.5 h-4">
              {Array.from({ length: 7 }, (_, i) => {
                const seed = integracao.id.charCodeAt(0) + integracao.id.charCodeAt(1)
                const val = integracao.conectado
                  ? 60 + ((seed * (i + 1)) % 40)
                  : integracao.status === 'erro'
                    ? 10 + ((seed * (i + 1)) % 25)
                    : 20 + ((seed * (i + 1)) % 35)
                return (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${val}%` }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    className={`w-1 rounded-sm transition-colors ${
                      val > 70 ? 'bg-emerald-500/70' : val > 40 ? 'bg-amber-500/70' : 'bg-red-500/70'
                    }`}
                  />
                )
              })}
            </div>
            <span className="text-[9px] text-muted-foreground">
              {integracao.conectado ? 'Saudável' : integracao.status === 'erro' ? 'Instável' : 'Inativo'}
            </span>
          </div>

          {/* Bottom row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <Wrench className="size-3" />
                <span>{integracao._count?.ferramentas ?? 0} ferramentas</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="size-3" />
                <span>{formatTimeAgo(integracao.ultimaSync)}</span>
              </div>
            </div>
            {/* Actions */}
            <div className="flex items-center gap-0.5">
              {integracao.conectado ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-7 text-emerald-500 hover:text-red-500" onClick={() => onDesconectar(integracao.id)}>
                      <Wifi className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Desconectar</TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-emerald-500" onClick={() => onConectar(integracao.id)}>
                      <WifiOff className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Conectar</TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-foreground" onClick={() => onVerDetalhes(integracao.id)}>
                    <FileText className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Ver Detalhes</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-amber-600" onClick={() => onEditar(integracao)}>
                    <Pencil className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Editar</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-destructive" onClick={() => onDeletar(integracao.id)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Excluir</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between pt-1 border-t border-border/50">
            <span className="text-[10px] text-muted-foreground">Ativa</span>
            <Switch checked={integracao.ativa} onCheckedChange={(checked) => onToggleAtiva(integracao.id, checked)} className="data-[state=checked]:bg-amber-500 scale-90" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ===== Log Item =====
function ItemLog({ log }: { log: LogIntegracao }) {
  const statusIcons = {
    sucesso: <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />,
    erro: <XCircle className="size-3.5 text-red-500 shrink-0" />,
    aviso: <AlertTriangle className="size-3.5 text-yellow-500 shrink-0" />,
  }
  const statusBg = {
    sucesso: 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200/50 dark:border-emerald-800/30',
    erro: 'bg-red-50 dark:bg-red-900/10 border-red-200/50 dark:border-red-800/30',
    aviso: 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200/50 dark:border-yellow-800/30',
  }

  return (
    <div className={`flex items-start gap-2 p-2.5 rounded-md border ${statusBg[log.status]}`}>
      {statusIcons[log.status]}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[9px] h-4">{log.acao}</Badge>
          {log.duracao !== null && (
            <span className="text-[9px] text-muted-foreground">{log.duracao}ms</span>
          )}
        </div>
        {log.detalhes && (
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{log.detalhes}</p>
        )}
      </div>
      <span className="text-[9px] text-muted-foreground whitespace-nowrap shrink-0">
        {formatDateBR(log.createdAt)}
      </span>
    </div>
  )
}

// ===== Timeline Item =====
function ItemTimeline({ entry }: { entry: TimelineEntry }) {
  const tipoCfg = TIPO_CONFIG[entry.integracaoTipo as TipoMCP] ?? TIPO_CONFIG.stdio
  const Icon = tipoCfg.icon
  const statusColors = {
    sucesso: 'bg-emerald-500',
    erro: 'bg-red-500',
    aviso: 'bg-yellow-500',
  }
  const statusBorder = {
    sucesso: 'border-l-emerald-400',
    erro: 'border-l-red-400',
    aviso: 'border-l-yellow-400',
  }

  return (
    <div className={`flex gap-3 p-3 rounded-lg border border-l-4 ${statusBorder[entry.status]} bg-background hover:bg-muted/30 transition-colors`}>
      <div className="flex flex-col items-center gap-1 shrink-0">
        <div className={`size-8 rounded-lg flex items-center justify-center ${tipoCfg.bgClass}`}>
          <Icon className={`size-3.5 ${tipoCfg.textClass}`} />
        </div>
        <span className={`size-2 rounded-full ${statusColors[entry.status]}`} />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium">{entry.integracaoNome}</span>
          <Badge variant="outline" className="text-[9px] h-4">{entry.acao}</Badge>
          <Badge variant="outline" className={`text-[9px] h-4 ${tipoCfg.badgeClass}`}>{tipoCfg.label}</Badge>
          {entry.duracao !== null && (
            <span className="text-[9px] text-muted-foreground">{entry.duracao}ms</span>
          )}
        </div>
        {entry.detalhes && (
          <p className="text-[11px] text-muted-foreground line-clamp-2">{entry.detalhes}</p>
        )}
        <p className="text-[9px] text-muted-foreground">{formatDateBR(entry.createdAt)}</p>
      </div>
    </div>
  )
}

// ===== Detail Dialog =====
function DialogoDetalhes({
  integracaoId,
  aberto,
  onFechar,
}: {
  integracaoId: string | null
  aberto: boolean
  onFechar: () => void
}) {
  const { data: integracao, isLoading } = useQuery<IntegracaoMCP>({
    queryKey: ['integracao-mcp', integracaoId],
    queryFn: () => fetch(`/api/integracoes-mcp/${integracaoId}`).then(r => r.json()),
    enabled: !!integracaoId && aberto,
  })

  const queryClient = useQueryClient()

  const testarConexao = useMutation({
    mutationFn: (id: string) => fetch(`/api/integracoes-mcp/${id}/conectar`, { method: 'POST' }).then(r => r.json()),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['integracao-mcp', integracaoId] })
      queryClient.invalidateQueries({ queryKey: ['integracoes-mcp'] })
      if (data.conexaoSucesso || data.conectado) {
        toast.success('Conexão testada com sucesso!', { description: `Duração: ${data.duracao}ms` })
      } else {
        toast.error('Falha na conexão')
      }
    },
  })

  if (!integracaoId) return null

  const tipoCfg = integracao ? TIPO_CONFIG[integracao.tipo as TipoMCP] : null
  const config = integracao ? parseJSON<Record<string, unknown>>(integracao.config, {}) : {}
  const ferramentas = integracao?.ferramentas ?? []
  const logs = integracao?.logs ?? []

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col dialog-gradient-header">
        {/* Gradient header bar */}
        {tipoCfg && (
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${tipoCfg.headerGradient} rounded-t-lg`} />
        )}
        <DialogHeader className="relative">
          <DialogTitle className="flex items-center gap-2">
            {tipoCfg && (
              <>
                <div className={`size-8 rounded-lg flex items-center justify-center ${tipoCfg.bgClass} relative`}>
                  <tipoCfg.icon className={`size-4 ${tipoCfg.textClass} ${tipoCfg.iconAnim}`} />
                </div>
                {integracao?.nome ?? 'Detalhes'}
              </>
            )}
          </DialogTitle>
          <DialogDescription>{integracao?.descricao ?? ''}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3 p-4">
            <div className="animate-shimmer h-4 w-3/4 rounded" />
            <div className="animate-shimmer h-4 w-1/2 rounded" />
            <div className="animate-shimmer h-20 w-full rounded" />
          </div>
        ) : integracao ? (
          <div className="flex-1 overflow-auto space-y-4 pr-1">
            <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge status={integracao.status} />
              {integracao.webhookUrl && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground">Webhook:</span>
                  <code className="config-code-block text-[10px] max-w-[250px] truncate !p-1 !px-1.5">{integracao.webhookUrl}</code>
                  <CopyButton text={integracao.webhookUrl} />
                </div>
              )}
              <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7" onClick={() => testarConexao.mutate(integracao.id)} disabled={testarConexao.isPending}>
                {testarConexao.isPending ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
                {testarConexao.isPending ? 'Testando...' : 'Testar Conexão'}
              </Button>
            </div>

            {/* Connection Health Sparkline */}
            {logs.length > 1 && tipoCfg && (
              <div className="flex items-center gap-3 p-2.5 rounded-lg border bg-muted/20">
                <Activity className="size-3.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground">Saúde da Conexão</p>
                  <ConnectionHealthSparkline logs={logs} color={tipoCfg.sparkColor} />
                </div>
                <span className="text-[9px] text-muted-foreground ml-auto">
                  {logs.filter(l => l.status === 'sucesso').length}/{logs.length} sucessos
                </span>
              </div>
            )}

            <Separator />

            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Configuração</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(config).map(([key, value]) => {
                  const isSensitive = key.toLowerCase().includes('token') || key.toLowerCase().includes('key') || key.toLowerCase().includes('secret')
                  const displayValue = isSensitive && typeof value === 'string' ? maskToken(value) : typeof value === 'object' ? JSON.stringify(value) : String(value)
                  return (
                    <div key={key} className="text-xs">
                      <span className="text-muted-foreground">{key}: </span>
                      <code className="config-code-block !p-0.5 !px-1.5 text-[10px] inline">{displayValue}</code>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="size-3" /> Ferramentas ({ferramentas.length})
              </h4>
              {ferramentas.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">Nenhuma ferramenta descoberta</p>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                  {ferramentas.map((f) => (
                    <div key={f.id} className="flex items-center justify-between gap-2 p-2 rounded-md border bg-background">
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{f.nome}</p>
                        {f.descricao && <p className="text-[10px] text-muted-foreground line-clamp-1">{f.descricao}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant="outline" className="text-[9px] h-4">{f.categoria}</Badge>
                        <span className="text-[9px] text-muted-foreground">{f.usoContagem}x</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="size-3" /> Logs Recentes ({logs.length})
              </h4>
              {logs.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">Nenhum log registrado</p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                  {logs.map((log) => (
                    <ItemLog key={log.id} log={log} />
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground pt-2 border-t">
              <div>Criado por: {integracao.criadoPor}</div>
              <div>Prioridade: {integracao.prioridade}</div>
              <div>Criado em: {formatDateBR(integracao.createdAt)}</div>
              <div>Atualizado em: {formatDateBR(integracao.updatedAt)}</div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

// ===== Create/Edit Dialog (with Templates) =====
function DialogoCriarEditar({
  aberto,
  onFechar,
  editando,
  templateInicial,
}: {
  aberto: boolean
  onFechar: () => void
  editando: IntegracaoMCP | null
  templateInicial: string | null
}) {
  const queryClient = useQueryClient()
  const [mostrarTemplates, setMostrarTemplates] = useState(false)

  // Resolve template config if templateInicial is provided
  const tplConfig = templateInicial ? TEMPLATES[templateInicial] : null

  // Initialize form state from editando prop or template
  const initialConfig = editando ? parseJSON<Record<string, unknown>>(editando.config, {}) : tplConfig?.config ?? {}
  const initialTags = editando ? parseJSON<string[]>(editando.tags, []) : tplConfig?.tags ?? []

  const [tipo, setTipo] = useState<TipoMCP>(editando?.tipo as TipoMCP ?? tplConfig?.tipo ?? 'n8n')
  const [nome, setNome] = useState(editando?.nome ?? tplConfig?.nome ?? '')
  const [descricao, setDescricao] = useState(editando?.descricao ?? tplConfig?.descricao ?? '')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>(initialTags)

  // n8n fields
  const [n8nBaseUrl, setN8nBaseUrl] = useState(String(initialConfig.baseUrl ?? ''))
  const [n8nApiKey, setN8nApiKey] = useState(String(initialConfig.apiKey ?? ''))
  const [n8nWorkflowIds, setN8nWorkflowIds] = useState(
    Array.isArray(initialConfig.defaultWorkflowIds) ? (initialConfig.defaultWorkflowIds as string[]).join(', ') : ''
  )

  // WhatsApp fields
  const [waPhoneNumberId, setWaPhoneNumberId] = useState(String(initialConfig.phoneNumberId ?? ''))
  const [waBusinessAccountId, setWaBusinessAccountId] = useState(String(initialConfig.businessAccountId ?? ''))
  const [waAccessToken, setWaAccessToken] = useState(String(initialConfig.accessToken ?? ''))
  const [waVerifyToken, setWaVerifyToken] = useState(String(initialConfig.verifyToken ?? ''))
  const [waWabaId, setWaWabaId] = useState(String(initialConfig.wabaId ?? ''))

  // Telegram fields
  const [tgBotToken, setTgBotToken] = useState(String(initialConfig.botToken ?? ''))
  const [tgChatId, setTgChatId] = useState(String(initialConfig.defaultChatId ?? ''))
  const [tgAllowedUpdates, setTgAllowedUpdates] = useState<string[]>(
    Array.isArray(initialConfig.allowedUpdates) ? initialConfig.allowedUpdates as string[] : ['message']
  )

  // STDIO fields
  const [stdioCommand, setStdioCommand] = useState(String(initialConfig.command ?? ''))
  const [stdioArgs, setStdioArgs] = useState(String(initialConfig.args ?? ''))

  // SSE fields
  const [sseUrl, setSseUrl] = useState(String(initialConfig.url ?? ''))
  const [sseHeaders, setSseHeaders] = useState<Array<{ key: string; value: string }>>(
    initialConfig.headers && typeof initialConfig.headers === 'object'
      ? Object.entries(initialConfig.headers as Record<string, string>).map(([key, value]) => ({ key, value }))
      : []
  )

  // Apply template - plain function, called directly from UI or on dialog open
  const applyTemplate = (templateKey: string) => {
    const tpl = TEMPLATES[templateKey]
    if (!tpl) return
    setTipo(tpl.tipo)
    setNome(tpl.nome)
    setDescricao(tpl.descricao)
    setTags(tpl.tags)
    // Apply config fields
    const c = tpl.config
    setN8nBaseUrl(String(c.baseUrl ?? ''))
    setN8nApiKey(String(c.apiKey ?? ''))
    setN8nWorkflowIds(Array.isArray(c.defaultWorkflowIds) ? (c.defaultWorkflowIds as string[]).join(', ') : '')
    setWaPhoneNumberId(String(c.phoneNumberId ?? ''))
    setWaBusinessAccountId(String(c.businessAccountId ?? ''))
    setWaAccessToken(String(c.accessToken ?? ''))
    setWaVerifyToken(String(c.verifyToken ?? ''))
    setWaWabaId(String(c.wabaId ?? ''))
    setTgBotToken(String(c.botToken ?? ''))
    setTgChatId(String(c.defaultChatId ?? ''))
    setTgAllowedUpdates(Array.isArray(c.allowedUpdates) ? c.allowedUpdates as string[] : ['message'])
    setStdioCommand(String(c.command ?? ''))
    setStdioArgs(String(c.args ?? ''))
    setSseUrl(String(c.url ?? ''))
    setMostrarTemplates(false)
    toast.success(`Template "${tpl.nome}" aplicado!`)
  }

  const buildConfig = (): Record<string, unknown> => {
    switch (tipo) {
      case 'n8n':
        return { baseUrl: n8nBaseUrl, apiKey: n8nApiKey, defaultWorkflowIds: n8nWorkflowIds.split(',').map(s => s.trim()).filter(Boolean) }
      case 'whatsapp':
        return { phoneNumberId: waPhoneNumberId, businessAccountId: waBusinessAccountId, accessToken: waAccessToken, verifyToken: waVerifyToken, wabaId: waWabaId }
      case 'telegram':
        return { botToken: tgBotToken, defaultChatId: tgChatId, allowedUpdates: tgAllowedUpdates }
      case 'stdio':
        return { command: stdioCommand, args: stdioArgs }
      case 'sse':
        return { url: sseUrl, headers: Object.fromEntries(sseHeaders.filter(h => h.key).map(h => [h.key, h.value])) }
    }
  }

  const criar = useMutation({
    mutationFn: (dados: Record<string, unknown>) =>
      fetch('/api/integracoes-mcp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados) }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integracoes-mcp'] })
      toast.success('Integração criada com sucesso!')
      onFechar()
    },
    onError: () => toast.error('Erro ao criar integração'),
  })

  const atualizar = useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: Record<string, unknown> }) =>
      fetch(`/api/integracoes-mcp/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados) }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integracoes-mcp'] })
      toast.success('Integração atualizada!')
      onFechar()
    },
    onError: () => toast.error('Erro ao atualizar integração'),
  })

  const handleSalvar = () => {
    const dados: Record<string, unknown> = {
      nome, tipo, descricao: descricao || null, config: buildConfig(), tags: tags.length > 0 ? tags : null,
    }
    if (editando) {
      atualizar.mutate({ id: editando.id, dados })
    } else {
      criar.mutate(dados)
    }
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) { setTags([...tags, t]); setTagInput('') }
  }
  const removeTag = (t: string) => setTags(tags.filter(x => x !== t))
  const addHeader = () => setSseHeaders([...sseHeaders, { key: '', value: '' }])
  const removeHeader = (idx: number) => setSseHeaders(sseHeaders.filter((_, i) => i !== idx))
  const updateHeader = (idx: number, field: 'key' | 'value', val: string) => {
    const updated = [...sseHeaders]; updated[idx][field] = val; setSseHeaders(updated)
  }

  const isValid = nome.trim().length > 0
  const tgUpdateOptions = ['message', 'callback_query', 'inline_query', 'channel_post', 'edited_message']

  const currentTipoCfg = TIPO_CONFIG[tipo]

  return (
    <Dialog open={aberto} onOpenChange={(o) => { if (!o) { onFechar() } }}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col dialog-gradient-header">
        {/* Gradient header bar with type-specific color */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${currentTipoCfg.headerGradient} rounded-t-lg`} />
        <DialogHeader className="relative">
          <DialogTitle className="flex items-center gap-2">
            <div className={`size-7 rounded-md flex items-center justify-center ${currentTipoCfg.bgClass}`}>
              <currentTipoCfg.icon className={`size-3.5 ${currentTipoCfg.textClass} ${currentTipoCfg.iconAnim}`} />
            </div>
            {editando ? 'Editar Integração' : 'Nova Integração MCP'}
          </DialogTitle>
          <DialogDescription>{editando ? 'Altere os dados da integração' : 'Configure uma nova integração MCP'}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
          {/* Template selector (only for new integrations) */}
          {!editando && (
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 text-xs h-8 border-amber-200 dark:border-amber-800/50 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                onClick={() => setMostrarTemplates(!mostrarTemplates)}
              >
                <LayoutTemplate className="size-3.5" />
                {mostrarTemplates ? 'Fechar Templates' : 'Usar Template'}
                {mostrarTemplates ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              </Button>
              <AnimatePresence>
                {mostrarTemplates && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(TEMPLATES).map(([key, tpl]) => {
                        const TplIcon = tpl.icon
                        return (
                          <button
                            key={key}
                            onClick={() => applyTemplate(key)}
                            className="flex items-center gap-2 p-2.5 rounded-lg border border-dashed border-amber-300/50 dark:border-amber-700/30 bg-amber-50/30 dark:bg-amber-900/10 hover:bg-amber-100/50 dark:hover:bg-amber-900/20 hover:border-amber-400 dark:hover:border-amber-600 transition-all text-left"
                          >
                            <div className={`size-8 rounded-md flex items-center justify-center shrink-0 ${TIPO_CONFIG[tpl.tipo].bgClass}`}>
                              <TplIcon className={`size-4 ${TIPO_CONFIG[tpl.tipo].textClass}`} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-medium truncate">{tpl.nome}</p>
                              <p className="text-[9px] text-muted-foreground line-clamp-1">{tpl.emoji} {TIPO_CONFIG[tpl.tipo].label}</p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Nome */}
          <div className="space-y-1.5">
            <Label className="text-xs">Nome *</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome da integração" className="h-9 text-sm focus-visible:ring-amber-500/30 focus-visible:border-amber-500" />
          </div>

          {/* Tipo */}
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoMCP)} disabled={!!editando}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(TIPO_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-2"><span>{cfg.emoji}</span><span>{cfg.label}</span></span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dynamic form fields */}
          <AnimatePresence mode="wait">
          {tipo === 'n8n' && (
            <div className="space-y-3 p-3 rounded-lg border border-amber-200/50 dark:border-amber-800/30 bg-amber-50/30 dark:bg-amber-900/10">
              <h4 className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5"><Zap className="size-3" /> Configuração n8n</h4>
              <div className="space-y-1.5"><Label className="text-[10px]">Base URL</Label><Input value={n8nBaseUrl} onChange={(e) => setN8nBaseUrl(e.target.value)} placeholder="https://n8n.empresa.com.br" className="h-8 text-xs font-mono focus-visible:ring-amber-500/30 focus-visible:border-amber-500" /></div>
              <div className="space-y-1.5"><Label className="text-[10px]">API Key</Label><Input value={n8nApiKey} onChange={(e) => setN8nApiKey(e.target.value)} placeholder="n8n_api_xxxxx" type="password" className="h-8 text-xs font-mono focus-visible:ring-amber-500/30 focus-visible:border-amber-500" /></div>
              <div className="space-y-1.5"><Label className="text-[10px]">Workflow IDs (separados por vírgula)</Label><Input value={n8nWorkflowIds} onChange={(e) => setN8nWorkflowIds(e.target.value)} placeholder="wf_001, wf_002" className="h-8 text-xs font-mono focus-visible:ring-amber-500/30 focus-visible:border-amber-500" /></div>
            </div>
          )}

          {tipo === 'whatsapp' && (
            <div className="space-y-3 p-3 rounded-lg border border-emerald-200/50 dark:border-emerald-800/30 bg-emerald-50/30 dark:bg-emerald-900/10">
              <h4 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5"><MessageCircle className="size-3" /> Configuração WhatsApp</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1.5"><Label className="text-[10px]">Phone Number ID</Label><Input value={waPhoneNumberId} onChange={(e) => setWaPhoneNumberId(e.target.value)} placeholder="123456789012345" className="h-8 text-xs font-mono focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500" /></div>
                <div className="space-y-1.5"><Label className="text-[10px]">Business Account ID</Label><Input value={waBusinessAccountId} onChange={(e) => setWaBusinessAccountId(e.target.value)} placeholder="BIZ_xxxx" className="h-8 text-xs font-mono focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500" /></div>
              </div>
              <div className="space-y-1.5"><Label className="text-[10px]">Access Token</Label><Input value={waAccessToken} onChange={(e) => setWaAccessToken(e.target.value)} placeholder="EAAxxxxx" type="password" className="h-8 text-xs font-mono focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1.5"><Label className="text-[10px]">Verify Token</Label><Input value={waVerifyToken} onChange={(e) => setWaVerifyToken(e.target.value)} placeholder="my_verify_token" className="h-8 text-xs font-mono focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500" /></div>
                <div className="space-y-1.5"><Label className="text-[10px]">WABA ID</Label><Input value={waWabaId} onChange={(e) => setWaWabaId(e.target.value)} placeholder="WABA_xxxx" className="h-8 text-xs font-mono focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500" /></div>
              </div>
            </div>
          )}

          {tipo === 'telegram' && (
            <div className="space-y-3 p-3 rounded-lg border border-sky-200/50 dark:border-sky-800/30 bg-sky-50/30 dark:bg-sky-900/10">
              <h4 className="text-xs font-semibold text-sky-700 dark:text-sky-400 flex items-center gap-1.5"><Send className="size-3" /> Configuração Telegram</h4>
              <div className="space-y-1.5"><Label className="text-[10px]">Bot Token</Label><Input value={tgBotToken} onChange={(e) => setTgBotToken(e.target.value)} placeholder="7123456789:AAHxxx" type="password" className="h-8 text-xs font-mono focus-visible:ring-sky-500/30 focus-visible:border-sky-500" /></div>
              <div className="space-y-1.5"><Label className="text-[10px]">Chat ID Padrão</Label><Input value={tgChatId} onChange={(e) => setTgChatId(e.target.value)} placeholder="-1001234567890" className="h-8 text-xs font-mono focus-visible:ring-sky-500/30 focus-visible:border-sky-500" /></div>
              <div className="space-y-1.5">
                <Label className="text-[10px]">Atualizações Permitidas</Label>
                <div className="flex flex-wrap gap-2">
                  {tgUpdateOptions.map((opt) => (
                    <label key={opt} className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <Checkbox
                        checked={tgAllowedUpdates.includes(opt)}
                        onCheckedChange={(checked) => {
                          if (checked) { setTgAllowedUpdates([...tgAllowedUpdates, opt]) }
                          else { setTgAllowedUpdates(tgAllowedUpdates.filter(u => u !== opt)) }
                        }}
                      />
                      <span className="text-muted-foreground">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tipo === 'stdio' && (
            <div className="space-y-3 p-3 rounded-lg border border-orange-200/50 dark:border-orange-800/30 bg-orange-50/30 dark:bg-orange-900/10">
              <h4 className="text-xs font-semibold text-orange-700 dark:text-orange-400 flex items-center gap-1.5"><Terminal className="size-3" /> Configuração STDIO</h4>
              <div className="space-y-1.5"><Label className="text-[10px]">Comando *</Label><Input value={stdioCommand} onChange={(e) => setStdioCommand(e.target.value)} placeholder="npx, python, node" className="h-8 text-xs font-mono focus-visible:ring-orange-500/30 focus-visible:border-orange-500" /></div>
              <div className="space-y-1.5"><Label className="text-[10px]">Argumentos (separados por espaço)</Label><Input value={stdioArgs} onChange={(e) => setStdioArgs(e.target.value)} placeholder="-y @modelcontextprotocol/server-memory" className="h-8 text-xs font-mono focus-visible:ring-orange-500/30 focus-visible:border-orange-500" /></div>
            </div>
          )}

          {tipo === 'sse' && (
            <div className="space-y-3 p-3 rounded-lg border border-cyan-200/50 dark:border-cyan-800/30 bg-cyan-50/30 dark:bg-cyan-900/10">
              <h4 className="text-xs font-semibold text-cyan-700 dark:text-cyan-400 flex items-center gap-1.5"><Globe className="size-3" /> Configuração SSE</h4>
              <div className="space-y-1.5"><Label className="text-[10px]">URL do Servidor *</Label><Input value={sseUrl} onChange={(e) => setSseUrl(e.target.value)} placeholder="https://mcp-server.com/sse" className="h-8 text-xs font-mono focus-visible:ring-cyan-500/30 focus-visible:border-cyan-500" /></div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px]">Headers Personalizados</Label>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-cyan-600" onClick={addHeader}><Plus className="size-2.5" /> Adicionar</Button>
                </div>
                {sseHeaders.map((h, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <Input value={h.key} onChange={(e) => updateHeader(idx, 'key', e.target.value)} placeholder="Chave" className="h-7 text-[10px] font-mono flex-1" />
                    <Input value={h.value} onChange={(e) => updateHeader(idx, 'value', e.target.value)} placeholder="Valor" className="h-7 text-[10px] font-mono flex-1" />
                    <Button variant="ghost" size="icon" className="size-6 shrink-0" onClick={() => removeHeader(idx)}><X className="size-3" /></Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          </AnimatePresence>

          {/* Descrição */}
          <div className="space-y-1.5">
            <Label className="text-xs">Descrição</Label>
            <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição opcional da integração" className="h-9 text-sm focus-visible:ring-amber-500/30 focus-visible:border-amber-500" />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label className="text-xs">Tags</Label>
            <div className="flex gap-1.5">
              <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Adicionar tag..." className="h-8 text-xs flex-1 focus-visible:ring-amber-500/30 focus-visible:border-amber-500" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }} />
              <Button variant="outline" size="sm" className="h-8 px-2.5" onClick={addTag}><Plus className="size-3" /></Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {tags.map((t) => (
                  <Badge key={t} variant="outline" className="text-[10px] gap-1 h-5 pr-1">{t}<button onClick={() => removeTag(t)} className="hover:text-destructive transition-colors"><X className="size-2.5" /></button></Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="pt-2 border-t">
          <Button variant="outline" onClick={onFechar} className="h-8">Cancelar</Button>
          <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white h-8 gap-2" onClick={handleSalvar} disabled={!isValid || criar.isPending || atualizar.isPending}>
            {(criar.isPending || atualizar.isPending) && <Loader2 className="size-3.5 animate-spin" />}
            {editando ? 'Salvar' : 'Criar Integração'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ===== Import Dialog =====
function DialogoImportar({
  aberto,
  onFechar,
}: {
  aberto: boolean
  onFechar: () => void
}) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importData, setImportData] = useState<Array<Record<string, unknown>> | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        if (!Array.isArray(data)) {
          setImportError('O arquivo deve conter um array de integrações')
          return
        }
        // Validate structure
        for (const item of data) {
          if (!item.nome || !item.tipo) {
            setImportError('Cada integração deve ter "nome" e "tipo"')
            return
          }
          const tiposValidos = ['n8n', 'whatsapp', 'telegram', 'stdio', 'sse']
          if (!tiposValidos.includes(item.tipo as string)) {
            setImportError(`Tipo inválido: ${item.tipo as string}. Válidos: ${tiposValidos.join(', ')}`)
            return
          }
        }
        setImportData(data)
      } catch {
        setImportError('Arquivo JSON inválido')
      }
    }
    reader.readAsText(file)
  }

  const importar = useMutation({
    mutationFn: async (items: Array<Record<string, unknown>>) => {
      const results = []
      for (const item of items) {
        const res = await fetch('/api/integracoes-mcp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        })
        results.push(await res.json())
      }
      return results
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integracoes-mcp'] })
      toast.success('Integrações importadas com sucesso!')
      setImportData(null)
      setImportError(null)
      onFechar()
    },
    onError: () => toast.error('Erro ao importar integrações'),
  })

  return (
    <Dialog open={aberto} onOpenChange={(o) => { if (!o) { setImportData(null); setImportError(null); onFechar() } }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="size-5 text-amber-600" />
            Importar Integrações
          </DialogTitle>
          <DialogDescription>Selecione um arquivo JSON com as configurações das integrações</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-amber-400 dark:hover:border-amber-600 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="size-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Clique para selecionar um arquivo JSON</p>
            <p className="text-[10px] text-muted-foreground mt-1">Formato esperado: Array de objetos com nome, tipo e config</p>
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileSelect} />
          </div>

          {importError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs">
              <XCircle className="size-4 shrink-0" />
              {importError}
            </div>
          )}

          {importData && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold">{importData.length} integração(ões) encontrada(s):</h4>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                {importData.map((item, idx) => {
                  const tipoCfg = TIPO_CONFIG[item.tipo as TipoMCP]
                  return (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-md border bg-muted/20 text-xs">
                      {tipoCfg && <span>{tipoCfg.emoji}</span>}
                      <span className="font-medium">{item.nome as string}</span>
                      <Badge variant="outline" className="text-[9px] h-4 ml-auto">{item.tipo as string}</Badge>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { setImportData(null); setImportError(null); onFechar() }} className="h-8">Cancelar</Button>
          <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white h-8" onClick={() => importData && importar.mutate(importData)} disabled={!importData || importar.isPending}>
            {importar.isPending ? 'Importando...' : 'Confirmar Importação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ===== Main Component =====
export function ConexoesMCP() {
  const queryClient = useQueryClient()
  const [tabAtiva, setTabAtiva] = useState('todas')
  const [busca, setBusca] = useState('')
  const [dialogoCriar, setDialogoCriar] = useState(false)
  const [editando, setEditando] = useState<IntegracaoMCP | null>(null)
  const [detalhesId, setDetalhesId] = useState<string | null>(null)
  const [deletarId, setDeletarId] = useState<string | null>(null)
  const [templateInicial, setTemplateInicial] = useState<string | null>(null)
  const [dialogoImportar, setDialogoImportar] = useState(false)
  const [confirmarAcao, setConfirmarAcao] = useState<{ titulo: string; descricao: string; onConfirm: () => void } | null>(null)
  const [timelinePage, setTimelinePage] = useState(1)

  // Auto-refresh polling every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['integracoes-mcp'] })
    }, 30000)
    return () => clearInterval(interval)
  }, [queryClient])

  // Fetch integrations
  const { data: integracoes, isLoading } = useQuery<IntegracaoMCP[]>({
    queryKey: ['integracoes-mcp'],
    queryFn: () => fetch('/api/integracoes-mcp').then(r => r.json()),
  })

  // Fetch timeline
  const { data: timelineData, isLoading: timelineLoading } = useQuery({
    queryKey: ['timeline-mcp', timelinePage],
    queryFn: () => fetch(`/api/integracoes-mcp/timeline?page=${timelinePage}&limit=20`).then(r => r.json()),
    enabled: tabAtiva === 'timeline',
  })

  // Mutations
  const deletar = useMutation({
    mutationFn: (id: string) => fetch(`/api/integracoes-mcp/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integracoes-mcp'] })
      toast.success('Integração excluída!')
      setDeletarId(null)
    },
  })

  const conectar = useMutation({
    mutationFn: (id: string) => fetch(`/api/integracoes-mcp/${id}/conectar`, { method: 'POST' }).then(r => r.json()),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['integracoes-mcp'] })
      if (data.conectado || data.conexaoSucesso) {
        toast.success('Conectado com sucesso!', { description: `Duração: ${data.duracao}ms` })
      } else {
        toast.error('Falha na conexão')
      }
    },
  })

  const desconectar = useMutation({
    mutationFn: (id: string) => fetch(`/api/integracoes-mcp/${id}/desconectar`, { method: 'POST' }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integracoes-mcp'] })
      toast.success('Desconectado com sucesso!')
    },
  })

  const toggleAtiva = useMutation({
    mutationFn: ({ id, ativa }: { id: string; ativa: boolean }) =>
      fetch(`/api/integracoes-mcp/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ativa }) }).then(r => r.json()),
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ['integracoes-mcp'] })
      toast.success(vars.ativa ? 'Integração ativada!' : 'Integração desativada!')
    },
  })

  const duplicar = useMutation({
    mutationFn: (id: string) => fetch(`/api/integracoes-mcp/${id}/duplicar`, { method: 'POST' }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integracoes-mcp'] })
      toast.success('Integração duplicada!')
    },
    onError: () => toast.error('Erro ao duplicar integração'),
  })

  const limparLogs = useMutation({
    mutationFn: (id: string) => fetch(`/api/integracoes-mcp/${id}/logs`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['integracoes-mcp'] })
      toast.success(`${data.deletedCount ?? ''} logs removidos!`)
    },
    onError: () => toast.error('Erro ao limpar logs'),
  })

  const seedData = useMutation({
    mutationFn: () => fetch('/api/integracoes-mcp/seed', { method: 'POST' }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integracoes-mcp'] })
      toast.success('Dados de demonstração carregados!')
    },
  })

  // Computed
  const filtradas = useMemo(() => {
    if (!integracoes) return []
    return integracoes.filter((i) => {
      const matchTab = tabAtiva === 'todas' || i.tipo === tabAtiva
      const matchBusca = busca === '' ||
        i.nome.toLowerCase().includes(busca.toLowerCase()) ||
        (i.descricao?.toLowerCase().includes(busca.toLowerCase()) ?? false)
      return matchTab && matchBusca
    })
  }, [integracoes, tabAtiva, busca])

  const stats = useMemo(() => {
    const all = integracoes ?? []
    return {
      total: all.length,
      conectadas: all.filter(i => i.conectado).length,
      ferramentas: all.reduce((acc, i) => acc + (i._count?.ferramentas ?? 0), 0),
      webhooks: all.filter(i => i.webhookUrl && i.ativa).length,
      erros: all.filter(i => i.status === 'erro').length,
    }
  }, [integracoes])

  const tabCounts = useMemo(() => {
    const all = integracoes ?? []
    return {
      todas: all.length,
      n8n: all.filter(i => i.tipo === 'n8n').length,
      whatsapp: all.filter(i => i.tipo === 'whatsapp').length,
      telegram: all.filter(i => i.tipo === 'telegram').length,
      stdio: all.filter(i => i.tipo === 'stdio').length,
      sse: all.filter(i => i.tipo === 'sse').length,
    }
  }, [integracoes])

  const handleEditar = (i: IntegracaoMCP) => {
    setEditando(i)
    setTemplateInicial(null)
    setDialogoCriar(true)
  }

  const handleFecharCriar = () => {
    setDialogoCriar(false)
    setEditando(null)
    setTemplateInicial(null)
  }

  const handleConectarTodos = useCallback(() => {
    const all = integracoes ?? []
    const desconectados = all.filter(i => !i.conectado)
    Promise.all(desconectados.map(i => conectar.mutateAsync(i.id)))
      .then(() => toast.success(`${desconectados.length} integrações conectadas!`))
      .catch(() => toast.error('Erro ao conectar algumas integrações'))
  }, [integracoes, conectar])

  const handleDesconectarTodos = useCallback(() => {
    const all = integracoes ?? []
    const conectados = all.filter(i => i.conectado)
    Promise.all(conectados.map(i => desconectar.mutateAsync(i.id)))
      .then(() => toast.success(`${conectados.length} integrações desconectadas!`))
      .catch(() => toast.error('Erro ao desconectar algumas integrações'))
  }, [integracoes, desconectar])

  // Export all integrations
  const handleExportAll = useCallback(() => {
    const all = integracoes ?? []
    const exportData = all.map((i) => {
      const config = parseJSON<Record<string, unknown>>(i.config, {})
      return {
        nome: i.nome,
        tipo: i.tipo,
        descricao: i.descricao,
        config: maskSensitiveConfig(config),
        tags: parseJSON<string[]>(i.tags, []),
      }
    })
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `aguiatech-integracoes-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`${all.length} integrações exportadas!`)
  }, [integracoes])

  // Export single integration config
  const handleExportSingle = useCallback((id: string) => {
    const i = (integracoes ?? []).find(x => x.id === id)
    if (!i) return
    const config = parseJSON<Record<string, unknown>>(i.config, {})
    const exportData = {
      nome: i.nome,
      tipo: i.tipo,
      descricao: i.descricao,
      config: maskSensitiveConfig(config),
      tags: parseJSON<string[]>(i.tags, []),
    }
    const blob = new Blob([JSON.stringify([exportData], null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `aguiatech-${i.nome.replace(/\s+/g, '-').toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Config de "${i.nome}" exportado!`)
  }, [integracoes])

  // Quick action handler
  const handleQuickAction = useCallback((action: string, id: string) => {
    const i = (integracoes ?? []).find(x => x.id === id)
    switch (action) {
      case 'testar':
        conectar.mutate(id)
        break
      case 'duplicar':
        setConfirmarAcao({
          titulo: 'Duplicar Integração',
          descricao: `Deseja duplicar "${i?.nome ?? ''}"? Uma cópia será criada com o sufixo "(Cópia)".`,
          onConfirm: () => { duplicar.mutate(id); setConfirmarAcao(null) },
        })
        break
      case 'exportar':
        handleExportSingle(id)
        break
      case 'webhook':
        if (i?.webhookUrl) {
          navigator.clipboard.writeText(i.webhookUrl)
          toast.success('Webhook URL copiada!', { description: i.webhookUrl })
        } else {
          toast.info('Esta integração não possui webhook URL')
        }
        break
      case 'limpar-logs':
        setConfirmarAcao({
          titulo: 'Limpar Logs',
          descricao: `Deseja remover todos os logs de "${i?.nome ?? ''}"? Esta ação não pode ser desfeita.`,
          onConfirm: () => { limparLogs.mutate(id); setConfirmarAcao(null) },
        })
        break
    }
  }, [integracoes, conectar, duplicar, limparLogs, handleExportSingle])

  // Stat cards configuration
  const statCards = useMemo(() => [
    { label: 'Total', value: isLoading ? '-' : stats.total, icon: Cable as LucideIcon, gradient: 'from-amber-500 to-orange-500', iconBg: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-600 dark:text-amber-400', glowColor: 'text-amber-500', hoverShadow: 'hover:shadow-amber-500/25' },
    { label: 'Conectadas', value: isLoading ? '-' : stats.conectadas, icon: Wifi as LucideIcon, gradient: 'from-emerald-500 to-teal-500', iconBg: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400', glowColor: 'text-emerald-500', hoverShadow: 'hover:shadow-emerald-500/25' },
    { label: 'Ferramentas', value: isLoading ? '-' : stats.ferramentas, icon: Wrench as LucideIcon, gradient: 'from-sky-500 to-cyan-500', iconBg: 'bg-sky-100 dark:bg-sky-900/30', iconColor: 'text-sky-600 dark:text-sky-400', glowColor: 'text-sky-500', hoverShadow: 'hover:shadow-sky-500/25' },
    { label: 'Webhooks', value: isLoading ? '-' : stats.webhooks, icon: Globe as LucideIcon, gradient: 'from-orange-500 to-amber-500', iconBg: 'bg-orange-100 dark:bg-orange-900/30', iconColor: 'text-orange-600 dark:text-orange-400', glowColor: 'text-orange-500', hoverShadow: 'hover:shadow-orange-500/25' },
    { label: 'Erros', value: isLoading ? '-' : stats.erros, icon: AlertTriangle as LucideIcon, gradient: 'from-red-500 to-orange-500', iconBg: 'bg-red-100 dark:bg-red-900/30', iconColor: 'text-red-600 dark:text-red-400', glowColor: 'text-red-500', hoverShadow: 'hover:shadow-red-500/25' },
  ], [stats, isLoading])

  // Timeline grouping
  const timelineGrouped = useMemo(() => {
    if (!timelineData?.timeline) return []
    const groups: Record<string, TimelineEntry[]> = {}
    for (const entry of timelineData.timeline as TimelineEntry[]) {
      if (!groups[entry.period]) groups[entry.period] = []
      groups[entry.period].push(entry)
    }
    return Object.entries(groups).map(([period, entries]) => ({ period, entries }))
  }, [timelineData])

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-5 text-white dark:from-amber-600 dark:via-orange-600 dark:to-red-600"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-300/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-300/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-red-300/10 rounded-full" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-white/20 flex items-center justify-center shadow-md backdrop-blur-sm">
              <Cable className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Integrações MCP</h1>
              <p className="text-amber-100 text-sm">Conecte n8n, WhatsApp Business, Telegram e servidores MCP</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-amber-100 text-[10px] mr-2">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Atualização automática
            </div>
            <Button variant="outline" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-white/20 h-8 gap-1.5 text-xs backdrop-blur-sm" onClick={() => seedData.mutate()} disabled={seedData.isPending}>
              <Database className="size-3.5" />
              {seedData.isPending ? 'Carregando...' : 'Demo'}
            </Button>
            <Button variant="outline" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-white/20 h-8 gap-1.5 text-xs backdrop-blur-sm" onClick={handleExportAll} disabled={!integracoes?.length}>
              <Download className="size-3.5" />
              Exportar
            </Button>
            <Button variant="outline" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-white/20 h-8 gap-1.5 text-xs backdrop-blur-sm" onClick={() => setDialogoImportar(true)}>
              <Upload className="size-3.5" />
              Importar
            </Button>
            <Button className="bg-white/20 hover:bg-white/30 text-white gap-2 backdrop-blur-sm border border-white/20 h-8 text-xs" onClick={() => { setEditando(null); setTemplateInicial(null); setDialogoCriar(true) }}>
              <Plus className="size-3.5" />
              Nova Integração
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Stats Cards */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {statCards.map((card, idx) => {
            const Icon = card.icon
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * idx, duration: 0.3 }}
                whileHover={{ y: -2, transition: { duration: 0.15 } }}
                className={`relative overflow-hidden rounded-xl border bg-card shadow-sm p-4 ${card.hoverShadow} hover:shadow-lg transition-shadow duration-300 cursor-default group`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-300`} />
                <div className="absolute inset-0 dot-grid animate-dot-grid opacity-50" />
                <div className="relative z-10 flex items-center gap-3">
                  <div className={`size-10 rounded-lg ${card.iconBg} flex items-center justify-center shadow-sm shrink-0`}>
                    <Icon className={`size-5 ${card.iconColor} animate-float`} style={{ animationDelay: `${idx * 0.3}s` }} />
                  </div>
                  <div>
                    <p className={`text-2xl font-bold leading-none stat-number-glow ${card.glowColor}`}>
                      <AnimatedCounter value={card.value} />
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Health Dashboard */}
      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        <PainelSaude integracoes={integracoes} />
      </motion.div>

      {/* Bulk Actions Toolbar */}
      {(integracoes?.length ?? 0) > 0 && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={handleConectarTodos} disabled={conectar.isPending}>
              <Play className="size-3" /> Conectar Todos
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8" onClick={handleDesconectarTodos} disabled={desconectar.isPending}>
              <Square className="size-3" /> Desconectar Todos
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <span className="text-[10px] text-muted-foreground">{integracoes?.length ?? 0} integrações</span>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Tabs value={tabAtiva} onValueChange={setTabAtiva}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <TabsList className="bg-muted/80 h-auto flex-wrap">
              <TabsTrigger value="todas" className="text-xs gap-1 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                <Cable className="size-3" /> Todas
                <Badge variant="secondary" className="text-[9px] h-4 min-w-[1rem] px-1 ml-0.5">{tabCounts.todas}</Badge>
              </TabsTrigger>
              {Object.entries(TIPO_CONFIG).map(([key, cfg]) => (
                <TabsTrigger key={key} value={key} className="text-xs gap-1 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                  <cfg.icon className="size-3" /> {cfg.label}
                  <Badge variant="secondary" className="text-[9px] h-4 min-w-[1rem] px-1 ml-0.5">{tabCounts[key as TipoMCP]}</Badge>
                </TabsTrigger>
              ))}
              <TabsTrigger value="timeline" className="text-xs gap-1 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                <History className="size-3" /> Timeline
              </TabsTrigger>
            </TabsList>

            {tabAtiva !== 'timeline' && (
              <div className="relative w-full sm:w-64 group/search">
                <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground transition-transform duration-200 ${busca ? 'scale-110 text-amber-500' : 'group-focus-within/search:scale-110 group-focus-within/search:text-amber-500'}`} />
                <Input
                  placeholder="Buscar integrações..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="h-8 text-xs pl-8 bg-background border-border/60 focus-visible:ring-amber-500/30 focus-visible:border-amber-500 transition-shadow duration-200"
                />
                {busca && (
                  <button onClick={() => setBusca('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-xs">✕</button>
                )}
              </div>
            )}
          </div>

          {/* Timeline Tab */}
          <TabsContent value="timeline">
            {timelineLoading ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            ) : !timelineData?.timeline?.length ? (
              <Card className="border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <div className="size-20 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center mb-4">
                    <History className="size-10 text-amber-400 dark:text-amber-500" />
                  </div>
                  <p className="font-medium text-foreground">Nenhuma atividade registrada</p>
                  <p className="text-xs mt-1">As atividades aparecerão aqui quando houver logs</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {timelineGrouped.map(({ period, entries }) => (
                  <div key={period}>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Clock className="size-3" /> {period}
                    </h3>
                    <div className="space-y-2">
                      <AnimatePresence>
                        {entries.map((entry) => (
                          <motion.div key={entry.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.15 }}>
                            <ItemTimeline entry={entry} />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}
                {/* Load More */}
                {timelineData?.pagination && timelineData.pagination.page < timelineData.pagination.totalPages && (
                  <div className="flex justify-center pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-xs"
                      onClick={() => setTimelinePage(prev => prev + 1)}
                    >
                      <RefreshCw className="size-3" />
                      Carregar Mais ({timelineData.pagination.total - timelineData.pagination.page * timelineData.pagination.limit} restantes)
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Integration list tabs */}
          {['todas', 'n8n', 'whatsapp', 'telegram', 'stdio', 'sse'].map((tab) => (
            <TabsContent key={tab} value={tab}>
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-3 p-4 rounded-lg border overflow-hidden relative">
                      <div className="absolute inset-0 animate-shimmer" />
                      <div className="relative flex items-center gap-2">
                        <Skeleton className="size-8 rounded-lg" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-8 w-full rounded relative" />
                      <div className="flex gap-2 relative">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                      <Skeleton className="h-6 w-full rounded relative" />
                    </div>
                  ))}
                </div>
              ) : filtradas.length === 0 ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                  {busca ? (
                    <Card className="border-dashed border-2">
                      <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <div className="relative mb-4">
                          <div className="size-20 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                            <Search className="size-10 text-amber-400 dark:text-amber-500" />
                          </div>
                        </div>
                        <p className="font-medium text-foreground">Nenhuma integração encontrada</p>
                        <p className="text-xs mt-1 max-w-xs text-center">Tente ajustar os termos de busca</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border-dashed border-2">
                      <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <div className="relative mb-6">
                          <div className="size-24 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center shadow-inner">
                            <Cable className="size-12 text-amber-400 dark:text-amber-500" />
                          </div>
                          <div className="absolute -bottom-1 -right-1 size-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center border-2 border-background shadow-sm">
                            <Plus className="size-4 text-orange-600 dark:text-orange-400" />
                          </div>
                        </div>
                        <p className="font-semibold text-lg text-foreground">Nenhuma integração configurada</p>
                        <p className="text-sm mt-1 max-w-md text-center">
                          Conecte n8n, WhatsApp Business, Telegram ou servidores MCP para expandir as capacidades do agente
                        </p>

                        {/* Quick-start cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 w-full max-w-lg">
                          {Object.entries(TEMPLATES).slice(0, 3).map(([key, tpl]) => {
                            const TplIcon = tpl.icon
                            const tipoCfg = TIPO_CONFIG[tpl.tipo]
                            return (
                              <div key={key} className="flex flex-col items-center gap-2 p-4 rounded-lg border border-dashed border-amber-200/50 dark:border-amber-800/30 bg-amber-50/30 dark:bg-amber-900/10 hover:shadow-md transition-shadow">
                                <div className={`size-10 rounded-lg ${tipoCfg.bgClass} flex items-center justify-center`}>
                                  <TplIcon className={`size-5 ${tipoCfg.textClass}`} />
                                </div>
                                <span className="text-xs font-medium">{tpl.nome}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1 text-[10px] h-6 border-amber-300 hover:bg-amber-50 dark:border-amber-700 dark:hover:bg-amber-900/20"
                                  onClick={() => { setEditando(null); setTemplateInicial(key); setDialogoCriar(true) }}
                                >
                                  <Plus className="size-2.5" /> Usar Template
                                </Button>
                              </div>
                            )
                          })}
                        </div>

                        <div className="flex gap-2 mt-4">
                          <Button variant="outline" className="gap-2 border-amber-300 hover:bg-amber-50 dark:border-amber-700 dark:hover:bg-amber-900/20" onClick={() => { setEditando(null); setTemplateInicial(null); setDialogoCriar(true) }}>
                            <Plus className="size-4" /> Criar do Zero
                          </Button>
                          <Button variant="outline" className="gap-2 border-amber-300 hover:bg-amber-50 dark:border-amber-700 dark:hover:bg-amber-900/20" onClick={() => seedData.mutate()} disabled={seedData.isPending}>
                            <Database className="size-4" /> Carregar Demo
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AnimatePresence mode="popLayout">
                    {filtradas.map((integracao) => (
                      <CartaoIntegracao
                        key={integracao.id}
                        integracao={integracao}
                        onVerDetalhes={setDetalhesId}
                        onEditar={handleEditar}
                        onDeletar={setDeletarId}
                        onConectar={(id) => conectar.mutate(id)}
                        onDesconectar={(id) => desconectar.mutate(id)}
                        onToggleAtiva={(id, ativa) => toggleAtiva.mutate({ id, ativa })}
                        onQuickAction={handleQuickAction}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>

      {/* Detail Dialog */}
      <DialogoDetalhes integracaoId={detalhesId} aberto={!!detalhesId} onFechar={() => setDetalhesId(null)} />

      {/* Create/Edit Dialog */}
      <DialogoCriarEditar aberto={dialogoCriar} onFechar={handleFecharCriar} editando={editando} templateInicial={templateInicial} />

      {/* Import Dialog */}
      <DialogoImportar aberto={dialogoImportar} onFechar={() => setDialogoImportar(false)} />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletarId} onOpenChange={(o) => !o && setDeletarId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Integração</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. A integração e todos os logs e ferramentas associados serão removidos permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletarId && deletar.mutate(deletarId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Generic Confirmation Dialog */}
      <AlertDialog open={!!confirmarAcao} onOpenChange={(o) => !o && setConfirmarAcao(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmarAcao?.titulo ?? 'Confirmar'}</AlertDialogTitle>
            <AlertDialogDescription>{confirmarAcao?.descricao ?? ''}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmarAcao(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarAcao?.onConfirm}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
