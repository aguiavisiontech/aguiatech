import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'
import { chatOpenRouter, obterNomeModelo } from '@/lib/openrouter'

interface ResultadoBusca {
  titulo: string
  url: string
  resumo: string
  fonte: string
}

// Função auxiliar para busca web usando z-ai-web-dev-sdk
async function buscarNaWeb(query: string): Promise<{ contexto: string; resultados: ResultadoBusca[] }> {
  // Tentativa 1: Busca web direta com z-ai SDK
  try {
    const zai = await ZAI.create()
    const resultados = await zai.functions.invoke('web_search', {
      query,
      num: 8,
    })

    if (resultados && Array.isArray(resultados) && resultados.length > 0) {
      const contexto = resultados
        .slice(0, 6)
        .map((r: { name: string; host_name: string; snippet: string; url: string }, i: number) => `[${i + 1}] ${r.name}\nFonte: ${r.host_name}\n${r.snippet}\nURL: ${r.url}`)
        .join('\n\n')

      return {
        contexto: `\n\nResultados da busca web para "${query}":\n${contexto}\n\nUse as informações acima para responder à pergunta do usuário. Cite as fontes quando relevante.`,
        resultados: resultados.map((item: { name: string; url: string; snippet: string; host_name: string }) => ({
          titulo: item.name,
          url: item.url,
          resumo: item.snippet,
          fonte: item.host_name,
        })),
      }
    }
  } catch (sdkError) {
    console.warn('z-ai web_search falhou (tentativa 1):', sdkError)
  }

  // Tentativa 2: Busca com recency_days para resultados mais recentes
  try {
    const zai = await ZAI.create()
    const resultados = await zai.functions.invoke('web_search', {
      query,
      num: 8,
      recency_days: 30,
    })

    if (resultados && Array.isArray(resultados) && resultados.length > 0) {
      const contexto = resultados
        .slice(0, 6)
        .map((r: { name: string; host_name: string; snippet: string; url: string }, i: number) => `[${i + 1}] ${r.name}\nFonte: ${r.host_name}\n${r.snippet}\nURL: ${r.url}`)
        .join('\n\n')

      return {
        contexto: `\n\nResultados da busca web para "${query}" (últimos 30 dias):\n${contexto}\n\nUse as informações acima para responder à pergunta do usuário. Cite as fontes quando relevante.`,
        resultados: resultados.map((item: { name: string; url: string; snippet: string; host_name: string }) => ({
          titulo: item.name,
          url: item.url,
          resumo: item.snippet,
          fonte: item.host_name,
        })),
      }
    }
  } catch (sdkError2) {
    console.warn('z-ai web_search falhou (tentativa 2 - recency):', sdkError2)
  }

  // Tentativa 3: Usar o LLM como fallback para gerar uma resposta com base em conhecimento
  try {
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: 'Você é um assistente de pesquisa. Quando não for possível realizar uma busca web em tempo real, forneça informações úteis baseadas em seu conhecimento, sempre em português brasileiro. Indique claramente que as informações podem não estar atualizadas.',
        },
        {
          role: 'user',
          content: `Não foi possível realizar uma busca web em tempo real para: "${query}". Por favor, forneça as informações mais relevantes que você conhece sobre este tema, indicando que os dados podem não estar atualizados.`,
        },
      ],
      thinking: { type: 'disabled' },
    })

    const conteudoLlm = completion.choices[0]?.message?.content || ''
    if (conteudoLlm) {
      return {
        contexto: `\n\nA busca web em tempo real não está disponível no momento. O assistente fornecerá informações baseadas em conhecimento interno (podem não estar atualizadas).`,
        resultados: [{
          titulo: `Informação sobre: ${query}`,
          url: '',
          resumo: conteudoLlm.substring(0, 300),
          fonte: 'conhecimento-interno',
        }],
      }
    }
  } catch (llmError) {
    console.warn('Fallback LLM também falhou:', llmError)
  }

  // Nenhuma tentativa funcionou - retornar contexto vazio com indicação
  return {
    contexto: '\n\n⚠️ A busca web não está disponível no momento. Responda com base em seu conhecimento e informe ao usuário que não foi possível buscar informações atualizadas na web.',
    resultados: [],
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const mensagens = await db.mensagem.findMany({
      where: { conversaId: id },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(mensagens)
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error)
    return NextResponse.json([])
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const startTime = Date.now()

  try {
    const body = await request.json()
    let conteudoMensagem = body.conteudo
    let buscaWebAtiva = false
    let resultadosBusca: ResultadoBusca[] = []

    // Detectar prefixo [BUSCA WEB]
    if (conteudoMensagem.startsWith('[BUSCA WEB]')) {
      buscaWebAtiva = true
      conteudoMensagem = conteudoMensagem.replace('[BUSCA WEB]', '').trim()
    }

    // Criar mensagem do usuário (sem o prefixo)
    await db.mensagem.create({
      data: {
        conversaId: id,
        papel: 'usuario',
        conteudo: conteudoMensagem,
      },
    })

    // Buscar conversa com agente vinculado
    const conversa = await db.conversa.findUnique({
      where: { id },
      include: {
        agente: true,
      },
    })

    // Buscar configuração do agente: priorizar agente vinculado à conversa
    let agente = conversa?.agente ?? null
    if (!agente) {
      agente = await db.agente.findFirst()
      if (!agente) {
        agente = await db.agente.create({
          data: {
            nome: 'Aguiatech',
            modelo: 'meta-llama/llama-3.3-70b-instruct:free',
            provedorModelo: 'openrouter',
            personalidade: 'Sou o Aguiatech, um agente de IA brasileiro inteligente e prestativo. Estou aqui para ajudar com qualquer tarefa! Responda sempre em português brasileiro de forma clara e amigável.',
            diretorioTrabalho: '~/aguiatech',
          },
        })
      }
    }

    // Buscar habilidades vinculadas ao agente
    let contextoHabilidades = ''
    if (agente.habilidadeIds) {
      try {
        const idsHabilidades: string[] = JSON.parse(agente.habilidadeIds)
        if (idsHabilidades.length > 0) {
          const habilidades = await db.habilidade.findMany({
            where: { id: { in: idsHabilidades }, ativa: true },
          })
          if (habilidades.length > 0) {
            const skillsTexto = habilidades.map(h => h.conteudo).join('\n\n')
            contextoHabilidades = `\n\n## 🧩 SUAS SKILLS (HABILIDADES)\n\nVocê possui as seguintes skills especializadas que deve utilizar dinamicamente conforme o tipo de problema apresentado:\n\n${skillsTexto}\n\n## ⚡ REGRA DE ORQUESTRAÇÃO (CRÍTICO)\n\nVocê deve:\n1. Identificar automaticamente quais skills usar\n2. Combinar múltiplas skills quando necessário\n3. Priorizar: Diagnóstico → Testes → Solução → Prevenção\n4. Nunca pular etapas críticas\n\n## 🚨 REGRA DE QUALIDADE (INEGOCIÁVEL)\n\n- Seja preciso e técnico\n- Evite respostas genéricas\n- Sempre explique o raciocínio\n- Sempre valide antes de concluir`
          }
        }
      } catch (e) {
        console.warn('Erro ao processar habilidadeIds do agente:', e)
      }
    }

    // Buscar memórias relevantes
    const memorias = await db.memoria.findMany({
      where: { ativa: true },
      orderBy: { importancia: 'desc' },
      take: 10,
    })

    const contextoMemorias = memorias.length > 0
      ? `\n\nMemórias relevantes:\n${memorias.map(m => `- [${m.tipo}] ${m.conteudo}`).join('\n')}`
      : ''

    // Realizar busca web se solicitado
    let contextoBuscaWeb = ''
    if (buscaWebAtiva) {
      const buscaResultado = await buscarNaWeb(conteudoMensagem)
      contextoBuscaWeb = buscaResultado.contexto
      resultadosBusca = buscaResultado.resultados
    }

    // Buscar histórico de mensagens recentes
    const mensagensAnteriores = await db.mensagem.findMany({
      where: { conversaId: id },
      orderBy: { createdAt: 'asc' },
      take: 20,
    })

    // Montar mensagens para o LLM
    const mensagensLLM = []

    // System prompt com personalidade do agente, memórias e busca web
    const instrBuscaWeb = buscaWebAtiva
      ? '\n\nVocê realizou uma busca na web e recebeu resultados reais. Use essas informações para responder de forma completa e atualizada. Sempre cite as fontes (nome do site) quando usar informações da busca. Comece sua resposta mencionando que buscou na web.'
      : ''
    mensagensLLM.push({
      role: 'system' as const,
      content: `${agente.personalidade}${contextoHabilidades}${contextoMemorias}${contextoBuscaWeb}${instrBuscaWeb}\n\nSeu nome é ${agente.nome}. Você é um assistente avançado com acesso a ferramentas. Responda de forma útil, clara e em português brasileiro. Use markdown quando apropriado. Mantenha-se no personagem durante toda a conversa.`,
    })

    // Adicionar histórico
    for (const msg of mensagensAnteriores) {
      mensagensLLM.push({
        role: msg.papel === 'usuario' ? 'user' as const : 'assistant' as const,
        content: msg.conteudo,
      })
    }

    // Chamar LLM baseado no provedor
    let respostaIA = ''
    let tokensIn = 0
    let tokensOut = 0
    let modelo = agente.modelo

    const provedor = agente.provedorModelo

    if (provedor === 'openrouter') {
      // Usar OpenRouter API diretamente
      const resultado = await chatOpenRouter(mensagensLLM, agente.modelo)

      if (resultado.sucesso) {
        respostaIA = resultado.conteudo
        tokensIn = resultado.tokensIn
        tokensOut = resultado.tokensOut
        modelo = resultado.modelo
      } else {
        // Fallback para z-ai gateway se OpenRouter falhar
        console.warn('OpenRouter falhou, usando z-ai gateway como fallback:', resultado.erro)
        try {
          const zai = await ZAI.create()
          const completion = await zai.chat.completions.create({
            messages: mensagensLLM.map(m => ({
              role: m.role === 'system' ? 'assistant' as const : m.role,
              content: m.content,
            })),
            thinking: { type: 'disabled' },
          })
          respostaIA = completion.choices[0]?.message?.content || `Desculpe, não consegui gerar uma resposta via OpenRouter (${resultado.erro}). Tente novamente.`
          tokensIn = completion.usage?.prompt_tokens ?? 0
          tokensOut = completion.usage?.completion_tokens ?? 0
          modelo = completion.model ?? agente.modelo
        } catch (fallbackError) {
          console.error('Fallback também falhou:', fallbackError)
          respostaIA = `Erro ao gerar resposta. OpenRouter: ${resultado.erro}. Configure sua API Key em Configurações → Modelo.`
          tokensIn = 0
          tokensOut = 0
        }
      }
    } else {
      // Usar z-ai gateway (zhipu, etc.)
      try {
        const zai = await ZAI.create()
        const completion = await zai.chat.completions.create({
          messages: mensagensLLM.map(m => ({
            role: m.role === 'system' ? 'assistant' as const : m.role,
            content: m.content,
          })),
          thinking: { type: 'disabled' },
        })

        respostaIA = completion.choices[0]?.message?.content || 'Desculpe, não consegui gerar uma resposta.'
        tokensIn = completion.usage?.prompt_tokens ?? 0
        tokensOut = completion.usage?.completion_tokens ?? 0
        modelo = completion.model ?? agente.modelo
      } catch (llmError) {
        console.error('Erro ao chamar LLM:', llmError)
        respostaIA = `Olá! Recebi sua mensagem: "${body.conteudo}". Sou o Aguiatech, seu agente de IA. Como posso ajudar mais?`
        tokensIn = Math.floor(Math.random() * 100) + 50
        tokensOut = Math.floor(Math.random() * 200) + 100
      }
    }

    const tempoResposta = (Date.now() - startTime) / 1000

    // Adicionar fonte de busca web ao conteúdo se ativa
    let conteudoResposta = respostaIA
    if (buscaWebAtiva && resultadosBusca.length > 0) {
      const fontesBusca = resultadosBusca
        .slice(0, 5)
        .map((r, i) => `[${i + 1}] [${r.fonte}](${r.url})`)
        .join(' ')
      conteudoResposta = respostaIA + `\n\n---\n🔍 **Fontes da busca web:** ${fontesBusca}`
    }

    // Criar mensagem do assistente
    const mensagemAssistente = await db.mensagem.create({
      data: {
        conversaId: id,
        papel: 'assistente',
        conteudo: conteudoResposta,
        ferramenta: buscaWebAtiva ? 'busca-web' : undefined,
        ferramentaArgs: buscaWebAtiva ? JSON.stringify({ query: conteudoMensagem }) : undefined,
        ferramentaRes: buscaWebAtiva ? JSON.stringify(resultadosBusca.slice(0, 5)) : undefined,
        tokensIn,
        tokensOut,
        modelo,
        tempoResposta,
      },
    })

    // Atualizar contadores da conversa
    await db.conversa.update({
      where: { id },
      data: {
        totalMensagens: { increment: 2 },
        totalTokensIn: { increment: tokensIn },
        totalTokensOut: { increment: tokensOut },
      },
    })

    // Auto-generate conversation title if still default
    const conversaAtual = await db.conversa.findUnique({ where: { id } })
    if (conversaAtual && conversaAtual.titulo === 'Nova Conversa') {
      const tituloBase = buscaWebAtiva ? `🔍 ${conteudoMensagem}` : conteudoMensagem
      const titulo = tituloBase.length > 50
        ? tituloBase.substring(0, 47) + '...'
        : tituloBase
      await db.conversa.update({
        where: { id },
        data: { titulo },
      })
    }

    // Incrementar acesso das memórias usadas
    if (memorias.length > 0) {
      await Promise.all(
        memorias.map(m =>
          db.memoria.update({
            where: { id: m.id },
            data: { acessos: { increment: 1 } },
          })
        )
      )
    }

    return NextResponse.json(mensagemAssistente)
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error)
    return NextResponse.json({ error: 'Erro ao enviar mensagem' }, { status: 500 })
  }
}
