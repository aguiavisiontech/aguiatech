import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const diretrizes = await db.diretrizIA.findMany({
      include: { exemplos: { orderBy: { ordem: 'asc' } } },
      orderBy: { principio: 'asc' },
    })
    return NextResponse.json(diretrizes)
  } catch (error) {
    console.error('Erro ao buscar diretrizes:', error instanceof Error ? error.message : error)
    return NextResponse.json({ erro: 'Falha ao buscar diretrizes', detalhe: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const dados = await request.json()
    const diretriz = await db.diretrizIA.create({ data: dados })
    return NextResponse.json(diretriz, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar diretriz:', error)
    return NextResponse.json({ erro: 'Falha ao criar diretriz' }, { status: 500 })
  }
}
