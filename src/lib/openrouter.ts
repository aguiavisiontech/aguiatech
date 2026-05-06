/**
 * OpenRouter API Integration
 * Supports free models via OpenRouter's OpenAI-compatible API
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

export const MODELOS_OPENROUTER_GRATUITOS = [
  { id: 'meta-llama/llama-3.3-70b-instruct:free', nome: 'Llama 3.3 70B', provedor: 'Meta', destaque: true, cor: 'bg-blue-500', descricao: 'Melhor modelo geral, ótimo para conversação' },
  { id: 'qwen/qwen3-coder:free', nome: 'Qwen3 Coder', provedor: 'Alibaba', destaque: true, cor: 'bg-orange-500', descricao: 'Especializado em código e programação' },
  { id: 'qwen/qwen3-next-80b-a3b-instruct:free', nome: 'Qwen3 Next 80B', provedor: 'Alibaba', destaque: false, cor: 'bg-orange-400', descricao: 'Modelo grande com raciocínio avançado' },
  { id: 'google/gemma-4-31b-it:free', nome: 'Gemma 4 31B', provedor: 'Google', destaque: true, cor: 'bg-emerald-500', descricao: 'Modelo Google versátil e eficiente' },
  { id: 'google/gemma-4-26b-a4b-it:free', nome: 'Gemma 4 26B A4B', provedor: 'Google', destaque: false, cor: 'bg-emerald-400', descricao: 'Modelo compacto do Google' },
  { id: 'openai/gpt-oss-20b:free', nome: 'GPT OSS 20B', provedor: 'OpenAI', destaque: true, cor: 'bg-teal-500', descricao: 'Modelo open source da OpenAI' },
  { id: 'minimax/minimax-m2.5:free', nome: 'MiniMax M2.5', provedor: 'MiniMax', destaque: false, cor: 'bg-purple-500', descricao: 'Modelo multimodal MiniMax' },
  { id: 'z-ai/glm-4.5-air:free', nome: 'GLM 4.5 Air', provedor: 'Zhipu AI', destaque: false, cor: 'bg-amber-500', descricao: 'Modelo leve da Zhipu AI' },
] as const

/** Convenience alias for use in components */
export const MODELOS_GRATUITOS = MODELOS_OPENROUTER_GRATUITOS

export type ModeloOpenRouter = typeof MODELOS_OPENROUTER_GRATUITOS[number]['id']

interface MensagemOpenRouter {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface RespostaOpenRouter {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface ResultadoChatOpenRouter {
  conteudo: string
  tokensIn: number
  tokensOut: number
  modelo: string
  sucesso: boolean
  erro?: string
}

/**
 * Get OpenRouter API key from database config or environment
 */
export async function obterApiKeyOpenRouter(): Promise<string | null> {
  // First try environment variable
  if (process.env.OPENROUTER_API_KEY) {
    return process.env.OPENROUTER_API_KEY
  }

  // Then try database config
  try {
    const { db } = await import('@/lib/db')
    const config = await db.config.findUnique({
      where: { chave: 'openrouter_api_key' },
    })
    if (config?.valor) {
      return config.valor
    }
  } catch {
    // Database might not be available
  }

  return null
}

/**
 * Call OpenRouter API for chat completions
 */
/**
 * Get fallback models for a given model (same or similar capabilities)
 */
function obterModelosFallback(modeloPreferido: string): string[] {
  const modelos = MODELOS_OPENROUTER_GRATUITOS.map(m => m.id)
  // Put preferred model first, then others
  const semPreferido = modelos.filter(m => m !== modeloPreferido)
  return [modeloPreferido, ...semPreferido]
}

export async function chatOpenRouter(
  mensagens: MensagemOpenRouter[],
  modelo: string = 'meta-llama/llama-3.3-70b-instruct:free',
  apiKey?: string
): Promise<ResultadoChatOpenRouter> {
  const key = apiKey || await obterApiKeyOpenRouter()

  if (!key) {
    return {
      conteudo: '',
      tokensIn: 0,
      tokensOut: 0,
      modelo,
      sucesso: false,
      erro: 'API Key do OpenRouter não configurada. Configure em Configurações → Modelo.',
    }
  }

  const modelosParaTentar = obterModelosFallback(modelo)

  for (const modeloAtual of modelosParaTentar) {
    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
          'HTTP-Referer': 'https://aguiatech.com.br',
          'X-Title': 'Aguiatech - Agente de IA',
        },
        body: JSON.stringify({
          model: modeloAtual,
          messages: mensagens,
          temperature: 0.7,
          max_tokens: 4096,
        }),
      })

      if (!response.ok) {
        const errorBody = await response.text()

        // Rate-limited: try next model
        if (response.status === 429) {
          console.warn(`OpenRouter: modelo ${modeloAtual} rate-limited, tentando próximo...`)
          continue
        }

        // Auth errors: don't try other models
        if (response.status === 401 || response.status === 403) {
          return {
            conteudo: '',
            tokensIn: 0,
            tokensOut: 0,
            modelo: modeloAtual,
            sucesso: false,
            erro: 'Chave API inválida ou sem permissão',
          }
        }

        // Other errors
        console.error('OpenRouter API error:', response.status, errorBody)
        return {
          conteudo: '',
          tokensIn: 0,
          tokensOut: 0,
          modelo: modeloAtual,
          sucesso: false,
          erro: `Erro da API OpenRouter (${response.status}): ${errorBody}`,
        }
      }

      const data: RespostaOpenRouter = await response.json()
      const conteudo = data.choices[0]?.message?.content || ''
      const tokensIn = data.usage?.prompt_tokens ?? 0
      const tokensOut = data.usage?.completion_tokens ?? 0

      return {
        conteudo,
        tokensIn,
        tokensOut,
        modelo: data.model || modeloAtual,
        sucesso: true,
      }
    } catch (error) {
      console.error('OpenRouter API request failed:', error)
      continue
    }
  }

  return {
    conteudo: '',
    tokensIn: 0,
    tokensOut: 0,
    modelo,
    sucesso: false,
    erro: 'Todos os modelos estão com limite de requisições atingido. Tente novamente em alguns segundos.',
  }
}

/**
 * Models to try for validation (in order of preference)
 * Uses smaller/faster models less likely to be rate-limited
 */
const MODELOS_VALIDACAO = [
  'google/gemma-4-26b-a4b-it:free',
  'z-ai/glm-4.5-air:free',
  'google/gemma-4-31b-it:free',
  'openai/gpt-oss-20b:free',
  'meta-llama/llama-3.3-70b-instruct:free',
] as const

export interface ResultadoValidacao {
  valida: boolean
  erro?: string
  aviso?: string
  modeloTestado?: string
  latencia?: number
}

/**
 * Validate an OpenRouter API key by attempting a minimal chat completion.
 * Tries multiple free models as fallback if one is rate-limited.
 */
export async function validarApiKeyOpenRouter(apiKey: string): Promise<ResultadoValidacao> {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 10) {
    return { valida: false, erro: 'Chave API muito curta ou inválida' }
  }

  const key = apiKey.trim()

  // Try each model until one succeeds or we get a definitive answer
  for (const modelo of MODELOS_VALIDACAO) {
    const inicio = Date.now()
    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
          'HTTP-Referer': 'https://aguiatech.com.br',
          'X-Title': 'Aguiatech - Agente de IA',
        },
        body: JSON.stringify({
          model: modelo,
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 5,
        }),
      })

      const latencia = Date.now() - inicio

      // Success - key is valid
      if (response.ok) {
        return {
          valida: true,
          modeloTestado: modelo,
          latencia,
        }
      }

      // Parse error response for more details
      let errorDetail = ''
      try {
        const errorBody = await response.text()
        const parsed = JSON.parse(errorBody)
        errorDetail = parsed?.error?.message || parsed?.error?.code || ''
      } catch {
        // Ignore parse errors
      }

      // Rate-limited: key IS valid, but this model is throttled
      // Try next model instead of failing immediately
      if (response.status === 429) {
        continue // Try next model
      }

      // Authentication errors: key is genuinely invalid
      if (response.status === 401 || response.status === 403) {
        return {
          valida: false,
          erro: `Chave API inválida ou sem permissão (${response.status})`,
          modeloTestado: modelo,
          latencia,
        }
      }

      // Payment required / insufficient credits
      if (response.status === 402) {
        return {
          valida: false,
          erro: 'Créditos insuficientes na conta OpenRouter',
          modeloTestado: modelo,
          latencia,
        }
      }

      // Server errors: might be temporary, try next model
      if (response.status >= 500) {
        continue
      }

      // Other client errors
      return {
        valida: false,
        erro: errorDetail || `Erro na validação (${response.status})`,
        modeloTestado: modelo,
        latencia,
      }
    } catch (error) {
      // Network error - try next model
      continue
    }
  }

  // All models were rate-limited or errored - key is valid but currently throttled
  return {
    valida: true,
    aviso: 'Chave válida, mas todos os modelos gratuitos estão com limite de requisições atingido no momento. Tente novamente em alguns segundos.',
    modeloTestado: MODELOS_VALIDACAO[0],
  }
}

/**
 * Get model display name from model ID
 */
export function obterNomeModelo(modeloId: string): string {
  const modelo = MODELOS_OPENROUTER_GRATUITOS.find(m => m.id === modeloId)
  if (modelo) return modelo.nome

  // Extract provider/name from OpenRouter format
  const parts = modeloId.split('/')
  if (parts.length >= 2) {
    return parts[parts.length - 1].replace(':free', '')
  }

  return modeloId
}

/**
 * Get short display name for a model (alias for obterNomeModelo)
 */
export function obterNomeCurtoModelo(modeloId: string): string {
  const modelo = MODELOS_OPENROUTER_GRATUITOS.find(m => m.id === modeloId)
  if (modelo) return modelo.nome

  // Fallback: extract last part and strip :free
  if (modeloId.includes('/')) return modeloId.split('/').pop()?.replace(':free', '') ?? modeloId
  return modeloId
}

/**
 * Check if a model is free (ends with :free)
 */
export function modeloEhGratis(modelo: string): boolean {
  return modelo.endsWith(':free')
}

/**
 * Format provider name for display
 */
export function formatarProvedor(provedor: string): string {
  const mapa: Record<string, string> = {
    openrouter: 'OpenRouter',
    zhipu: 'ZhipuAI',
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    google: 'Google',
    groq: 'Groq',
    together: 'Together AI',
    deepseek: 'DeepSeek',
    alibaba: 'Alibaba',
    meta: 'Meta',
    minimax: 'MiniMax',
  }
  return mapa[provedor.toLowerCase()] || provedor.charAt(0).toUpperCase() + provedor.slice(1)
}
