'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Keyboard, X } from 'lucide-react'
import { useEstadoAguiatech } from '@/lib/estado'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface Atalho {
  teclas: string[]
  descricao: string
}

interface CategoriaAtalhos {
  nome: string
  atalhos: Atalho[]
}

const CATEGORIAS: CategoriaAtalhos[] = [
  {
    nome: 'Navegação',
    atalhos: [
      { teclas: ['Ctrl', '1-9'], descricao: 'Navegar entre seções' },
      { teclas: ['Ctrl', '0'], descricao: 'Ir para Configurações' },
      { teclas: ['Ctrl', 'K'], descricao: 'Abrir paleta de comandos' },
      { teclas: ['Ctrl', '\\'], descricao: 'Alternar barra lateral' },
    ],
  },
  {
    nome: 'Ações',
    atalhos: [
      { teclas: ['Ctrl', 'D'], descricao: 'Alternar modo escuro' },
      { teclas: ['?'], descricao: 'Mostrar atalhos' },
      { teclas: ['Esc'], descricao: 'Fechar diálogos' },
    ],
  },
  {
    nome: 'Sistema',
    atalhos: [
      { teclas: ['Ctrl', 'Shift', 'I'], descricao: 'Diretrizes IA' },
      { teclas: ['Ctrl', 'Shift', 'A'], descricao: 'Agentes IA' },
    ],
  },
]

function TeclaKbd({ tecla }: { tecla: string }) {
  return (
    <kbd className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-md border border-amber-200 dark:border-amber-800 bg-gradient-to-b from-amber-50 to-amber-100/80 dark:from-amber-900/30 dark:to-amber-800/20 px-1.5 font-mono text-[11px] font-semibold text-amber-800 dark:text-amber-300 shadow-sm">
      {tecla}
    </kbd>
  )
}

function LinhaAtalho({ atalho }: { atalho: Atalho }) {
  return (
    <motion.div
      className="flex items-center justify-between gap-4 px-3 py-2 rounded-lg hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-colors duration-150"
      whileHover={{ x: 2 }}
      transition={{ duration: 0.1 }}
    >
      <span className="text-sm text-foreground">{atalho.descricao}</span>
      <div className="flex items-center gap-1">
        {atalho.teclas.map((tecla, i) => (
          <span key={i} className="flex items-center gap-1">
            <TeclaKbd tecla={tecla} />
            {i < atalho.teclas.length - 1 && (
              <span className="text-[10px] text-muted-foreground mx-0.5">+</span>
            )}
          </span>
        ))}
      </div>
    </motion.div>
  )
}

export function AtalhosOverlay() {
  const { atalhosAbertos, setAtalhosAbertos } = useEstadoAguiatech()

  // Close on Esc
  useEffect(() => {
    if (!atalhosAbertos) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setAtalhosAbertos(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [atalhosAbertos, setAtalhosAbertos])

  return (
    <Dialog open={atalhosAbertos} onOpenChange={setAtalhosAbertos}>
      <DialogContent
        className="sm:max-w-lg p-0 gap-0 overflow-hidden border-amber-200 dark:border-amber-800"
        showCloseButton={false}
      >
        {/* Header with amber gradient */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 text-white">
          <DialogHeader className="p-0 gap-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Keyboard className="size-4" />
                </div>
                <DialogTitle className="text-white text-lg">Atalhos de Teclado</DialogTitle>
              </div>
              <button
                onClick={() => setAtalhosAbertos(false)}
                className="p-1.5 rounded-md hover:bg-white/20 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
            <DialogDescription className="text-amber-100 text-xs mt-1">
              Use estes atalhos para navegar rapidamente pela plataforma
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Two-column layout */}
        <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-h-[60vh] overflow-y-auto">
          {CATEGORIAS.map((categoria, idx) => (
            <div key={categoria.nome} className={idx === CATEGORIAS.length - 1 && CATEGORIAS.length % 2 !== 0 ? 'sm:col-span-2' : ''}>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                  {categoria.nome}
                </h3>
                <div className="flex-1 h-px bg-gradient-to-r from-amber-300 dark:from-amber-700 to-transparent" />
              </div>
              <div className="space-y-0.5">
                {categoria.atalhos.map((atalho, aIdx) => (
                  <LinhaAtalho key={aIdx} atalho={atalho} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t bg-muted/30 text-center">
          <p className="text-[11px] text-muted-foreground">
            Pressione <TeclaKbd tecla="?" /> ou <TeclaKbd tecla="Esc" /> para fechar
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
