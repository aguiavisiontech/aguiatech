import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/integracoes-mcp/[id]/ferramentas - List tools for integration
export async function GET(
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

    const ferramentas = await db.ferramentaMCP.findMany({
      where: { integracaoId: id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(ferramentas)
  } catch (error) {
    console.error('Erro ao buscar ferramentas da integração MCP:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar ferramentas' },
      { status: 500 }
    )
  }
}

// POST /api/integracoes-mcp/[id]/ferramentas - Add a tool to the integration
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

    const body = await request.json()
    const { nome, descricao, parametros, categoria } = body

    if (!nome) {
      return NextResponse.json(
        { error: 'Nome da ferramenta é obrigatório' },
        { status: 400 }
      )
    }

    // Validate parametros JSON if provided
    if (parametros) {
      try {
        JSON.parse(parametros)
      } catch {
        return NextResponse.json(
          { error: 'Parametros deve ser um JSON válido' },
          { status: 400 }
        )
      }
    }

    const ferramenta = await db.ferramentaMCP.create({
      data: {
        integracaoId: id,
        nome,
        descricao: descricao || null,
        parametros: parametros || null,
        categoria: categoria || 'geral',
      },
    })

    // Create log for tool addition
    await db.logIntegracao.create({
      data: {
        integracaoId: id,
        acao: 'executar',
        detalhes: `Ferramenta "${nome}" adicionada à integração "${integracao.nome}"`,
        status: 'sucesso',
      },
    })

    return NextResponse.json(ferramenta, { status: 201 })
  } catch (error) {
    console.error('Erro ao adicionar ferramenta à integração MCP:', error)
    return NextResponse.json(
      { error: 'Erro ao adicionar ferramenta' },
      { status: 500 }
    )
  }
}
