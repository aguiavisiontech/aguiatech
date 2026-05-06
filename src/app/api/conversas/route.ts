import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const conversas = await db.conversa.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { mensagens: true } },
        agente: { select: { id: true, nome: true, avatar: true, cor: true, personalidade: true } },
      },
    })
    return NextResponse.json(conversas)
  } catch (error) {
    console.error('Erro ao buscar conversas:', error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const agenteId = body?.agenteId as string | undefined

    let titulo = 'Nova Conversa'
    let agenteData: { id: string; nome: string } | null = null

    if (agenteId) {
      const agente = await db.agente.findUnique({ where: { id: agenteId } })
      if (agente) {
        titulo = `Chat com ${agente.nome}`
        agenteData = { id: agente.id, nome: agente.nome }
        await db.agente.update({
          where: { id: agenteId },
          data: {
            conversasTotal: { increment: 1 },
            ultimaConversa: new Date(),
          },
        })
      }
    }

    const conversa = await db.conversa.create({
      data: {
        titulo,
        plataforma: 'web',
        agenteId: agenteId || undefined,
      },
      include: {
        agente: { select: { id: true, nome: true, avatar: true, cor: true, personalidade: true } },
      },
    })
    return NextResponse.json(conversa)
  } catch (error) {
    console.error('Erro ao criar conversa:', error)
    return NextResponse.json({ error: 'Erro ao criar conversa' }, { status: 500 })
  }
}
