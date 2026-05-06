'use client'

import { useState, useEffect, useCallback } from 'react'
import { ExternalLink, Heart, Cpu, ArrowUp, Clock, HardDrive, Calendar } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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

// ─── Uptime Hook ──────────────────────────────────────────────────────────────

function useUptime() {
  const [uptime, setUptime] = useState('00:00:00')
  const startTimeRef = useState(Date.now())[0]

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef) / 1000)
      const h = Math.floor(elapsed / 3600).toString().padStart(2, '0')
      const m = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0')
      const s = (elapsed % 60).toString().padStart(2, '0')
      setUptime(`${h}:${m}:${s}`)
    }, 1000)
    return () => clearInterval(interval)
  }, [startTimeRef])

  return uptime
}

// ─── Memory Usage Hook ────────────────────────────────────────────────────────

function useMemoryUsage() {
  const [memoria, setMemoria] = useState<{ usado: number; total: number } | null>(null)

  useEffect(() => {
    // Use performance.memory if available (Chrome only)
    const perf = performance as Performance & {
      memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number }
    }
    if (perf.memory) {
      const update = () => {
        setMemoria({
          usado: perf.memory!.usedJSHeapSize,
          total: perf.memory!.jsHeapSizeLimit,
        })
      }
      update()
      const interval = setInterval(update, 5000)
      return () => clearInterval(interval)
    }
  }, [])

  return memoria
}

// ─── Build Date ───────────────────────────────────────────────────────────────

const BUILD_DATE = new Date().toISOString().split('T')[0]
const VERSION = '0.3.0'

// ─── Main Component ───────────────────────────────────────────────────────────

export function Rodape() {
  const { data: agente } = useQuery<Agente>({
    queryKey: ['agente'],
    queryFn: () => fetch('/api/agente').then(r => r.json()),
  })

  const modeloNome = agente?.modelo ?? ''
  const nomeCurto = obterNomeCurtoModelo(modeloNome)
  const ehGratis = modeloEhGratis(modeloNome)
  const uptime = useUptime()
  const memoria = useMemoryUsage()

  // Scroll to top
  const [mostrarBotaoTopo, setMostrarBotaoTopo] = useState(false)

  useEffect(() => {
    const handler = () => setMostrarBotaoTopo(window.scrollY > 300)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const voltarAoTopo = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const memoriaPercentual = memoria ? Math.round((memoria.usado / memoria.total) * 100) : null
  const memoriaUsadoMB = memoria ? (memoria.usado / 1024 / 1024).toFixed(0) : null
  const memoriaTotalMB = memoria ? (memoria.total / 1024 / 1024).toFixed(0) : null

  return (
    <>
      <footer className="mt-auto relative">
        {/* Animated gradient border at top */}
        <div
          className="h-[2px] w-full"
          style={{
            background: 'linear-gradient(90deg, transparent, #f59e0b, #ef4444, #f59e0b, transparent)',
            backgroundSize: '200% 100%',
            animation: 'gradientBorder 4s ease infinite',
          }}
        />

        <div className="bg-gradient-to-r from-amber-50/50 via-background to-amber-50/50 dark:from-amber-950/10 dark:via-background dark:to-amber-950/10 backdrop-blur-sm">
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

            <div className="flex items-center gap-2.5 flex-wrap justify-center">
              {/* Online Status with ripple effect */}
              <div className="flex items-center gap-1.5">
                <span className="relative flex size-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40" />
                  <span className="relative inline-flex rounded-full size-2.5 bg-emerald-500" />
                </span>
                <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                  Online
                </span>
              </div>

              {/* System Uptime */}
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/50 border border-border/50">
                <Clock className="size-2.5 text-amber-600 dark:text-amber-400" />
                <span className="text-[10px] font-mono text-muted-foreground">
                  {uptime}
                </span>
              </div>

              {/* Memory Usage */}
              {memoriaPercentual !== null && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/50 border border-border/50">
                  <HardDrive className="size-2.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {memoriaUsadoMB}/{memoriaTotalMB}MB
                  </span>
                  <div className="w-8 h-1 rounded-full bg-muted overflow-hidden ml-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        memoriaPercentual > 80 ? 'bg-red-500' :
                        memoriaPercentual > 50 ? 'bg-amber-500' :
                        'bg-emerald-500'
                      }`}
                      style={{ width: `${memoriaPercentual}%` }}
                    />
                  </div>
                </div>
              )}

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

              {/* Version with build date */}
              <div className="flex items-center gap-1">
                <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium text-[10px]">
                  v{VERSION}
                </span>
                <span className="text-[9px] text-muted-foreground/60 flex items-center gap-0.5">
                  <Calendar className="size-2.5" />
                  {BUILD_DATE}
                </span>
              </div>

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
        </div>
      </footer>

      {/* Scroll to top button */}
      <AnimatePresence>
        {mostrarBotaoTopo && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={voltarAoTopo}
            className="fixed bottom-4 right-4 z-50 size-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25 flex items-center justify-center hover:shadow-xl hover:shadow-amber-500/30 transition-shadow duration-200 cursor-pointer"
            title="Voltar ao topo"
          >
            <ArrowUp className="size-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Footer animation keyframes */}
      <style jsx global>{`
        @keyframes gradientBorder {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </>
  )
}
