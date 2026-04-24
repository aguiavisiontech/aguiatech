import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()
    const ferramenta = await db.ferramenta.update({
      where: { id },
      data: body,
    })
    return NextResponse.json(ferramenta)
  } catch (error) {
    console.error('Erro ao atualizar ferramenta:', error)
    return NextResponse.json({ error: 'Erro ao atualizar ferramenta' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    await db.ferramenta.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar ferramenta:', error)
    return NextResponse.json({ error: 'Erro ao deletar ferramenta' }, { status: 500 })
  }
}
