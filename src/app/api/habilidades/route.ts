import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const habilidades = await db.habilidade.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        execucoes: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    })
    return NextResponse.json(habilidades)
  } catch (error) {
    console.error('Erro ao buscar habilidades:', error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const habilidade = await db.habilidade.create({
      data: {
        nome: body.nome,
        categoria: body.categoria || 'geral',
        descricao: body.descricao || null,
        conteudo: body.conteudo,
        parametros: body.parametros || null,
      },
    })
    return NextResponse.json(habilidade)
  } catch (error) {
    console.error('Erro ao criar habilidade:', error)
    return NextResponse.json({ error: 'Erro ao criar habilidade' }, { status: 500 })
  }
}
