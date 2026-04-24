import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const agente = await db.agente.findUnique({ where: { id } })

    if (!agente) {
      return NextResponse.json(
        { erro: 'Agente não encontrado' },
        { status: 404 }
      )
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const agenteExiste = await db.agente.findUnique({ where: { id } })
    if (!agenteExiste) {
      return NextResponse.json(
        { erro: 'Agente não encontrado' },
        { status: 404 }
      )
    }

    const atualizado = await db.agente.update({
      where: { id },
      data: {
        ...(body.nome !== undefined && { nome: body.nome }),
        ...(body.descricao !== undefined && { descricao: body.descricao }),
        ...(body.avatar !== undefined && { avatar: body.avatar }),
        ...(body.modelo !== undefined && { modelo: body.modelo }),
        ...(body.provedorModelo !== undefined && { provedorModelo: body.provedorModelo }),
        ...(body.personalidade !== undefined && { personalidade: body.personalidade }),
        ...(body.diretorioTrabalho !== undefined && { diretorioTrabalho: body.diretorioTrabalho }),
        ...(body.temperatura !== undefined && { temperatura: body.temperatura }),
        ...(body.maxTokens !== undefined && { maxTokens: body.maxTokens }),
        ...(body.categoria !== undefined && { categoria: body.categoria }),
        ...(body.cor !== undefined && { cor: body.cor }),
        ...(body.habilidadeIds !== undefined && { habilidadeIds: body.habilidadeIds }),
        ...(body.ferramentaIds !== undefined && { ferramentaIds: body.ferramentaIds }),
        ...(body.ativo !== undefined && { ativo: body.ativo }),
        ...(body.ativa !== undefined && { ativo: body.ativa }),
        ...(body.ultimaConversa !== undefined && { ultimaConversa: body.ultimaConversa }),
        ...(body.conversasTotal !== undefined && { conversasTotal: body.conversasTotal }),
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const agenteExiste = await db.agente.findUnique({ where: { id } })
    if (!agenteExiste) {
      return NextResponse.json(
        { erro: 'Agente não encontrado' },
        { status: 404 }
      )
    }

    await db.agente.delete({ where: { id } })

    return NextResponse.json({ mensagem: 'Agente excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir agente:', error)
    return NextResponse.json(
      { erro: 'Falha ao excluir agente' },
      { status: 500 }
    )
  }
}
