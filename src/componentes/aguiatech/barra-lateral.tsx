'use client'

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
  Cpu,
  Bot,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useQuery } from '@tanstack/react-query'
import { useEstadoAguiatech, type SecaoAtiva } from '@/lib/estado'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { obterNomeCurtoModelo, modeloEhGratis, formatarProvedor } from '@/lib/openrouter'

interface Estatisticas {
  totalConversas: number
  totalHabilidades: number
  totalMemorias: number
  ferramentasAtivas: number
}

interface Agente {
  id: string
  nome: string
  modelo: string
  provedorModelo: string
  personalidade: string
  ativo: boolean
}

const itensNavegacao: { secao: SecaoAtiva; rotulo: string; icone: React.ElementType; atalho: string; corIcone: string }[] = [
  { secao: 'painel', rotulo: 'Painel', icone: LayoutDashboard, atalho: 'Ctrl+1', corIcone: 'text-amber-500' },
  { secao: 'conversas', rotulo: 'Conversas', icone: MessageSquare, atalho: 'Ctrl+2', corIcone: 'text-sky-500' },
  { secao: 'habilidades', rotulo: 'Habilidades', icone: Sparkles, atalho: 'Ctrl+3', corIcone: 'text-emerald-500' },
  { secao: 'agentes', rotulo: 'Agentes', icone: Bot, atalho: 'Ctrl+4', corIcone: 'text-teal-500' },
  { secao: 'orquestrador', rotulo: 'Orquestrador', icone: Cpu, atalho: 'Ctrl+5', corIcone: 'text-violet-500' },
  { secao: 'memorias', rotulo: 'Memórias', icone: Brain, atalho: 'Ctrl+6', corIcone: 'text-purple-500' },
  { secao: 'ferramentas', rotulo: 'Ferramentas', icone: Wrench, atalho: 'Ctrl+7', corIcone: 'text-orange-500' },
  { secao: 'conexoes-mcp', rotulo: 'Conexões MCP', icone: Link, atalho: 'Ctrl+8', corIcone: 'text-indigo-500' },
  { secao: 'agendador', rotulo: 'Agendador', icone: Clock, atalho: 'Ctrl+9', corIcone: 'text-rose-500' },
  { secao: 'config', rotulo: 'Configurações', icone: Settings, atalho: 'Ctrl+0', corIcone: 'text-slate-500' },
]

export function BarraLateral() {
  const { secaoAtiva, setSecaoAtiva, setCommandPaletteAberta } = useEstadoAguiatech()
  const { resolvedTheme, setTheme } = useTheme()
  const escuro = resolvedTheme === 'dark'

  const { data: estatisticas } = useQuery<Estatisticas>({
    queryKey: ['estatisticas'],
    queryFn: () => fetch('/api/estatisticas').then(r => r.json()),
  })

  const { data: agente } = useQuery<Agente>({
    queryKey: ['agente'],
    queryFn: () => fetch('/api/agente').then(r => r.json()),
  })

  // Badge counters for nav items
  const contadores: Partial<Record<SecaoAtiva, number>> = {
    conversas: estatisticas?.totalConversas ?? 0,
    habilidades: estatisticas?.totalHabilidades ?? 0,
    memorias: estatisticas?.totalMemorias ?? 0,
    ferramentas: estatisticas?.ferramentasAtivas ?? 0,
  }

  const modeloNome = agente?.modelo ?? ''
  const nomeCurto = obterNomeCurtoModelo(modeloNome)
  const ehGratis = modeloEhGratis(modeloNome)
  const provedorFormatado = agente?.provedorModelo ? formatarProvedor(agente.provedorModelo) : ''

  return (
    <Sidebar collapsible="icon" className="border-r border-amber-200/50 dark:border-amber-800/30">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <div className="size-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
            A
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-bold text-lg text-amber-700 dark:text-amber-400 tracking-tight">Aguiatech</span>
            <span className="text-[10px] text-muted-foreground leading-tight">
              O Agente de IA que Cresce com Você
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-amber-600 dark:text-amber-500 text-[11px] font-semibold uppercase tracking-wider">
            Navegação
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {itensNavegacao.map((item) => {
                const ativo = secaoAtiva === item.secao
                const contador = contadores[item.secao]
                return (
                  <SidebarMenuItem key={item.secao}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          isActive={ativo}
                          onClick={() => setSecaoAtiva(item.secao)}
                          className={
                            `relative transition-all duration-200 ease-in-out ` +
                            `hover:scale-[1.02] hover:translate-x-0.5 ` +
                            (ativo
                              ? `bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50 font-medium shadow-sm ` +
                                `border-l-2 border-amber-500 dark:border-amber-400 -ml-[2px] pl-[calc(0.5rem+2px)]`
                              : `hover:bg-amber-50 dark:hover:bg-amber-900/10 border-l-2 border-transparent -ml-[2px] pl-[calc(0.5rem+2px)]`)
                          }
                        >
                          <item.icone className={`${ativo ? item.corIcone : 'text-muted-foreground group-hover:text-foreground'} transition-colors duration-200`} />
                          <span className="flex-1">{item.rotulo}</span>
                          {contador !== undefined && contador > 0 && (
                            <Badge
                              variant={ativo ? 'default' : 'secondary'}
                              className={`text-[9px] h-4 min-w-[1.25rem] px-1 transition-transform duration-200 ${
                                ativo
                                  ? 'bg-amber-600 text-white hover:bg-amber-600'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {contador}
                            </Badge>
                          )}
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="flex items-center gap-2">
                        <span>{item.rotulo}</span>
                        <kbd className="ml-2 inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
                          {item.atalho}
                        </kbd>
                      </TooltipContent>
                    </Tooltip>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Search */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-amber-600 dark:text-amber-500 text-[11px] font-semibold uppercase tracking-wider">
            Busca Rápida
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton
                      onClick={() => setCommandPaletteAberta(true)}
                      className="text-muted-foreground hover:text-amber-700 dark:hover:text-amber-400 transition-all duration-200 hover:scale-[1.02] hover:translate-x-0.5"
                    >
                      <Search className="size-4" />
                      <span>Buscar... ⌘K</span>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    Abrir paleta de comandos
                  </TooltipContent>
                </Tooltip>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarSeparator />

        {/* Agent Model Info */}
        <div className="group-data-[collapsible=icon]:hidden mt-2 px-2 space-y-2">
          <div className="flex items-center gap-2">
            <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-muted-foreground font-medium">Agente ativo</span>
          </div>

          {agente && (
            <div className="rounded-md bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-800/40 p-2 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Cpu className="size-3 text-amber-600 dark:text-amber-400" />
                <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                  {nomeCurto}
                </span>
                {ehGratis && (
                  <span className="text-[9px] leading-none" title="Modelo gratuito">🆓</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <Badge
                  variant="outline"
                  className="h-4 text-[8px] px-1.5 gap-1 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-900/30 hover:bg-amber-100/50 dark:hover:bg-amber-900/30"
                >
                  {provedorFormatado === 'OpenRouter' && (
                    <span className="size-1 rounded-full bg-emerald-500 inline-block" />
                  )}
                  {provedorFormatado}
                </Badge>
                {ehGratis && (
                  <span className="text-[8px] text-emerald-600 dark:text-emerald-400 font-medium">
                    Gratuito
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Collapsed icon state for model */}
        <div className="hidden group-data-[collapsible=icon]:flex flex-col items-center gap-1 mt-1">
          <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="size-6 rounded bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center cursor-default">
                <Cpu className="size-3 text-amber-600 dark:text-amber-400" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="flex flex-col items-start gap-0.5">
              <span className="font-medium">{nomeCurto}{ehGratis ? ' 🆓' : ''}</span>
              <span className="text-[10px] text-muted-foreground">{provedorFormatado}</span>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Theme toggle */}
        <div className="flex items-center gap-1 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-2 mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(escuro ? 'light' : 'dark')}
            className="flex-1 justify-start gap-2 text-muted-foreground hover:text-amber-700 dark:hover:text-amber-400 transition-colors duration-200"
            suppressHydrationWarning
          >
            {escuro ? <Sun className="size-4" /> : <Moon className="size-4" />}
            <span className="group-data-[collapsible=icon]:hidden" suppressHydrationWarning>
              {escuro ? 'Modo Claro' : 'Modo Escuro'}
            </span>
          </Button>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
