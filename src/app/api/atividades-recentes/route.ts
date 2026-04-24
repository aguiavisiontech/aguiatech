import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const atividades = []

    // Últimas conversas criadas
    const conversasRecentes = await db.conversa.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
    })

    for (const c of conversasRecentes) {
      atividades.push({
        id: `conv-${c.id}`,
        tipo: 'conversa',
        descricao: `Conversa "${c.titulo}" ${c.totalMensagens > 0 ? `com ${c.totalMensagens} mensagens` : 'iniciada'}`,
        timestamp: c.createdAt.toLocaleString('pt-BR'),
      })
    }

    // Últimas mensagens do assistente
    const mensagensRecentes = await db.mensagem.findMany({
      where: { papel: 'assistente' },
      orderBy: { createdAt: 'desc' },
      take: 3,
    })

    for (const m of mensagensRecentes) {
      atividades.push({
        id: `msg-${m.id}`,
        tipo: 'mensagem',
        descricao: `Resposta gerada${m.modelo ? ` com ${m.modelo}` : ''} em ${m.tempoResposta?.toFixed(1) ?? '?'}s`,
        timestamp: m.createdAt.toLocaleString('pt-BR'),
      })
    }

    // Ferramentas carregadas
    const totalFerramentas = await db.ferramenta.count()
    if (totalFerramentas > 0) {
      atividades.push({
        id: 'ferramentas-seed',
        tipo: 'ferramenta',
        descricao: `${totalFerramentas} ferramentas disponíveis no registro`,
        timestamp: new Date().toLocaleString('pt-BR'),
      })
    }

    // Ordenar por timestamp (mais recente primeiro)
    atividades.sort((a, b) => {
      const dateA = new Date(a.timestamp.replace(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}:\d{2}:\d{2})/, '$3-$2-$1T$4'))
      const dateB = new Date(b.timestamp.replace(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}:\d{2}:\d{2})/, '$3-$2-$1T$4'))
      return dateB.getTime() - dateA.getTime()
    })

    return NextResponse.json(atividades.slice(0, 8))
  } catch (error) {
    console.error('Erro ao buscar atividades recentes:', error)
    return NextResponse.json([])
  }
}
