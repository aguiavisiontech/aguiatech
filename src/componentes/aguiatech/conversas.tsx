'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { formatDistanceToNow, isToday, isYesterday, format, subHours } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  MessageSquare,
  Plus,
  Search,
  Send,
  Trash2,
  Bot,
  User,
  Wrench,
  Loader2,
  ChevronDown,
  Zap,
  Hash,
  Copy,
  Check,
  Cpu,
  Globe,
  Star,
  RefreshCw,
  Paperclip,
  MoreVertical,
  Pencil,
  Download,
  Eraser,
  ListFilter,
  MessageCircle,
  Clock,
  X,
  Sparkles,
  ArrowRight,
  Activity,
  FileCode,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useEstadoAguiatech } from '@/lib/estado'
import { MODELOS_GRATUITOS, obterNomeCurtoModelo } from '@/lib/openrouter'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

interface Conversa {
  id: string
  titulo: string
  plataforma: string
  ativa: boolean
  totalMensagens: number
  totalTokensIn: number
  totalTokensOut: number
  agenteId?: string | null
  agente?: {
    id: string
    nome: string
    avatar: string | null
    cor: string
    personalidade: string
    modelo: string
    provedorModelo: string
    temperatura: number
    maxTokens: number
  } | null
  createdAt: string
  updatedAt: string
  mensagens?: Mensagem[]
}

interface Mensagem {
  id: string
  conversaId: string
  papel: string
  conteudo: string
  ferramenta?: string
  ferramentaArgs?: string
  ferramentaRes?: string
  tokensIn?: number
  tokensOut?: number
  modelo?: string
  tempoResposta?: number
  createdAt: string
}

interface ResultadoBuscaMensagem {
  id: string
  conversaId: string
  conversaTitulo: string
  papel: string
  conteudo: string
  createdAt: string
}

interface AgenteConfig {
  id: string
  nome: string
  modelo: string
  personalidade: string
  [key: string]: unknown
}

interface AgenteSimples {
  id: string
  nome: string
  avatar: string | null
  cor: string
  categoria: string
  personalidade: string
  ativo: boolean
  modelo?: string
  provedorModelo?: string
}

type ModoBusca = 'titulo' | 'mensagens'
type FiltroConversa = 'todas' | 'com-ia' | 'recentes'

// Color classes for agent display
const corClasses: Record<string, { bg: string; text: string; border: string; accent: string }> = {
  amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500', accent: 'bg-amber-200 dark:bg-amber-800/50' },
  emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500', accent: 'bg-emerald-200 dark:bg-emerald-800/50' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500', accent: 'bg-purple-200 dark:bg-purple-800/50' },
  sky: { bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-sky-600 dark:text-sky-400', border: 'border-sky-500', accent: 'bg-sky-200 dark:bg-sky-800/50' },
  cyan: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500', accent: 'bg-cyan-200 dark:bg-cyan-800/50' },
  rose: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500', accent: 'bg-rose-200 dark:bg-rose-800/50' },
  violet: { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-500', accent: 'bg-violet-200 dark:bg-violet-800/50' },
  fuchsia: { bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/30', text: 'text-fuchsia-600 dark:text-fuchsia-400', border: 'border-fuchsia-500', accent: 'bg-fuchsia-200 dark:bg-fuchsia-800/50' },
}

function obterCor(cor: string) {
  return corClasses[cor] || corClasses.amber
}

function obterRotuloData(data: Date): string {
  if (isToday(data)) return 'Hoje'
  if (isYesterday(data)) return 'Ontem'
  return format(data, "dd 'de' MMMM", { locale: ptBR })
}

function obterTempoRelativo(data: Date): string {
  return formatDistanceToNow(data, { addSuffix: true, locale: ptBR })
}

// Animated dots component
function AnimatedDots() {
  return (
    <span className="inline-flex gap-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block size-1 rounded-full bg-amber-500 dark:bg-amber-400"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </span>
  )
}

// Typing effect component
function TypingText({ text, speed = 40 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    setDisplayed('')
    setDone(false)
    let i = 0
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1))
        i++
      } else {
        setDone(true)
        clearInterval(interval)
      }
    }, speed)
    return () => clearInterval(interval)
  }, [text, speed])

  return (
    <span>
      {displayed}
      {!done && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
          className="inline-block w-0.5 h-4 bg-amber-500 dark:bg-amber-400 ml-0.5 align-middle"
        />
      )}
    </span>
  )
}

// Floating particles component
function FloatingParticles() {
  const particles = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 10 + 8,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.15 + 0.05,
    })),
  [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-amber-400 dark:bg-amber-500"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 15, 0],
            opacity: [p.opacity, p.opacity * 1.5, p.opacity],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

export function Conversas() {
  const { conversaAtiva, setConversaAtiva, agenteIdParaConversa, setAgenteIdParaConversa } = useEstadoAguiatech()
  const queryClient = useQueryClient()
  const [busca, setBusca] = useState('')
  const [modoBusca, setModoBusca] = useState<ModoBusca>('titulo')
  const [filtroConversa, setFiltroConversa] = useState<FiltroConversa>('todas')
  const [favoritas, setFavoritas] = useState<Set<string>>(new Set())
  const [mensagemInput, setMensagemInput] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [buscaWebAtiva, setBuscaWebAtiva] = useState(false)
  const [mensagemCopiada, setMensagemCopiada] = useState<string | null>(null)
  const [mensagemDestaque, setMensagemDestaque] = useState<string | null>(null)
  const [renomeando, setRenomeando] = useState(false)
  const [novoTitulo, setNovoTitulo] = useState('')
  const [inputFocado, setInputFocado] = useState(false)
  const [codigoCopiado, setCodigoCopiado] = useState<string | null>(null)
  const mensagensFimRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const renomearInputRef = useRef<HTMLInputElement>(null)

  // Buscar lista de conversas
  const { data: conversas, isLoading: carregandoConversas } = useQuery<Conversa[]>({
    queryKey: ['conversas'],
    queryFn: () => fetch('/api/conversas').then(r => r.json()),
  })

  // Ref para rastrear se já processamos o agenteId
  const agenteIdProcessadoRef = useRef<string | null>(null)
  const [criandoComAgente, setCriandoComAgente] = useState(false)

  // Agente selecionado para nova conversa
  const [agenteSelecionado, setAgenteSelecionado] = useState<string | null>(null)
  const [seletorAgenteAberto, setSeletorAgenteAberto] = useState(false)
  const seletorAgenteRef = useRef<HTMLDivElement>(null)
  const [agenteCriandoId, setAgenteCriandoId] = useState<string | null>(null)

  // Fechar seletor de agente ao clicar fora
  useEffect(() => {
    function handleClickFora(event: MouseEvent) {
      if (seletorAgenteRef.current && !seletorAgenteRef.current.contains(event.target as Node)) {
        setSeletorAgenteAberto(false)
      }
    }
    if (seletorAgenteAberto) {
      document.addEventListener('mousedown', handleClickFora)
      return () => document.removeEventListener('mousedown', handleClickFora)
    }
  }, [seletorAgenteAberto])

  // Buscar lista de agentes ativos
  const { data: agentesDisponiveis } = useQuery<AgenteSimples[]>({
    queryKey: ['agentes-ativos-conversas'],
    queryFn: () => fetch('/api/agentes').then(r => r.json()),
    select: (data) => data.filter(a => a.ativo),
  })

  // Auto-criar conversa com agente quando agenteIdParaConversa é definido
  useEffect(() => {
    if (!agenteIdParaConversa) return
    // Evitar processar o mesmo agenteId duas vezes
    if (agenteIdProcessadoRef.current === agenteIdParaConversa) return
    agenteIdProcessadoRef.current = agenteIdParaConversa
    setCriandoComAgente(true)
    setAgenteSelecionado(agenteIdParaConversa)

    const criarConversaComAgente = async () => {
      try {
        const resposta = await fetch('/api/conversas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agenteId: agenteIdParaConversa }),
        })
        const data = await resposta.json()
        if (data?.id) {
          setConversaAtiva(data.id)
          queryClient.invalidateQueries({ queryKey: ['conversas'] })
          toast.success(`Conversa com ${data.agente?.nome || 'agente'} criada!`)
        } else {
          toast.error('Erro ao criar conversa: resposta inválida')
          console.error('Resposta inválida ao criar conversa:', data)
        }
      } catch (err) {
        console.error('Erro ao criar conversa com agente:', err)
        toast.error('Erro ao criar conversa com agente')
      } finally {
        setAgenteIdParaConversa(null)
        agenteIdProcessadoRef.current = null
        setCriandoComAgente(false)
      }
    }
    criarConversaComAgente()
  }, [agenteIdParaConversa, setConversaAtiva, setAgenteIdParaConversa, queryClient])

  // Buscar mensagens da conversa ativa
  const { data: mensagens, isLoading: carregandoMensagens } = useQuery<Mensagem[]>({
    queryKey: ['conversas', conversaAtiva, 'mensagens'],
    queryFn: () => fetch(`/api/conversas/${conversaAtiva}/mensagens`).then(r => r.json()),
    enabled: !!conversaAtiva,
  })

  // Buscar detalhes da conversa ativa
  const { data: conversaDetalhe } = useQuery<Conversa>({
    queryKey: ['conversas', conversaAtiva],
    queryFn: () => fetch(`/api/conversas/${conversaAtiva}`).then(r => r.json()),
    enabled: !!conversaAtiva,
  })

  // Buscar configuração do agente
  const { data: agenteConfig } = useQuery<AgenteConfig>({
    queryKey: ['config', 'agente'],
    queryFn: () => fetch('/api/config/agente').then(r => r.json()),
  })

  // Busca em mensagens (só quando modo é 'mensagens')
  const { data: resultadosBuscaMensagens } = useQuery<ResultadoBuscaMensagem[]>({
    queryKey: ['busca-mensagens', busca],
    queryFn: () => fetch(`/api/conversas/busca-mensagens?q=${encodeURIComponent(busca)}`).then(r => r.json()),
    enabled: modoBusca === 'mensagens' && busca.length >= 2,
  })

  // Modelo usado na conversa
  const modeloUsado = mensagens?.filter(m => m.modelo).pop()?.modelo
  const modeloAtual = agenteConfig?.modelo || 'z-ai/glm-4.5-air:free'

  // Atualizar modelo do agente
  const atualizarModelo = useMutation({
    mutationFn: (modelo: string) =>
      fetch('/api/config/agente', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelo }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'agente'] })
      toast.success('Modelo atualizado!', { description: 'O novo modelo será usado nas próximas mensagens.' })
    },
  })

  // Criar nova conversa
  const criarConversa = useMutation({
    mutationFn: (agenteId?: string) => fetch('/api/conversas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agenteId ? { agenteId } : {}),
    }).then(r => r.json()),
    onSuccess: (data: Conversa) => {
      setConversaAtiva(data.id)
      queryClient.invalidateQueries({ queryKey: ['conversas'] })
      setAgenteCriandoId(null)
      if (data.agente) {
        toast.success(`Conversa com ${data.agente.nome} criada!`)
      } else {
        toast.success('Nova conversa criada!')
      }
    },
    onError: () => {
      setAgenteCriandoId(null)
      toast.error('Erro ao criar conversa')
    },
  })

  // Deletar conversa
  const deletarConversa = useMutation({
    mutationFn: (id: string) => fetch(`/api/conversas/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      if (conversaAtiva) setConversaAtiva(null)
      queryClient.invalidateQueries({ queryKey: ['conversas'] })
    },
  })

  // Renomear conversa
  const renomearConversa = useMutation({
    mutationFn: ({ id, titulo }: { id: string; titulo: string }) =>
      fetch(`/api/conversas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'renomear', titulo }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversas'] })
      queryClient.invalidateQueries({ queryKey: ['conversas', conversaAtiva] })
      setRenomeando(false)
      toast.success('Conversa renomeada!')
    },
  })

  // Limpar conversa
  const limparConversa = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/conversas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'limpar' }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversas', conversaAtiva, 'mensagens'] })
      queryClient.invalidateQueries({ queryKey: ['conversas'] })
      queryClient.invalidateQueries({ queryKey: ['conversas', conversaAtiva] })
      toast.success('Conversa limpa!', { description: 'Todas as mensagens foram removidas.' })
    },
  })

  // Deletar mensagem
  const deletarMensagem = useMutation({
    mutationFn: ({ conversaId, mensagemId }: { conversaId: string; mensagemId: string }) =>
      fetch(`/api/conversas/${conversaId}/mensagens/${mensagemId}`, { method: 'DELETE' }),
  })

  // Enviar mensagem
  const enviarMensagem = useCallback(async (conteudoOverride?: string) => {
    const textoEnvio = conteudoOverride || mensagemInput.trim()
    if (!textoEnvio || !conversaAtiva || enviando) return

    const conteudo = buscaWebAtiva ? `[BUSCA WEB] ${textoEnvio}` : textoEnvio
    setEnviando(true)
    try {
      await fetch(`/api/conversas/${conversaAtiva}/mensagens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conteudo }),
      })
      setMensagemInput('')
      if (buscaWebAtiva && !conteudoOverride) {
        setBuscaWebAtiva(false)
        toast.success('Busca web realizada!', { description: 'Resultados da web foram incorporados à resposta.' })
      }
      queryClient.invalidateQueries({ queryKey: ['conversas', conversaAtiva, 'mensagens'] })
      queryClient.invalidateQueries({ queryKey: ['conversas'] })
    } catch {
      toast.error('Erro ao enviar mensagem', { description: 'Tente novamente.' })
    } finally {
      setEnviando(false)
    }
  }, [mensagemInput, conversaAtiva, enviando, buscaWebAtiva, queryClient])

  // Regenerar última resposta
  const regenerarResposta = useCallback(async () => {
    if (!mensagens || !conversaAtiva || enviando) return

    // Encontrar a última mensagem do assistente
    const ultimaAssistente = [...mensagens].reverse().find(m => m.papel === 'assistente')
    if (!ultimaAssistente) return

    // Encontrar a última mensagem do usuário antes da do assistente
    const indiceAssistente = mensagens.indexOf(ultimaAssistente)
    const ultimaUsuario = [...mensagens].slice(0, indiceAssistente).reverse().find(m => m.papel === 'usuario')
    if (!ultimaUsuario) return

    // Deletar a última mensagem do assistente
    await deletarMensagem.mutateAsync({ conversaId: conversaAtiva, mensagemId: ultimaAssistente.id })

    // Re-enviar a última mensagem do usuário
    setEnviando(true)
    try {
      await fetch(`/api/conversas/${conversaAtiva}/mensagens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conteudo: ultimaUsuario.conteudo }),
      })
      queryClient.invalidateQueries({ queryKey: ['conversas', conversaAtiva, 'mensagens'] })
      queryClient.invalidateQueries({ queryKey: ['conversas'] })
      toast.success('Resposta regenerada!')
    } catch {
      toast.error('Erro ao regenerar resposta', { description: 'Tente novamente.' })
    } finally {
      setEnviando(false)
    }
  }, [mensagens, conversaAtiva, enviando, queryClient])

  // Exportar conversa como markdown
  const exportarConversa = useCallback(async () => {
    if (!mensagens || !conversaDetalhe) return

    let markdown = `# ${conversaDetalhe.titulo}\n\n`
    markdown += `*Exportado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}*\n\n---\n\n`

    for (const msg of mensagens) {
      const remetente = msg.papel === 'usuario' ? '👤 Você' : `${conversaDetalhe.agente?.avatar ?? '🤖'} ${conversaDetalhe.agente?.nome ?? 'Aguiatech'}`
      const hora = format(new Date(msg.createdAt), 'HH:mm', { locale: ptBR })
      markdown += `### ${remetente} (${hora})\n\n${msg.conteudo}\n\n`
      if (msg.ferramenta) {
        markdown += `> 🔧 Ferramenta: ${msg.ferramenta}\n\n`
      }
      markdown += '---\n\n'
    }

    await navigator.clipboard.writeText(markdown)
    toast.success('Conversa exportada!', { description: 'Markdown copiado para a área de transferência.' })
  }, [mensagens, conversaDetalhe])

  // Copiar mensagem
  const copiarMensagem = useCallback(async (id: string, conteudo: string) => {
    await navigator.clipboard.writeText(conteudo)
    setMensagemCopiada(id)
    setTimeout(() => setMensagemCopiada(null), 2000)
  }, [])

  // Toggle favorita
  const toggleFavorita = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setFavoritas(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // Abrir conversa a partir de busca de mensagem
  const abrirMensagemBusca = useCallback((conversaId: string, mensagemId: string) => {
    setConversaAtiva(conversaId)
    setMensagemDestaque(mensagemId)
    setBusca('')
    setTimeout(() => {
      const el = document.getElementById(`msg-${mensagemId}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.classList.add('ring-2', 'ring-amber-400', 'dark:ring-amber-500')
        setTimeout(() => {
          el.classList.remove('ring-2', 'ring-amber-400', 'dark:ring-amber-500')
          setMensagemDestaque(null)
        }, 3000)
      }
    }, 500)
  }, [setConversaAtiva])

  // Iniciar renomeação
  const iniciarRenomeacao = useCallback(() => {
    if (conversaDetalhe) {
      setNovoTitulo(conversaDetalhe.titulo)
      setRenomeando(true)
      setTimeout(() => renomearInputRef.current?.select(), 100)
    }
  }, [conversaDetalhe])

  // Confirmar renomeação
  const confirmarRenomeacao = useCallback(() => {
    if (conversaAtiva && novoTitulo.trim()) {
      renomearConversa.mutate({ id: conversaAtiva, titulo: novoTitulo.trim() })
    }
  }, [conversaAtiva, novoTitulo, renomearConversa])

  // Auto-scroll
  useEffect(() => {
    mensagensFimRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens, enviando])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const newHeight = Math.min(textarea.scrollHeight, 128)
      textarea.style.height = `${newHeight}px`
    }
  }, [mensagemInput])

  // Copiar código
  const copiarCodigo = useCallback(async (code: string, id: string) => {
    await navigator.clipboard.writeText(code)
    setCodigoCopiado(id)
    setTimeout(() => setCodigoCopiado(null), 2000)
  }, [])

  // Filtrar conversas por título
  const conversasFiltradas = useMemo(() => {
    let lista = conversas?.filter((c) =>
      c.titulo.toLowerCase().includes(busca.toLowerCase())
    ) ?? []

    // Aplicar filtros
    if (filtroConversa === 'com-ia') {
      lista = lista.filter(c => c.totalMensagens > 0)
    } else if (filtroConversa === 'recentes') {
      const limite = subHours(new Date(), 24)
      lista = lista.filter(c => new Date(c.updatedAt) >= limite)
    }

    // Favoritas primeiro
    lista.sort((a, b) => {
      const aFav = favoritas.has(a.id) ? 0 : 1
      const bFav = favoritas.has(b.id) ? 0 : 1
      if (aFav !== bFav) return aFav - bFav
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })

    return lista
  }, [conversas, busca, filtroConversa, favoritas])

  // Agrupar conversas por data
  const conversasAgrupadas = conversasFiltradas.reduce<Record<string, Conversa[]>>((acc, conversa) => {
    const data = new Date(conversa.updatedAt)
    const rotulo = favoritas.has(conversa.id) ? '⭐ Favoritas' : obterRotuloData(data)
    if (!acc[rotulo]) acc[rotulo] = []
    acc[rotulo].push(conversa)
    return acc
  }, {})

  const ordemRotulos = ['⭐ Favoritas', 'Hoje', 'Ontem']

  // Conversas recentes para tela de boas-vindas
  const conversasRecentes = useMemo(() =>
    (conversas ?? [])
      .filter(c => c.totalMensagens > 0)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 3),
  [conversas])

  // Última mensagem do assistente (para regenerar)
  const ultimaMensagemAssistente = mensagens && mensagens.length > 0
    ? [...mensagens].reverse().find(m => m.papel === 'assistente')
    : null
  const isUltimaAssistente = (msg: Mensagem) => ultimaMensagemAssistente?.id === msg.id

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0">
      {/* Painel Esquerdo - Lista de Conversas */}
      <div className="w-72 border-r border-border flex flex-col bg-muted/30 shrink-0">
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">Conversas</h2>
            <div className="flex items-center gap-1">
              {/* Seletor de agente */}
              <div className="relative" ref={seletorAgenteRef}>
                <Button
                  size="sm"
                  variant="outline"
                  className={`h-7 gap-1 text-xs ${agenteSelecionado ? 'border-teal-400 bg-teal-50 text-teal-700 dark:border-teal-600 dark:bg-teal-900/30 dark:text-teal-400' : ''}`}
                  onClick={() => setSeletorAgenteAberto(!seletorAgenteAberto)}
                >
                  {agenteSelecionado ? (
                    <>
                      <span className="text-sm">{agentesDisponiveis?.find(a => a.id === agenteSelecionado)?.avatar ?? '🤖'}</span>
                      <span className="max-w-[60px] truncate">{agentesDisponiveis?.find(a => a.id === agenteSelecionado)?.nome ?? 'Agente'}</span>
                      <X className="size-2.5 ml-0.5" onClick={(e) => { e.stopPropagation(); setAgenteSelecionado(null) }} />
                    </>
                  ) : (
                    <>
                      <Bot className="size-3" />
                      <span>Agente</span>
                    </>
                  )}
                  <ChevronDown className={`size-2.5 transition-transform ${seletorAgenteAberto ? 'rotate-180' : ''}`} />
                </Button>
                {/* Dropdown de agentes */}
                <AnimatePresence>
                  {seletorAgenteAberto && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-1 z-50 w-56 rounded-lg border border-border bg-popover shadow-lg overflow-hidden"
                    >
                      <div className="p-1.5">
                        <button
                          className="w-full text-left px-2.5 py-1.5 rounded-md text-xs hover:bg-muted transition-colors flex items-center gap-2"
                          onClick={() => { setAgenteSelecionado(null); setSeletorAgenteAberto(false) }}
                        >
                          <span className="size-5 rounded bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-xs">💬</span>
                          <span>Sem agente (padrão)</span>
                          {!agenteSelecionado && <Check className="size-3 text-amber-600 ml-auto" />}
                        </button>
                        {agentesDisponiveis?.map((agente) => {
                          const cor = obterCor(agente.cor)
                          return (
                            <Tooltip key={agente.id}>
                              <TooltipTrigger asChild>
                                <button
                                  className="w-full text-left px-2.5 py-1.5 rounded-md text-xs hover:bg-muted transition-colors flex items-center gap-2"
                                  onClick={() => { setAgenteSelecionado(agente.id); setSeletorAgenteAberto(false) }}
                                >
                                  <span className={`size-5 rounded ${cor.bg} flex items-center justify-center text-xs`}>{agente.avatar ?? '🤖'}</span>
                                  <span className="truncate">{agente.nome}</span>
                                  {agenteSelecionado === agente.id && <Check className={`size-3 ${cor.text} ml-auto`} />}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="left" className="text-[10px]">
                                <span className="flex items-center gap-1">
                                  <Cpu className="size-2.5" />
                                  {agente.modelo ? obterNomeCurtoModelo(agente.modelo) : 'Modelo padrão'}
                                </span>
                              </TooltipContent>
                            </Tooltip>
                          )
                        })}
                        {(!agentesDisponiveis || agentesDisponiveis.length === 0) && (
                          <p className="text-[10px] text-muted-foreground text-center py-2">Nenhum agente ativo</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <Button
                size="sm"
                className={`h-7 gap-1 text-white relative ${agenteSelecionado ? 'bg-teal-600 hover:bg-teal-700 shadow-sm shadow-teal-200 dark:shadow-teal-900/50' : 'bg-amber-600 hover:bg-amber-700'}`}
                onClick={() => criarConversa.mutate(agenteSelecionado ?? undefined)}
                disabled={criarConversa.isPending}
              >
                {agenteSelecionado && (
                  <span className="absolute -top-0.5 -left-0.5 size-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
                <Plus className="size-3" />
                Nova
              </Button>
            </div>
          </div>
          {/* Barra de busca com toggle de modo */}
          <div className="flex gap-1">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                placeholder={modoBusca === 'titulo' ? 'Buscar por título...' : 'Buscar nas mensagens...'}
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-8 h-8 text-sm pr-7"
              />
              {busca && (
                <button
                  onClick={() => setBusca('')}
                  className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={`size-8 shrink-0 ${
                    modoBusca === 'mensagens'
                      ? 'bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-400'
                      : ''
                  }`}
                  onClick={() => setModoBusca(modoBusca === 'titulo' ? 'mensagens' : 'titulo')}
                >
                  <MessageCircle className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {modoBusca === 'titulo' ? 'Buscar nas mensagens' : 'Buscar por título'}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-1">
            <ListFilter className="size-3 text-muted-foreground shrink-0" />
            <div className="flex gap-1 overflow-x-auto">
              {([
                { valor: 'todas', rotulo: 'Todas', icone: Hash },
                { valor: 'com-ia', rotulo: 'Com IA', icone: Cpu },
                { valor: 'recentes', rotulo: 'Recentes', icone: Clock },
              ] as const).map((filtro) => (
                <button
                  key={filtro.valor}
                  onClick={() => setFiltroConversa(filtro.valor)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors whitespace-nowrap ${
                    filtroConversa === filtro.valor
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  <filtro.icone className="size-2.5" />
                  {filtro.rotulo}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Resultados de busca em mensagens */}
        {modoBusca === 'mensagens' && busca.length >= 2 && (
          <div className="border-b border-border">
            <ScrollArea className="max-h-48">
              <div className="px-2 pb-2 space-y-1">
                {resultadosBuscaMensagens && resultadosBuscaMensagens.length > 0 ? (
                  <>
                    <p className="text-[10px] text-muted-foreground px-2 py-1">
                      {resultadosBuscaMensagens.length} resultado(s) nas mensagens
                    </p>
                    {resultadosBuscaMensagens.map((resultado) => (
                      <button
                        key={resultado.id}
                        onClick={() => abrirMensagemBusca(resultado.conversaId, resultado.id)}
                        className="w-full text-left p-2 rounded-lg hover:bg-muted/80 transition-colors"
                      >
                        <div className="flex items-center gap-1 mb-0.5">
                          <MessageSquare className="size-2.5 text-muted-foreground" />
                          <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400 truncate">
                            {resultado.conversaTitulo}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2">
                          {resultado.conteudo.substring(0, 100)}
                          {resultado.conteudo.length > 100 ? '...' : ''}
                        </p>
                      </button>
                    ))}
                  </>
                ) : resultadosBuscaMensagens && resultadosBuscaMensagens.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground text-center py-3">
                    Nenhuma mensagem encontrada
                  </p>
                ) : (
                  <div className="flex items-center justify-center py-3">
                    <Loader2 className="size-3 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        <ScrollArea className="flex-1">
          <div className="px-2 pb-2 space-y-1">
            {carregandoConversas ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="mx-2 p-3 rounded-lg">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))
            ) : conversasFiltradas.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                Nenhuma conversa encontrada
              </p>
            ) : (
              Object.entries(conversasAgrupadas)
                .sort(([a], [b]) => {
                  const ia = ordemRotulos.indexOf(a)
                  const ib = ordemRotulos.indexOf(b)
                  if (ia !== -1 && ib !== -1) return ia - ib
                  if (ia !== -1) return -1
                  if (ib !== -1) return 1
                  return 0
                })
                .map(([rotulo, items]) => (
                  <div key={rotulo}>
                    <div className="px-3 py-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {rotulo}
                      </span>
                    </div>
                    {items.map((conversa) => {
                      const agenteCor = conversa.agente ? obterCor(conversa.agente.cor) : null
                      const isActive = conversaAtiva === conversa.id
                      const showUnread = conversa.totalMensagens > 0 && !isActive
                      return (
                      <motion.div
                        key={conversa.id}
                        onClick={() => setConversaAtiva(conversa.id)}
                        whileHover={{ x: 2 }}
                        className={`relative p-3 rounded-lg cursor-pointer transition-all duration-200 group overflow-hidden ${
                          isActive
                            ? agenteCor
                              ? `${agenteCor.accent} border ${agenteCor.border} dark:${agenteCor.border}`
                              : 'bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800'
                            : 'hover:bg-gradient-to-r hover:from-muted/60 hover:to-muted/30'
                        }`}
                      >
                        {/* Animated left border for active */}
                        {isActive && (
                          <motion.div
                            className={`absolute left-0 top-0 bottom-0 w-1 rounded-r ${agenteCor ? agenteCor.border.replace('border-', 'bg-') : 'bg-amber-500'}`}
                            layoutId="activeIndicator"
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          />
                        )}
                        {/* Unread badge */}
                        {showUnread && (
                          <div className="absolute top-2 right-2">
                            <span className="flex size-4 items-center justify-center rounded-full bg-amber-500 text-[8px] font-bold text-white">
                              {conversa.totalMensagens > 99 ? '99+' : conversa.totalMensagens}
                            </span>
                          </div>
                        )}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {conversa.agente && (
                                <span className="text-sm shrink-0">{conversa.agente.avatar ?? '🤖'}</span>
                              )}
                              <p className={`text-sm font-medium truncate ${
                                isActive
                                  ? agenteCor ? agenteCor.text : 'text-amber-900 dark:text-amber-300'
                                  : ''
                              }`}>
                                {conversa.titulo}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {conversa.agente && (
                                <Badge
                                  className={`text-[8px] px-1 py-0 h-4 border-0 gap-0.5 ${agenteCor?.bg} ${agenteCor?.text}`}
                                >
                                  {conversa.agente.nome}
                                </Badge>
                              )}
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <MessageSquare className="size-2.5" />
                                {conversa.totalMensagens}
                              </span>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Zap className="size-2.5" />
                                {conversa.totalTokensIn + conversa.totalTokensOut} tokens
                              </span>
                              {conversa.totalMensagens > 0 && (
                                <Badge
                                  variant="outline"
                                  className="text-[8px] px-1 py-0 h-4 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 gap-0.5"
                                >
                                  <Cpu className="size-2" />
                                  IA
                                </Badge>
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground mt-0.5 block">
                              {obterTempoRelativo(new Date(conversa.updatedAt))}
                            </span>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              onClick={(e) => toggleFavorita(conversa.id, e)}
                              className={`size-5 flex items-center justify-center rounded transition-opacity ${
                                favoritas.has(conversa.id)
                                  ? 'opacity-100 text-amber-500'
                                  : 'opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-amber-500'
                              }`}
                            >
                              <Star className={`size-3 ${favoritas.has(conversa.id) ? 'fill-current' : ''}`} />
                            </button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Trash2 className="size-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir conversa?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. Todas as mensagens serão perdidas.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deletarConversa.mutate(conversa.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </motion.div>
                      )
                    })}
                  </div>
                ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Painel Direito - Conversa Ativa */}
      <div className="flex-1 flex flex-col min-w-0">
        {conversaAtiva && conversaDetalhe ? (
          <>
            {/* Cabeçalho da Conversa */}
            <div className={`px-4 py-3 border-b border-border flex items-center justify-between bg-background/80 backdrop-blur-sm ${conversaDetalhe.agente ? `border-l-4 ${obterCor(conversaDetalhe.agente.cor).border}` : ''}`}>
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {conversaDetalhe.agente ? (
                  <div className={`size-7 rounded-lg ${obterCor(conversaDetalhe.agente.cor).bg} flex items-center justify-center text-base shrink-0`}>
                    {conversaDetalhe.agente.avatar ?? '🤖'}
                  </div>
                ) : (
                  <Bot className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
                )}
                {renomeando ? (
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <Input
                      ref={renomearInputRef}
                      value={novoTitulo}
                      onChange={(e) => setNovoTitulo(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') confirmarRenomeacao()
                        if (e.key === 'Escape') setRenomeando(false)
                      }}
                      className="h-6 text-sm"
                      autoFocus
                    />
                    <Button size="icon" variant="ghost" className="size-6 shrink-0" onClick={confirmarRenomeacao}>
                      <Check className="size-3 text-emerald-500" />
                    </Button>
                    <Button size="icon" variant="ghost" className="size-6 shrink-0" onClick={() => setRenomeando(false)}>
                      <X className="size-3 text-destructive" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="font-medium text-sm truncate">{conversaDetalhe.titulo}</h3>
                    {conversaDetalhe.agente && (
                      <Badge className={`text-[9px] ${obterCor(conversaDetalhe.agente.cor).bg} ${obterCor(conversaDetalhe.agente.cor).text} border-0 gap-0.5 shrink-0`}>
                        {conversaDetalhe.agente.avatar ?? '🤖'} {conversaDetalhe.agente.nome}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {modeloUsado && (
                  <Badge variant="outline" className="text-[10px] gap-1 border-amber-200 dark:border-amber-800">
                    <Cpu className="size-2.5" />
                    {obterNomeCurtoModelo(modeloUsado)}
                  </Badge>
                )}
                <Badge variant="outline" className="text-[10px] gap-1 border-amber-200 dark:border-amber-800">
                  <Zap className="size-2.5" />
                  {conversaDetalhe.totalTokensIn + conversaDetalhe.totalTokensOut} tokens
                </Badge>
                <Badge variant="outline" className="text-[10px] gap-1">
                  <Hash className="size-2.5" />
                  {conversaDetalhe.totalMensagens} msgs
                </Badge>
                {/* Menu dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-7">
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={iniciarRenomeacao}>
                      <Pencil className="size-3.5" />
                      Renomear conversa
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportarConversa}>
                      <Download className="size-3.5" />
                      Exportar conversa
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => limparConversa.mutate(conversaAtiva)}>
                      <Eraser className="size-3.5" />
                      Limpar conversa
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => deletarConversa.mutate(conversaAtiva)}
                    >
                      <Trash2 className="size-3.5" />
                      Excluir conversa
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Mensagens */}
            <ScrollArea className="flex-1 p-4">
              {carregandoMensagens ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="size-6 animate-spin text-amber-600" />
                </div>
              ) : mensagens && mensagens.length > 0 ? (
                <div className="space-y-4 max-w-3xl mx-auto">
                  {mensagens.map((msg, i) => (
                    <div key={msg.id} id={`msg-${msg.id}`}>
                      {/* Separador de tempo */}
                      {(i === 0 || (new Date(msg.createdAt).getTime() - new Date(mensagens[i-1].createdAt).getTime() > 5 * 60 * 1000)) && (
                        <div className="flex items-center gap-2 py-2">
                          <div className="flex-1 h-px bg-border" />
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: ptBR })}
                          </span>
                          <div className="flex-1 h-px bg-border" />
                        </div>
                      )}
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className={`flex gap-3 group/msg ${
                          msg.papel === 'usuario' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {msg.papel !== 'usuario' && (
                          <div className={`size-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm ${
                            conversaDetalhe.agente
                              ? obterCor(conversaDetalhe.agente.cor).bg
                              : 'bg-amber-100 dark:bg-amber-900/30'
                          }`}>
                            {conversaDetalhe.agente ? (
                              <span className="text-sm">{conversaDetalhe.agente.avatar ?? '🤖'}</span>
                            ) : (
                              <Bot className="size-4 text-amber-600 dark:text-amber-400" />
                            )}
                          </div>
                        )}

                        <div className={`max-w-[75%] relative ${msg.papel === 'usuario' ? 'order-first' : ''}`}>
                          {/* Conteúdo da Mensagem */}
                          <div
                            className={`rounded-2xl px-4 py-3 transition-all duration-150 ${
                              msg.papel === 'usuario'
                                ? 'bg-gradient-to-br from-amber-500 via-amber-600 to-teal-600 text-white rounded-br-sm shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30'
                                : 'bg-background border border-border/60 rounded-bl-sm shadow-sm hover:shadow-md'
                            }`}
                          >
                            {msg.papel === 'usuario' ? (
                              <p className="text-sm whitespace-pre-wrap">{msg.conteudo}</p>
                            ) : (
                              <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                                <ReactMarkdown
                                  components={{
                                    code({ className, children, ...props }) {
                                      const match = /language-(\w+)/.exec(className || '')
                                      const inline = !match
                                      const codeId = `code-${msg.id}-${String(children).substring(0, 10).replace(/\s/g, '')}`
                                      return inline ? (
                                        <code className="bg-muted-foreground/10 px-1.5 py-0.5 rounded text-xs" {...props}>
                                          {children}
                                        </code>
                                      ) : (
                                        <div className="relative my-2 rounded-lg overflow-hidden border border-border/50">
                                          <div className="flex items-center justify-between bg-zinc-900 dark:bg-zinc-950 px-3 py-1.5">
                                            <div className="flex items-center gap-1.5">
                                              <FileCode className="size-3 text-muted-foreground" />
                                              <span className="text-[10px] text-muted-foreground font-mono">
                                                {match[1]}
                                              </span>
                                            </div>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-5 px-1.5 text-[10px] gap-1 text-muted-foreground hover:text-foreground"
                                              onClick={() => copiarCodigo(String(children).replace(/\n$/, ''), codeId)}
                                            >
                                              {codigoCopiado === codeId ? (
                                                <>
                                                  <Check className="size-2.5 text-emerald-400" />
                                                  <span className="text-emerald-400">Copiado!</span>
                                                </>
                                              ) : (
                                                <>
                                                  <Copy className="size-2.5" />
                                                  Copiar
                                                </>
                                              )}
                                            </Button>
                                          </div>
                                          <SyntaxHighlighter
                                            style={oneDark}
                                            language={match[1]}
                                            PreTag="div"
                                            className="!rounded-none !text-xs !leading-relaxed !m-0"
                                          >
                                            {String(children).replace(/\n$/, '')}
                                          </SyntaxHighlighter>
                                        </div>
                                      )
                                    },
                                  }}
                                >
                                  {msg.conteudo}
                                </ReactMarkdown>
                              </div>
                            )}
                          </div>

                          {/* Botões de ação para mensagens do assistente */}
                          {msg.papel !== 'usuario' && (
                            <div className="absolute -right-1 top-1 opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center gap-0.5">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7 bg-background border border-border shadow-sm hover:bg-muted"
                                    onClick={() => copiarMensagem(msg.id, msg.conteudo)}
                                  >
                                    {mensagemCopiada === msg.id ? (
                                      <Check className="size-3 text-emerald-500" />
                                    ) : (
                                      <Copy className="size-3 text-muted-foreground" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="left">
                                  {mensagemCopiada === msg.id ? 'Copiado!' : 'Copiar mensagem'}
                                </TooltipContent>
                              </Tooltip>
                              {/* Botão regenerar - só na última mensagem do assistente */}
                              {isUltimaAssistente(msg) && !enviando && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-7 bg-background border border-border shadow-sm hover:bg-muted"
                                      onClick={regenerarResposta}
                                      disabled={enviando}
                                    >
                                      <RefreshCw className="size-3 text-muted-foreground" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="left">
                                    Regenerar resposta
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          )}

                          {/* Chamada de Ferramenta */}
                          {msg.ferramenta && (
                            <Card className={`mt-2 ${
                              msg.ferramenta === 'busca-web'
                                ? 'border-sky-200 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-900/10'
                                : 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10'
                            }`}>
                              <CardContent className="p-3">
                                <div className={`flex items-center gap-2 text-xs font-medium ${
                                  msg.ferramenta === 'busca-web'
                                    ? 'text-sky-700 dark:text-sky-400'
                                    : 'text-amber-700 dark:text-amber-400'
                                }`}>
                                  {msg.ferramenta === 'busca-web' ? (
                                    <>
                                      <Globe className="size-3" />
                                      Busca Web
                                      <Badge className="text-[8px] bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 border-0 ml-1">
                                        Fonte: Web
                                      </Badge>
                                    </>
                                  ) : (
                                    <>
                                      <Wrench className="size-3" />
                                      Ferramenta: {msg.ferramenta}
                                    </>
                                  )}
                                </div>
                                {msg.ferramentaArgs && (
                                  <details className="mt-2">
                                    <summary className="text-[10px] text-muted-foreground cursor-pointer flex items-center gap-1">
                                      <ChevronDown className="size-2.5" />
                                      Argumentos
                                    </summary>
                                    <pre className="mt-1 text-[10px] bg-muted p-2 rounded overflow-x-auto">
                                      {(() => {
                                        try {
                                          return JSON.stringify(JSON.parse(msg.ferramentaArgs), null, 2)
                                        } catch {
                                          return msg.ferramentaArgs
                                        }
                                      })()}
                                    </pre>
                                  </details>
                                )}
                                {msg.ferramentaRes && (
                                  <details className="mt-1">
                                    <summary className="text-[10px] text-muted-foreground cursor-pointer flex items-center gap-1">
                                      <ChevronDown className="size-2.5" />
                                      Resultado
                                    </summary>
                                    <pre className="mt-1 text-[10px] bg-muted p-2 rounded overflow-x-auto max-h-40 overflow-y-auto">
                                      {msg.ferramentaRes}
                                    </pre>
                                  </details>
                                )}
                              </CardContent>
                            </Card>
                          )}

                          {/* Metadados */}
                          {msg.papel !== 'usuario' && (msg.tokensIn || msg.tempoResposta) && (
                            <div className="flex items-center gap-3 mt-1 px-1">
                              {msg.tokensIn && (
                                <span className="text-[10px] text-muted-foreground">
                                  {msg.tokensIn}+{msg.tokensOut ?? 0} tokens
                                </span>
                              )}
                              {msg.tempoResposta && (
                                <span className="text-[10px] text-muted-foreground">
                                  {msg.tempoResposta.toFixed(1)}s
                                </span>
                              )}
                            </div>
                          )}

                          {/* Timestamp */}
                          <span className="text-[10px] text-muted-foreground mt-1 px-1 block">
                            {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: ptBR })}
                          </span>
                        </div>

                        {msg.papel === 'usuario' && (
                          <div className="size-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shrink-0 mt-1">
                            <User className="size-4 text-white" />
                          </div>
                        )}
                      </motion.div>
                    </div>
                  ))}

                  {/* Typing indicator - melhorado */}
                  {enviando && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3 justify-start"
                    >
                      <motion.div
                        className={`size-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                          conversaDetalhe.agente
                            ? obterCor(conversaDetalhe.agente.cor).bg
                            : 'bg-amber-100 dark:bg-amber-900/30'
                        }`}
                        animate={{ scale: [1, 1.08, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        {conversaDetalhe.agente ? (
                          <span className="text-sm">{conversaDetalhe.agente.avatar ?? '🤖'}</span>
                        ) : (
                          <Bot className="size-4 text-amber-600 dark:text-amber-400" />
                        )}
                      </motion.div>
                      <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                            {conversaDetalhe.agente
                              ? `${conversaDetalhe.agente.nome} está pensando`
                              : 'Aguiatech está pensando'
                            }
                            <AnimatedDots />
                          </span>
                          <div className={`w-20 h-0.5 rounded-full overflow-hidden ${
                            conversaDetalhe.agente
                              ? obterCor(conversaDetalhe.agente.cor).accent
                              : 'bg-amber-200/50 dark:bg-amber-800/50'
                          }`}>
                            <motion.div
                              className={`h-full rounded-full ${
                                conversaDetalhe.agente
                                  ? obterCor(conversaDetalhe.agente.cor).text.replace('text-', 'bg-').replace(/dark:.*/, '')
                                  : 'bg-amber-500/60 dark:bg-amber-400/60'
                              }`}
                              initial={{ width: '0%' }}
                              animate={{ width: '100%' }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'easeInOut',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={mensagensFimRef} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  {conversaDetalhe.agente ? (
                    <>
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="relative mb-4"
                      >
                        <motion.div
                          animate={{ y: [0, -6, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                          className={`size-20 rounded-2xl ${obterCor(conversaDetalhe.agente.cor).bg} flex items-center justify-center text-4xl shadow-lg`}
                        >
                          {conversaDetalhe.agente.avatar ?? '🤖'}
                        </motion.div>
                        <motion.div
                          className="absolute -bottom-1 -right-1 size-5 bg-emerald-500 rounded-full border-2 border-background"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      </motion.div>
                      <p className="text-base font-semibold text-foreground">{conversaDetalhe.agente.nome}</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-xs text-center leading-relaxed">
                        {conversaDetalhe.agente.personalidade?.substring(0, 120)}{conversaDetalhe.agente.personalidade?.length > 120 ? '...' : ''}
                      </p>
                      <p className="text-sm mt-4 flex items-center gap-1.5 text-foreground/70">
                        <MessageCircle className="size-4" />
                        Envie uma mensagem para começar!
                      </p>
                      {/* Suggestion chips */}
                      <div className="flex flex-wrap gap-2 mt-4 max-w-sm justify-center">
                        {[
                          { texto: 'Olá, como você pode me ajudar?', icone: '👋' },
                          { texto: 'Me conte sobre suas habilidades', icone: '⚡' },
                          { texto: 'Qual é a melhor forma de usar você?', icone: '🎯' },
                        ].map((sugestao, idx) => (
                          <motion.button
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + idx * 0.1 }}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => {
                              setMensagemInput(sugestao.texto)
                              textareaRef.current?.focus()
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-border/60 bg-background hover:bg-muted/80 hover:border-amber-300 dark:hover:border-amber-700 transition-all text-xs text-foreground/80 shadow-sm"
                          >
                            <span>{sugestao.icone}</span>
                            {sugestao.texto}
                          </motion.button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <Bot className="size-12 mb-3 text-amber-600/50 dark:text-amber-400/50" />
                      <p className="text-sm">Nenhuma mensagem ainda</p>
                      <p className="text-xs mt-1 flex items-center gap-1">
                        <MessageCircle className="size-3" />
                        Envie uma mensagem para começar!
                      </p>
                    </>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input de Mensagem */}
            <div className="p-4 border-t border-border bg-background/80 backdrop-blur-sm">
              <div className="max-w-3xl mx-auto">
                {/* Seletor de modelo */}
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    variant="outline"
                    className="text-[10px] gap-1 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
                  >
                    <Cpu className="size-2.5" />
                    Modelo: {obterNomeCurtoModelo(modeloAtual)}
                  </Badge>
                  <Select
                    value={modeloAtual}
                    onValueChange={(valor) => atualizarModelo.mutate(valor)}
                  >
                    <SelectTrigger
                      size="sm"
                      className="h-6 text-[10px] gap-1 border-amber-200 dark:border-amber-800 w-auto"
                    >
                      <SelectValue placeholder="Trocar modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      {MODELOS_GRATUITOS.map((modelo) => (
                        <SelectItem key={modelo.id} value={modelo.id} className="text-xs">
                          {modelo.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Área de input */}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    {buscaWebAtiva && (
                      <div className="absolute -top-0.5 left-0 right-0 -translate-y-full mb-1">
                        <Badge className="text-[10px] gap-1 bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400 border-sky-200 dark:border-sky-800">
                          <Globe className="size-2.5" />
                          Busca Web ativada — a mensagem será pesquisada na internet
                        </Badge>
                      </div>
                    )}
                    <div className="flex items-end gap-1">
                      {/* Botão Anexar arquivo (placeholder) */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-9 shrink-0 text-muted-foreground hover:text-foreground"
                            onClick={() => toast.info('Em breve!', { description: 'O anexo de arquivo estará disponível em breve.' })}
                          >
                            <Paperclip className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          Anexar arquivo
                        </TooltipContent>
                      </Tooltip>
                      <div className="flex-1 relative">
                        <Textarea
                          ref={textareaRef}
                          placeholder={buscaWebAtiva ? "O que deseja pesquisar na web?..." : "Digite sua mensagem..."}
                          value={mensagemInput}
                          onChange={(e) => setMensagemInput(e.target.value)}
                          onFocus={() => setInputFocado(true)}
                          onBlur={() => setInputFocado(false)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              enviarMensagem()
                            }
                          }}
                          className={`min-h-[44px] max-h-32 resize-none transition-all duration-200 flex-1 ${
                            buscaWebAtiva
                              ? 'focus-visible:ring-sky-500/30 focus-visible:border-sky-500 focus-visible:shadow-[0_0_8px_rgba(14,165,233,0.15)] border-sky-300 dark:border-sky-700'
                              : 'focus-visible:ring-amber-500/30 focus-visible:border-amber-500 focus-visible:shadow-[0_0_8px_rgba(245,158,11,0.15)]'
                          }`}
                          rows={1}
                        />
                        {/* Character count */}
                        {mensagemInput.length > 0 && (
                          <span className={`absolute bottom-1 right-2 text-[9px] ${
                            mensagemInput.length > 3000 ? 'text-red-500' : 'text-muted-foreground/50'
                          }`}>
                            {mensagemInput.length}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Keyboard shortcut hint */}
                    <AnimatePresence>
                      {inputFocado && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          transition={{ duration: 0.15 }}
                          className="flex items-center gap-3 mt-1.5 ml-10"
                        >
                          <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                            <kbd className="px-1 py-0.5 rounded bg-muted text-[9px] font-mono">Enter</kbd>
                            enviar
                          </span>
                          <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                            <kbd className="px-1 py-0.5 rounded bg-muted text-[9px] font-mono">Shift+Enter</kbd>
                            nova linha
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setBuscaWebAtiva(!buscaWebAtiva)}
                          className={buscaWebAtiva
                            ? 'bg-sky-100 border-sky-300 text-sky-700 hover:bg-sky-200 dark:bg-sky-900/30 dark:border-sky-700 dark:text-sky-400 dark:hover:bg-sky-900/50'
                            : 'hover:bg-amber-50 hover:border-amber-300 dark:hover:bg-amber-900/20 dark:hover:border-amber-700'
                          }
                        >
                          <Globe className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        {buscaWebAtiva ? 'Desativar busca web' : 'Buscar na Web'}
                      </TooltipContent>
                    </Tooltip>
                    <motion.div whileTap={{ scale: 0.9 }}>
                      <Button
                        onClick={() => enviarMensagem()}
                        disabled={!mensagemInput.trim() || enviando}
                        className={buscaWebAtiva
                          ? 'bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white shadow-md shadow-sky-500/20'
                          : 'bg-gradient-to-r from-amber-500 via-amber-600 to-teal-600 hover:from-amber-600 hover:via-amber-700 hover:to-teal-700 text-white shadow-md shadow-amber-500/20'
                        }
                        size="icon"
                      >
                        {enviando ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Send className="size-4" />
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : criandoComAgente ? (
          /* Criando conversa com agente */
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className="size-10 text-teal-600 dark:text-teal-400" />
            </motion.div>
            <p className="text-sm font-medium text-teal-700 dark:text-teal-400">Criando conversa com o agente...</p>
            <p className="text-xs text-muted-foreground">Aguarde enquanto preparamos tudo</p>
          </div>
        ) : (
          /* Nenhuma conversa selecionada - Tela de boas-vindas */
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-6 p-8 relative overflow-hidden">
            {/* Fundo animado com gradiente e partículas */}
            <div className="absolute inset-0 -z-10">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/80 via-transparent to-orange-50/80 dark:from-amber-950/20 dark:via-transparent dark:to-orange-950/20" />
              <motion.div
                className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-amber-200/20 dark:bg-amber-800/10 blur-3xl"
                animate={{
                  x: [0, 50, 0],
                  y: [0, 30, 0],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <motion.div
                className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full bg-orange-200/20 dark:bg-orange-800/10 blur-3xl"
                animate={{
                  x: [0, -40, 0],
                  y: [0, -20, 0],
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <motion.div
                className="absolute top-1/3 right-1/4 w-1/3 h-1/3 rounded-full bg-teal-200/10 dark:bg-teal-800/5 blur-3xl"
                animate={{
                  x: [0, -30, 0],
                  y: [0, 20, 0],
                }}
                transition={{
                  duration: 12,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <FloatingParticles />
            </div>

            {/* Avatar do agente selecionado ou padrão */}
            <div className="relative">
              {agenteSelecionado && agentesDisponiveis?.find(a => a.id === agenteSelecionado) ? (
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className={`size-24 rounded-full ${obterCor(agentesDisponiveis.find(a => a.id === agenteSelecionado)!.cor).bg} flex items-center justify-center shadow-xl ring-4 ring-white/20 dark:ring-white/10`}
                >
                  <span className="text-5xl">{agentesDisponiveis.find(a => a.id === agenteSelecionado)!.avatar ?? '🤖'}</span>
                </motion.div>
              ) : (
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="size-24 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/20 flex items-center justify-center shadow-xl ring-4 ring-white/20 dark:ring-white/10"
                >
                  <Bot className="size-12 text-amber-600 dark:text-amber-400" />
                </motion.div>
              )}
              <div className="absolute -bottom-1 -right-1 size-5 bg-emerald-500 rounded-full border-2 border-background" />
            </div>
            <div className="text-center">
              {agenteSelecionado && agentesDisponiveis?.find(a => a.id === agenteSelecionado) ? (
                <>
                  <h3 className="text-2xl font-bold text-foreground">
                    Olá! Sou o {agentesDisponiveis.find(a => a.id === agenteSelecionado)!.nome} {agentesDisponiveis.find(a => a.id === agenteSelecionado)!.avatar ?? '🤖'}
                  </h3>
                  <div className="text-sm mt-2 max-w-md">
                    <TypingText
                      text={agentesDisponiveis.find(a => a.id === agenteSelecionado)!.personalidade?.substring(0, 120) + (agentesDisponiveis.find(a => a.id === agenteSelecionado)!.personalidade?.length > 120 ? '...' : '')}
                      speed={25}
                    />
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-foreground">Olá! Sou o Aguiatech 🦅</h3>
                  <div className="text-sm mt-2 max-w-md">
                    <TypingText
                      text="O Agente de IA que Cresce com Você. Posso ajudar com diversas tarefas!"
                      speed={25}
                    />
                  </div>
                </>
              )}
              <p className="text-xs mt-1 text-muted-foreground">
                💡 Selecione um agente no menu acima e clique "Nova" para conversar com ele!
              </p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <Badge
                  variant="outline"
                  className="text-[10px] gap-1 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
                >
                  <Cpu className="size-2.5" />
                  Modelo: {obterNomeCurtoModelo(modeloAtual)}
                </Badge>
                {conversas && conversas.length > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] gap-1 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                  >
                    <MessageSquare className="size-2.5" />
                    {conversas.length} conversa{conversas.length !== 1 ? 's' : ''}
                  </Badge>
                )}
                {conversas && conversas.some(c => {
                  const updated = new Date(c.updatedAt)
                  return isToday(updated) && c.totalMensagens > 0
                }) && (
                  <Badge
                    variant="outline"
                    className="text-[10px] gap-1 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400"
                  >
                    <Activity className="size-2.5" />
                    Ativo hoje
                  </Badge>
                )}
              </div>
            </div>

            {/* Agentes disponíveis */}
            {agentesDisponiveis && agentesDisponiveis.length > 0 && (
              <div className="max-w-lg w-full">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 text-center">
                  Conversar com um agente
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {agentesDisponiveis.map((agente) => {
                    const cor = obterCor(agente.cor)
                    const isSelected = agenteSelecionado === agente.id
                    const isCreating = agenteCriandoId === agente.id
                    return (
                      <motion.button
                        key={agente.id}
                        whileHover={{ scale: 1.04, y: -2 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => {
                          setAgenteCriandoId(agente.id)
                          criarConversa.mutate(agente.id)
                        }}
                        disabled={criarConversa.isPending}
                        className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all overflow-hidden group ${
                          isCreating
                            ? 'opacity-70 pointer-events-none'
                            : isSelected
                              ? `${cor.bg} ${cor.border} border-2 shadow-lg`
                              : 'border-border/50 bg-gradient-to-b from-background to-muted/30 hover:border-amber-300/50 dark:hover:border-amber-700/50 hover:shadow-lg'
                        }`}
                      >
                        {isCreating && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-10">
                            <Loader2 className="size-5 animate-spin text-amber-600" />
                          </div>
                        )}
                        <span className={`size-12 rounded-xl ${cor.bg} flex items-center justify-center text-2xl shrink-0 transition-transform group-hover:scale-110 shadow-sm`}>
                          {agente.avatar ?? '🤖'}
                        </span>
                        <div className="text-center min-w-0">
                          <p className={`text-sm font-medium truncate ${isSelected ? cor.text : 'text-foreground'}`}>{agente.nome}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{agente.categoria}</p>
                        </div>
                        <span className={`flex items-center gap-1 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0 ${cor.text}`}>
                          Chat <ArrowRight className="size-2.5" />
                        </span>
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Comece agora CTA */}
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Button
                size="lg"
                className={`gap-2 text-base px-10 py-6 shadow-xl transition-all rounded-xl ${
                  agenteSelecionado
                    ? 'bg-gradient-to-r from-teal-500 to-teal-700 hover:from-teal-600 hover:to-teal-800 shadow-teal-200/50 dark:shadow-teal-900/50'
                    : 'bg-gradient-to-r from-amber-500 via-amber-600 to-teal-600 hover:from-amber-600 hover:via-amber-700 hover:to-teal-700 shadow-amber-200/50 dark:shadow-amber-900/50'
                } text-white`}
                onClick={() => criarConversa.mutate(agenteSelecionado ?? undefined)}
                disabled={criarConversa.isPending}
              >
                {criarConversa.isPending ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <Sparkles className="size-5" />
                )}
                Comece agora
                {agenteSelecionado && agentesDisponiveis?.find(a => a.id === agenteSelecionado) && (
                  <span className="text-xs opacity-80">com {agentesDisponiveis.find(a => a.id === agenteSelecionado)!.nome}</span>
                )}
              </Button>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md w-full">
              {[
                { texto: '💡 Me ajude com uma ideia', rotulo: 'ideia' },
                { texto: '📝 Escreva um texto para mim', rotulo: 'texto' },
                { texto: '🔍 Pesquise algo na web', rotulo: 'pesquisa' },
                { texto: '💻 Ajude com programação', rotulo: 'codigo' },
              ].map((sugestao) => (
                <motion.div
                  key={sugestao.rotulo}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="outline"
                    className="justify-start gap-2 h-auto py-2.5 text-xs border-amber-200 hover:bg-amber-50 hover:border-amber-400 dark:border-amber-800 dark:hover:bg-amber-900/20 w-full transition-colors"
                    onClick={() => criarConversa.mutate(agenteSelecionado ?? undefined)}
                    disabled={criarConversa.isPending}
                  >
                    {criarConversa.isPending ? <Loader2 className="size-3 animate-spin" /> : null}
                    {sugestao.texto}
                  </Button>
                </motion.div>
              ))}
            </div>

            {/* Conversas recentes */}
            {conversasRecentes.length > 0 && (
              <div className="max-w-md w-full mt-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Conversas recentes
                </h4>
                <div className="space-y-2">
                  {conversasRecentes.map((conversa) => (
                    <motion.button
                      key={conversa.id}
                      onClick={() => setConversaAtiva(conversa.id)}
                      className="w-full text-left"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <Card className="hover:border-amber-300 dark:hover:border-amber-700 transition-colors">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium truncate">
                              {conversa.titulo}
                            </span>
                            <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                              {obterTempoRelativo(new Date(conversa.updatedAt))}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[9px] gap-0.5 h-4 px-1 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400">
                              <MessageSquare className="size-2" />
                              {conversa.totalMensagens} msgs
                            </Badge>
                            <span className="text-[10px] text-muted-foreground line-clamp-1">
                              {conversa.totalMensagens > 0 ? 'Clique para continuar' : 'Vazia'}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
