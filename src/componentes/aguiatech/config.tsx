'use client'

import { useState, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, Save, Loader2, Bot, Cpu, FolderOpen, SlidersHorizontal, Key, CheckCircle2, XCircle, Eye, EyeOff, ExternalLink, Zap, Globe, Shield, ShieldCheck, ShieldAlert, Activity, Server, Info, Monitor, Database, Code2, Heart, MessageSquare } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
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
import { MODELOS_GRATUITOS, obterNomeCurtoModelo, modeloEhGratis } from '@/lib/openrouter'

interface ConfigAgente {
  id: string
  nome: string
  modelo: string
  provedorModelo: string
  personalidade: string
  diretorioTrabalho: string
  ativo: boolean
}

interface FormularioConfig {
  nome: string
  modelo: string
  provedorModelo: string
  personalidade: string
  diretorioTrabalho: string
}

const PADRAO: FormularioConfig = {
  nome: 'Aguiatech',
  modelo: 'meta-llama/llama-3.3-70b-instruct:free',
  provedorModelo: 'openrouter',
  personalidade: 'Sou o Aguiatech, um agente de IA brasileiro inteligente e prestativo. Estou aqui para ajudar com qualquer tarefa!',
  diretorioTrabalho: '~/aguiatech',
}

// Animation variants for tab content
const tabVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15, ease: 'easeIn' } },
}

function FormularioConfigAgente({ config }: { config: ConfigAgente | undefined }) {
  const queryClient = useQueryClient()
  const [formulario, setFormulario] = useState<FormularioConfig>(() => {
    if (config) {
      return {
        nome: config.nome,
        modelo: config.modelo,
        provedorModelo: config.provedorModelo,
        personalidade: config.personalidade,
        diretorioTrabalho: config.diretorioTrabalho,
      }
    }
    return PADRAO
  })
  const [salvo, setSalvo] = useState(false)
  const [abaAtiva, setAbaAtiva] = useState('modelo')

  // API Key state
  const [apiKey, setApiKey] = useState('')
  const [apiKeyVisivel, setApiKeyVisivel] = useState(false)
  const [validandoKey, setValidandoKey] = useState(false)
  const [keyValida, setKeyValida] = useState<boolean | null>(null)
  const [keyErro, setKeyErro] = useState<string | null>(null)

  // Connection test state
  const [testandoConexao, setTestandoConexao] = useState(false)
  const [resultadoConexao, setResultadoConexao] = useState<'sucesso' | 'erro' | null>(null)
  const [mensagemConexao, setMensagemConexao] = useState<string | null>(null)

  // Load API key from config
  const { data: configMap } = useQuery<Record<string, string>>({
    queryKey: ['config-geral'],
    queryFn: () => fetch('/api/config').then(r => r.json()),
  })

  const apiKeyConfigurada = !!configMap?.openrouter_api_key

  useEffect(() => {
    if (configMap?.['openrouter_api_key']) {
      setApiKey(configMap['openrouter_api_key'])
    }
  }, [configMap])

  const salvarConfig = useMutation({
    mutationFn: (dados: FormularioConfig) =>
      fetch('/api/config/agente', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config-agente'] })
      setSalvo(true)
      setTimeout(() => setSalvo(false), 2000)
    },
  })

  const salvarApiKey = useMutation({
    mutationFn: (key: string) =>
      fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chave: 'openrouter_api_key', valor: key }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config-geral'] })
    },
  })

  const validarApiKey = useCallback(async () => {
    if (!apiKey.trim()) return
    setValidandoKey(true)
    setKeyValida(null)
    setKeyErro(null)
    try {
      const res = await fetch('/api/openrouter/validar-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      })
      const data = await res.json()
      setKeyValida(data.valida)
      setKeyErro(data.erro || null)
    } catch {
      setKeyValida(false)
      setKeyErro('Erro ao validar chave')
    } finally {
      setValidandoKey(false)
    }
  }, [apiKey])

  const testarConexao = useCallback(async () => {
    setTestandoConexao(true)
    setResultadoConexao(null)
    setMensagemConexao(null)
    try {
      // First validate API key
      const res = await fetch('/api/openrouter/validar-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() || configMap?.openrouter_api_key }),
      })
      const data = await res.json()
      if (data.valida) {
        setResultadoConexao('sucesso')
        setMensagemConexao(`Conexão bem-sucedida com OpenRouter! Modelo ativo: ${obterNomeCurtoModelo(formulario.modelo)}`)
      } else {
        setResultadoConexao('erro')
        setMensagemConexao(data.erro || 'Falha na conexão. Verifique sua API Key.')
      }
    } catch {
      setResultadoConexao('erro')
      setMensagemConexao('Erro de conexão com o servidor OpenRouter')
    } finally {
      setTestandoConexao(false)
    }
  }, [apiKey, configMap, formulario.modelo])

  const modelos: Record<string, string[]> = {
    openrouter: MODELOS_GRATUITOS.map(m => m.id),
    zhipu: ['glm-4-plus', 'glm-4', 'glm-4-flash', 'glm-4v'],
    openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
    anthropic: ['claude-3.5-sonnet', 'claude-3-haiku'],
    google: ['gemini-1.5-pro', 'gemini-1.5-flash'],
  }

  const provedores: Record<string, { nome: string; descricao: string; gratuito: boolean; icone: string }> = {
    openrouter: { nome: 'OpenRouter', descricao: '8 modelos gratuitos disponíveis', gratuito: true, icone: '🌐' },
    zhipu: { nome: 'Zhipu AI', descricao: 'Via gateway Z-AI', gratuito: true, icone: '🤖' },
    openai: { nome: 'OpenAI', descricao: 'Requer API Key própria', gratuito: false, icone: '💡' },
    anthropic: { nome: 'Anthropic', descricao: 'Requer API Key própria', gratuito: false, icone: '🧠' },
    google: { nome: 'Google AI', descricao: 'Requer API Key própria', gratuito: false, icone: '✨' },
  }

  const atualizarCampo = useCallback(<K extends keyof FormularioConfig>(campo: K, valor: FormularioConfig[K]) => {
    setFormulario(f => ({ ...f, [campo]: valor }))
  }, [])

  const modeloAtual = MODELOS_GRATUITOS.find(m => m.id === formulario.modelo)

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header com gradiente */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-5 text-white dark:from-slate-600 dark:via-slate-700 dark:to-slate-800"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-500/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-white/5 rounded-full" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg">
              <Settings className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Configurações</h1>
              <p className="text-slate-300 text-sm">Personalize o comportamento do seu agente de IA</p>
            </div>
          </div>
          <Button
            className="bg-amber-600 hover:bg-amber-700 text-white gap-2 shadow-md"
            onClick={() => salvarConfig.mutate(formulario)}
            disabled={salvarConfig.isPending}
          >
            {salvarConfig.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : salvo ? (
              <>
                <CheckCircle2 className="size-4" />
                Salvo!
              </>
            ) : (
              <>
                <Save className="size-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </motion.div>

      {/* Status da Conexão */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className={`size-10 rounded-lg flex items-center justify-center ${
                  resultadoConexao === 'sucesso'
                    ? 'bg-emerald-100 dark:bg-emerald-900/30'
                    : resultadoConexao === 'erro'
                      ? 'bg-red-100 dark:bg-red-900/30'
                      : 'bg-amber-100 dark:bg-amber-900/30'
                }`}>
                  {resultadoConexao === 'sucesso' ? (
                    <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
                  ) : resultadoConexao === 'erro' ? (
                    <ShieldAlert className="size-5 text-red-600 dark:text-red-400" />
                  ) : (
                    <Shield className="size-5 text-amber-600 dark:text-amber-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold">Status da Conexão</h3>
                    {resultadoConexao === 'sucesso' ? (
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 text-[10px] border-0">
                        ● Conectado
                      </Badge>
                    ) : resultadoConexao === 'erro' ? (
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 text-[10px] border-0">
                        ● Desconectado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">
                        ○ Não testado
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Globe className="size-3" />
                      {provedores[formulario.provedorModelo]?.nome || formulario.provedorModelo}
                    </span>
                    <span className="flex items-center gap-1">
                      <Cpu className="size-3" />
                      {obterNomeCurtoModelo(formulario.modelo)}
                    </span>
                    <span className="flex items-center gap-1">
                      {apiKeyConfigurada ? (
                        <>
                          <Key className="size-3 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">Key configurada</span>
                        </>
                      ) : (
                        <>
                          <Key className="size-3 text-red-500" />
                          <span className="text-red-600 dark:text-red-400">Key ausente</span>
                        </>
                      )}
                    </span>
                  </div>
                  {mensagemConexao && (
                    <p className={`text-xs mt-1 ${resultadoConexao === 'sucesso' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {mensagemConexao}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-amber-300 hover:bg-amber-50 hover:border-amber-400 dark:border-amber-700 dark:hover:bg-amber-900/20"
                onClick={testarConexao}
                disabled={testandoConexao}
              >
                {testandoConexao ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : resultadoConexao === 'sucesso' ? (
                  <CheckCircle2 className="size-3.5 text-emerald-500" />
                ) : resultadoConexao === 'erro' ? (
                  <XCircle className="size-3.5 text-red-500" />
                ) : (
                  <Activity className="size-3.5" />
                )}
                Testar Conexão
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs com animação */}
      <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="space-y-4">
        <TabsList className="bg-muted/50 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="modelo" className="gap-1.5 data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900 dark:data-[state=active]:bg-amber-900/30 dark:data-[state=active]:text-amber-300">
            <Cpu className="size-3.5" />
            Modelo
          </TabsTrigger>
          <TabsTrigger value="agente" className="gap-1.5 data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900 dark:data-[state=active]:bg-amber-900/30 dark:data-[state=active]:text-amber-300">
            <Bot className="size-3.5" />
            Agente
          </TabsTrigger>
          <TabsTrigger value="api-key" className="gap-1.5 data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900 dark:data-[state=active]:bg-amber-900/30 dark:data-[state=active]:text-amber-300">
            <Shield className="size-3.5" />
            API Key
          </TabsTrigger>
          <TabsTrigger value="ambiente" className="gap-1.5 data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900 dark:data-[state=active]:bg-amber-900/30 dark:data-[state=active]:text-amber-300">
            <FolderOpen className="size-3.5" />
            Ambiente
          </TabsTrigger>
          <TabsTrigger value="geral" className="gap-1.5 data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900 dark:data-[state=active]:bg-amber-900/30 dark:data-[state=active]:text-amber-300">
            <SlidersHorizontal className="size-3.5" />
            Geral
          </TabsTrigger>
        </TabsList>

        {/* Tab: Modelo (Agora Principal) */}
        <TabsContent value="modelo">
          <AnimatePresence mode="wait">
            <motion.div
              key="modelo"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4"
            >
              {/* Provedor Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Globe className="size-4 text-amber-600 dark:text-amber-400" />
                    Provedor de IA
                  </CardTitle>
                  <CardDescription>
                    Selecione o provedor e modelo de IA. OpenRouter oferece modelos gratuitos!
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(provedores).map(([key, prov]) => (
                      <motion.button
                        key={key}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setFormulario(f => ({
                            ...f,
                            provedorModelo: key,
                            modelo: modelos[key]?.[0] ?? '',
                          }))
                        }}
                        className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                          formulario.provedorModelo === key
                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 shadow-md'
                            : 'border-border hover:border-amber-300 dark:hover:border-amber-700 hover:bg-muted/50'
                        }`}
                      >
                        {formulario.provedorModelo === key && (
                          <div className="absolute top-2 right-2">
                            <CheckCircle2 className="size-4 text-amber-600 dark:text-amber-400" />
                          </div>
                        )}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{prov.icone}</span>
                          <span className="font-semibold text-sm">{prov.nome}</span>
                          {prov.gratuito && (
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-[9px] border-0">
                              GRATUITO
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{prov.descricao}</p>
                      </motion.button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Model Selection - OpenRouter */}
              {formulario.provedorModelo === 'openrouter' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="size-4 text-amber-600 dark:text-amber-400" />
                      Modelos Gratuitos OpenRouter
                    </CardTitle>
                    <CardDescription>
                      Todos os modelos abaixo são gratuitos e não possuem limite de uso
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {MODELOS_GRATUITOS.map((modelo) => (
                        <motion.button
                          key={modelo.id}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => atualizarCampo('modelo', modelo.id)}
                          className={`relative p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                            formulario.modelo === modelo.id
                              ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 shadow-sm'
                              : 'border-border hover:border-amber-300 dark:hover:border-amber-700 hover:bg-muted/50'
                          }`}
                        >
                          {formulario.modelo === modelo.id && (
                            <div className="absolute top-2 right-2">
                              <CheckCircle2 className="size-3.5 text-amber-600 dark:text-amber-400" />
                            </div>
                          )}
                          <div className="flex items-center gap-2 mb-0.5">
                            <div className={`size-6 rounded-md ${modelo.cor} flex items-center justify-center text-white text-[10px] font-bold`}>
                              {modelo.nome.charAt(0)}
                            </div>
                            <span className="font-medium text-sm">{modelo.nome}</span>
                            {modelo.destaque && (
                              <Badge variant="outline" className="text-[8px] h-4 border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400">
                                Popular
                              </Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground">{modelo.provedor}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{modelo.descricao}</p>
                        </motion.button>
                      ))}
                    </div>

                    {/* Current model info */}
                    {modeloAtual && (
                      <div className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
                        <div className="flex items-center gap-2">
                          <Zap className="size-4 text-amber-600 dark:text-amber-400" />
                          <span className="text-sm font-medium">Modelo selecionado:</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 ml-6">
                          {modeloAtual.nome} ({modeloAtual.id})
                        </p>
                        <p className="text-xs text-muted-foreground ml-6">
                          {modeloAtual.descricao}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Model Selection - Other Providers */}
              {formulario.provedorModelo !== 'openrouter' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Cpu className="size-4 text-amber-600 dark:text-amber-400" />
                      Selecionar Modelo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Modelo</Label>
                      <Select
                        value={formulario.modelo}
                        onValueChange={(v) => atualizarCampo('modelo', v)}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(modelos[formulario.provedorModelo] ?? []).map((modelo) => (
                            <SelectItem key={modelo} value={modelo}>
                              {modelo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        {/* Tab: Agente */}
        <TabsContent value="agente">
          <AnimatePresence mode="wait">
            <motion.div
              key="agente"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bot className="size-4 text-amber-600 dark:text-amber-400" />
                    Identidade do Agente
                  </CardTitle>
                  <CardDescription>
                    Configure como o agente se apresenta e se comporta
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="size-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-2xl shadow-md">
                      {formulario.nome.charAt(0) || 'A'}
                    </div>
                    <div>
                      <p className="font-semibold">{formulario.nome || 'Aguiatech'}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 max-w-xs">
                        {formulario.personalidade || 'Agente de IA inteligente e prestativo'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Bot className="size-3.5 text-amber-600 dark:text-amber-400" />
                      Nome do Agente
                    </Label>
                    <Input
                      value={formulario.nome}
                      onChange={(e) => atualizarCampo('nome', e.target.value)}
                      placeholder="Nome do agente"
                      className="focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <MessageSquare className="size-3.5 text-amber-600 dark:text-amber-400" />
                      Personalidade
                    </Label>
                    <Textarea
                      value={formulario.personalidade}
                      onChange={(e) => atualizarCampo('personalidade', e.target.value)}
                      placeholder="Descreva a personalidade e comportamento do agente..."
                      rows={5}
                      className="focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-muted-foreground">
                        Define como o agente responde e interage com os usuários
                      </p>
                      <span className="text-[10px] text-muted-foreground">
                        {formulario.personalidade.length} caracteres
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        {/* Tab: API Key */}
        <TabsContent value="api-key">
          <AnimatePresence mode="wait">
            <motion.div
              key="api-key"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4"
            >
              <Card className="overflow-hidden">
                {/* Shield header inside the card */}
                <div className="bg-gradient-to-r from-amber-50 via-amber-100/50 to-orange-50 dark:from-amber-900/20 dark:via-amber-900/10 dark:to-orange-900/20 p-5 border-b">
                  <div className="flex items-center gap-3">
                    <div className={`size-11 rounded-xl flex items-center justify-center shadow-sm ${
                      keyValida === true
                        ? 'bg-emerald-100 dark:bg-emerald-900/30'
                        : keyValida === false
                          ? 'bg-red-100 dark:bg-red-900/30'
                          : 'bg-amber-200 dark:bg-amber-800/50'
                    }`}>
                      {keyValida === true ? (
                        <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
                      ) : keyValida === false ? (
                        <ShieldAlert className="size-5 text-red-600 dark:text-red-400" />
                      ) : (
                        <Shield className="size-5 text-amber-700 dark:text-amber-300" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold flex items-center gap-2">
                        Chave API OpenRouter
                        {keyValida === true && (
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 text-[9px] border-0">
                            ✓ Válida
                          </Badge>
                        )}
                        {keyValida === false && (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 text-[9px] border-0">
                            ✕ Inválida
                          </Badge>
                        )}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Configure sua chave de API para usar os modelos do OpenRouter
                      </p>
                    </div>
                  </div>
                </div>

                <CardContent className="p-5 space-y-4">
                  {/* Security status indicators */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className={`flex items-center gap-2.5 p-3 rounded-lg border ${
                      apiKeyConfigurada
                        ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800'
                        : 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800'
                    }`}>
                      {apiKeyConfigurada ? (
                        <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="size-4 text-red-600 dark:text-red-400 shrink-0" />
                      )}
                      <div>
                        <p className="text-xs font-medium">Key no Sistema</p>
                        <p className="text-[10px] text-muted-foreground">
                          {apiKeyConfigurada ? 'Configurada' : 'Ausente'}
                        </p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-2.5 p-3 rounded-lg border ${
                      keyValida === true
                        ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800'
                        : keyValida === false
                          ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800'
                          : 'bg-muted/50 border-border'
                    }`}>
                      {keyValida === true ? (
                        <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : keyValida === false ? (
                        <XCircle className="size-4 text-red-600 dark:text-red-400 shrink-0" />
                      ) : (
                        <Shield className="size-4 text-muted-foreground shrink-0" />
                      )}
                      <div>
                        <p className="text-xs font-medium">Validação</p>
                        <p className="text-[10px] text-muted-foreground">
                          {keyValida === true ? 'Verificada' : keyValida === false ? 'Falhou' : 'Não testada'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 p-3 rounded-lg border bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800">
                      <Zap className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <div>
                        <p className="text-xs font-medium">Modelos</p>
                        <p className="text-[10px] text-muted-foreground">8 gratuitos</p>
                      </div>
                    </div>
                  </div>

                  {/* How to get API key */}
                  <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                      <Info className="size-4 text-amber-600 dark:text-amber-400" />
                      Como obter sua chave API
                    </h4>
                    <ol className="text-xs text-muted-foreground space-y-1.5 ml-6 list-decimal">
                      <li>Acesse <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-amber-700 dark:text-amber-400 underline inline-flex items-center gap-1">openrouter.ai/keys <ExternalLink className="size-2.5" /></a></li>
                      <li>Crie uma conta gratuita ou faça login</li>
                      <li>Clique em &quot;Create Key&quot; para gerar uma nova chave</li>
                      <li>Copie a chave e cole no campo abaixo</li>
                    </ol>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      💡 Os modelos gratuitos não exigem cartão de crédito!
                    </p>
                  </div>

                  {/* API Key input */}
                  <div className="space-y-2">
                    <Label>Chave API (sk-or-...)</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type={apiKeyVisivel ? 'text' : 'password'}
                          value={apiKey}
                          onChange={(e) => {
                            setApiKey(e.target.value)
                            setKeyValida(null)
                            setKeyErro(null)
                          }}
                          placeholder="sk-or-v1-..."
                          className="pr-10 font-mono text-sm focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
                        />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 -translate-y-1/2 size-7"
                              onClick={() => setApiKeyVisivel(!apiKeyVisivel)}
                            >
                              {apiKeyVisivel ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {apiKeyVisivel ? 'Ocultar chave' : 'Mostrar chave'}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Button
                        variant="outline"
                        onClick={validarApiKey}
                        disabled={!apiKey.trim() || validandoKey}
                        className="shrink-0 gap-2 border-amber-300 hover:bg-amber-50 dark:border-amber-700 dark:hover:bg-amber-900/20"
                      >
                        {validandoKey ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : keyValida === true ? (
                          <CheckCircle2 className="size-3.5 text-emerald-500" />
                        ) : keyValida === false ? (
                          <XCircle className="size-3.5 text-destructive" />
                        ) : null}
                        Validar
                      </Button>
                    </div>
                    {keyValida === true && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1"
                      >
                        <CheckCircle2 className="size-3" /> Chave válida! Você pode usar os modelos gratuitos.
                      </motion.p>
                    )}
                    {keyValida === false && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-destructive flex items-center gap-1"
                      >
                        <XCircle className="size-3" /> {keyErro || 'Chave inválida'}
                      </motion.p>
                    )}
                  </div>

                  {/* API Key strength indicator */}
                  {apiKey.trim() && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground">Força da chave</span>
                        <span className={`font-medium ${
                          apiKey.startsWith('sk-or-v1-') && apiKey.length > 30
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : apiKey.length > 10
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-red-600 dark:text-red-400'
                        }`}>
                          {apiKey.startsWith('sk-or-v1-') && apiKey.length > 30
                            ? 'Formato correto'
                            : apiKey.length > 10
                              ? 'Formato incomum'
                              : 'Muito curta'
                          }
                        </span>
                      </div>
                      <Progress
                        value={
                          apiKey.startsWith('sk-or-v1-') && apiKey.length > 30
                            ? 100
                            : apiKey.length > 20
                              ? 60
                              : apiKey.length > 10
                                ? 30
                                : 10
                        }
                        className="h-1.5"
                      />
                    </div>
                  )}

                  <Button
                    className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                    onClick={() => salvarApiKey.mutate(apiKey.trim())}
                    disabled={!apiKey.trim() || salvarApiKey.isPending}
                  >
                    {salvarApiKey.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    Salvar Chave API
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        {/* Tab: Ambiente */}
        <TabsContent value="ambiente">
          <AnimatePresence mode="wait">
            <motion.div
              key="ambiente"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FolderOpen className="size-4 text-amber-600 dark:text-amber-400" />
                    Ambiente de Trabalho
                  </CardTitle>
                  <CardDescription>
                    Configure o diretório e ambiente de execução
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="size-10 rounded-lg bg-amber-200 dark:bg-amber-800/50 flex items-center justify-center">
                      <Server className="size-5 text-amber-700 dark:text-amber-300" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Diretório Atual</p>
                      <p className="text-xs font-mono text-muted-foreground">{formulario.diretorioTrabalho || '~/aguiatech'}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <FolderOpen className="size-3.5 text-amber-600 dark:text-amber-400" />
                      Diretório de Trabalho
                    </Label>
                    <Input
                      value={formulario.diretorioTrabalho}
                      onChange={(e) => atualizarCampo('diretorioTrabalho', e.target.value)}
                      placeholder="~/aguiatech"
                      className="font-mono focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Diretório base para operações de arquivo do agente
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        {/* Tab: Geral */}
        <TabsContent value="geral">
          <AnimatePresence mode="wait">
            <motion.div
              key="geral"
              variants={tabVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4"
            >
              {/* System Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Monitor className="size-4 text-amber-600 dark:text-amber-400" />
                    Informações do Sistema
                  </CardTitle>
                  <CardDescription>
                    Detalhes técnicos da plataforma Aguiatech
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                      <div className="size-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <Code2 className="size-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Versão</p>
                        <p className="text-sm font-medium">v0.3.0</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                      <div className="size-9 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                        <Zap className="size-4 text-sky-600 dark:text-sky-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Framework</p>
                        <p className="text-sm font-medium">Next.js 16</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                      <div className="size-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <Globe className="size-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Provedor Padrão</p>
                        <p className="text-sm font-medium">OpenRouter</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                      <div className="size-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Cpu className="size-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Modelo Padrão</p>
                        <p className="text-sm font-medium">Llama 3.3 70B 🆓</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                      <div className="size-9 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                        <Database className="size-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Banco de dados</p>
                        <p className="text-sm font-medium">SQLite (Prisma)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                      <div className="size-9 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                        <Heart className="size-4 text-rose-600 dark:text-rose-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Desenvolvedor</p>
                        <p className="text-sm font-medium">Aguiavision</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Available Models */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="size-4 text-amber-600 dark:text-amber-400" />
                    Modelos Gratuitos Disponíveis
                  </CardTitle>
                  <CardDescription>
                    8 modelos gratuitos via OpenRouter prontos para uso
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {MODELOS_GRATUITOS.map((modelo) => (
                      <div
                        key={modelo.id}
                        className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50 border border-border/50 hover:bg-muted transition-colors"
                      >
                        <div className={`size-7 rounded-md ${modelo.cor} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                          {modelo.nome.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium">{modelo.nome}</span>
                          <p className="text-[10px] text-muted-foreground">{modelo.provedor} · {modelo.descricao}</p>
                        </div>
                        {modelo.destaque && (
                          <Badge variant="outline" className="text-[8px] h-4 shrink-0 border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400">
                            Popular
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Engine info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Server className="size-4 text-amber-600 dark:text-amber-400" />
                    Motor Aguiatech
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="size-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold shadow-md">
                        A
                      </div>
                      <div>
                        <p className="font-semibold">Aguiatech Engine</p>
                        <p className="text-xs text-muted-foreground">Plataforma de agentes de IA com memória persistente</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="p-2 rounded bg-white/50 dark:bg-white/5">
                        <p className="text-lg font-bold text-amber-700 dark:text-amber-400">12</p>
                        <p className="text-[10px] text-muted-foreground">Modelos DB</p>
                      </div>
                      <div className="p-2 rounded bg-white/50 dark:bg-white/5">
                        <p className="text-lg font-bold text-amber-700 dark:text-amber-400">10</p>
                        <p className="text-[10px] text-muted-foreground">Ferramentas</p>
                      </div>
                      <div className="p-2 rounded bg-white/50 dark:bg-white/5">
                        <p className="text-lg font-bold text-amber-700 dark:text-amber-400">8</p>
                        <p className="text-[10px] text-muted-foreground">Modelos IA</p>
                      </div>
                      <div className="p-2 rounded bg-white/50 dark:bg-white/5">
                        <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">🆓</p>
                        <p className="text-[10px] text-muted-foreground">Gratuito</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export function Config() {
  const { data: config, isLoading } = useQuery<ConfigAgente>({
    queryKey: ['config-agente'],
    queryFn: () => fetch('/api/config/agente').then(r => r.json()),
  })

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        {/* Skeleton header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        {/* Skeleton status card */}
        <Skeleton className="h-20 w-full rounded-lg" />
        {/* Skeleton tabs */}
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-md" />
          ))}
        </div>
        {/* Skeleton content cards */}
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  return <FormularioConfigAgente config={config} />
}
