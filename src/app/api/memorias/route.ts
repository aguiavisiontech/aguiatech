import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const memorias = await db.memoria.findMany({
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json(memorias)
  } catch (error) {
    console.error('Erro ao buscar memórias:', error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const memoria = await db.memoria.create({
      data: {
        tipo: body.tipo || 'fato',
        categoria: body.categoria || 'geral',
        conteudo: body.conteudo,
        importancia: body.importancia ?? 0.5,
        origem: body.origem || null,
      },
    })
    return NextResponse.json(memoria)
  } catch (error) {
    console.error('Erro ao criar memória:', error)
    return NextResponse.json({ error: 'Erro ao criar memória' }, { status: 500 })
  }
}
