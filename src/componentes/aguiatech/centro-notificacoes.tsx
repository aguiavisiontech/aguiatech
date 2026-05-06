'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Settings,
  X,
  CheckCheck,
  Trash2,
} from 'lucide-react'
import { useEstadoAguiatech, type Notificacao, type TipoNotificacao } from '@/lib/estado'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface GrupoNotificacoes {
  rotulo: string
  notificacoes: Notificacao[]
}

const ICONE_TIPO: Record<TipoNotificacao, React.ElementType> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  system: Settings,
}

const COR_BORDA_TIPO: Record<TipoNotificacao, string> = {
  info: 'border-l-amber-500',
  success: 'border-l-emerald-500',
  warning: 'border-l-yellow-500',
  error: 'border-l-red-500',
  system: 'border-l-slate-400',
}

const COR_ICONE_TIPO: Record<TipoNotificacao, string> = {
  info: 'text-amber-500',
  success: 'text-emerald-500',
  warning: 'text-yellow-500',
  error: 'text-red-500',
  system: 'text-slate-400',
}

const COR_BG_TIPO: Record<TipoNotificacao, string> = {
  info: 'bg-amber-50 dark:bg-amber-900/20',
  success: 'bg-emerald-50 dark:bg-emerald-900/20',
  warning: 'bg-yellow-50 dark:bg-yellow-900/20',
  error: 'bg-red-50 dark:bg-red-900/20',
  system: 'bg-slate-50 dark:bg-slate-800/30',
}

function agruparPorPeriodo(notificacoes: Notificacao[]): GrupoNotificacoes[] {
  const agora = new Date()
  const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
  const inicioOntem = new Date(inicioHoje.getTime() - 86400000)
  const inicioSemana = new Date(inicioHoje.getTime() - 7 * 86400000)

  const grupos: GrupoNotificacoes[] = []
  const hojes: Notificacao[] = []
  const ontems: Notificacao[] = []
  const semanas: Notificacao[] = []
  const antigos: Notificacao[] = []

  for (const n of notificacoes) {
    const data = new Date(n.createdAt)
    if (data >= inicioHoje) {
      hojes.push(n)
    } else if (data >= inicioOntem) {
      ontems.push(n)
    } else if (data >= inicioSemana) {
      semanas.push(n)
    } else {
      antigos.push(n)
    }
  }

  if (hojes.length > 0) grupos.push({ rotulo: 'Hoje', notificacoes: hojes })
  if (ontems.length > 0) grupos.push({ rotulo: 'Ontem', notificacoes: ontems })
  if (semanas.length > 0) grupos.push({ rotulo: 'Esta Semana', notificacoes: semanas })
  if (antigos.length > 0) grupos.push({ rotulo: 'Mais Antigo', notificacoes: antigos })

  return grupos
}

function formatarHora(iso: string): string {
  const data = new Date(iso)
  const agora = new Date()
  const diff = agora.getTime() - data.getTime()
  const minutos = Math.floor(diff / 60000)
  const horas = Math.floor(minutos / 60)

  if (minutos < 1) return 'Agora'
  if (minutos < 60) return `${minutos}min atrás`
  if (horas < 24) return `${horas}h atrás`
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function ItemNotificacao({
  notificacao,
  onMarcarLida,
  onRemover,
}: {
  notificacao: Notificacao
  onMarcarLida: (id: string) => void
  onRemover: (id: string) => void
}) {
  const Icone = ICONE_TIPO[notificacao.tipo]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      transition={{ duration: 0.2 }}
      className={`relative flex items-start gap-3 p-3 rounded-lg border-l-4 cursor-pointer transition-colors duration-150 hover:bg-muted/50 ${COR_BORDA_TIPO[notificacao.tipo]} ${!notificacao.lida ? COR_BG_TIPO[notificacao.tipo] : 'bg-background'}`}
      onClick={() => onMarcarLida(notificacao.id)}
    >
      <div className={`mt-0.5 shrink-0 ${COR_ICONE_TIPO[notificacao.tipo]}`}>
        <Icone className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium leading-tight ${!notificacao.lida ? 'text-foreground' : 'text-muted-foreground'}`}>
            {notificacao.titulo}
          </span>
          {!notificacao.lida && (
            <span className="size-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {notificacao.descricao}
        </p>
        <span className="text-[10px] text-muted-foreground/70 mt-1 block">
          {formatarHora(notificacao.createdAt)}
        </span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onRemover(notificacao.id)
        }}
        className="shrink-0 p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="size-3" />
      </button>
    </motion.div>
  )
}

export function CentroNotificacoes() {
  const {
    notificacoes,
    notificacoesAbertas,
    setNotificacoesAbertas,
    marcarNotificacaoLida,
    marcarTodasLidas,
    limparNotificacoes,
    removerNotificacao,
  } = useEstadoAguiatech()

  const [confirmarLimpar, setConfirmarLimpar] = useState(false)

  const naoLidas = notificacoes.filter((n) => !n.lida)
  const grupos = agruparPorPeriodo(notificacoes)

  const handleOpenChange = (open: boolean) => {
    setNotificacoesAbertas(open)
    if (!open) setConfirmarLimpar(false)
  }

  return (
    <Sheet open={notificacoesAbertas} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 gap-0">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-white">
          <SheetHeader className="p-0 gap-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="size-5" />
                <SheetTitle className="text-white text-lg">Notificações</SheetTitle>
                {naoLidas.length > 0 && (
                  <Badge className="bg-white/20 text-white border-white/30 text-[10px] h-5 px-1.5">
                    {naoLidas.length}
                  </Badge>
                )}
              </div>
            </div>
            <SheetDescription className="text-amber-100 text-xs mt-1">
              {naoLidas.length === 0
                ? 'Você está em dia com suas notificações'
                : `${naoLidas.length} não lida${naoLidas.length > 1 ? 's' : ''}`}
            </SheetDescription>
          </SheetHeader>
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1.5 text-amber-700 dark:text-amber-400 hover:bg-amber-100/50 dark:hover:bg-amber-900/20"
            onClick={() => marcarTodasLidas()}
            disabled={naoLidas.length === 0}
          >
            <CheckCheck className="size-3.5" />
            Marcar todas como lidas
          </Button>
          <div className="ml-auto">
            {confirmarLimpar ? (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-red-600 hover:bg-red-100/50 dark:hover:bg-red-900/20"
                  onClick={() => {
                    limparNotificacoes()
                    setConfirmarLimpar(false)
                  }}
                >
                  Confirmar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => setConfirmarLimpar(false)}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-100/50 dark:hover:bg-red-900/20"
                onClick={() => setConfirmarLimpar(true)}
                disabled={notificacoes.length === 0}
              >
                <Trash2 className="size-3.5" />
                Limpar todas
              </Button>
            )}
          </div>
        </div>

        {/* Notification list */}
        <ScrollArea className="flex-1 h-[calc(100vh-10rem)]">
          <div className="p-4 space-y-4">
            {notificacoes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="size-16 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-4">
                  <Bell className="size-8 text-amber-400" />
                </div>
                <p className="text-sm font-medium text-foreground">Nenhuma notificação</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Suas notificações aparecerão aqui
                </p>
              </div>
            ) : (
              <AnimatePresence>
                {grupos.map((grupo) => (
                  <div key={grupo.rotulo}>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      {grupo.rotulo}
                    </h3>
                    <div className="space-y-2">
                      {grupo.notificacoes.map((n) => (
                        <ItemNotificacao
                          key={n.id}
                          notificacao={n}
                          onMarcarLida={marcarNotificacaoLida}
                          onRemover={removerNotificacao}
                        />
                      ))}
                    </div>
                    {grupo !== grupos[grupos.length - 1] && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

export function BotaoNotificacao() {
  const { notificacoes, setNotificacoesAbertas } = useEstadoAguiatech()
  const naoLidas = notificacoes.filter((n) => !n.lida)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => setNotificacoesAbertas(true)}
          className="relative p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <Bell className="size-4" />
          {naoLidas.length > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center"
            >
              {naoLidas.length > 9 ? '9+' : naoLidas.length}
            </motion.span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <span>Notificações</span>
      </TooltipContent>
    </Tooltip>
  )
}
