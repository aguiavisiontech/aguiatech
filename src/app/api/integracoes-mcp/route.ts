import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/integracoes-mcp - List all integrations with tools count and latest log
export async function GET() {
  try {
    const integracoes = await db.integracaoMCP.findMany({
      orderBy: [{ prioridade: 'desc' }, { nome: 'asc' }],
      include: {
        _count: {
          select: { ferramentas: true },
        },
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    const result = integracoes.map(({ logs, _count, ...rest }) => ({
      ...rest,
      ferramentasCount: _count.ferramentas,
      ultimoLog: logs[0] || null,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Erro ao buscar integrações MCP:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar integrações' },
      { status: 500 }
    )
  }
}

// POST /api/integracoes-mcp - Create a new integration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { nome, tipo, descricao, config, webhookUrl, tags } = body

    if (!nome || !tipo) {
      return NextResponse.json(
        { error: 'Nome e tipo são obrigatórios' },
        { status: 400 }
      )
    }

    const tiposValidos = ['n8n', 'whatsapp', 'telegram', 'stdio', 'sse']
    if (!tiposValidos.includes(tipo)) {
      return NextResponse.json(
        { error: `Tipo inválido. Tipos válidos: ${tiposValidos.join(', ')}` },
        { status: 400 }
      )
    }

    // Process and validate config JSON
    let configStr: string | null = null
    if (config) {
      // Accept config as either a string (JSON) or an object
      const configObj = typeof config === 'string' ? JSON.parse(config) : config

      switch (tipo) {
        case 'n8n':
          if (!configObj.baseUrl) {
            return NextResponse.json(
              { error: 'Config n8n: baseUrl é obrigatório' },
              { status: 400 }
            )
          }
          break
        case 'whatsapp':
          if (!configObj.phoneNumberId || !configObj.accessToken) {
            return NextResponse.json(
              { error: 'Config whatsapp: phoneNumberId e accessToken são obrigatórios' },
              { status: 400 }
            )
          }
          break
        case 'telegram':
          if (!configObj.botToken) {
            return NextResponse.json(
              { error: 'Config telegram: botToken é obrigatório' },
              { status: 400 }
            )
          }
          break
        case 'stdio':
          if (!configObj.comando) {
            return NextResponse.json(
              { error: 'Config stdio: comando é obrigatório' },
              { status: 400 }
            )
          }
          break
        case 'sse':
          if (!configObj.url) {
            return NextResponse.json(
              { error: 'Config sse: url é obrigatória' },
              { status: 400 }
            )
          }
          break
      }

      configStr = JSON.stringify(configObj)
    }

    // Process tags - accept as string (JSON) or array
    let tagsStr: string | null = null
    if (tags) {
      if (typeof tags === 'string') {
        try {
          JSON.parse(tags)
          tagsStr = tags
        } catch {
          return NextResponse.json(
            { error: 'Tags deve ser um JSON array válido' },
            { status: 400 }
          )
        }
      } else if (Array.isArray(tags)) {
        tagsStr = JSON.stringify(tags)
      }
    }

    const integracao = await db.integracaoMCP.create({
      data: {
        nome,
        tipo,
        descricao: descricao || null,
        config: configStr,
        webhookUrl: webhookUrl || null,
        tags: tagsStr,
        ativa: true,
        conectado: false,
        status: 'desconectado',
      },
    })

    // Create initial log
    await db.logIntegracao.create({
      data: {
        integracaoId: integracao.id,
        acao: 'criar',
        detalhes: `Integração "${nome}" do tipo ${tipo} criada`,
        status: 'sucesso',
      },
    })

    return NextResponse.json(integracao, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar integração MCP:', error)
    return NextResponse.json(
      { error: 'Erro ao criar integração' },
      { status: 500 }
    )
  }
}
