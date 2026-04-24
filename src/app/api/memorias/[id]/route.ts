import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()
    const memoria = await db.memoria.update({
      where: { id },
      data: body,
    })
    return NextResponse.json(memoria)
  } catch (error) {
    console.error('Erro ao atualizar memória:', error)
    return NextResponse.json({ error: 'Erro ao atualizar memória' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    await db.memoria.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar memória:', error)
    return NextResponse.json({ error: 'Erro ao deletar memória' }, { status: 500 })
  }
}
