'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import {
  Zap,
  Search,
  Shield,
  Building2,
  Code2,
  Send,
  Loader2,
  RotateCcw,
  Copy,
  Check,
  Trash2,
  Sparkles,
  ChevronRight,
  BookOpen,
  Lightbulb,
  X,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'

// ===== Types =====
interface AgenteConfig {
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
  systemPrompt: string
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

// ===== Agent Definitions =====
const AGENTES: AgenteConfig[] = [
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
    systemPrompt: '', // Sent to backend
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
    systemPrompt: '',
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
    systemPrompt: '',
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
    systemPrompt: '',
    skills: [
      { label: 'Análise OWASP', prompt: 'Analise o código ou arquitetura apresentada contra o OWASP Top 10 atual e identifique vulnerabilidades com CVSS score estimado.', icon: Shield },
      { label: 'Gestão de secrets', prompt: 'Revise como secrets, credenciais, API keys e dados sensíveis são gerenciados, armazenados e rotacionados no sistema.', icon: Search },
      { label: 'Auth & Autorização', prompt: 'Analise o sistema de autenticação e autorização: tokens JWT, sessões, permissões RBAC/ABAC e possíveis vetores de ataque.', icon: Shield },
      { label: 'Hardening', prompt: 'Proponha um checklist completo de hardening: headers de segurança HTTP, configurações, rate limiting e WAF.', icon: Check },
      { label: 'Criptografia', prompt: 'Analise o uso de criptografia: algoritmos utilizados, gestão de chaves, configuração TLS/SSL e dados em repouso.', icon: Lock },
      { label: 'Threat Modeling', prompt: 'Realize um threat modeling do sistema: identifique ativos críticos, ameaças, vetores de ataque e controles mitigantes.', icon: Search },
    ],
    sugestoes: [
      'Quais são as vulnerabilidades mais comuns em APIs REST?',
      'Como implementar autenticação segura com JWT?',
      'O que é OWASP Top 10 e por que é importante?',
    ],
  },
]

// Placeholder for Lock icon (since it's not imported)
function Lock({ className }: { className?: string }) {
  return <Shield className={className} />
}

// ===== Sub-components =====

function AnimatedDots({ color }: { color: string }) {
  return (
    <span className="inline-flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block size-2 rounded-full"
          style={{ backgroundColor: color }}
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
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

function PrincipioBadge({ num, accent }: { num: number; accent: string }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-bold font-mono"
      style={{ backgroundColor: `${accent}20`, color: accent }}
    >
      P{num}
    </span>
  )
}

// ===== Main Component =====
export function AgentesIA() {
  const [agenteAtivo, setAgenteAtivo] = useState<string>('dev')
  const [historicos, setHistoricos] = useState<Record<string, MensagemChat[]>>({
    dev: [],
    revisor: [],
    arquiteto: [],
    seguranca: [],
  })
  const [input, setInput] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [mensagemCopiada, setMensagemCopiada] = useState<string | null>(null)
  const [skillsExpandido, setSkillsExpandido] = useState(true)
  const chatRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const agente = AGENTES.find(a => a.id === agenteAtivo)!
  const mensagens = historicos[agenteAtivo] ?? []

  // Auto-scroll
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [mensagens, carregando])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const newHeight = Math.min(textarea.scrollHeight, 128)
      textarea.style.height = `${newHeight}px`
    }
  }, [input])

  // Stats
  const totalTokens = useMemo(() => {
    return mensagens.reduce((acc, m) => acc + (m.tokensIn ?? 0) + (m.tokensOut ?? 0), 0)
  }, [mensagens])

  const totalMensagens = mensagens.length

  // Send message
  const enviar = useCallback(async (texto?: string) => {
    const t = (texto || input).trim()
    if (!t || carregando) return

    const novaMensagem: MensagemChat = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: t,
      timestamp: Date.now(),
    }

    const novoHistorico = [...mensagens, novaMensagem]
    setHistoricos(prev => ({ ...prev, [agenteAtivo]: novoHistorico }))
    setInput('')
    setCarregando(true)

    try {
      const response = await fetch('/api/agentes-ia/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agenteId: agenteAtivo,
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
          [agenteAtivo]: [...novoHistorico, respostaMsg],
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
          [agenteAtivo]: [...novoHistorico, errorMsg],
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
        [agenteAtivo]: [...novoHistorico, errorMsg],
      }))
      toast.error('Erro de conexão com o agente')
    } finally {
      setCarregando(false)
    }
  }, [input, carregando, agenteAtivo, mensagens])

  // Keyboard handler
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviar()
    }
  }, [enviar])

  // Copy message
  const copiarMensagem = useCallback(async (id: string, content: string) => {
    await navigator.clipboard.writeText(content)
    setMensagemCopiada(id)
    setTimeout(() => setMensagemCopiada(null), 2000)
    toast.success('Mensagem copiada!')
  }, [])

  // Clear history
  const limparHistorico = useCallback(() => {
    setHistoricos(prev => ({ ...prev, [agenteAtivo]: [] }))
    toast.success('Histórico limpo!')
  }, [agenteAtivo])

  // Switch agent
  const trocarAgente = useCallback((id: string) => {
    setAgenteAtivo(id)
    setInput('')
    setCarregando(false)
  }, [])

  const vazio = mensagens.length === 0

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0">
      {/* Left Panel - Agent Selection & Skills */}
      <div className="w-72 border-r border-border flex flex-col bg-muted/30 shrink-0">
        {/* Agent Tabs */}
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-amber-500" />
              Agentes IA
            </h2>
            <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-mono">
              Karpathy P1-P5
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {AGENTES.map((a) => {
              const ativo = agenteAtivo === a.id
              return (
                <motion.button
                  key={a.id}
                  onClick={() => trocarAgente(a.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    relative flex flex-col items-center gap-1 p-2.5 rounded-lg text-center transition-all duration-200 border
                    ${ativo
                      ? `${a.bgClass} ${a.borderClass} shadow-sm`
                      : 'border-transparent hover:bg-muted/80'
                    }
                  `}
                >
                  <span className="text-lg">{a.icone}</span>
                  <span className={`text-[10px] font-medium leading-tight ${ativo ? a.accentClass : 'text-muted-foreground'}`}>
                    {a.nome.replace('Agente ', '')}
                  </span>
                  {ativo && (
                    <motion.div
                      layoutId="agenteIndicator"
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                      style={{ backgroundColor: a.accent }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.button>
              )
            })}
          </div>

          {/* Agent Info */}
          <div className={`rounded-lg border ${agente.borderClass} ${agente.lightBgClass} p-2.5 space-y-2`}>
            <div className="flex items-center gap-2">
              <span className="text-xl">{agente.icone}</span>
              <div>
                <p className={`text-xs font-semibold ${agente.accentClass}`}>{agente.nome}</p>
                <p className="text-[10px] text-muted-foreground">{agente.tag}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <PrincipioBadge key={n} num={n} accent={agente.accent} />
              ))}
            </div>
          </div>
        </div>

        <Separator />

        {/* Skills Sidebar */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-3 pt-3 pb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Skills
            </span>
            <button
              onClick={() => setSkillsExpandido(!skillsExpandido)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className={`size-3 transition-transform ${skillsExpandido ? 'rotate-90' : ''}`} />
            </button>
          </div>

          <AnimatePresence>
            {skillsExpandido && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <ScrollArea className="flex-1">
                  <div className="px-2 pb-2 space-y-0.5">
                    {agente.skills.map((skill, i) => (
                      <motion.button
                        key={i}
                        onClick={() => enviar(skill.prompt)}
                        disabled={carregando}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-md text-xs transition-all duration-150 hover:bg-muted/80 group disabled:opacity-50"
                      >
                        <skill.icon className={`size-3 shrink-0 ${agente.accentClass} opacity-60 group-hover:opacity-100 transition-opacity`} />
                        <span className="text-muted-foreground group-hover:text-foreground transition-colors truncate">
                          {skill.label}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </ScrollArea>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats */}
          <div className="p-3 border-t border-border space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">Mensagens</span>
              <span className="font-medium">{totalMensagens}</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">Tokens</span>
              <span className="font-medium">{totalTokens > 1000 ? `${(totalTokens / 1000).toFixed(1)}k` : totalTokens}</span>
            </div>
            {mensagens.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={limparHistorico}
                className="w-full h-7 text-[10px] text-muted-foreground hover:text-destructive gap-1.5"
              >
                <Trash2 className="size-3" />
                Limpar Histórico
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className={`px-4 py-3 border-b border-border ${agente.lightBgClass}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{agente.icone}</span>
              <div>
                <h2 className={`text-sm font-semibold ${agente.accentClass}`}>{agente.nome}</h2>
                <p className="text-[10px] text-muted-foreground">{agente.tag}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {carregando && (
                <Badge variant="outline" className="text-[9px] h-5 gap-1 animate-pulse">
                  <Loader2 className="size-2.5 animate-spin" />
                  Pensando...
                </Badge>
              )}
              {mensagens.length > 0 && (
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
            {vazio && !carregando && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center h-full gap-6 py-8"
              >
                {/* Agent avatar */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative"
                >
                  <div
                    className={`size-24 rounded-2xl flex items-center justify-center ${agente.bgClass} ring-2 ${agente.borderClass} ring-offset-4 ring-offset-background`}
                  >
                    <span className="text-4xl">{agente.icone}</span>
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-1 -right-1 size-4 rounded-full"
                    style={{ backgroundColor: agente.accent }}
                  />
                </motion.div>

                <div className="text-center">
                  <h3 className={`text-xl font-bold ${agente.accentClass}`}>{agente.nome}</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">{agente.tag}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Guiado pelos 5 princípios Karpathy
                  </p>
                </div>

                {/* Suggestion buttons */}
                <div className="flex flex-col gap-2 w-full max-w-md">
                  {agente.sugestoes.map((sugestao, i) => (
                    <motion.button
                      key={i}
                      onClick={() => enviar(sugestao)}
                      whileHover={{ scale: 1.01, x: 4 }}
                      whileTap={{ scale: 0.99 }}
                      className="text-left px-4 py-3 rounded-xl border border-border bg-background hover:bg-muted/50 transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3">
                        <ChevronRight className={`size-3.5 ${agente.accentClass} opacity-50 group-hover:opacity-100 transition-opacity`} />
                        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                          {sugestao}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Chat messages */}
            {mensagens.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* Agent avatar for assistant messages */}
                {msg.role === 'assistant' && (
                  <div
                    className={`size-8 rounded-lg ${agente.bgClass} flex items-center justify-center text-sm shrink-0 mt-1`}
                  >
                    {agente.icone}
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800'
                      : `bg-muted/50 border border-border`
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:text-sm [&>p]:leading-relaxed [&>h1]:text-base [&>h2]:text-sm [&>h3]:text-sm">
                      <ReactMarkdown
                        components={{
                          code({ className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '')
                            const inline = !match
                            return inline ? (
                              <code
                                className="bg-muted/80 px-1.5 py-0.5 rounded text-xs font-mono"
                                {...props}
                              >
                                {children}
                              </code>
                            ) : (
                              <div className="relative my-2">
                                <div className="flex items-center justify-between bg-muted/80 px-3 py-1.5 rounded-t-lg border-b border-border">
                                  <span className="text-[10px] font-mono text-muted-foreground">
                                    {match[1]}
                                  </span>
                                  <button
                                    onClick={() => copiarMensagem(msg.id, String(children))}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                  >
                                    {mensagemCopiada === msg.id ? (
                                      <Check className="size-3 text-emerald-500" />
                                    ) : (
                                      <Copy className="size-3" />
                                    )}
                                  </button>
                                </div>
                                <SyntaxHighlighter
                                  style={oneDark}
                                  language={match[1]}
                                  PreTag="div"
                                  customStyle={{
                                    margin: 0,
                                    borderRadius: '0 0 0.5rem 0.5rem',
                                    fontSize: '0.75rem',
                                  }}
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              </div>
                            )
                          },
                          strong({ children }) {
                            return <strong className={`font-semibold ${agente.accentClass}`}>{children}</strong>
                          },
                          // Highlight [P1]-[P5] principle badges
                          p({ children }) {
                            return <p className="text-sm leading-relaxed">{children}</p>
                          },
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}

                  {/* Message metadata */}
                  {msg.role === 'assistant' && (msg.tokensIn || msg.tokensOut) && (
                    <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/50 text-[9px] text-muted-foreground">
                      {msg.modelo && <span className="font-mono">{msg.modelo}</span>}
                      {msg.tokensIn && <span>{msg.tokensIn} in</span>}
                      {msg.tokensOut && <span>{msg.tokensOut} out</span>}
                    </div>
                  )}
                </div>

                {/* Copy button for user messages */}
                {msg.role === 'user' && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => copiarMensagem(msg.id, msg.content)}
                        className="size-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all mt-1 opacity-0 group-hover:opacity-100"
                        style={{ opacity: mensagemCopiada === msg.id ? 1 : undefined }}
                      >
                        {mensagemCopiada === msg.id ? (
                          <Check className="size-3 text-emerald-500" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Copiar</TooltipContent>
                  </Tooltip>
                )}
              </motion.div>
            ))}

            {/* Loading indicator */}
            {carregando && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div
                  className={`size-8 rounded-lg ${agente.bgClass} flex items-center justify-center text-sm shrink-0`}
                >
                  {agente.icone}
                </div>
                <div className="px-4 py-3 rounded-2xl bg-muted/50 border border-border">
                  <AnimatedDots color={agente.accent} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="p-3 border-t border-border bg-background">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={`Pergunte para o ${agente.nome}...`}
                rows={1}
                className="resize-none pr-10 min-h-[40px] max-h-32 focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
              />
              {input && (
                <button
                  onClick={() => setInput('')}
                  className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <Button
              onClick={() => enviar()}
              disabled={!input.trim() || carregando}
              className="shrink-0 h-10 px-4 gap-2 bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50"
            >
              {carregando ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Enviar
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-1.5">
            Enter para enviar • Shift+Enter para nova linha • Princípios Karpathy ativos
          </p>
        </div>
      </div>
    </div>
  )
}
