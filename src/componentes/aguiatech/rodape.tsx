'use client'

import { ExternalLink, Heart, Cpu } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { obterNomeCurtoModelo, modeloEhGratis } from '@/lib/openrouter'

interface Agente {
  id: string
  nome: string
  modelo: string
  provedorModelo: string
  personalidade: string
  ativo: boolean
}

export function Rodape() {
  const { data: agente } = useQuery<Agente>({
    queryKey: ['agente'],
    queryFn: () => fetch('/api/agente').then(r => r.json()),
  })

  const modeloNome = agente?.modelo ?? ''
  const nomeCurto = obterNomeCurtoModelo(modeloNome)
  const ehGratis = modeloEhGratis(modeloNome)

  return (
    <footer className="mt-auto border-t border-amber-200/50 dark:border-amber-800/30 bg-gradient-to-r from-amber-50/50 via-background to-amber-50/50 dark:from-amber-950/10 dark:via-background dark:to-amber-950/10 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-2.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          <div className="size-5 rounded bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-[8px] font-bold">
            A
          </div>
          <span className="font-semibold text-amber-700 dark:text-amber-400">Aguiatech</span>
          <span className="text-muted-foreground/40">•</span>
          <span>Desenvolvido com</span>
          <Heart className="size-3 text-red-500 fill-red-500 inline" />
          <span>por</span>
          <span className="font-semibold text-amber-700 dark:text-amber-400">Aguiavision Tecnologia</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-center">
          {/* Online Status */}
          <div className="flex items-center gap-1.5">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
              Online
            </span>
          </div>

          {/* Model Info */}
          {agente && (
            <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-amber-100/60 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/30">
              <Cpu className="size-3 text-amber-600 dark:text-amber-400" />
              <span className="text-[10px] font-medium text-amber-700 dark:text-amber-300">
                {nomeCurto}
              </span>
              {ehGratis && (
                <span className="text-[8px]" title="Modelo gratuito">🆓</span>
              )}
            </div>
          )}

          {/* Version */}
          <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium text-[10px]">
            v0.3.0
          </span>

          {/* GitHub */}
          <a
            href="https://github.com/aguiavisiontech/aguiatech"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-muted-foreground hover:text-amber-700 dark:hover:text-amber-400 transition-colors duration-200"
          >
            <span>GitHub</span>
            <ExternalLink className="size-3" />
          </a>
        </div>
      </div>
    </footer>
  )
}
