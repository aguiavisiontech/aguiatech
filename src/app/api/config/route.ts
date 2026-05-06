import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const configs = await db.config.findMany()

    // Return as key-value object for easier consumption
    const configMap: Record<string, string> = {}
    for (const config of configs) {
      configMap[config.chave] = config.valor
    }

    return NextResponse.json(configMap)
  } catch (error) {
    console.error('Erro ao buscar configurações:', error)
    return NextResponse.json(
      { erro: 'Falha ao buscar configurações' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.chave || body.valor === undefined) {
      return NextResponse.json(
        { erro: 'Chave e valor são obrigatórios' },
        { status: 400 }
      )
    }

    const config = await db.config.upsert({
      where: { chave: body.chave },
      update: { valor: String(body.valor) },
      create: { chave: body.chave, valor: String(body.valor) },
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error('Erro ao definir configuração:', error)
    return NextResponse.json(
      { erro: 'Falha ao definir configuração' },
      { status: 500 }
    )
  }
}
