import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const ferramentas = await db.ferramenta.findMany({
      orderBy: { nome: 'asc' },
    })
    return NextResponse.json(ferramentas)
  } catch (error) {
    console.error('Erro ao buscar ferramentas:', error)
    return NextResponse.json([])
  }
}
