import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/integracoes-mcp/[id]/logs - Get logs for an integration (paginated, last 50)
export async function GET(
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

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '50')))
    const skip = (page - 1) * limit

    const [logs, total] = await Promise.all([
      db.logIntegracao.findMany({
        where: { integracaoId: id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.logIntegracao.count({
        where: { integracaoId: id },
      }),
    ])

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Erro ao buscar logs da integração MCP:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar logs' },
      { status: 500 }
    )
  }
}

// DELETE /api/integracoes-mcp/[id]/logs - Clear all logs for an integration
export async function DELETE(
  _request: NextRequest,
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

    const result = await db.logIntegracao.deleteMany({
      where: { integracaoId: id },
    })

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: `${result.count} logs removidos com sucesso`,
    })
  } catch (error) {
    console.error('Erro ao limpar logs da integração MCP:', error)
    return NextResponse.json(
      { error: 'Erro ao limpar logs' },
      { status: 500 }
    )
  }
}
