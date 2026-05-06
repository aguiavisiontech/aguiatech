import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/integracoes-mcp/timeline - Get activity timeline across all integrations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const skip = (page - 1) * limit

    // Fetch all logs with integration names
    const [logs, total] = await Promise.all([
      db.logIntegracao.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          integracao: {
            select: {
              id: true,
              nome: true,
              tipo: true,
            },
          },
        },
      }),
      db.logIntegracao.count(),
    ])

    // Build 24h activity heatmap data
    const now = new Date()
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const recentLogs = await db.logIntegracao.findMany({
      where: {
        createdAt: { gte: twentyFourHoursAgo },
      },
      select: {
        createdAt: true,
        status: true,
      },
    })

    // Build heatmap: 24 hours, activity level per hour
    const heatmap: Array<{ hour: number; count: number; errors: number }> = []
    for (let h = 0; h < 24; h++) {
      const hourLogs = recentLogs.filter((log) => {
        const logHour = new Date(log.createdAt).getHours()
        return logHour === h
      })
      heatmap.push({
        hour: h,
        count: hourLogs.length,
        errors: hourLogs.filter((l) => l.status === 'erro').length,
      })
    }

    // Group timeline entries by time period
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)

    const groupedLogs = logs.map((log) => {
      const logDate = new Date(log.createdAt)
      let period: string
      if (logDate >= today) {
        period = 'Hoje'
      } else if (logDate >= yesterday) {
        period = 'Ontem'
      } else if (logDate >= weekAgo) {
        period = 'Esta Semana'
      } else {
        period = 'Mais Antigo'
      }

      return {
        id: log.id,
        integracaoId: log.integracaoId,
        integracaoNome: log.integracao.nome,
        integracaoTipo: log.integracao.tipo,
        acao: log.acao,
        detalhes: log.detalhes,
        status: log.status,
        duracao: log.duracao,
        createdAt: log.createdAt,
        period,
      }
    })

    return NextResponse.json({
      timeline: groupedLogs,
      heatmap,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Erro ao buscar timeline:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar timeline' },
      { status: 500 }
    )
  }
}
