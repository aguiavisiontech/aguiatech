import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.toLowerCase()

    if (!query || query.length < 2) {
      return NextResponse.json([])
    }

    const mensagens = await db.mensagem.findMany({
      where: {
        conteudo: { contains: query },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        conversa: {
          select: {
            id: true,
            titulo: true,
          },
        },
      },
    })

    const resultados = mensagens.map((msg) => ({
      id: msg.id,
      conversaId: msg.conversaId,
      conversaTitulo: msg.conversa.titulo,
      papel: msg.papel,
      conteudo: msg.conteudo,
      createdAt: msg.createdAt,
    }))

    return NextResponse.json(resultados)
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error)
    return NextResponse.json([])
  }
}
