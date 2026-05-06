import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const totalConversas = await db.conversa.count()
    const totalHabilidades = await db.habilidade.count()
    const totalMemorias = await db.memoria.count()
    const ferramentasAtivas = await db.ferramenta.count({ where: { ativa: true } })

    return NextResponse.json({
      totalConversas,
      totalHabilidades,
      totalMemorias,
      ferramentasAtivas,
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json({
      totalConversas: 0,
      totalHabilidades: 0,
      totalMemorias: 0,
      ferramentasAtivas: 0,
    })
  }
}
