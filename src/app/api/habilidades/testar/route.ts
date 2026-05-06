import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { db } from '@/lib/db'

interface ParametrosHabilidade {
  tipo: string
  [chave: string]: unknown
}

interface ResultadoExecucao {
  sucesso: boolean
  resultadoBruto: unknown
  saida: string
  duracao: number
  erro?: string
}

async function executarWebSearch(entrada: string): Promise<ResultadoExecucao> {
  const inicio = Date.now()
  try {
    const zai = await ZAI.create()
    const resultados = await zai.functions.invoke('web_search', {
      query: entrada,
      num: 5,
    })

    const duracao = (Date.now() - inicio) / 1000

    if (Array.isArray(resultados) && resultados.length > 0) {
      const saida = resultados
        .map(
          (r: { name?: string; url?: string; snippet?: string; host_name?: string }, i: number) =>
            `${i + 1}. **${r.name || 'Sem título'}**\n   URL: ${r.url || 'N/A'}\n   Resumo: ${r.snippet || 'N/A'}\n   Fonte: ${r.host_name || 'N/A'}`
        )
        .join('\n\n')

      return {
        sucesso: true,
        resultadoBruto: resultados,
        saida: `[Busca Web] Resultados para "${entrada}":\n\n${saida}`,
        duracao,
      }
    }

    return {
      sucesso: true,
      resultadoBruto: resultados,
      saida: `[Busca Web] Nenhum resultado encontrado para "${entrada}".`,
      duracao,
    }
  } catch (error) {
    const duracao = (Date.now() - inicio) / 1000
    const msg = error instanceof Error ? error.message : 'Erro desconhecido'
    return {
      sucesso: false,
      resultadoBruto: null,
      saida: `[Busca Web] Falha ao realizar busca: ${msg}`,
      duracao,
      erro: msg,
    }
  }
}

async function executarLlmChat(
  entrada: string,
  conteudoHabilidade: string
): Promise<ResultadoExecucao> {
  const inicio = Date.now()
  try {
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: conteudoHabilidade },
        { role: 'user', content: entrada },
      ],
      thinking: { type: 'disabled' },
    })

    const duracao = (Date.now() - inicio) / 1000
    const resposta = completion.choices?.[0]?.message?.content || ''

    return {
      sucesso: true,
      resultadoBruto: completion,
      saida: resposta || '[Chat LLM] Sem resposta gerada.',
      duracao,
    }
  } catch (error) {
    const duracao = (Date.now() - inicio) / 1000
    const msg = error instanceof Error ? error.message : 'Erro desconhecido'
    return {
      sucesso: false,
      resultadoBruto: null,
      saida: `[Chat LLM] Falha ao gerar resposta: ${msg}`,
      duracao,
      erro: msg,
    }
  }
}

async function executarImageGeneration(entrada: string): Promise<ResultadoExecucao> {
  const inicio = Date.now()
  try {
    const zai = await ZAI.create()
    const resultado = await zai.images.generations.create({
      prompt: entrada,
      size: '1024x1024',
    })

    const duracao = (Date.now() - inicio) / 1000
    const base64 = resultado.data?.[0]?.base64

    if (base64) {
      return {
        sucesso: true,
        resultadoBruto: { imagemGerada: true, tamanho: base64.length },
        saida: `[Geração de Imagem] Imagem gerada com sucesso a partir do prompt: "${entrada}". Dados base64 disponíveis (${Math.round(base64.length / 1024)}KB).`,
        duracao,
      }
    }

    return {
      sucesso: true,
      resultadoBruto: resultado,
      saida: `[Geração de Imagem] Resposta recebida, mas sem dados de imagem base64.`,
      duracao,
    }
  } catch (error) {
    const duracao = (Date.now() - inicio) / 1000
    const msg = error instanceof Error ? error.message : 'Erro desconhecido'
    return {
      sucesso: false,
      resultadoBruto: null,
      saida: `[Geração de Imagem] Falha ao gerar imagem: ${msg}`,
      duracao,
      erro: msg,
    }
  }
}

async function executarVlmAnalysis(entrada: string): Promise<ResultadoExecucao> {
  const inicio = Date.now()
  try {
    const zai = await ZAI.create()
    const resultado = await zai.chat.completions.createVision({
      model: 'glm-4v',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Descreva esta imagem em detalhes' },
            { type: 'image_url', image_url: { url: entrada } },
          ],
        },
      ],
      thinking: { type: 'disabled' },
    })

    const duracao = (Date.now() - inicio) / 1000
    const resposta = resultado.choices?.[0]?.message?.content || ''

    return {
      sucesso: true,
      resultadoBruto: resultado,
      saida: resposta || '[Análise VLM] Sem descrição gerada.',
      duracao,
    }
  } catch (error) {
    const duracao = (Date.now() - inicio) / 1000
    const msg = error instanceof Error ? error.message : 'Erro desconhecido'
    return {
      sucesso: false,
      resultadoBruto: null,
      saida: `[Análise VLM] Falha ao analisar imagem: ${msg}`,
      duracao,
      erro: msg,
    }
  }
}

async function executarTTS(entrada: string): Promise<ResultadoExecucao> {
  const inicio = Date.now()
  try {
    const zai = await ZAI.create()
    const response = await zai.audio.tts.create({
      input: entrada,
      voice: 'tongtong',
      response_format: 'wav',
    })

    const duracao = (Date.now() - inicio) / 1000

    const contentType = response.headers?.get('content-type') || 'audio/wav'
    let tamanhoAudio = 0
    try {
      const arrayBuffer = await response.arrayBuffer()
      tamanhoAudio = arrayBuffer.byteLength
    } catch {
      // Não foi possível ler o tamanho do áudio
    }

    return {
      sucesso: true,
      resultadoBruto: { tipoAudio: contentType, tamanhoBytes: tamanhoAudio },
      saida: `[TTS] Áudio gerado com sucesso para o texto: "${entrada.substring(0, 100)}${entrada.length > 100 ? '...' : ''}". Tipo: ${contentType}, Tamanho: ${tamanhoAudio} bytes.`,
      duracao,
    }
  } catch (error) {
    const duracao = (Date.now() - inicio) / 1000
    const msg = error instanceof Error ? error.message : 'Erro desconhecido'
    return {
      sucesso: false,
      resultadoBruto: null,
      saida: `[TTS] Falha ao sintetizar áudio: ${msg}`,
      duracao,
      erro: msg,
    }
  }
}

async function executarASR(entrada: string): Promise<ResultadoExecucao> {
  const inicio = Date.now()
  try {
    const zai = await ZAI.create()

    const asrBody: { file_base64?: string; file?: string } = {}
    if (entrada.startsWith('data:') || entrada.length > 500) {
      const base64Data = entrada.startsWith('data:')
        ? entrada.split(',')[1] || entrada
        : entrada
      asrBody.file_base64 = base64Data
    } else {
      asrBody.file = entrada
    }

    const resultado = await zai.audio.asr.create(asrBody)

    const duracao = (Date.now() - inicio) / 1000
    const texto = resultado.text || ''

    return {
      sucesso: true,
      resultadoBruto: resultado,
      saida: texto || '[ASR] Nenhuma transcrição gerada.',
      duracao,
    }
  } catch (error) {
    const duracao = (Date.now() - inicio) / 1000
    const msg = error instanceof Error ? error.message : 'Erro desconhecido'
    return {
      sucesso: false,
      resultadoBruto: null,
      saida: `[ASR] Falha ao transcrever áudio: ${msg}`,
      duracao,
      erro: msg,
    }
  }
}

async function executarWebReader(entrada: string): Promise<ResultadoExecucao> {
  const inicio = Date.now()
  try {
    const zai = await ZAI.create()
    const resultado = await zai.functions.invoke('page_reader', {
      url: entrada,
    })

    const duracao = (Date.now() - inicio) / 1000

    const titulo = resultado?.data?.title || 'Sem título'
    const urlPagina = resultado?.data?.url || entrada
    const publicadoEm = resultado?.data?.publishedTime || 'N/A'
    const tokens = resultado?.data?.usage?.tokens || 0

    const saida = `[Leitor Web] Conteúdo da página:\n\nTítulo: ${titulo}\nURL: ${urlPagina}\nPublicado em: ${publicadoEm}\nTokens utilizados: ${tokens}`

    return {
      sucesso: true,
      resultadoBruto: resultado,
      saida,
      duracao,
    }
  } catch (error) {
    const duracao = (Date.now() - inicio) / 1000
    const msg = error instanceof Error ? error.message : 'Erro desconhecido'
    return {
      sucesso: false,
      resultadoBruto: null,
      saida: `[Leitor Web] Falha ao ler página: ${msg}`,
      duracao,
      erro: msg,
    }
  }
}

function executarSimulado(
  habilidade: { nome: string; conteudo: string },
  entrada: string
): ResultadoExecucao {
  const inicio = Date.now()
  const duracao = (Date.now() - inicio) / 1000
  return {
    sucesso: true,
    resultadoBruto: null,
    saida: `[Simulação da habilidade "${habilidade.nome}"]\n\nEntrada: "${entrada}"\nConteúdo aplicado:\n${habilidade.conteudo.substring(0, 300)}${habilidade.conteudo.length > 300 ? '...' : ''}\n\n✅ Habilidade executada em modo simulação (tipo não reconhecido).`,
    duracao,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { habilidadeId, entrada } = body

    if (!habilidadeId || !entrada) {
      return NextResponse.json(
        { error: 'habilidadeId e entrada são obrigatórios' },
        { status: 400 }
      )
    }

    const habilidade = await db.habilidade.findUnique({
      where: { id: habilidadeId },
    })

    if (!habilidade) {
      return NextResponse.json(
        { error: 'Habilidade não encontrada' },
        { status: 404 }
      )
    }

    let parametros: ParametrosHabilidade = { tipo: 'simulado' }
    if (habilidade.parametros) {
      try {
        parametros = JSON.parse(habilidade.parametros) as ParametrosHabilidade
      } catch {
        parametros = { tipo: 'simulado' }
      }
    }

    const tipo = parametros.tipo || 'simulado'

    let resultado: ResultadoExecucao

    switch (tipo) {
      case 'web_search':
        resultado = await executarWebSearch(entrada)
        break
      case 'llm_chat':
        resultado = await executarLlmChat(entrada, habilidade.conteudo)
        break
      case 'image_generation':
        resultado = await executarImageGeneration(entrada)
        break
      case 'vlm_analysis':
        resultado = await executarVlmAnalysis(entrada)
        break
      case 'tts':
        resultado = await executarTTS(entrada)
        break
      case 'asr':
        resultado = await executarASR(entrada)
        break
      case 'web_reader':
        resultado = await executarWebReader(entrada)
        break
      default:
        resultado = executarSimulado(habilidade, entrada)
        break
    }

    const execucao = await db.execucaoHabilidade.create({
      data: {
        habilidadeId,
        entrada,
        saida: resultado.saida,
        sucesso: resultado.sucesso,
        duracao: resultado.duracao,
      },
    })

    const execucoes = await db.execucaoHabilidade.findMany({
      where: { habilidadeId },
    })
    const sucessoCount = execucoes.filter((e) => e.sucesso).length
    const novaTaxaSucesso = (sucessoCount / execucoes.length) * 100

    await db.habilidade.update({
      where: { id: habilidadeId },
      data: {
        usoContagem: { increment: 1 },
        taxaSucesso: novaTaxaSucesso,
      },
    })

    return NextResponse.json({
      execucao,
      tipo,
      saida: resultado.saida,
      resultadoBruto: resultado.resultadoBruto,
      duracao: resultado.duracao,
      novaTaxaSucesso,
      erro: resultado.erro || undefined,
    })
  } catch (error) {
    console.error('Erro ao testar habilidade:', error)
    return NextResponse.json(
      { error: 'Erro interno ao testar habilidade' },
      { status: 500 }
    )
  }
}
