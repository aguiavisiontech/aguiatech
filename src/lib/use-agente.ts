export function useAgente() {
  const obterIconeCategoria = (categoria: string) => {
    switch (categoria) {
      case 'nucleo': return '⭐'
      case 'avancado': return '🚀'
      case 'experimental': return '🧪'
      default: return '📦'
    }
  }

  const obterCorCategoria = (categoria: string) => {
    switch (categoria) {
      case 'nucleo': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
      case 'avancado': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
      case 'experimental': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  const obterIconeTipoMemoria = (tipo: string) => {
    switch (tipo) {
      case 'fato': return '📌'
      case 'curto_prazo': return '⚡'
      case 'longo_prazo': return '🧠'
      case 'semantica': return '🔗'
      case 'episodica': return '📖'
      default: return '💾'
    }
  }

  const obterCorTipoMemoria = (tipo: string) => {
    switch (tipo) {
      case 'fato': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'curto_prazo': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'longo_prazo': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'semantica': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      case 'episodica': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  return {
    obterIconeCategoria,
    obterCorCategoria,
    obterIconeTipoMemoria,
    obterCorTipoMemoria,
  }
}
