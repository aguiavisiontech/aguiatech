'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
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
  Send,
  RotateCcw,
  Check,
  Sparkles,
  BookOpen,
  Lightbulb,
  Building2,
  Code2,
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'

// ─── Chat IA Types ────────────────────────────────────────────────────────

interface AgenteChatConfig {
  id: string
  nome: string
  icone: string
  tag: string
  accent: string
  accentClass: string
  bgClass: string
  borderClass: string
  lightBgClass: string
  iconComponent: React.ElementType
  skills: Array<{ label: string; prompt: string; icon: React.ElementType }>
  sugestoes: string[]
}

interface MensagemChat {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  tokensIn?: number
  tokensOut?: number
  modelo?: string
}

const AGENTES_CHAT: AgenteChatConfig[] = [
  {
    id: 'dev',
    nome: 'Agente Dev',
    icone: '⚡',
    tag: 'Full-stack • Todos os idiomas',
    accent: '#10b981',
    accentClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-100 dark:bg-emerald-900/30',
    borderClass: 'border-emerald-300 dark:border-emerald-700',
    lightBgClass: 'bg-emerald-50 dark:bg-emerald-900/10',
    iconComponent: Code2,
    skills: [
      { label: 'Gerar testes', prompt: 'Analise o código discutido e gere testes unitários e de integração completos, incluindo casos de borda importantes.', icon: Zap },
      { label: 'Refatorar código', prompt: 'Refatore o código para melhorar legibilidade, manutenibilidade e performance, seguindo princípios SOLID e DRY.', icon: RotateCcw },
      { label: 'Documentar', prompt: 'Gere documentação completa: JSDoc/docstrings, README e exemplos de uso para o código em questão.', icon: BookOpen },
      { label: 'Debug & análise', prompt: 'Analise possíveis bugs e problemas no código, explique as causas raízes e sugira correções detalhadas.', icon: Search },
      { label: 'Design de API', prompt: 'Projete uma API RESTful seguindo boas práticas: endpoints, verbos HTTP, status codes e documentação OpenAPI.', icon: Building2 },
      { label: 'Otimizar performance', prompt: 'Identifique gargalos de performance e sugira otimizações com análise de complexidade Big-O.', icon: Zap },
    ],
    sugestoes: [
      'Crie uma função para validar CPF em JavaScript',
      'Como implementar autenticação JWT no Node.js?',
      'Explique as diferenças entre SQL e NoSQL',
    ],
  },
  {
    id: 'revisor',
    nome: 'Agente Revisor',
    icone: '🔍',
    tag: 'Code Review • Bugs • SOLID',
    accent: '#f59e0b',
    accentClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-100 dark:bg-amber-900/30',
    borderClass: 'border-amber-300 dark:border-amber-700',
    lightBgClass: 'bg-amber-50 dark:bg-amber-900/10',
    iconComponent: Search,
    skills: [
      { label: 'Analisar bugs', prompt: 'Faça análise completa buscando bugs, race conditions e comportamentos inesperados. Classifique por severidade (CRÍTICO/ALTO/MÉDIO/BAIXO).', icon: Search },
      { label: 'Checar SOLID', prompt: 'Verifique aderência aos princípios SOLID, DRY, KISS e YAGNI. Aponte violações com exemplos concretos de como corrigir.', icon: Check },
      { label: 'Revisar segurança', prompt: 'Analise vulnerabilidades: injeção SQL, XSS, autenticação fraca, autorização incorreta e exposição de dados sensíveis.', icon: Shield },
      { label: 'Avaliar performance', prompt: 'Identifique problemas de performance: N+1 queries, memory leaks, loops ineficientes e chamadas desnecessárias.', icon: Zap },
      { label: 'Cobertura de testes', prompt: 'Avalie a cobertura de testes existente e aponte cenários críticos e casos de borda não cobertos.', icon: BookOpen },
      { label: 'Padrões de código', prompt: 'Verifique consistência de estilo, nomenclatura e estrutura conforme boas práticas da linguagem.', icon: Code2 },
    ],
    sugestoes: [
      'Revise este código e aponte os principais problemas',
      'Quais são os principais code smells que devo evitar?',
      'Como estruturar um pull request de qualidade?',
    ],
  },
  {
    id: 'arquiteto',
    nome: 'Agente Arquiteto',
    icone: '🏗️',
    tag: 'Sistemas • Trade-offs • Escala',
    accent: '#3b82f6',
    accentClass: 'text-sky-600 dark:text-sky-400',
    bgClass: 'bg-sky-100 dark:bg-sky-900/30',
    borderClass: 'border-sky-300 dark:border-sky-700',
    lightBgClass: 'bg-sky-50 dark:bg-sky-900/10',
    iconComponent: Building2,
    skills: [
      { label: 'Desenhar sistema', prompt: 'Descreva o sistema que você quer construir e vou propor uma arquitetura completa com componentes, fluxos de dados e justificativas técnicas.', icon: Building2 },
      { label: 'Analisar trade-offs', prompt: 'Apresente as opções arquiteturais que está considerando e vou analisar os trade-offs de cada uma de forma objetiva.', icon: Lightbulb },
      { label: 'Estratégia de escala', prompt: 'Descreva seu sistema atual e seus gargalos, e vou propor estratégias para escalar: horizontal, vertical, caching, sharding e CDN.', icon: Zap },
      { label: 'Escolha de banco', prompt: 'Descreva seus requisitos de dados, volume e padrões de acesso e vou recomendar o banco mais adequado com justificativa técnica.', icon: BookOpen },
      { label: 'Plano de migração', prompt: 'Descreva de onde quer migrar e para onde, e vou criar um plano de migração incremental, seguro e com rollback possível.', icon: RotateCcw },
      { label: 'Gerar ADR', prompt: 'Descreva a decisão arquitetural e vou gerar um Architecture Decision Record (ADR) completo e estruturado.', icon: Code2 },
    ],
    sugestoes: [
      'Como escolher entre microserviços e monolito?',
      'Projete uma arquitetura para um e-commerce com alto volume',
      'Quando usar SQL vs NoSQL? Explique os trade-offs',
    ],
  },
  {
    id: 'seguranca',
    nome: 'Agente Segurança',
    icone: '🔒',
    tag: 'OWASP • CVEs • Hardening',
    accent: '#ef4444',
    accentClass: 'text-red-600 dark:text-red-400',
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    borderClass: 'border-red-300 dark:border-red-700',
    lightBgClass: 'bg-red-50 dark:bg-red-900/10',
    iconComponent: Shield,
    skills: [
      { label: 'Análise OWASP', prompt: 'Analise o código ou arquitetura apresentada contra o OWASP Top 10 atual e identifique vulnerabilidades com CVSS score estimado.', icon: Shield },
      { label: 'Gestão de secrets', prompt: 'Revise como secrets, credenciais, API keys e dados sensíveis são gerenciados, armazenados e rotacionados no sistema.', icon: Search },
      { label: 'Auth & Autorização', prompt: 'Analise o sistema de autenticação e autorização: tokens JWT, sessões, permissões RBAC/ABAC e possíveis vetores de ataque.', icon: Shield },
      { label: 'Hardening', prompt: 'Proponha um checklist completo de hardening: headers de segurança HTTP, configurações, rate limiting e WAF.', icon: Check },
      { label: 'Criptografia', prompt: 'Analise o uso de criptografia: algoritmos utilizados, gestão de chaves, configuração TLS/SSL e dados em repouso.', icon: Shield },
      { label: 'Threat Modeling', prompt: 'Realize um threat modeling do sistema: identifique ativos críticos, ameaças, vetores de ataque e controles mitigantes.', icon: Search },
    ],
    sugestoes: [
      'Quais são as vulnerabilidades mais comuns em APIs REST?',
      'Como implementar autenticação segura com JWT?',
      'O que é OWASP Top 10 e por que é importante?',
    ],
  },
]

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
  const [abaPrincipal, setAbaPrincipal] = useState('gerenciar')

  // ─── Chat IA State ────────────────────────────────────────────────────
  const [agenteChatAtivo, setAgenteChatAtivo] = useState<string>('dev')
  const [historicos, setHistoricos] = useState<Record<string, MensagemChat[]>>({
    dev: [], revisor: [], arquiteto: [], seguranca: [],
  })
  const [chatInput, setChatInput] = useState('')
  const [carregandoChat, setCarregandoChat] = useState(false)
  const [mensagemCopiada, setMensagemCopiada] = useState<string | null>(null)
  const [skillsExpandido, setSkillsExpandido] = useState(true)
  const chatRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

  // ─── Chat IA Logic ──────────────────────────────────────────────────

  const agenteChat = AGENTES_CHAT.find(a => a.id === agenteChatAtivo)!
  const mensagensChat = historicos[agenteChatAtivo] ?? []

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [mensagensChat, carregandoChat])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const newHeight = Math.min(textarea.scrollHeight, 128)
      textarea.style.height = `${newHeight}px`
    }
  }, [chatInput])

  const totalTokensChat = useMemo(() => {
    return mensagensChat.reduce((acc, m) => acc + (m.tokensIn ?? 0) + (m.tokensOut ?? 0), 0)
  }, [mensagensChat])

  const enviarChat = useCallback(async (texto?: string) => {
    const t = (texto || chatInput).trim()
    if (!t || carregandoChat) return

    const novaMensagem: MensagemChat = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: t,
      timestamp: Date.now(),
    }

    const novoHistorico = [...mensagensChat, novaMensagem]
    setHistoricos(prev => ({ ...prev, [agenteChatAtivo]: novoHistorico }))
    setChatInput('')
    setCarregandoChat(true)

    try {
      const response = await fetch('/api/agentes-ia/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agenteId: agenteChatAtivo,
          mensagens: novoHistorico.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      const data = await response.json()

      if (data.sucesso) {
        const respostaMsg: MensagemChat = {
          id: `msg-${Date.now()}-resp`,
          role: 'assistant',
          content: data.resposta,
          timestamp: Date.now(),
          tokensIn: data.tokensIn,
          tokensOut: data.tokensOut,
          modelo: data.modelo,
        }
        setHistoricos(prev => ({
          ...prev,
          [agenteChatAtivo]: [...novoHistorico, respostaMsg],
        }))
      } else {
        const errorMsg: MensagemChat = {
          id: `msg-${Date.now()}-err`,
          role: 'assistant',
          content: data.resposta || 'Erro ao processar resposta.',
          timestamp: Date.now(),
        }
        setHistoricos(prev => ({
          ...prev,
          [agenteChatAtivo]: [...novoHistorico, errorMsg],
        }))
      }
    } catch {
      const errorMsg: MensagemChat = {
        id: `msg-${Date.now()}-err`,
        role: 'assistant',
        content: 'Erro de conexão. Verifique sua rede e tente novamente.',
        timestamp: Date.now(),
      }
      setHistoricos(prev => ({
        ...prev,
        [agenteChatAtivo]: [...novoHistorico, errorMsg],
      }))
      toast.error('Erro de conexão com o agente')
    } finally {
      setCarregandoChat(false)
    }
  }, [chatInput, carregandoChat, agenteChatAtivo, mensagensChat])

  const onChatKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviarChat()
    }
  }, [enviarChat])

  const copiarMensagem = useCallback(async (id: string, content: string) => {
    await navigator.clipboard.writeText(content)
    setMensagemCopiada(id)
    setTimeout(() => setMensagemCopiada(null), 2000)
    toast.success('Mensagem copiada!')
  }, [])

  const limparHistorico = useCallback(() => {
    setHistoricos(prev => ({ ...prev, [agenteChatAtivo]: [] }))
    toast.success('Histórico limpo!')
  }, [agenteChatAtivo])

  const trocarAgenteChat = useCallback((id: string) => {
    setAgenteChatAtivo(id)
    setChatInput('')
    setCarregandoChat(false)
  }, [])

  // Abrir Orquestrador
  const abrirOrquestrador = useCallback(() => {
    setSecaoAtiva('orquestrador')
  }, [setSecaoAtiva])

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
      {/* ─── Tabs: Gerenciar | Chat IA ──────────────────────────────────────── */}
      <Tabs value={abaPrincipal} onValueChange={setAbaPrincipal}>
        <div className="flex items-center justify-between mb-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="gerenciar" className="gap-1.5 data-[state=active]:bg-teal-600 data-[state=active]:text-white">
              <Bot className="size-3.5" />
              Gerenciar
            </TabsTrigger>
            <TabsTrigger value="chat-ia" className="gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <MessageSquare className="size-3.5" />
              Chat IA
            </TabsTrigger>
          </TabsList>
          <Badge variant="outline" className="text-[9px] h-5 px-2 font-mono">
            Aguiavisiontech P1-P5
          </Badge>
        </div>

        <TabsContent value="gerenciar">
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

      {/* ─── Agente Orquestrador (Special Card) ──────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-2 border-violet-500/30 bg-gradient-to-br from-violet-500/5 via-card to-amber-500/5 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
          onClick={abrirOrquestrador}
        >
          <div className="h-2 bg-gradient-to-r from-violet-500 via-purple-500 to-amber-500" />
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Avatar */}
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20 text-2xl shrink-0 group-hover:scale-105 transition-transform duration-300">
                🧠
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-bold text-violet-700 dark:text-violet-300">
                    Agente Orquestrador
                  </h3>
                  <Badge className="text-[9px] bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border-violet-200 dark:border-violet-700">
                    <Activity className="size-2.5 mr-0.5" />
                    Multi-Agente
                  </Badge>
                  <Badge className="text-[9px] bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-700">
                    🔥 Destaque
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Sistema inteligente de debug que decide dinamicamente quais agentes ativar, em qual ordem e quantas vezes executar cada um. 9 agentes especializados trabalhando juntos.
                </p>
                <div className="flex flex-wrap gap-1">
                  {['🔍 Diagnóstico', '🎯 Causa Raiz', '⚙️ Simulação', '🔧 Correção', '✅ Testes', '♻️ Refatoração', '⚠️ Riscos', '🧠 Verificação', '📋 Checklist'].map((ag) => (
                    <span key={ag} className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] bg-muted/60 border border-border/30 text-muted-foreground">
                      {ag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-center gap-2 shrink-0">
                <Button
                  className="gap-2 bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20 group-hover:shadow-lg group-hover:shadow-violet-500/30 transition-all duration-300"
                  onClick={(e) => {
                    e.stopPropagation()
                    abrirOrquestrador()
                  }}
                >
                  <Cpu className="size-4" />
                  Usar Orquestrador
                </Button>
                <span className="text-[9px] text-muted-foreground">
                  Adaptação dinâmica
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

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
        </TabsContent>

        {/* ─── Chat IA Tab ──────────────────────────────────────────────────── */}
        <TabsContent value="chat-ia">
          <div className="flex h-[calc(100vh-14rem)] gap-0">
            {/* Left Panel - Agent Selection & Skills */}
            <div className="w-72 border-r border-border flex flex-col bg-muted/30 shrink-0">
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-sm flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-amber-500" />
                    Chat IA
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {AGENTES_CHAT.map((a) => {
                    const ativo = agenteChatAtivo === a.id
                    return (
                      <motion.button
                        key={a.id}
                        onClick={() => trocarAgenteChat(a.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`relative flex flex-col items-center gap-1 p-2.5 rounded-lg text-center transition-all duration-200 border ${ativo ? `${a.bgClass} ${a.borderClass} shadow-sm` : 'border-transparent hover:bg-muted/80'}`}
                      >
                        <span className="text-lg">{a.icone}</span>
                        <span className={`text-[10px] font-medium leading-tight ${ativo ? a.accentClass : 'text-muted-foreground'}`}>
                          {a.nome.replace('Agente ', '')}
                        </span>
                        {ativo && (
                          <motion.div layoutId="agenteChatIndicator" className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full" style={{ backgroundColor: a.accent }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
                        )}
                      </motion.button>
                    )
                  })}
                </div>
                <div className={`rounded-lg border ${agenteChat.borderClass} ${agenteChat.lightBgClass} p-2.5 space-y-2`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{agenteChat.icone}</span>
                    <div>
                      <p className={`text-xs font-semibold ${agenteChat.accentClass}`}>{agenteChat.nome}</p>
                      <p className="text-[10px] text-muted-foreground">{agenteChat.tag}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {[1, 2, 3, 4, 5].map(n => (
                      <span key={n} className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-bold font-mono" style={{ backgroundColor: `${agenteChat.accent}20`, color: agenteChat.accent }}>P{n}</span>
                    ))}
                  </div>
                </div>
              </div>
              <Separator />
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-3 pt-3 pb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Skills</span>
                  <button onClick={() => setSkillsExpandido(!skillsExpandido)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronRight className={`size-3 transition-transform ${skillsExpandido ? 'rotate-90' : ''}`} />
                  </button>
                </div>
                <AnimatePresence>
                  {skillsExpandido && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <ScrollArea className="flex-1">
                        <div className="px-2 pb-2 space-y-0.5">
                          {agenteChat.skills.map((skill, i) => (
                            <motion.button key={i} onClick={() => enviarChat(skill.prompt)} disabled={carregandoChat} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-md text-xs transition-all duration-150 hover:bg-muted/80 group disabled:opacity-50">
                              <skill.icon className={`size-3 shrink-0 ${agenteChat.accentClass} opacity-60 group-hover:opacity-100 transition-opacity`} />
                              <span className="text-muted-foreground group-hover:text-foreground transition-colors truncate">{skill.label}</span>
                            </motion.button>
                          ))}
                        </div>
                      </ScrollArea>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="p-3 border-t border-border space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">Mensagens</span>
                    <span className="font-medium">{mensagensChat.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">Tokens</span>
                    <span className="font-medium">{totalTokensChat > 1000 ? `${(totalTokensChat / 1000).toFixed(1)}k` : totalTokensChat}</span>
                  </div>
                  {mensagensChat.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={limparHistorico} className="w-full h-7 text-[10px] text-muted-foreground hover:text-destructive gap-1.5">
                      <Trash2 className="size-3" />
                      Limpar Histórico
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className={`px-4 py-3 border-b border-border ${agenteChat.lightBgClass}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{agenteChat.icone}</span>
                    <div>
                      <h2 className={`text-sm font-semibold ${agenteChat.accentClass}`}>{agenteChat.nome}</h2>
                      <p className="text-[10px] text-muted-foreground">{agenteChat.tag}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {carregandoChat && (
                      <Badge variant="outline" className="text-[9px] h-5 gap-1 animate-pulse">
                        <Loader2 className="size-2.5 animate-spin" />
                        Pensando...
                      </Badge>
                    )}
                    {mensagensChat.length > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-7" onClick={limparHistorico}>
                            <Trash2 className="size-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Limpar conversa</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                  {mensagensChat.length === 0 && !carregandoChat && (
                    <motion.div key="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col items-center justify-center h-full gap-6 py-8">
                      <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} className="relative">
                        <div className={`size-24 rounded-2xl flex items-center justify-center ${agenteChat.bgClass} ring-2 ${agenteChat.borderClass} ring-offset-4 ring-offset-background`}>
                          <span className="text-4xl">{agenteChat.icone}</span>
                        </div>
                        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="absolute -top-1 -right-1 size-4 rounded-full" style={{ backgroundColor: agenteChat.accent }} />
                      </motion.div>
                      <div className="text-center">
                        <h3 className={`text-xl font-bold ${agenteChat.accentClass}`}>{agenteChat.nome}</h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-sm">{agenteChat.tag}</p>
                        <p className="text-xs text-muted-foreground mt-2">Guiado pelos 5 princípios Aguiavisiontech</p>
                      </div>
                      <div className="flex flex-col gap-2 w-full max-w-md">
                        {agenteChat.sugestoes.map((sugestao, i) => (
                          <motion.button key={i} onClick={() => enviarChat(sugestao)} whileHover={{ scale: 1.01, x: 4 }} whileTap={{ scale: 0.99 }} className="text-left px-4 py-3 rounded-xl border border-border bg-background hover:bg-muted/50 transition-all duration-200 group">
                            <div className="flex items-center gap-3">
                              <ChevronRight className={`size-3.5 ${agenteChat.accentClass} opacity-50 group-hover:opacity-100 transition-opacity`} />
                              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{sugestao}</span>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {mensagensChat.map((msg) => (
                    <motion.div key={msg.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'assistant' && (
                        <div className={`size-8 rounded-lg ${agenteChat.bgClass} flex items-center justify-center text-sm shrink-0 mt-1`}>{agenteChat.icone}</div>
                      )}
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800' : 'bg-muted/50 border border-border'}`}>
                        {msg.role === 'user' ? (
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                        ) : (
                          <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:text-sm [&>p]:leading-relaxed">
                            <ReactMarkdown
                              components={{
                                code({ className, children, ...props }) {
                                  const match = /language-(\w+)/.exec(className || '')
                                  const inline = !match
                                  return inline ? (
                                    <code className="bg-muted/80 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>{children}</code>
                                  ) : (
                                    <div className="relative my-2">
                                      <div className="flex items-center justify-between bg-muted/80 px-3 py-1.5 rounded-t-lg border-b border-border">
                                        <span className="text-[10px] font-mono text-muted-foreground">{match[1]}</span>
                                        <button onClick={() => copiarMensagem(msg.id, String(children))} className="text-muted-foreground hover:text-foreground transition-colors">
                                          {mensagemCopiada === msg.id ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                                        </button>
                                      </div>
                                      <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" customStyle={{ margin: 0, borderRadius: '0 0 0.5rem 0.5rem', fontSize: '0.75rem' }} {...props}>
                                        {String(children).replace(/\n$/, '')}
                                      </SyntaxHighlighter>
                                    </div>
                                  )
                                },
                                strong({ children }) {
                                  return <strong className={`font-semibold ${agenteChat.accentClass}`}>{children}</strong>
                                },
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        )}
                        {msg.role === 'assistant' && (msg.tokensIn || msg.tokensOut) && (
                          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/50 text-[9px] text-muted-foreground">
                            {msg.modelo && <span className="font-mono">{msg.modelo}</span>}
                            {msg.tokensIn && <span>{msg.tokensIn} in</span>}
                            {msg.tokensOut && <span>{msg.tokensOut} out</span>}
                          </div>
                        )}
                      </div>
                      {msg.role === 'user' && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button onClick={() => copiarMensagem(msg.id, msg.content)} className="size-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all mt-1" style={{ opacity: mensagemCopiada === msg.id ? 1 : undefined }}>
                              {mensagemCopiada === msg.id ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Copiar</TooltipContent>
                        </Tooltip>
                      )}
                    </motion.div>
                  ))}

                  {carregandoChat && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                      <div className={`size-8 rounded-lg ${agenteChat.bgClass} flex items-center justify-center text-sm shrink-0`}>{agenteChat.icone}</div>
                      <div className="px-4 py-3 rounded-2xl bg-muted/50 border border-border">
                        <span className="inline-flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <motion.span key={i} className="inline-block size-2 rounded-full" style={{ backgroundColor: agenteChat.accent }} animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }} />
                          ))}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Input Area */}
              <div className="p-3 border-t border-border bg-background">
                <div className="flex gap-2 items-end">
                  <div className="flex-1 relative">
                    <Textarea ref={textareaRef} value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={onChatKeyDown} placeholder={`Pergunte para o ${agenteChat.nome}...`} rows={1} className="resize-none pr-10 min-h-[40px] max-h-32 focus-visible:ring-amber-500/30 focus-visible:border-amber-500" />
                    {chatInput && (
                      <button onClick={() => setChatInput('')} className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground transition-colors">
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>
                  <Button onClick={() => enviarChat()} disabled={!chatInput.trim() || carregandoChat} className="shrink-0 h-10 px-4 gap-2 bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50">
                    {carregandoChat ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                    Enviar
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground text-center mt-1.5">
                  Enter para enviar • Shift+Enter para nova linha • Princípios Aguiavisiontech ativos
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
