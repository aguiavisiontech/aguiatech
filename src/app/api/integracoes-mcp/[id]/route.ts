import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/integracoes-mcp/[id] - Get single integration with tools and recent logs
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const integracao = await db.integracaoMCP.findUnique({
      where: { id },
      include: {
        ferramentas: {
          orderBy: { nome: 'asc' },
        },
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: {
          select: { ferramentas: true, logs: true },
        },
      },
    })

    if (!integracao) {
      return NextResponse.json(
        { error: 'Integração não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(integracao)
  } catch (error) {
    console.error('Erro ao buscar integração MCP:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar integração' },
      { status: 500 }
    )
  }
}

// PUT /api/integracoes-mcp/[id] - Update integration
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    // Check if integration exists
    const existing = await db.integracaoMCP.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Integração não encontrada' },
        { status: 404 }
      )
    }

    const body = await request.json()

    // Build update data - only allow specific fields
    const data: Record<string, unknown> = {}

    if (body.nome !== undefined) data.nome = body.nome
    if (body.descricao !== undefined) data.descricao = body.descricao
    if (body.ativa !== undefined) data.ativa = body.ativa
    if (body.conectado !== undefined) data.conectado = body.conectado
    if (body.status !== undefined) data.status = body.status
    if (body.mensagemErro !== undefined) data.mensagemErro = body.mensagemErro
    if (body.webhookUrl !== undefined) data.webhookUrl = body.webhookUrl
    if (body.prioridade !== undefined) data.prioridade = body.prioridade
    if (body.criadoPor !== undefined) data.criadoPor = body.criadoPor

    // Validate tipo if being updated
    if (body.tipo !== undefined) {
      const tiposValidos = ['n8n', 'whatsapp', 'telegram', 'stdio', 'sse']
      if (!tiposValidos.includes(body.tipo)) {
        return NextResponse.json(
          { error: `Tipo inválido. Tipos válidos: ${tiposValidos.join(', ')}` },
          { status: 400 }
        )
      }
      data.tipo = body.tipo
    }

    // Process config - accept string (JSON) or object
    if (body.config !== undefined) {
      if (typeof body.config === 'string') {
        try {
          JSON.parse(body.config)
          data.config = body.config
        } catch {
          return NextResponse.json(
            { error: 'Config deve ser um JSON válido' },
            { status: 400 }
          )
        }
      } else {
        data.config = JSON.stringify(body.config)
      }
    }

    // Process metricas - accept string (JSON) or object
    if (body.metricas !== undefined) {
      data.metricas = typeof body.metricas === 'string' ? body.metricas : JSON.stringify(body.metricas)
    }

    // Process tags - accept string (JSON) or array
    if (body.tags !== undefined) {
      if (typeof body.tags === 'string') {
        try {
          JSON.parse(body.tags)
          data.tags = body.tags
        } catch {
          return NextResponse.json(
            { error: 'Tags deve ser um JSON array válido' },
            { status: 400 }
          )
        }
      } else if (Array.isArray(body.tags)) {
        data.tags = JSON.stringify(body.tags)
      }
    }

    if (body.ultimaSync !== undefined) {
      data.ultimaSync = new Date(body.ultimaSync)
    }

    const integracao = await db.integracaoMCP.update({
      where: { id },
      data,
    })

    // Log the update
    await db.logIntegracao.create({
      data: {
        integracaoId: id,
        acao: 'atualizar',
        detalhes: `Integração "${integracao.nome}" atualizada`,
        status: 'sucesso',
      },
    })

    return NextResponse.json(integracao)
  } catch (error) {
    console.error('Erro ao atualizar integração MCP:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar integração' },
      { status: 500 }
    )
  }
}

// DELETE /api/integracoes-mcp/[id] - Delete integration and cascade
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const existing = await db.integracaoMCP.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Integração não encontrada' },
        { status: 404 }
      )
    }

    // Cascade delete is handled by Prisma schema (onDelete: Cascade)
    await db.integracaoMCP.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: 'Integração removida com sucesso',
    })
  } catch (error) {
    console.error('Erro ao deletar integração MCP:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar integração' },
      { status: 500 }
    )
  }
}
