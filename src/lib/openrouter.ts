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
        messages: mensagens,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error('OpenRouter API error:', response.status, errorBody)
      return {
        conteudo: '',
        tokensIn: 0,
        tokensOut: 0,
        modelo,
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
      modelo: data.model || modelo,
      sucesso: true,
    }
  } catch (error) {
    console.error('OpenRouter API request failed:', error)
    return {
      conteudo: '',
      tokensIn: 0,
      tokensOut: 0,
      modelo,
      sucesso: false,
      erro: `Erro ao conectar com OpenRouter: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    }
  }
}

/**
 * Validate an OpenRouter API key
 */
export async function validarApiKeyOpenRouter(apiKey: string): Promise<{ valida: boolean; erro?: string }> {
  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://aguiatech.com.br',
        'X-Title': 'Aguiatech - Agente de IA',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
      }),
    })

    if (response.ok) {
      return { valida: true }
    }

    const errorBody = await response.text()
    return { valida: false, erro: `Chave inválida (${response.status})` }
  } catch (error) {
    return { valida: false, erro: `Erro de conexão: ${error instanceof Error ? error.message : 'desconhecido'}` }
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
