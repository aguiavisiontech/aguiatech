'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
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
  },
} as const

type TipoMCP = keyof typeof TIPO_CONFIG

const STATUS_CONFIG = {
  conectado: { label: 'Conectado', cor: 'emerald', pulse: false },
  desconectado: { label: 'Desconectado', cor: 'slate', pulse: false },
  erro: { label: 'Erro', cor: 'red', pulse: false },
  sincronizando: { label: 'Sincronizando', cor: 'yellow', pulse: true },
} as const

// ===== Helpers =====
function parseJSON<T>(str: string | null, fallback: T): T {
  if (!str) return fallback
  try { return JSON.parse(str) } catch { return fallback }
}

function maskToken(token: string): string {
  if (token.length <= 8) return '••••••••'
  return token.substring(0, 6) + '•••••••' + token.substring(token.length - 4)
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

// ===== Integration Card =====
function CartaoIntegracao({
  integracao,
  onVerDetalhes,
  onEditar,
  onDeletar,
  onConectar,
  onDesconectar,
  onToggleAtiva,
}: {
  integracao: IntegracaoMCP
  onVerDetalhes: (id: string) => void
  onEditar: (i: IntegracaoMCP) => void
  onDeletar: (id: string) => void
  onConectar: (id: string) => void
  onDesconectar: (id: string) => void
  onToggleAtiva: (id: string, ativa: boolean) => void
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
      <Card className={`border-l-4 ${tipoCfg.borderClass} hover:shadow-lg transition-all duration-200 ${!integracao.ativa ? 'opacity-60' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${tipoCfg.bgClass}`}>
                <Icon className={`size-4 ${tipoCfg.textClass}`} />
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
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Config details */}
          {renderConfigDetail()}

          {/* Webhook URL */}
          {integracao.webhookUrl && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground text-[10px]">Webhook:</span>
              <code className="bg-muted/80 px-1.5 py-0.5 rounded font-mono text-[10px] text-foreground/80 truncate max-w-[200px]">
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

          {/* Bottom row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              {/* Tool count */}
              <div className="flex items-center gap-1">
                <Wrench className="size-3" />
                <span>{integracao._count?.ferramentas ?? 0} ferramentas</span>
              </div>
              {/* Last sync */}
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-emerald-500 hover:text-red-500"
                      onClick={() => onDesconectar(integracao.id)}
                    >
                      <Wifi className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Desconectar</TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-emerald-500"
                      onClick={() => onConectar(integracao.id)}
                    >
                      <WifiOff className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Conectar</TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-foreground"
                    onClick={() => onVerDetalhes(integracao.id)}
                  >
                    <FileText className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Ver Detalhes</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-amber-600"
                    onClick={() => onEditar(integracao)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Editar</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-destructive"
                    onClick={() => onDeletar(integracao.id)}
                  >
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
            <Switch
              checked={integracao.ativa}
              onCheckedChange={(checked) => onToggleAtiva(integracao.id, checked)}
              className="data-[state=checked]:bg-amber-500 scale-90"
            />
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
      if (data.conexaoSucesso) {
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
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {tipoCfg && (
              <>
                <div className={`size-8 rounded-lg flex items-center justify-center ${tipoCfg.bgClass}`}>
                  <tipoCfg.icon className={`size-4 ${tipoCfg.textClass}`} />
                </div>
                {integracao?.nome ?? 'Detalhes'}
              </>
            )}
          </DialogTitle>
          <DialogDescription>{integracao?.descricao ?? ''}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : integracao ? (
          <div className="flex-1 overflow-auto space-y-4 pr-1">
            {/* Status & Info */}
            <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge status={integracao.status} />
              {integracao.webhookUrl && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground">Webhook:</span>
                  <code className="bg-muted/80 px-1.5 py-0.5 rounded font-mono text-[10px] max-w-[250px] truncate">
                    {integracao.webhookUrl}
                  </code>
                  <CopyButton text={integracao.webhookUrl} />
                </div>
              )}
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs h-7"
                onClick={() => testarConexao.mutate(integracao.id)}
                disabled={testarConexao.isPending}
              >
                <RefreshCw className={`size-3 ${testarConexao.isPending ? 'animate-spin' : ''}`} />
                {testarConexao.isPending ? 'Testando...' : 'Testar Conexão'}
              </Button>
            </div>

            {/* Config */}
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Configuração</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(config).map(([key, value]) => {
                  const isSensitive = key.toLowerCase().includes('token') || key.toLowerCase().includes('key') || key.toLowerCase().includes('secret')
                  const displayValue = isSensitive && typeof value === 'string'
                    ? maskToken(value)
                    : typeof value === 'object'
                      ? JSON.stringify(value)
                      : String(value)
                  return (
                    <div key={key} className="text-xs">
                      <span className="text-muted-foreground">{key}: </span>
                      <code className="font-mono text-[10px] bg-muted px-1 py-0.5 rounded">{displayValue}</code>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Tools */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="size-3" />
                Ferramentas ({ferramentas.length})
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

            {/* Logs */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="size-3" />
                Logs Recentes ({logs.length})
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

            {/* Metadata */}
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

// ===== Create/Edit Dialog =====
function DialogoCriarEditar({
  aberto,
  onFechar,
  editando,
}: {
  aberto: boolean
  onFechar: () => void
  editando: IntegracaoMCP | null
}) {
  const queryClient = useQueryClient()

  // Initialize form state from editando prop
  const initialConfig = editando ? parseJSON<Record<string, unknown>>(editando.config, {}) : {}
  const initialTags = editando ? parseJSON<string[]>(editando.tags, []) : []

  const [tipo, setTipo] = useState<TipoMCP>(editando?.tipo as TipoMCP ?? 'n8n')
  const [nome, setNome] = useState(editando?.nome ?? '')
  const [descricao, setDescricao] = useState(editando?.descricao ?? '')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>(initialTags)

  // n8n fields
  const [n8nBaseUrl, setN8nBaseUrl] = useState(String(initialConfig.baseUrl ?? ''))
  const [n8nApiKey, setN8nApiKey] = useState(String(initialConfig.apiKey ?? ''))
  const [n8nWorkflowIds, setN8nWorkflowIds] = useState(
    Array.isArray(initialConfig.defaultWorkflowIds)
      ? (initialConfig.defaultWorkflowIds as string[]).join(', ')
      : ''
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

  const buildConfig = (): Record<string, unknown> => {
    switch (tipo) {
      case 'n8n':
        return {
          baseUrl: n8nBaseUrl,
          apiKey: n8nApiKey,
          defaultWorkflowIds: n8nWorkflowIds.split(',').map(s => s.trim()).filter(Boolean),
        }
      case 'whatsapp':
        return {
          phoneNumberId: waPhoneNumberId,
          businessAccountId: waBusinessAccountId,
          accessToken: waAccessToken,
          verifyToken: waVerifyToken,
          wabaId: waWabaId,
        }
      case 'telegram':
        return {
          botToken: tgBotToken,
          defaultChatId: tgChatId,
          allowedUpdates: tgAllowedUpdates,
        }
      case 'stdio':
        return { command: stdioCommand, args: stdioArgs }
      case 'sse':
        return {
          url: sseUrl,
          headers: Object.fromEntries(sseHeaders.filter(h => h.key).map(h => [h.key, h.value])),
        }
    }
  }

  const criar = useMutation({
    mutationFn: (dados: Record<string, unknown>) =>
      fetch('/api/integracoes-mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integracoes-mcp'] })
      toast.success('Integração criada com sucesso!')
      onFechar()
    },
    onError: () => toast.error('Erro ao criar integração'),
  })

  const atualizar = useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: Record<string, unknown> }) =>
      fetch(`/api/integracoes-mcp/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integracoes-mcp'] })
      toast.success('Integração atualizada!')
      onFechar()
    },
    onError: () => toast.error('Erro ao atualizar integração'),
  })

  const handleSalvar = () => {
    const dados: Record<string, unknown> = {
      nome,
      tipo,
      descricao: descricao || null,
      config: buildConfig(),
      tags: tags.length > 0 ? tags : null,
    }

    if (editando) {
      atualizar.mutate({ id: editando.id, dados })
    } else {
      criar.mutate(dados)
    }
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) {
      setTags([...tags, t])
      setTagInput('')
    }
  }

  const removeTag = (t: string) => setTags(tags.filter(x => x !== t))

  const addHeader = () => setSseHeaders([...sseHeaders, { key: '', value: '' }])
  const removeHeader = (idx: number) => setSseHeaders(sseHeaders.filter((_, i) => i !== idx))
  const updateHeader = (idx: number, field: 'key' | 'value', val: string) => {
    const updated = [...sseHeaders]
    updated[idx][field] = val
    setSseHeaders(updated)
  }

  const isValid = nome.trim().length > 0

  const tgUpdateOptions = ['message', 'callback_query', 'inline_query', 'channel_post', 'edited_message']

  return (
    <Dialog open={aberto} onOpenChange={(o) => { if (!o) { onFechar() } }}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{editando ? 'Editar Integração' : 'Nova Integração MCP'}</DialogTitle>
          <DialogDescription>
            {editando ? 'Altere os dados da integração' : 'Configure uma nova integração MCP'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
          {/* Nome */}
          <div className="space-y-1.5">
            <Label className="text-xs">Nome *</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome da integração"
              className="h-9 text-sm focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
            />
          </div>

          {/* Tipo */}
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoMCP)} disabled={!!editando}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TIPO_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-2">
                      <span>{cfg.emoji}</span>
                      <span>{cfg.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dynamic form fields */}
          {tipo === 'n8n' && (
            <div className="space-y-3 p-3 rounded-lg border border-amber-200/50 dark:border-amber-800/30 bg-amber-50/30 dark:bg-amber-900/10">
              <h4 className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <Zap className="size-3" /> Configuração n8n
              </h4>
              <div className="space-y-1.5">
                <Label className="text-[10px]">Base URL</Label>
                <Input value={n8nBaseUrl} onChange={(e) => setN8nBaseUrl(e.target.value)} placeholder="https://n8n.empresa.com.br" className="h-8 text-xs font-mono focus-visible:ring-amber-500/30 focus-visible:border-amber-500" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px]">API Key</Label>
                <Input value={n8nApiKey} onChange={(e) => setN8nApiKey(e.target.value)} placeholder="n8n_api_xxxxx" type="password" className="h-8 text-xs font-mono focus-visible:ring-amber-500/30 focus-visible:border-amber-500" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px]">Workflow IDs (separados por vírgula)</Label>
                <Input value={n8nWorkflowIds} onChange={(e) => setN8nWorkflowIds(e.target.value)} placeholder="wf_001, wf_002" className="h-8 text-xs font-mono focus-visible:ring-amber-500/30 focus-visible:border-amber-500" />
              </div>
            </div>
          )}

          {tipo === 'whatsapp' && (
            <div className="space-y-3 p-3 rounded-lg border border-emerald-200/50 dark:border-emerald-800/30 bg-emerald-50/30 dark:bg-emerald-900/10">
              <h4 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <MessageCircle className="size-3" /> Configuração WhatsApp
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[10px]">Phone Number ID</Label>
                  <Input value={waPhoneNumberId} onChange={(e) => setWaPhoneNumberId(e.target.value)} placeholder="123456789012345" className="h-8 text-xs font-mono focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px]">Business Account ID</Label>
                  <Input value={waBusinessAccountId} onChange={(e) => setWaBusinessAccountId(e.target.value)} placeholder="BIZ_xxxx" className="h-8 text-xs font-mono focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px]">Access Token</Label>
                <Input value={waAccessToken} onChange={(e) => setWaAccessToken(e.target.value)} placeholder="EAAxxxxx" type="password" className="h-8 text-xs font-mono focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[10px]">Verify Token</Label>
                  <Input value={waVerifyToken} onChange={(e) => setWaVerifyToken(e.target.value)} placeholder="my_verify_token" className="h-8 text-xs font-mono focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px]">WABA ID</Label>
                  <Input value={waWabaId} onChange={(e) => setWaWabaId(e.target.value)} placeholder="WABA_xxxx" className="h-8 text-xs font-mono focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500" />
                </div>
              </div>
            </div>
          )}

          {tipo === 'telegram' && (
            <div className="space-y-3 p-3 rounded-lg border border-sky-200/50 dark:border-sky-800/30 bg-sky-50/30 dark:bg-sky-900/10">
              <h4 className="text-xs font-semibold text-sky-700 dark:text-sky-400 flex items-center gap-1.5">
                <Send className="size-3" /> Configuração Telegram
              </h4>
              <div className="space-y-1.5">
                <Label className="text-[10px]">Bot Token</Label>
                <Input value={tgBotToken} onChange={(e) => setTgBotToken(e.target.value)} placeholder="7123456789:AAHxxx" type="password" className="h-8 text-xs font-mono focus-visible:ring-sky-500/30 focus-visible:border-sky-500" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px]">Chat ID Padrão</Label>
                <Input value={tgChatId} onChange={(e) => setTgChatId(e.target.value)} placeholder="-1001234567890" className="h-8 text-xs font-mono focus-visible:ring-sky-500/30 focus-visible:border-sky-500" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px]">Atualizações Permitidas</Label>
                <div className="flex flex-wrap gap-2">
                  {tgUpdateOptions.map((opt) => (
                    <label key={opt} className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <Checkbox
                        checked={tgAllowedUpdates.includes(opt)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setTgAllowedUpdates([...tgAllowedUpdates, opt])
                          } else {
                            setTgAllowedUpdates(tgAllowedUpdates.filter(u => u !== opt))
                          }
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
              <h4 className="text-xs font-semibold text-orange-700 dark:text-orange-400 flex items-center gap-1.5">
                <Terminal className="size-3" /> Configuração STDIO
              </h4>
              <div className="space-y-1.5">
                <Label className="text-[10px]">Comando *</Label>
                <Input value={stdioCommand} onChange={(e) => setStdioCommand(e.target.value)} placeholder="npx, python, node" className="h-8 text-xs font-mono focus-visible:ring-orange-500/30 focus-visible:border-orange-500" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px]">Argumentos (separados por espaço)</Label>
                <Input value={stdioArgs} onChange={(e) => setStdioArgs(e.target.value)} placeholder="-y @modelcontextprotocol/server-memory" className="h-8 text-xs font-mono focus-visible:ring-orange-500/30 focus-visible:border-orange-500" />
              </div>
            </div>
          )}

          {tipo === 'sse' && (
            <div className="space-y-3 p-3 rounded-lg border border-cyan-200/50 dark:border-cyan-800/30 bg-cyan-50/30 dark:bg-cyan-900/10">
              <h4 className="text-xs font-semibold text-cyan-700 dark:text-cyan-400 flex items-center gap-1.5">
                <Globe className="size-3" /> Configuração SSE
              </h4>
              <div className="space-y-1.5">
                <Label className="text-[10px]">URL do Servidor *</Label>
                <Input value={sseUrl} onChange={(e) => setSseUrl(e.target.value)} placeholder="https://mcp-server.com/sse" className="h-8 text-xs font-mono focus-visible:ring-cyan-500/30 focus-visible:border-cyan-500" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px]">Headers Personalizados</Label>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-cyan-600" onClick={addHeader}>
                    <Plus className="size-2.5" /> Adicionar
                  </Button>
                </div>
                {sseHeaders.map((h, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <Input value={h.key} onChange={(e) => updateHeader(idx, 'key', e.target.value)} placeholder="Chave" className="h-7 text-[10px] font-mono flex-1" />
                    <Input value={h.value} onChange={(e) => updateHeader(idx, 'value', e.target.value)} placeholder="Valor" className="h-7 text-[10px] font-mono flex-1" />
                    <Button variant="ghost" size="icon" className="size-6 shrink-0" onClick={() => removeHeader(idx)}>
                      <X className="size-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Descrição */}
          <div className="space-y-1.5">
            <Label className="text-xs">Descrição</Label>
            <Input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição opcional da integração"
              className="h-9 text-sm focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label className="text-xs">Tags</Label>
            <div className="flex gap-1.5">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Adicionar tag..."
                className="h-8 text-xs flex-1 focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
              />
              <Button variant="outline" size="sm" className="h-8 px-2.5" onClick={addTag}>
                <Plus className="size-3" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {tags.map((t) => (
                  <Badge key={t} variant="outline" className="text-[10px] gap-1 h-5 pr-1">
                    {t}
                    <button onClick={() => removeTag(t)} className="hover:text-destructive transition-colors">
                      <X className="size-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="pt-2 border-t">
          <Button variant="outline" onClick={onFechar} className="h-8">Cancelar</Button>
          <Button
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white h-8"
            onClick={handleSalvar}
            disabled={!isValid || criar.isPending || atualizar.isPending}
          >
            {editando ? 'Salvar' : 'Criar Integração'}
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
      if (data.conexaoSucesso) {
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
      fetch(`/api/integracoes-mcp/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativa }),
      }).then(r => r.json()),
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ['integracoes-mcp'] })
      toast.success(vars.ativa ? 'Integração ativada!' : 'Integração desativada!')
    },
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

  // Tab counts
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
    setDialogoCriar(true)
  }

  const handleFecharCriar = () => {
    setDialogoCriar(false)
    setEditando(null)
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

  // Stat cards configuration
  const statCards = useMemo(() => [
    {
      label: 'Total',
      value: isLoading ? '-' : stats.total,
      icon: Cable,
      gradient: 'from-amber-500 to-orange-500',
      iconBg: 'bg-amber-100 dark:bg-amber-900/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      label: 'Conectadas',
      value: isLoading ? '-' : stats.conectadas,
      icon: Wifi,
      gradient: 'from-emerald-500 to-teal-500',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Ferramentas',
      value: isLoading ? '-' : stats.ferramentas,
      icon: Wrench,
      gradient: 'from-violet-500 to-purple-500',
      iconBg: 'bg-violet-100 dark:bg-violet-900/30',
      iconColor: 'text-violet-600 dark:text-violet-400',
    },
    {
      label: 'Webhooks',
      value: isLoading ? '-' : stats.webhooks,
      icon: Globe,
      gradient: 'from-rose-500 to-pink-500',
      iconBg: 'bg-rose-100 dark:bg-rose-900/30',
      iconColor: 'text-rose-600 dark:text-rose-400',
    },
    {
      label: 'Erros',
      value: isLoading ? '-' : stats.erros,
      icon: AlertTriangle,
      gradient: 'from-red-500 to-orange-500',
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600 dark:text-red-400',
    },
  ], [stats, isLoading])

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
          <div className="flex items-center gap-2">
            {/* Auto-refresh indicator */}
            <div className="flex items-center gap-1.5 text-amber-100 text-[10px] mr-2">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Atualização automática
            </div>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 h-8 gap-1.5 text-xs backdrop-blur-sm"
              onClick={() => seedData.mutate()}
              disabled={seedData.isPending}
            >
              <Database className="size-3.5" />
              {seedData.isPending ? 'Carregando...' : 'Demo'}
            </Button>
            <Button
              className="bg-white/20 hover:bg-white/30 text-white gap-2 backdrop-blur-sm border border-white/20 h-8 text-xs"
              onClick={() => { setEditando(null); setDialogoCriar(true) }}
            >
              <Plus className="size-3.5" />
              Nova Integração
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {statCards.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.label}
                className="relative overflow-hidden rounded-xl bg-gradient-to-br shadow-sm p-4"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-10`} />
                <div className="relative z-10 flex items-center gap-3">
                  <div className={`size-10 rounded-lg ${card.iconBg} flex items-center justify-center shadow-sm shrink-0`}>
                    <Icon className={`size-5 ${card.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold leading-none">{card.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Bulk Actions Toolbar */}
      {(integracoes?.length ?? 0) > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs h-8"
              onClick={handleConectarTodos}
              disabled={conectar.isPending}
            >
              <Play className="size-3" />
              Conectar Todos
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs h-8"
              onClick={handleDesconectarTodos}
              disabled={desconectar.isPending}
            >
              <Square className="size-3" />
              Desconectar Todos
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <span className="text-[10px] text-muted-foreground">
              {integracoes?.length ?? 0} integrações
            </span>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Tabs value={tabAtiva} onValueChange={setTabAtiva}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <TabsList className="bg-muted/80 h-auto flex-wrap">
              <TabsTrigger value="todas" className="text-xs gap-1 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                <Cable className="size-3" />
                Todas
                <Badge variant="secondary" className="text-[9px] h-4 min-w-[1rem] px-1 ml-0.5">{tabCounts.todas}</Badge>
              </TabsTrigger>
              {Object.entries(TIPO_CONFIG).map(([key, cfg]) => (
                <TabsTrigger key={key} value={key} className="text-xs gap-1 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                  <cfg.icon className="size-3" />
                  {cfg.label}
                  <Badge variant="secondary" className="text-[9px] h-4 min-w-[1rem] px-1 ml-0.5">{tabCounts[key as TipoMCP]}</Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar integrações..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="h-8 text-xs pl-8 bg-background border-border/60 focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
              />
              {busca && (
                <button
                  onClick={() => setBusca('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* All tabs share the same content */}
          {['todas', 'n8n', 'whatsapp', 'telegram', 'stdio', 'sse'].map((tab) => (
            <TabsContent key={tab} value={tab}>
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-3 p-4 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Skeleton className="size-8 rounded-lg" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-8 w-full rounded" />
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                      <Skeleton className="h-6 w-full rounded" />
                    </div>
                  ))}
                </div>
              ) : filtradas.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  {busca ? (
                    <Card className="border-dashed border-2">
                      <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <div className="relative mb-4">
                          <div className="size-20 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                            <Search className="size-10 text-amber-400 dark:text-amber-500" />
                          </div>
                        </div>
                        <p className="font-medium text-foreground">Nenhuma integração encontrada</p>
                        <p className="text-xs mt-1 max-w-xs text-center">
                          Tente ajustar os termos de busca
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border-dashed border-2">
                      <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        {/* Large illustration area */}
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
                          {/* n8n quick-start */}
                          <div className="flex flex-col items-center gap-2 p-4 rounded-lg border border-amber-200/50 dark:border-amber-800/30 bg-amber-50/30 dark:bg-amber-900/10 hover:shadow-md transition-shadow">
                            <div className="size-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                              <Zap className="size-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <span className="text-xs font-medium">n8n</span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-[10px] h-6 border-amber-300 hover:bg-amber-50 dark:border-amber-700 dark:hover:bg-amber-900/20"
                              onClick={() => { setEditando(null); setDialogoCriar(true) }}
                            >
                              <Plus className="size-2.5" />
                              Criar
                            </Button>
                          </div>

                          {/* WhatsApp quick-start */}
                          <div className="flex flex-col items-center gap-2 p-4 rounded-lg border border-emerald-200/50 dark:border-emerald-800/30 bg-emerald-50/30 dark:bg-emerald-900/10 hover:shadow-md transition-shadow">
                            <div className="size-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                              <MessageCircle className="size-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <span className="text-xs font-medium">WhatsApp</span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-[10px] h-6 border-emerald-300 hover:bg-emerald-50 dark:border-emerald-700 dark:hover:bg-emerald-900/20"
                              onClick={() => { setEditando(null); setDialogoCriar(true) }}
                            >
                              <Plus className="size-2.5" />
                              Criar
                            </Button>
                          </div>

                          {/* Telegram quick-start */}
                          <div className="flex flex-col items-center gap-2 p-4 rounded-lg border border-sky-200/50 dark:border-sky-800/30 bg-sky-50/30 dark:bg-sky-900/10 hover:shadow-md transition-shadow">
                            <div className="size-10 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                              <Send className="size-5 text-sky-600 dark:text-sky-400" />
                            </div>
                            <span className="text-xs font-medium">Telegram</span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-[10px] h-6 border-sky-300 hover:bg-sky-50 dark:border-sky-700 dark:hover:bg-sky-900/20"
                              onClick={() => { setEditando(null); setDialogoCriar(true) }}
                            >
                              <Plus className="size-2.5" />
                              Criar
                            </Button>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="outline"
                            className="gap-2 border-amber-300 hover:bg-amber-50 dark:border-amber-700 dark:hover:bg-amber-900/20"
                            onClick={() => seedData.mutate()}
                            disabled={seedData.isPending}
                          >
                            <Database className="size-4" />
                            Carregar Demo
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AnimatePresence mode="popLayout">
                    {filtradas.map((integracao, i) => (
                      <motion.div
                        key={integracao.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: i * 0.04, duration: 0.2 }}
                      >
                        <CartaoIntegracao
                          integracao={integracao}
                          onVerDetalhes={setDetalhesId}
                          onEditar={handleEditar}
                          onDeletar={setDeletarId}
                          onConectar={(id) => conectar.mutate(id)}
                          onDesconectar={(id) => desconectar.mutate(id)}
                          onToggleAtiva={(id, ativa) => toggleAtiva.mutate({ id, ativa })}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>

      {/* Create/Edit Dialog */}
      <DialogoCriarEditar
        key={editando?.id ?? 'nova'}
        aberto={dialogoCriar}
        onFechar={handleFecharCriar}
        editando={editando}
      />

      {/* Detail Dialog */}
      <DialogoDetalhes
        integracaoId={detalhesId}
        aberto={!!detalhesId}
        onFechar={() => setDetalhesId(null)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletarId} onOpenChange={(o) => !o && setDeletarId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir integração?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A integração e todos os seus logs e ferramentas serão permanentemente removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletarId && deletar.mutate(deletarId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
