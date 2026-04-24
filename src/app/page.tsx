'use client'

import { useEffect, useCallback } from 'react'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { ThemeProvider, useTheme } from 'next-themes'
import { QueryProvider } from '@/componentes/provedores/query-provider'
import { BarraLateral } from '@/componentes/aguiatech/barra-lateral'
import { Rodape } from '@/componentes/aguiatech/rodape'
import { Painel } from '@/componentes/aguiatech/painel'
import { Conversas } from '@/componentes/aguiatech/conversas'
import { Habilidades } from '@/componentes/aguiatech/habilidades'
import { Memorias } from '@/componentes/aguiatech/memorias'
import { Ferramentas } from '@/componentes/aguiatech/ferramentas'
import { ConexoesMCP } from '@/componentes/aguiatech/conexoes-mcp'
import { Agendador } from '@/componentes/aguiatech/agendador'
import { Config } from '@/componentes/aguiatech/config'
import { Agentes } from '@/componentes/aguiatech/agentes'
import { useEstadoAguiatech, type SecaoAtiva } from '@/lib/estado'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  LayoutDashboard,
  MessageSquare,
  Sparkles,
  Brain,
  Wrench,
  Link,
  Clock,
  Settings,
  Moon,
  Sun,
  Search,
  Bot,
} from 'lucide-react'

const secoesNavegacao: { secao: SecaoAtiva; rotulo: string; icone: React.ElementType; atalho: string }[] = [
  { secao: 'painel', rotulo: 'Painel', icone: LayoutDashboard, atalho: 'Ctrl+1' },
  { secao: 'conversas', rotulo: 'Conversas', icone: MessageSquare, atalho: 'Ctrl+2' },
  { secao: 'habilidades', rotulo: 'Habilidades', icone: Sparkles, atalho: 'Ctrl+3' },
  { secao: 'agentes', rotulo: 'Agentes', icone: Bot, atalho: 'Ctrl+4' },
  { secao: 'memorias', rotulo: 'Memórias', icone: Brain, atalho: 'Ctrl+5' },
  { secao: 'ferramentas', rotulo: 'Ferramentas', icone: Wrench, atalho: 'Ctrl+6' },
  { secao: 'conexoes-mcp', rotulo: 'Conexões MCP', icone: Link, atalho: 'Ctrl+7' },
  { secao: 'agendador', rotulo: 'Agendador', icone: Clock, atalho: 'Ctrl+8' },
  { secao: 'config', rotulo: 'Configurações', icone: Settings, atalho: 'Ctrl+9' },
]

// Page transition animation variants
const pageVariants = {
  initial: { opacity: 0, x: 12 },
  enter: { opacity: 1, x: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, x: -8, transition: { duration: 0.12, ease: 'easeIn' } },
}

function CommandPalette() {
  const { secaoAtiva, setSecaoAtiva, commandPaletteAberta, setCommandPaletteAberta } = useEstadoAguiatech()
  const { theme, setTheme } = useTheme()

  // Ctrl+K para abrir/fechar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteAberta(!commandPaletteAberta)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [commandPaletteAberta, setCommandPaletteAberta])

  const executarAcao = useCallback((secao: SecaoAtiva) => {
    setSecaoAtiva(secao)
    setCommandPaletteAberta(false)
  }, [setSecaoAtiva, setCommandPaletteAberta])

  return (
    <CommandDialog open={commandPaletteAberta} onOpenChange={setCommandPaletteAberta}>
      <CommandInput placeholder="Buscar comandos, seções ou ações..." />
      <CommandList>
        <CommandEmpty>Nenhum comando encontrado</CommandEmpty>
        <CommandGroup heading="Navegação">
          {secoesNavegacao.map((item) => (
            <CommandItem
              key={item.secao}
              onSelect={() => executarAcao(item.secao)}
              className={secaoAtiva === item.secao ? 'bg-amber-50 dark:bg-amber-900/20' : ''}
            >
              <item.icone className="mr-2 size-4 text-amber-600 dark:text-amber-400" />
              <span>{item.rotulo}</span>
              {secaoAtiva === item.secao && (
                <span className="ml-auto text-[10px] text-amber-600 dark:text-amber-400">Ativo</span>
              )}
              <span className="ml-2 text-[10px] text-muted-foreground">{item.atalho}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Ações">
          <CommandItem onSelect={() => { executarAcao('conversas'); setCommandPaletteAberta(false) }}>
            <MessageSquare className="mr-2 size-4 text-amber-600 dark:text-amber-400" />
            <span>Nova Conversa</span>
          </CommandItem>
          <CommandItem onSelect={() => { executarAcao('habilidades'); setCommandPaletteAberta(false) }}>
            <Sparkles className="mr-2 size-4 text-amber-600 dark:text-amber-400" />
            <span>Nova Habilidade</span>
          </CommandItem>
          <CommandItem onSelect={() => { executarAcao('memorias'); setCommandPaletteAberta(false) }}>
            <Brain className="mr-2 size-4 text-amber-600 dark:text-amber-400" />
            <span>Nova Memória</span>
          </CommandItem>
          <CommandItem onSelect={() => { executarAcao('ferramentas'); setCommandPaletteAberta(false) }}>
            <Wrench className="mr-2 size-4 text-amber-600 dark:text-amber-400" />
            <span>Gerenciar Ferramentas</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Sistema">
          <CommandItem onSelect={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); setCommandPaletteAberta(false) }}>
            {theme === 'dark' ? (
              <Sun className="mr-2 size-4 text-amber-600 dark:text-amber-400" />
            ) : (
              <Moon className="mr-2 size-4 text-amber-600 dark:text-amber-400" />
            )}
            <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
            <span className="ml-2 text-[10px] text-muted-foreground">Ctrl+D</span>
          </CommandItem>
          <CommandItem onSelect={() => { setCommandPaletteAberta(false) }}>
            <Search className="mr-2 size-4 text-amber-600 dark:text-amber-400" />
            <span>Buscar na Web</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

function AtalhosGlobais() {
  const { setSecaoAtiva, toggleSidebar } = useEstadoAguiatech()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+\ para toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault()
        toggleSidebar()
      }
      // Ctrl+D para toggle dark mode
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault()
        setTheme(theme === 'dark' ? 'light' : 'dark')
      }
      // Ctrl+1-9 para navegação
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
        const num = parseInt(e.key)
        if (num >= 1 && num <= 9) {
          e.preventDefault()
          setSecaoAtiva(secoesNavegacao[num - 1].secao)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setSecaoAtiva, toggleSidebar, theme, setTheme])

  return null
}

// Section renderer component for clean code
function SecaoConteudo({ secao }: { secao: SecaoAtiva }) {
  switch (secao) {
    case 'painel': return <Painel />
    case 'conversas': return <Conversas />
    case 'habilidades': return <Habilidades />
    case 'agentes': return <Agentes />
    case 'memorias': return <Memorias />
    case 'ferramentas': return <Ferramentas />
    case 'conexoes-mcp': return <ConexoesMCP />
    case 'agendador': return <Agendador />
    case 'config': return <Config />
    default: return <Painel />
  }
}

function ConteudoPrincipal() {
  const { secaoAtiva, setCommandPaletteAberta } = useEstadoAguiatech()

  const rotulos: Record<string, string> = {
    painel: 'Painel',
    conversas: 'Conversas',
    habilidades: 'Habilidades',
    agentes: 'Agentes',
    memorias: 'Memórias',
    ferramentas: 'Ferramentas',
    'conexoes-mcp': 'Conexões MCP',
    agendador: 'Agendador',
    config: 'Configurações',
  }

  const iconesSecao: Record<string, React.ReactNode> = {
    painel: <LayoutDashboard className="size-3.5 text-amber-500" />,
    conversas: <MessageSquare className="size-3.5 text-sky-500" />,
    habilidades: <Sparkles className="size-3.5 text-emerald-500" />,
    agentes: <Bot className="size-3.5 text-teal-500" />,
    memorias: <Brain className="size-3.5 text-purple-500" />,
    ferramentas: <Wrench className="size-3.5 text-orange-500" />,
    'conexoes-mcp': <Link className="size-3.5 text-indigo-500" />,
    agendador: <Clock className="size-3.5 text-rose-500" />,
    config: <Settings className="size-3.5 text-slate-500" />,
  }

  return (
    <SidebarInset>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4 bg-background/80 backdrop-blur-sm">
        <SidebarTrigger className="-ml-1 hover:text-amber-600" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex items-center gap-2">
          {iconesSecao[secaoAtiva]}
          <span className="text-sm font-medium">
            {rotulos[secaoAtiva]}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setCommandPaletteAberta(true)}
            className="hidden sm:flex items-center gap-2 h-7 rounded-md border border-input bg-muted/50 px-3 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-xs"
          >
            <Search className="size-3" />
            <span>Buscar...</span>
            <kbd className="inline-flex h-4 items-center rounded border bg-background px-1 font-mono text-[9px] text-muted-foreground">
              ⌘K
            </kbd>
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={secaoAtiva}
              variants={pageVariants}
              initial="initial"
              animate="enter"
              exit="exit"
            >
              <SecaoConteudo secao={secaoAtiva} />
            </motion.div>
          </AnimatePresence>
        </div>
        <Rodape />
      </div>
    </SidebarInset>
  )
}

export default function Home() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryProvider>
        <SidebarProvider>
          <BarraLateral />
          <ConteudoPrincipal />
          <CommandPalette />
          <AtalhosGlobais />
        </SidebarProvider>
      </QueryProvider>
    </ThemeProvider>
  )
}
