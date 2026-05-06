import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/integracoes-mcp/[id]/webhook - Receive webhook from external services
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const integracao = await db.integracaoMCP.findUnique({ where: { id } })
    if (!integracao) {
      return NextResponse.json(
        { error: 'Integração não encontrada' },
        { status: 404 }
      )
    }

    if (!integracao.ativa) {
      return NextResponse.json(
        { error: 'Integração está inativa' },
        { status: 400 }
      )
    }

    // Parse the webhook payload
    let payload: unknown
    try {
      payload = await request.json()
    } catch {
      payload = null
    }

    // Build detailed log entry
    const detalhes = [
      `Webhook recebido para integração "${integracao.nome}" (${integracao.tipo})`,
      payload ? `Payload: ${JSON.stringify(payload).substring(0, 500)}` : 'Sem payload',
    ].join(' | ')

    // Create log record for the webhook
    await db.logIntegracao.create({
      data: {
        integracaoId: id,
        acao: 'webhook',
        detalhes,
        status: 'sucesso',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Webhook recebido com sucesso',
    })
  } catch (error) {
    console.error('Erro ao processar webhook da integração MCP:', error)
    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    )
  }
}
