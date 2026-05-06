import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.prompt) {
      return NextResponse.json(
        { erro: 'Prompt é obrigatório' },
        { status: 400 }
      )
    }

    const zai = await ZAI.create()
    const resultado = await zai.images.generations.create({
      prompt: body.prompt,
      size: body.size ?? '1024x1024',
    })

    return NextResponse.json(resultado)
  } catch (error) {
    console.error('Erro na geração de imagem:', error)
    return NextResponse.json(
      { erro: 'Falha ao gerar imagem' },
      { status: 500 }
    )
  }
}
