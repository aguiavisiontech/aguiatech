import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    let agente = await db.agente.findFirst()
    if (!agente) {
      agente = await db.agente.create({
        data: {},
      })
    }
    return NextResponse.json(agente)
  } catch (error) {
    console.error('Erro ao buscar configuração do agente:', error)
    return NextResponse.json({ error: 'Erro ao buscar configuração' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    let agente = await db.agente.findFirst()
    if (!agente) {
      agente = await db.agente.create({ data: body })
    } else {
      agente = await db.agente.update({
        where: { id: agente.id },
        data: body,
      })
    }
    return NextResponse.json(agente)
  } catch (error) {
    console.error('Erro ao atualizar configuração do agente:', error)
    return NextResponse.json({ error: 'Erro ao atualizar configuração' }, { status: 500 })
  }
}
