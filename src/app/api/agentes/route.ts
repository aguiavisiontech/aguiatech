import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const agentes = await db.agente.findMany({
      where: { ehTemplate: { not: true } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        nome: true,
        descricao: true,
        avatar: true,
        modelo: true,
        provedorModelo: true,
        personalidade: true,
        diretorioTrabalho: true,
        temperatura: true,
        maxTokens: true,
        categoria: true,
        cor: true,
        habilidadeIds: true,
        ferramentaIds: true,
        ativo: true,
        ehTemplate: true,
        conversasTotal: true,
        ultimaConversa: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    return NextResponse.json(agentes)
  } catch (error) {
    console.error('Erro ao buscar agentes:', error)
    return NextResponse.json(
      { erro: 'Falha ao buscar agentes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const agente = await db.agente.create({
      data: {
        nome: body.nome ?? 'Novo Agente',
        descricao: body.descricao ?? null,
        avatar: body.avatar ?? null,
        modelo: body.modelo ?? 'meta-llama/llama-3.3-70b-instruct:free',
        provedorModelo: body.provedorModelo ?? 'openrouter',
        personalidade: body.personalidade ?? 'Sou um agente de IA inteligente e prestativo.',
        diretorioTrabalho: body.diretorioTrabalho ?? '~/aguiatech',
        temperatura: body.temperatura ?? 0.7,
        maxTokens: body.maxTokens ?? 4096,
        categoria: body.categoria ?? 'geral',
        cor: body.cor ?? 'amber',
        habilidadeIds: body.habilidadeIds ?? null,
        ferramentaIds: body.ferramentaIds ?? null,
        ativo: body.ativo ?? true,
        ehTemplate: false,
      },
    })

    return NextResponse.json(agente)
  } catch (error) {
    console.error('Erro ao criar agente:', error)
    return NextResponse.json(
      { erro: 'Falha ao criar agente' },
      { status: 500 }
    )
  }
}
