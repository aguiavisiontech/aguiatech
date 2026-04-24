import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    let agente = await db.agente.findFirst()

    if (!agente) {
      agente = await db.agente.create({
        data: {
          nome: 'Aguiatech',
          modelo: 'glm-4-plus',
          provedorModelo: 'zhipu',
          personalidade:
            'Sou o Aguiatech, um agente de IA brasileiro inteligente e prestativo. Estou aqui para ajudar com qualquer tarefa!',
          diretorioTrabalho: '~/aguiatech',
          ativo: true,
        },
      })
    }

    return NextResponse.json(agente)
  } catch (error) {
    console.error('Erro ao buscar agente:', error)
    return NextResponse.json(
      { erro: 'Falha ao buscar agente' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    let agente = await db.agente.findFirst()

    if (!agente) {
      agente = await db.agente.create({
        data: {
          nome: body.nome ?? 'Aguiatech',
          modelo: body.modelo ?? 'glm-4-plus',
          provedorModelo: body.provedorModelo ?? 'zhipu',
          personalidade:
            body.personalidade ??
            'Sou o Aguiatech, um agente de IA brasileiro inteligente e prestativo. Estou aqui para ajudar com qualquer tarefa!',
          diretorioTrabalho: body.diretorioTrabalho ?? '~/aguiatech',
          ativo: body.ativo ?? true,
        },
      })
      return NextResponse.json(agente)
    }

    const atualizado = await db.agente.update({
      where: { id: agente.id },
      data: {
        ...(body.nome !== undefined && { nome: body.nome }),
        ...(body.modelo !== undefined && { modelo: body.modelo }),
        ...(body.provedorModelo !== undefined && {
          provedorModelo: body.provedorModelo,
        }),
        ...(body.personalidade !== undefined && {
          personalidade: body.personalidade,
        }),
        ...(body.diretorioTrabalho !== undefined && {
          diretorioTrabalho: body.diretorioTrabalho,
        }),
        ...(body.ativo !== undefined && { ativo: body.ativo }),
      },
    })

    return NextResponse.json(atualizado)
  } catch (error) {
    console.error('Erro ao atualizar agente:', error)
    return NextResponse.json(
      { erro: 'Falha ao atualizar agente' },
      { status: 500 }
    )
  }
}
