import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/integracoes-mcp/[id]/conectar - Test connection and update status
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

    const startTime = Date.now()
    let conectado = false
    let mensagemErro: string | null = null
    let detalhesLog = ''

    const config = integracao.config ? JSON.parse(integracao.config) : {}

    switch (integracao.tipo) {
      case 'n8n': {
        // Verify by fetching workflows from n8n API
        try {
          const baseUrl = config.baseUrl?.replace(/\/$/, '')
          const apiKey = config.apiKey
          if (!baseUrl || !apiKey) {
            throw new Error('baseUrl e apiKey são obrigatórios na configuração')
          }

          const response = await fetch(`${baseUrl}/api/v1/workflows`, {
            headers: {
              'X-N8N-API-KEY': apiKey,
              'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(10000),
          })

          if (response.ok) {
            conectado = true
            const data = await response.json()
            detalhesLog = `Conexão n8n bem-sucedida. ${data.data?.length || 0} workflows encontrados.`
          } else {
            mensagemErro = `Erro n8n: ${response.status} ${response.statusText}`
            detalhesLog = `Falha ao conectar n8n: ${response.status} ${response.statusText}`
          }
        } catch (err) {
          mensagemErro = err instanceof Error ? err.message : 'Erro desconhecido na conexão n8n'
          detalhesLog = `Falha ao conectar n8n: ${mensagemErro}`
        }
        break
      }

      case 'whatsapp': {
        // Verify by checking phone number info via WhatsApp Business API
        try {
          const phoneNumberId = config.phoneNumberId
          const accessToken = config.accessToken
          if (!phoneNumberId || !accessToken) {
            throw new Error('phoneNumberId e accessToken são obrigatórios na configuração')
          }

          const graphUrl = 'https://graph.facebook.com'
          const response = await fetch(`${graphUrl}/v18.0/${phoneNumberId}`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            signal: AbortSignal.timeout(10000),
          })

          if (response.ok) {
            conectado = true
            const data = await response.json()
            detalhesLog = `Conexão WhatsApp bem-sucedida. Phone number: ${data.verified_name || data.display_phone_number || 'N/A'}`
          } else {
            mensagemErro = `Erro WhatsApp: ${response.status} ${response.statusText}`
            detalhesLog = `Falha ao conectar WhatsApp: ${response.status} ${response.statusText}`
          }
        } catch (err) {
          mensagemErro = err instanceof Error ? err.message : 'Erro desconhecido na conexão WhatsApp'
          detalhesLog = `Falha ao conectar WhatsApp: ${mensagemErro}`
        }
        break
      }

      case 'telegram': {
        // Verify by calling getMe on Telegram Bot API
        try {
          const botToken = config.botToken
          if (!botToken) {
            throw new Error('botToken é obrigatório na configuração')
          }

          const response = await fetch(
            `https://api.telegram.org/bot${botToken}/getMe`,
            { signal: AbortSignal.timeout(10000) }
          )

          const data = await response.json()
          if (response.ok && data.ok) {
            conectado = true
            detalhesLog = `Conexão Telegram bem-sucedida. Bot: @${data.result?.username || 'N/A'}`
          } else {
            mensagemErro = `Erro Telegram: ${data.description || response.statusText}`
            detalhesLog = `Falha ao conectar Telegram: ${mensagemErro}`
          }
        } catch (err) {
          mensagemErro = err instanceof Error ? err.message : 'Erro desconhecido na conexão Telegram'
          detalhesLog = `Falha ao conectar Telegram: ${mensagemErro}`
        }
        break
      }

      case 'stdio': {
        // For stdio, just mark as connected (no real protocol verification in this implementation)
        conectado = true
        detalhesLog = `Conexão stdio configurada. Comando: ${config.comando || 'N/A'} ${config.args || ''}`
        break
      }

      case 'sse': {
        // For SSE, just mark as connected (no real protocol verification in this implementation)
        conectado = true
        detalhesLog = `Conexão SSE configurada. URL: ${config.url || 'N/A'}`
        break
      }

      default: {
        mensagemErro = `Tipo de integração não suportado: ${integracao.tipo}`
        detalhesLog = mensagemErro
      }
    }

    const duracao = Date.now() - startTime

    // Update integration status
    await db.integracaoMCP.update({
      where: { id },
      data: {
        conectado,
        status: conectado ? 'conectado' : 'erro',
        mensagemErro,
        ultimaSync: new Date(),
      },
    })

    // Create log record for the connection attempt
    await db.logIntegracao.create({
      data: {
        integracaoId: id,
        acao: 'conectar',
        detalhes: detalhesLog,
        status: conectado ? 'sucesso' : 'erro',
        duracao: duracao / 1000,
      },
    })

    return NextResponse.json({
      conectado,
      status: conectado ? 'conectado' : 'erro',
      mensagemErro,
      duracao: duracao / 1000,
      detalhes: detalhesLog,
    })
  } catch (error) {
    console.error('Erro ao conectar integração MCP:', error)
    return NextResponse.json(
      { error: 'Erro ao conectar integração' },
      { status: 500 }
    )
  }
}
