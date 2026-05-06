import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; mensagemId: string }> }
) {
  const { id, mensagemId } = await params
  try {
    const mensagem = await db.mensagem.findUnique({ where: { id: mensagemId } })
    if (!mensagem || mensagem.conversaId !== id) {
      return NextResponse.json({ error: 'Mensagem não encontrada' }, { status: 404 })
    }

    await db.mensagem.delete({ where: { id: mensagemId } })

    await db.conversa.update({
      where: { id },
      data: {
        totalMensagens: { decrement: 1 },
        ...(mensagem.tokensIn ? { totalTokensIn: { decrement: mensagem.tokensIn } } : {}),
        ...(mensagem.tokensOut ? { totalTokensOut: { decrement: mensagem.tokensOut } } : {}),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar mensagem:', error)
    return NextResponse.json({ error: 'Erro ao deletar mensagem' }, { status: 500 })
  }
}
