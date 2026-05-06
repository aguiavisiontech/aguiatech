import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/integracoes-mcp/[id]/desconectar - Disconnect and update status
export async function POST(
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

    if (!integracao.conectado) {
      return NextResponse.json(
        { error: 'Integração já está desconectada' },
        { status: 400 }
      )
    }

    // Update integration status
    await db.integracaoMCP.update({
      where: { id },
      data: {
        conectado: false,
        status: 'desconectado',
        mensagemErro: null,
      },
    })

    // Create log record for the disconnection
    await db.logIntegracao.create({
      data: {
        integracaoId: id,
        acao: 'desconectar',
        detalhes: `Integração "${integracao.nome}" do tipo ${integracao.tipo} desconectada`,
        status: 'sucesso',
      },
    })

    return NextResponse.json({
      success: true,
      status: 'desconectado',
      message: 'Integração desconectada com sucesso',
    })
  } catch (error) {
    console.error('Erro ao desconectar integração MCP:', error)
    return NextResponse.json(
      { error: 'Erro ao desconectar integração' },
      { status: 500 }
    )
  }
}
