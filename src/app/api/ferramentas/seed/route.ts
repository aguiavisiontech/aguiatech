import { NextResponse } from 'next/server'
import { seedFerramentas } from '@/lib/seed-ferramentas'

export async function POST() {
  try {
    await seedFerramentas()
    return NextResponse.json({ success: true, message: 'Ferramentas padrão carregadas' })
  } catch (error) {
    console.error('Erro ao carregar ferramentas padrão:', error)
    return NextResponse.json({ error: 'Erro ao carregar ferramentas' }, { status: 500 })
  }
}
