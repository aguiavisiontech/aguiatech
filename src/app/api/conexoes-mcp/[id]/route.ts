import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()
    const conexao = await db.conexaoMCP.update({
      where: { id },
      data: body,
    })
    return NextResponse.json(conexao)
  } catch (error) {
    console.error('Erro ao atualizar conexão MCP:', error)
    return NextResponse.json({ error: 'Erro ao atualizar conexão' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    await db.conexaoMCP.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar conexão MCP:', error)
    return NextResponse.json({ error: 'Erro ao deletar conexão' }, { status: 500 })
  }
}
