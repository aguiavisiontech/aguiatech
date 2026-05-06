import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const tarefas = await db.tarefaAgendada.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        historico: {
          orderBy: { executadaEm: 'desc' },
          take: 10,
        },
      },
    })
    return NextResponse.json(tarefas)
  } catch (error) {
    console.error('Erro ao buscar tarefas agendadas:', error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const tarefa = await db.tarefaAgendada.create({
      data: {
        nome: body.nome,
        descricao: body.descricao || null,
        cron: body.cron,
      },
    })
    return NextResponse.json(tarefa)
  } catch (error) {
    console.error('Erro ao criar tarefa agendada:', error)
    return NextResponse.json({ error: 'Erro ao criar tarefa' }, { status: 500 })
  }
}
