import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const conexoes = await db.conexaoMCP.findMany({
      orderBy: { nome: 'asc' },
    })
    return NextResponse.json(conexoes)
  } catch (error) {
    console.error('Erro ao buscar conexões MCP:', error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const conexao = await db.conexaoMCP.create({
      data: {
        nome: body.nome,
        tipo: body.tipo || 'stdio',
        comando: body.tipo === 'stdio' ? body.comando : null,
        args: body.tipo === 'stdio' ? body.args : null,
        url: body.tipo === 'sse' ? body.url : null,
      },
    })
    return NextResponse.json(conexao)
  } catch (error) {
    console.error('Erro ao criar conexão MCP:', error)
    return NextResponse.json({ error: 'Erro ao criar conexão' }, { status: 500 })
  }
}
