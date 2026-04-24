import { create } from 'zustand'

type SecaoAtiva = 'painel' | 'conversas' | 'agentes' | 'habilidades' | 'memorias' | 'ferramentas' | 'conexoes-mcp' | 'agendador' | 'config'

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
}

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
}))

export type { SecaoAtiva }
