import { create } from 'zustand'

type SecaoAtiva = 'painel' | 'conversas' | 'agentes' | 'habilidades' | 'memorias' | 'ferramentas' | 'conexoes-mcp' | 'agendador' | 'orquestrador' | 'diretrizes-ia' | 'agentes-ia' | 'config'

type TipoNotificacao = 'info' | 'success' | 'warning' | 'error' | 'system'

interface Notificacao {
  id: string
  tipo: TipoNotificacao
  titulo: string
  descricao: string
  lida: boolean
  createdAt: string
}

interface EstadoAguiatech {
  // Navegação
  secaoAtiva: SecaoAtiva
  setSecaoAtiva: (secao: SecaoAtiva) => void
  
  // Sidebar
  sidebarAberta: boolean
  toggleSidebar: () => void
  setSidebarAberta: (aberta: boolean) => void
  
  // Conversas
  conversaAtiva: string | null
  setConversaAtiva: (id: string | null) => void
  
  // Agente para conversar
  agenteIdParaConversa: string | null
  setAgenteIdParaConversa: (id: string | null) => void
  
  // Command palette
  commandPaletteAberta: boolean
  setCommandPaletteAberta: (aberta: boolean) => void
  
  // Filtros
  filtroCategoriaHabilidade: string
  setFiltroCategoriaHabilidade: (categoria: string) => void
  filtroTipoMemoria: string
  setFiltroTipoMemoria: (tipo: string) => void
  filtroCategoriaFerramenta: string
  setFiltroCategoriaFerramenta: (categoria: string) => void

  // Notificações
  notificacoes: Notificacao[]
  notificacoesAbertas: boolean
  setNotificacoesAbertas: (aberta: boolean) => void
  adicionarNotificacao: (notificacao: Omit<Notificacao, 'id' | 'createdAt' | 'lida'>) => void
  marcarNotificacaoLida: (id: string) => void
  marcarTodasLidas: () => void
  limparNotificacoes: () => void
  removerNotificacao: (id: string) => void

  // Atalhos overlay
  atalhosAbertos: boolean
  setAtalhosAbertos: (aberto: boolean) => void
}

const MAX_NOTIFICACOES = 50

export const useEstadoAguiatech = create<EstadoAguiatech>((set) => ({
  // Navegação
  secaoAtiva: 'painel',
  setSecaoAtiva: (secao) => set({ secaoAtiva: secao }),
  
  // Sidebar
  sidebarAberta: true,
  toggleSidebar: () => set((state) => ({ sidebarAberta: !state.sidebarAberta })),
  setSidebarAberta: (aberta) => set({ sidebarAberta: aberta }),
  
  // Conversas
  conversaAtiva: null,
  setConversaAtiva: (id) => set({ conversaAtiva: id }),
  
  // Agente para conversar
  agenteIdParaConversa: null,
  setAgenteIdParaConversa: (id) => set({ agenteIdParaConversa: id }),
  
  // Command palette
  commandPaletteAberta: false,
  setCommandPaletteAberta: (aberta) => set({ commandPaletteAberta: aberta }),
  
  // Filtros
  filtroCategoriaHabilidade: 'todas',
  setFiltroCategoriaHabilidade: (categoria) => set({ filtroCategoriaHabilidade: categoria }),
  filtroTipoMemoria: 'todas',
  setFiltroTipoMemoria: (tipo) => set({ filtroTipoMemoria: tipo }),
  filtroCategoriaFerramenta: 'todas',
  setFiltroCategoriaFerramenta: (categoria) => set({ filtroCategoriaFerramenta: categoria }),

  // Notificações
  notificacoes: [],
  notificacoesAbertas: false,
  setNotificacoesAbertas: (aberta) => set({ notificacoesAbertas: aberta }),
  adicionarNotificacao: (notificacao) => set((state) => {
    const nova: Notificacao = {
      ...notificacao,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      lida: false,
      createdAt: new Date().toISOString(),
    }
    const atualizadas = [nova, ...state.notificacoes].slice(0, MAX_NOTIFICACOES)
    return { notificacoes: atualizadas }
  }),
  marcarNotificacaoLida: (id) => set((state) => ({
    notificacoes: state.notificacoes.map((n) => n.id === id ? { ...n, lida: true } : n),
  })),
  marcarTodasLidas: () => set((state) => ({
    notificacoes: state.notificacoes.map((n) => ({ ...n, lida: true })),
  })),
  limparNotificacoes: () => set({ notificacoes: [] }),
  removerNotificacao: (id) => set((state) => ({
    notificacoes: state.notificacoes.filter((n) => n.id !== id),
  })),

  // Atalhos overlay
  atalhosAbertos: false,
  setAtalhosAbertos: (aberto) => set({ atalhosAbertos: aberto }),
}))

export type { SecaoAtiva, TipoNotificacao, Notificacao }
