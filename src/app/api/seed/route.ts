import { NextResponse } from 'next/server'
import { seedFerramentas } from '@/lib/seed-ferramentas'

export async function POST() {
  try {
    await seedFerramentas()

    return NextResponse.json({ mensagem: 'Seed de ferramentas executado com sucesso' })
  } catch (error) {
    console.error('Erro ao executar seed:', error)
    return NextResponse.json(
      { erro: 'Falha ao executar seed' },
      { status: 500 }
    )
  }
}
