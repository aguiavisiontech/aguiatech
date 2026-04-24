import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const conversa = await db.conversa.findUnique({
      where: { id },
      include: {
        mensagens: { orderBy: { createdAt: 'desc' }, take: 1 },
        agente: { select: { id: true, nome: true, avatar: true, cor: true, personalidade: true, modelo: true, provedorModelo: true, temperatura: true, maxTokens: true } },
      },
    })
    if (!conversa) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 })
    }
    return NextResponse.json(conversa)
  } catch (error) {
    console.error('Erro ao buscar conversa:', error)
    return NextResponse.json({ error: 'Erro ao buscar conversa' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()

    if (body.acao === 'renomear' && body.titulo) {
      const conversa = await db.conversa.update({
        where: { id },
        data: { titulo: body.titulo },
      })
      return NextResponse.json(conversa)
    }

    if (body.acao === 'limpar') {
      const mensagensDeletadas = await db.mensagem.deleteMany({ where: { conversaId: id } })
      await db.conversa.update({
        where: { id },
        data: {
          totalMensagens: 0,
          totalTokensIn: 0,
          totalTokensOut: 0,
        },
      })
      return NextResponse.json({ success: true, mensagensDeletadas: mensagensDeletadas.count })
    }

    return NextResponse.json({ error: 'Ação não reconhecida' }, { status: 400 })
  } catch (error) {
    console.error('Erro ao atualizar conversa:', error)
    return NextResponse.json({ error: 'Erro ao atualizar conversa' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    await db.mensagem.deleteMany({ where: { conversaId: id } })
    await db.conversa.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar conversa:', error)
    return NextResponse.json({ error: 'Erro ao deletar conversa' }, { status: 500 })
  }
}
