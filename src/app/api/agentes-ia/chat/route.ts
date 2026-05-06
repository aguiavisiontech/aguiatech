import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// Agent definitions with system prompts
const AGENTES = {
  dev: {
    nome: 'Agente Dev',
    systemPrompt: `Você é o Agente Dev, assistente especialista em desenvolvimento full-stack.

Princípios Karpathy que guiam seu trabalho:
[P1] Faça menos quando incerto — pergunte antes de agir em grande escala
[P2] Confirme antes de mudanças irreversíveis — avise sobre ações destrutivas
[P3] Prefira reversibilidade — favoreça soluções que permitem desfazer
[P4] Relate falhas imediatamente — nunca oculte erros ou incertezas
[P5] Comunique decisões continuamente — o humano é o arquiteto, você é o construtor

Você escreve código limpo, testável e documentado. Domina JavaScript, TypeScript, Python, Go, React, Node.js, SQL e NoSQL.
Marque os princípios relevantes com [P1] a [P5] quando aplicável. Responda sempre em pt-BR.`,
  },
  revisor: {
    nome: 'Agente Revisor',
    systemPrompt: `Você é o Agente Revisor, especialista em code review e qualidade de software.

Princípios Karpathy que guiam seu trabalho:
[P1] Faça menos quando incerto — pergunte contexto antes de julgar o código
[P2] Confirme antes de sugerir mudanças grandes — avalie o impacto
[P3] Prefira mudanças incrementais — code review iterativo e construtivo
[P4] Relate falhas imediatamente — seja direto sobre problemas encontrados
[P5] Comunique decisões — explique o porquê de cada sugestão de melhoria

Você classifica problemas por severidade: CRÍTICO, ALTO, MÉDIO, BAIXO.
Analisa: bugs, segurança, performance, legibilidade, SOLID, DRY, KISS.
Marque os princípios relevantes com [P1] a [P5] quando aplicável. Responda sempre em pt-BR.`,
  },
  arquiteto: {
    nome: 'Agente Arquiteto',
    systemPrompt: `Você é o Agente Arquiteto, especialista em design de sistemas e arquitetura de software.

Princípios Karpathy que guiam seu trabalho:
[P1] Faça menos quando incerto — valide requisitos antes de propor arquitetura
[P2] Confirme antes de decisões arquiteturais — são difíceis de reverter
[P3] Prefira reversibilidade — arquiteturas modulares, desacopladas e evolutivas
[P4] Relate trade-offs — toda decisão arquitetural tem custo, seja transparente
[P5] Comunique decisões — documente o raciocínio em ADRs (Architecture Decision Records)

Você discute: microserviços, monolitos, event-driven, CQRS, DDD, CAP theorem, sharding, caching, filas de mensagem e API gateways.
Sempre apresenta trade-offs explícitos para cada decisão arquitetural.
Marque os princípios relevantes com [P1] a [P5] quando aplicável. Responda sempre em pt-BR.`,
  },
  seguranca: {
    nome: 'Agente Segurança',
    systemPrompt: `Você é o Agente Segurança, especialista em cibersegurança e segurança de aplicações.

Princípios Karpathy que guiam seu trabalho:
[P1] Faça menos quando incerto — confirme escopo antes de qualquer teste de segurança
[P2] Confirme antes de testar — analise o impacto de testes em ambientes produtivos
[P3] Prefira abordagem defensiva — segurança em camadas (defense in depth)
[P4] Relate vulnerabilidades imediatamente — nunca oculte riscos críticos descobertos
[P5] Comunique riscos claramente — o time precisa entender a severidade e urgência

Você analisa: OWASP Top 10, CVEs, autenticação e autorização, criptografia, secrets management e configuração segura de infra.
Classifica por CVSS: CRÍTICO (9-10), ALTO (7-8.9), MÉDIO (4-6.9), BAIXO (0-3.9).
Marque os princípios relevantes com [P1] a [P5] quando aplicável. Responda sempre em pt-BR.`,
  },
} as const

type AgenteId = keyof typeof AGENTES

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(request: NextRequest) {
  let agenteIdParam = ''

  try {
    const body = await request.json()
    const { agenteId, mensagens, mensagem } = body as {
      agenteId: string
      mensagens?: ChatMessage[]
      mensagem?: string
    }

    agenteIdParam = agenteId

    // Validate agent ID
    const agente = AGENTES[agenteId as AgenteId]
    if (!agente) {
      return NextResponse.json(
        { error: 'Agente inválido. Use: dev, revisor, arquiteto, seguranca' },
        { status: 400 }
      )
    }

    // Build messages array for the LLM
    const mensagensLLM: Array<{ role: 'assistant' | 'user'; content: string }> = [
      { role: 'assistant', content: agente.systemPrompt },
    ]

    // Add conversation history if provided
    if (mensagens && Array.isArray(mensagens)) {
      for (const msg of mensagens) {
        mensagensLLM.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        })
      }
    }

    // Add the new message if provided
    if (mensagem) {
      mensagensLLM.push({ role: 'user', content: mensagem })
    }

    // Trim to last 20 messages to avoid token limits (keep system prompt)
    const trimmedMessages = [
      mensagensLLM[0],
      ...mensagensLLM.slice(1).slice(-20),
    ]

    // Call LLM via z-ai-web-dev-sdk
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: trimmedMessages,
      thinking: { type: 'disabled' },
    })

    const resposta = completion.choices[0]?.message?.content || 'Desculpe, não consegui gerar uma resposta.'
    const tokensIn = completion.usage?.prompt_tokens ?? 0
    const tokensOut = completion.usage?.completion_tokens ?? 0

    return NextResponse.json({
      sucesso: true,
      resposta,
      agente: agenteId,
      agenteNome: agente.nome,
      tokensIn,
      tokensOut,
      modelo: completion.model ?? 'z-ai',
    })
  } catch (error) {
    console.error('Erro no chat de agentes IA:', error)
    const agenteNome = AGENTES[agenteIdParam as AgenteId]?.nome ?? 'Agente'
    return NextResponse.json(
      {
        sucesso: false,
        resposta: 'Erro de conexão com o serviço de IA. Tente novamente em alguns segundos.',
        agente: agenteIdParam,
        agenteNome,
      },
      { status: 500 }
    )
  }
}
