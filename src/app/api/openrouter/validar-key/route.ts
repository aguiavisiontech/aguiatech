import { NextRequest, NextResponse } from 'next/server'
import { validarApiKeyOpenRouter } from '@/lib/openrouter'

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json()

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json({ valida: false, erro: 'API Key é obrigatória' }, { status: 400 })
    }

    const resultado = await validarApiKeyOpenRouter(apiKey)
    return NextResponse.json(resultado)
  } catch (error) {
    console.error('Erro ao validar API key:', error)
    return NextResponse.json({ valida: false, erro: 'Erro interno do servidor' }, { status: 500 })
  }
}
