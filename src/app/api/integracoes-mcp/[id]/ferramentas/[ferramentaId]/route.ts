import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUT /api/integracoes-mcp/[id]/ferramentas/[ferramentaId] - Update a tool
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; ferramentaId: string }> }
) {
  const { id, ferramentaId } = await params
  try {
    const ferramenta = await db.ferramentaMCP.findFirst({
      where: { id: ferramentaId, integracaoId: id },
    })

    if (!ferramenta) {
      return NextResponse.json(
        { error: 'Ferramenta não encontrada' },
        { status: 404 }
      )
    }

    const body = await request.json()

    // Build update data - only allow specific fields
    const updateData: Record<string, unknown> = {}
    const allowedFields = [
      'nome',
      'descricao',
      'parametros',
      'categoria',
      'requerAprovacao',
      'ativa',
      'usoContagem',
      'ultimaExecucao',
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // Validate parametros JSON if being updated
    if (updateData.parametros) {
      try {
        JSON.parse(updateData.parametros as string)
      } catch {
        return NextResponse.json(
          { error: 'Parametros deve ser um JSON válido' },
          { status: 400 }
        )
      }
    }

    const updated = await db.ferramentaMCP.update({
      where: { id: ferramentaId },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Erro ao atualizar ferramenta MCP:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar ferramenta' },
      { status: 500 }
    )
  }
}

// DELETE /api/integracoes-mcp/[id]/ferramentas/[ferramentaId] - Delete a tool
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; ferramentaId: string }> }
) {
  const { id, ferramentaId } = await params
  try {
    const ferramenta = await db.ferramentaMCP.findFirst({
      where: { id: ferramentaId, integracaoId: id },
    })

    if (!ferramenta) {
      return NextResponse.json(
        { error: 'Ferramenta não encontrada' },
        { status: 404 }
      )
    }

    await db.ferramentaMCP.delete({ where: { id: ferramentaId } })

    // Create log for tool removal
    await db.logIntegracao.create({
      data: {
        integracaoId: id,
        acao: 'executar',
        detalhes: `Ferramenta "${ferramenta.nome}" removida da integração`,
        status: 'sucesso',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Ferramenta removida com sucesso',
    })
  } catch (error) {
    console.error('Erro ao deletar ferramenta MCP:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar ferramenta' },
      { status: 500 }
    )
  }
}
