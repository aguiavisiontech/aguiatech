import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/integracoes-mcp/[id]/duplicar - Clone an integration with "(Cópia)" suffix
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const existing = await db.integracaoMCP.findUnique({
      where: { id },
      include: {
        ferramentas: true,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Integração não encontrada' },
        { status: 404 }
      )
    }

    // Create clone with "(Cópia)" suffix
    const clone = await db.integracaoMCP.create({
      data: {
        nome: `${existing.nome} (Cópia)`,
        tipo: existing.tipo,
        descricao: existing.descricao,
        config: existing.config,
        webhookUrl: existing.webhookUrl,
        tags: existing.tags,
        metricas: existing.metricas,
        criadoPor: existing.criadoPor,
        prioridade: existing.prioridade,
        ativa: false,
        conectado: false,
        status: 'desconectado',
      },
    })

    // Clone tools as well
    if (existing.ferramentas.length > 0) {
      await db.ferramentaMCP.createMany({
        data: existing.ferramentas.map((f) => ({
          integracaoId: clone.id,
          nome: f.nome,
          descricao: f.descricao,
          parametros: f.parametros,
          categoria: f.categoria,
          requerAprovacao: f.requerAprovacao,
          ativa: f.ativa,
          usoContagem: 0, // Reset usage count for clone
        })),
      })
    }

    // Log the duplication
    await db.logIntegracao.create({
      data: {
        integracaoId: clone.id,
        acao: 'criar',
        detalhes: `Integração duplicada de "${existing.nome}"`,
        status: 'sucesso',
      },
    })

    return NextResponse.json(clone, { status: 201 })
  } catch (error) {
    console.error('Erro ao duplicar integração MCP:', error)
    return NextResponse.json(
      { error: 'Erro ao duplicar integração' },
      { status: 500 }
    )
  }
}
