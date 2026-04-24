import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

interface ResultadoBuscaWeb {
  titulo: string
  url: string
  resumo: string
  fonte: string
  posicao: number
  data: string
  favicon: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.query) {
      return NextResponse.json(
        { erro: 'O parâmetro "query" é obrigatório' },
        { status: 400 }
      )
    }

    const query = body.query as string
    const num = Math.min(body.num ?? 10, 20) as number
    const recencyDays = body.recency_days as number | undefined

    // Tentativa 1: Busca web direta com z-ai SDK
    try {
      const zai = await ZAI.create()
      const searchArgs: { query: string; num: number; recency_days?: number } = {
        query,
        num,
      }
      if (recencyDays) {
        searchArgs.recency_days = recencyDays
      }

      const resultados = await zai.functions.invoke('web_search', searchArgs)

      if (resultados && Array.isArray(resultados) && resultados.length > 0) {
        return NextResponse.json({
          query,
          resultados: resultados.map((item: { name: string; url: string; snippet: string; host_name: string; rank: number; date: string; favicon: string }) => ({
            titulo: item.name,
            url: item.url,
            resumo: item.snippet,
            fonte: item.host_name,
            posicao: item.rank,
            data: item.date,
            favicon: item.favicon,
          })),
          total: resultados.length,
          fonte: 'z-ai-web-search',
        })
      }
    } catch (sdkError) {
      console.warn('z-ai web_search falhou (tentativa 1):', sdkError)
    }

    // Tentativa 2: Busca web com recency_days (se não foi usado antes)
    if (!recencyDays) {
      try {
        const zai = await ZAI.create()
        const resultados = await zai.functions.invoke('web_search', {
          query,
          num,
          recency_days: 30,
        })

        if (resultados && Array.isArray(resultados) && resultados.length > 0) {
          return NextResponse.json({
            query,
            resultados: resultados.map((item: { name: string; url: string; snippet: string; host_name: string; rank: number; date: string; favicon: string }) => ({
              titulo: item.name,
              url: item.url,
              resumo: item.snippet,
              fonte: item.host_name,
              posicao: item.rank,
              data: item.date,
              favicon: item.favicon,
            })),
            total: resultados.length,
            fonte: 'z-ai-web-search-recency',
          })
        }
      } catch (sdkError2) {
        console.warn('z-ai web_search falhou (tentativa 2 - recency):', sdkError2)
      }
    }

    // Tentativa 3: Usar LLM como fallback para obter informações relevantes
    try {
      const zai = await ZAI.create()
      const result = await zai.chat.completions.create({
        messages: [
          {
            role: 'assistant',
            content: 'Você é um assistente de pesquisa. Quando não for possível realizar uma busca web em tempo real, forneça informações úteis baseadas em seu conhecimento, sempre em português brasileiro. Indique claramente que as informações podem não estar atualizadas e que a busca web em tempo real não está disponível.',
          },
          {
            role: 'user',
            content: `Não foi possível realizar uma busca web em tempo real para: "${query}". Por favor, forneça as informações mais relevantes que você conhece sobre este tema, indicando que os dados podem não estar atualizados.`,
          },
        ],
        thinking: { type: 'disabled' },
      })

      const conteudo = result.choices[0]?.message?.content || ''

      return NextResponse.json({
        query,
        resultados: [{
          titulo: `Informações sobre: ${query}`,
          url: '',
          resumo: conteudo,
          fonte: 'z-ai-conhecimento',
          posicao: 1,
          data: new Date().toISOString(),
          favicon: '',
        }],
        total: 1,
        fonte: 'z-ai-llm-fallback',
      })
    } catch (llmError) {
      console.error('Fallback LLM também falhou:', llmError)
    }

    // Nenhuma tentativa funcionou - resposta de fallback
    return NextResponse.json({
      query,
      resultados: [{
        titulo: `Busca indisponível: ${query}`,
        url: '',
        resumo: 'Não foi possível realizar a busca web no momento. O serviço pode estar temporariamente indisponível. Tente novamente em alguns instantes.',
        fonte: 'indisponivel',
        posicao: 1,
        data: new Date().toISOString(),
        favicon: '',
      }],
      total: 1,
      fonte: 'fallback-offline',
    })

  } catch (error) {
    console.error('Erro na busca web:', error)
    return NextResponse.json(
      { erro: 'Falha ao realizar busca web. Tente novamente mais tarde.' },
      { status: 500 }
    )
  }
}
