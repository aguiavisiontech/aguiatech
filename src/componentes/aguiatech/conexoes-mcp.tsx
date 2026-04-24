'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Link,
  Plus,
  Pencil,
  Trash2,
  Terminal,
  Globe,
  Wifi,
  WifiOff,
  Activity,
  Cable,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
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

interface ConexaoMCP {
  id: string
  nome: string
  tipo: string
  comando: string | null
  args: string | null
  url: string | null
  ativa: boolean
  createdAt: string
  updatedAt: string
}

export function ConexoesMCP() {
  const queryClient = useQueryClient()
  const [dialogoAberto, setDialogoAberto] = useState(false)
  const [editando, setEditando] = useState<ConexaoMCP | null>(null)
  const [formulario, setFormulario] = useState({
    nome: '',
    tipo: 'stdio',
    comando: '',
    args: '',
    url: '',
  })

  const { data: conexoes, isLoading } = useQuery<ConexaoMCP[]>({
    queryKey: ['conexoes-mcp'],
    queryFn: () => fetch('/api/conexoes-mcp').then(r => r.json()),
  })

  const criarConexao = useMutation({
    mutationFn: (dados: typeof formulario) =>
      fetch('/api/conexoes-mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conexoes-mcp'] })
      setDialogoAberto(false)
      resetFormulario()
    },
  })

  const atualizarConexao = useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: Partial<typeof formulario> }) =>
      fetch(`/api/conexoes-mcp/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conexoes-mcp'] })
      setDialogoAberto(false)
      setEditando(null)
      resetFormulario()
    },
  })

  const deletarConexao = useMutation({
    mutationFn: (id: string) => fetch(`/api/conexoes-mcp/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conexoes-mcp'] })
    },
  })

  const toggleConexao = useMutation({
    mutationFn: ({ id, ativa }: { id: string; ativa: boolean }) =>
      fetch(`/api/conexoes-mcp/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativa }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conexoes-mcp'] })
    },
  })

  const resetFormulario = () => {
    setFormulario({ nome: '', tipo: 'stdio', comando: '', args: '', url: '' })
  }

  const abrirEdicao = (conexao: ConexaoMCP) => {
    setEditando(conexao)
    setFormulario({
      nome: conexao.nome,
      tipo: conexao.tipo,
      comando: conexao.comando ?? '',
      args: conexao.args ?? '',
      url: conexao.url ?? '',
    })
    setDialogoAberto(true)
  }

  // Computed stats
  const totalConexoes = conexoes?.length ?? 0
  const conexoesAtivas = conexoes?.filter(c => c.ativa).length ?? 0
  const totalStdio = conexoes?.filter(c => c.tipo === 'stdio').length ?? 0
  const totalSSE = conexoes?.filter(c => c.tipo === 'sse').length ?? 0

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header com gradiente */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-5 text-white dark:from-indigo-500 dark:via-indigo-600 dark:to-purple-700"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-white/5 rounded-full" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-white/20 flex items-center justify-center shadow-md backdrop-blur-sm">
              <Cable className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Conexões MCP</h1>
              <p className="text-indigo-200 text-sm">Gerencie conexões com servidores Model Context Protocol</p>
            </div>
          </div>
          <Dialog open={dialogoAberto} onOpenChange={(aberto) => {
            setDialogoAberto(aberto)
            if (!aberto) { setEditando(null); resetFormulario() }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-white/20 hover:bg-white/30 text-white gap-2 backdrop-blur-sm border border-white/20">
                <Plus className="size-4" />
                Nova Conexão
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editando ? 'Editar Conexão' : 'Nova Conexão MCP'}</DialogTitle>
                <DialogDescription>
                  {editando ? 'Altere os dados da conexão' : 'Configure uma nova conexão com servidor MCP'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={formulario.nome}
                    onChange={(e) => setFormulario(f => ({ ...f, nome: e.target.value }))}
                    placeholder="Nome da conexão"
                    className="focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={formulario.tipo} onValueChange={(v) => setFormulario(f => ({ ...f, tipo: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stdio">⚡ STDIO</SelectItem>
                      <SelectItem value="sse">🌐 SSE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formulario.tipo === 'stdio' ? (
                  <>
                    <div className="space-y-2">
                      <Label>Comando</Label>
                      <Input
                        value={formulario.comando}
                        onChange={(e) => setFormulario(f => ({ ...f, comando: e.target.value }))}
                        placeholder="ex: npx, python, node"
                        className="font-mono focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Argumentos (separados por espaço)</Label>
                      <Input
                        value={formulario.args}
                        onChange={(e) => setFormulario(f => ({ ...f, args: e.target.value }))}
                        placeholder="ex: -y @modelcontextprotocol/server-memory"
                        className="font-mono focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Label>URL</Label>
                    <Input
                      value={formulario.url}
                      onChange={(e) => setFormulario(f => ({ ...f, url: e.target.value }))}
                      placeholder="https://servidor-mcp.com/sse"
                      className="font-mono focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setDialogoAberto(false); setEditando(null); resetFormulario() }}>
                  Cancelar
                </Button>
                <Button
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={() => {
                    if (editando) {
                      atualizarConexao.mutate({ id: editando.id, dados: formulario })
                    } else {
                      criarConexao.mutate(formulario)
                    }
                  }}
                  disabled={!formulario.nome}
                >
                  {editando ? 'Salvar' : 'Criar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/50 border border-border/50">
            <div className="size-8 rounded-md bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <Cable className="size-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-lg font-bold">{isLoading ? '-' : totalConexoes}</p>
              <p className="text-[10px] text-muted-foreground">Total</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/50 border border-border/50">
            <div className="size-8 rounded-md bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Wifi className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-lg font-bold">{isLoading ? '-' : conexoesAtivas}</p>
              <p className="text-[10px] text-muted-foreground">Ativas</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/50 border border-border/50">
            <div className="size-8 rounded-md bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Terminal className="size-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-lg font-bold">{isLoading ? '-' : totalStdio}</p>
              <p className="text-[10px] text-muted-foreground">STDIO</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/50 border border-border/50">
            <div className="size-8 rounded-md bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
              <Globe className="size-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <p className="text-lg font-bold">{isLoading ? '-' : totalSSE}</p>
              <p className="text-[10px] text-muted-foreground">SSE</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Lista de Conexões */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-3 p-4 rounded-lg border">
              <div className="flex items-center gap-2">
                <Skeleton className="size-4 rounded" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-8 w-full rounded" />
            </div>
          ))}
        </div>
      ) : !conexoes || conexoes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <div className="relative mb-4">
                <div className="size-20 rounded-full bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center">
                  <Cable className="size-10 text-indigo-400 dark:text-indigo-500" />
                </div>
                <div className="absolute -bottom-1 -right-1 size-7 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center border-2 border-background">
                  <Plus className="size-3.5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <p className="font-medium text-foreground">Nenhuma conexão MCP configurada</p>
              <p className="text-xs mt-1 max-w-xs text-center">Adicione uma conexão com servidor MCP para expandir as capacidades do agente com ferramentas externas</p>
              <Button
                variant="outline"
                className="mt-4 gap-2 border-indigo-300 hover:bg-indigo-50 dark:border-indigo-700 dark:hover:bg-indigo-900/20"
                onClick={() => setDialogoAberto(true)}
              >
                <Plus className="size-4" />
                Criar Primeira Conexão
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {conexoes.map((conexao, i) => (
              <motion.div
                key={conexao.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className={`hover:shadow-md transition-all border-l-4 ${
                  conexao.tipo === 'stdio'
                    ? conexao.ativa
                      ? 'border-l-amber-500 hover:border-amber-300 dark:hover:border-amber-700'
                      : 'border-l-amber-300 dark:border-l-amber-800 opacity-60'
                    : conexao.ativa
                      ? 'border-l-sky-500 hover:border-sky-300 dark:hover:border-sky-700'
                      : 'border-l-sky-300 dark:border-l-sky-800 opacity-60'
                }`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`size-8 rounded-lg flex items-center justify-center ${
                          conexao.tipo === 'stdio'
                            ? 'bg-amber-100 dark:bg-amber-900/30'
                            : 'bg-sky-100 dark:bg-sky-900/30'
                        }`}>
                          {conexao.tipo === 'stdio' ? (
                            <Terminal className="size-4 text-amber-600 dark:text-amber-400" />
                          ) : (
                            <Globe className="size-4 text-sky-600 dark:text-sky-400" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-sm">{conexao.nome}</CardTitle>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => toggleConexao.mutate({ id: conexao.id, ativa: !conexao.ativa })}
                          className="cursor-pointer"
                        >
                          {conexao.ativa ? (
                            <Wifi className="size-4 text-emerald-500 hover:text-emerald-600" />
                          ) : (
                            <WifiOff className="size-4 text-muted-foreground hover:text-foreground" />
                          )}
                        </motion.button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-amber-600"
                          onClick={() => abrirEdicao(conexao)}
                        >
                          <Pencil className="size-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-destructive">
                              <Trash2 className="size-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir conexão?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deletarConexao.mutate(conexao.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {conexao.ativa ? (
                        <Badge className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-0">
                          <div className="size-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                          Ativa
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          ○ Inativa
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          conexao.tipo === 'stdio'
                            ? 'border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400'
                            : 'border-sky-300 text-sky-700 dark:border-sky-700 dark:text-sky-400'
                        }`}
                      >
                        {conexao.tipo === 'stdio' ? '⚡ STDIO' : '🌐 SSE'}
                      </Badge>
                    </div>

                    {conexao.tipo === 'stdio' && conexao.comando && (
                      <div className="bg-muted/80 p-2.5 rounded-md text-xs font-mono border border-border/50">
                        <span className="text-amber-700 dark:text-amber-400 font-semibold">{conexao.comando}</span>
                        {conexao.args && <span className="text-muted-foreground"> {conexao.args}</span>}
                      </div>
                    )}

                    {conexao.tipo === 'sse' && conexao.url && (
                      <div className="bg-muted/80 p-2.5 rounded-md text-xs font-mono truncate border border-border/50">
                        <span className="text-sky-700 dark:text-sky-400">{conexao.url}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Activity className="size-2.5" />
                      <span>Criada em {new Date(conexao.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
