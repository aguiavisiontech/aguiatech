import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const habilidade = await db.habilidade.findUnique({
      where: { id },
      include: {
        execucoes: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })
    if (!habilidade) {
      return NextResponse.json({ error: 'Habilidade não encontrada' }, { status: 404 })
    }
    return NextResponse.json(habilidade)
  } catch (error) {
    console.error('Erro ao buscar habilidade:', error)
    return NextResponse.json({ error: 'Erro ao buscar habilidade' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()
    const habilidade = await db.habilidade.update({
      where: { id },
      data: body,
    })
    return NextResponse.json(habilidade)
  } catch (error) {
    console.error('Erro ao atualizar habilidade:', error)
    return NextResponse.json({ error: 'Erro ao atualizar habilidade' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    await db.execucaoHabilidade.deleteMany({ where: { habilidadeId: id } })
    await db.habilidade.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar habilidade:', error)
    return NextResponse.json({ error: 'Erro ao deletar habilidade' }, { status: 500 })
  }
}
