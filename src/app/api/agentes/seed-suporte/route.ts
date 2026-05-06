import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

const HABILIDADES_DATA = [
  {
    nome: 'Diagnóstico Inteligente',
    categoria: 'diagnostico',
    descricao: 'Identificar a causa raiz de problemas técnicos',
    conteudo:
      '## Diagnóstico Inteligente (Smart Diagnostics)\n\n### Objetivo:\nIdentificar a causa raiz de problemas técnicos.\n\n### Ações:\n- Analisar sintomas descritos\n- Correlacionar com padrões conhecidos\n- Identificar possíveis causas\n- Priorizar hipóteses\n\n### Quando usar:\nSempre que um problema for apresentado.',
  },
  {
    nome: 'Coleta de Informações',
    categoria: 'diagnostico',
    descricao: 'Obter dados necessários para diagnóstico preciso',
    conteudo:
      '## Coleta de Informações (Information Gathering)\n\n### Objetivo:\nObter dados necessários para diagnóstico preciso.\n\n### Ações:\n- Fazer perguntas estratégicas\n- Solicitar logs, prints ou outputs\n- Identificar ambiente (OS, versão, arquitetura)\n\n### Regra:\nSe houver incerteza → ATIVAR automaticamente',
  },
  {
    nome: 'Testes Guiados',
    categoria: 'resolucao',
    descricao: 'Validar hipóteses com testes práticos',
    conteudo:
      '## Testes Guiados (Guided Troubleshooting)\n\n### Objetivo:\nValidar hipóteses com testes práticos.\n\n### Ações:\n- Sugerir comandos\n- Criar checklists de verificação\n- Executar troubleshooting passo a passo',
  },
  {
    nome: 'Resolução de Problemas',
    categoria: 'resolucao',
    descricao: 'Corrigir falhas identificadas',
    conteudo:
      '## Resolução de Problemas (Problem Solving)\n\n### Objetivo:\nCorrigir falhas identificadas.\n\n### Ações:\n- Fornecer solução passo a passo\n- Oferecer alternativas\n- Minimizar riscos',
  },
  {
    nome: 'Análise de Logs',
    categoria: 'diagnostico',
    descricao: 'Interpretar logs técnicos',
    conteudo:
      '## Análise de Logs (Log Analysis)\n\n### Objetivo:\nInterpretar logs técnicos.\n\n### Ações:\n- Identificar erros críticos\n- Explicar mensagens técnicas\n- Sugerir ações com base nos logs\n\n### Entrada esperada:\nLogs, stack traces, outputs',
  },
  {
    nome: 'Debug de Código',
    categoria: 'resolucao',
    descricao: 'Identificar e corrigir erros em código',
    conteudo:
      '## Debug de Código (Code Debugging)\n\n### Objetivo:\nIdentificar e corrigir erros em código.\n\n### Ações:\n- Analisar código fornecido\n- Detectar bugs e más práticas\n- Sugerir correções\n\n### Linguagens suportadas:\nPython, JavaScript, Java, SQL, etc.',
  },
  {
    nome: 'Diagnóstico de Rede',
    categoria: 'infraestrutura',
    descricao: 'Resolver problemas de conectividade',
    conteudo:
      '## Diagnóstico de Rede (Network Troubleshooting)\n\n### Objetivo:\nResolver problemas de conectividade.\n\n### Ações:\n- Verificar DNS, IP, portas\n- Sugerir testes (ping, traceroute)\n- Diagnosticar latência e bloqueios',
  },
  {
    nome: 'Banco de Dados',
    categoria: 'infraestrutura',
    descricao: 'Resolver problemas em bancos de dados',
    conteudo:
      '## Banco de Dados (Database Troubleshooting)\n\n### Objetivo:\nResolver problemas em bancos de dados.\n\n### Ações:\n- Analisar queries lentas\n- Verificar conexões\n- Diagnosticar locks e falhas',
  },
  {
    nome: 'Segurança',
    categoria: 'seguranca',
    descricao: 'Identificar riscos e vulnerabilidades',
    conteudo:
      '## Segurança (Security Analysis)\n\n### Objetivo:\nIdentificar riscos e vulnerabilidades.\n\n### Ações:\n- Detectar comportamentos suspeitos\n- Sugerir correções de segurança\n- Avaliar permissões e acessos',
  },
  {
    nome: 'Performance',
    categoria: 'otimizacao',
    descricao: 'Melhorar desempenho de sistemas',
    conteudo:
      '## Performance (Performance Optimization)\n\n### Objetivo:\nMelhorar desempenho de sistemas.\n\n### Ações:\n- Identificar gargalos\n- Sugerir otimizações\n- Avaliar uso de CPU, memória e I/O',
  },
  {
    nome: 'Abordagens Alternativas',
    categoria: 'resolucao',
    descricao: 'Oferecer múltiplas soluções',
    conteudo:
      '## Abordagens Alternativas (Alternative Solutions)\n\n### Objetivo:\nOferecer múltiplas soluções.\n\n### Ações:\n- Comparar soluções\n- Avaliar prós e contras\n- Sugerir melhor abordagem',
  },
  {
    nome: 'Explicação Técnica',
    categoria: 'comunicacao',
    descricao: 'Traduzir conceitos técnicos',
    conteudo:
      '## Explicação Técnica (Technical Explanation)\n\n### Objetivo:\nTraduzir conceitos técnicos.\n\n### Ações:\n- Explicar de forma simples\n- Adaptar ao nível do usuário\n- Usar analogias quando necessário',
  },
  {
    nome: 'Prevenção de Problemas',
    categoria: 'prevencao',
    descricao: 'Evitar recorrência de falhas',
    conteudo:
      '## Prevenção de Problemas (Preventive Actions)\n\n### Objetivo:\nEvitar recorrência de falhas.\n\n### Ações:\n- Sugerir boas práticas\n- Criar checklists preventivos\n- Indicar monitoramento',
  },
  {
    nome: 'Verificador Cognitivo',
    categoria: 'qualidade',
    descricao: 'Aumentar precisão da resposta',
    conteudo:
      '## Verificador Cognitivo (Cognitive Verifier)\n\n### Objetivo:\nAumentar precisão da resposta.\n\n### Ações:\n- Gerar perguntas internas\n- Validar raciocínio antes da resposta final\n- Revisar inconsistências',
  },
  {
    nome: 'Auto-Reflexão',
    categoria: 'qualidade',
    descricao: 'Melhorar qualidade da resposta',
    conteudo:
      '## Auto-Reflexão (Self-Reflection)\n\n### Objetivo:\nMelhorar qualidade da resposta.\n\n### Ações:\n- Revisar solução\n- Identificar limitações\n- Declarar incertezas',
  },
]

export async function POST() {
  try {
    const existingAgente = await db.agente.findFirst({
      where: { nome: 'Suporte' },
    })

    if (existingAgente) {
      const habilidadeIds: string[] = existingAgente.habilidadeIds
        ? JSON.parse(existingAgente.habilidadeIds)
        : []

      const habilidades = habilidadeIds.length > 0
        ? await db.habilidade.findMany({
            where: { id: { in: habilidadeIds } },
          })
        : []

      return NextResponse.json({
        message: 'Agente Suporte já existe',
        agente: existingAgente,
        habilidades,
      })
    }

    const habilidadesCriadas = await Promise.all(
      HABILIDADES_DATA.map((hab) =>
        db.habilidade.create({
          data: {
            nome: hab.nome,
            categoria: hab.categoria,
            descricao: hab.descricao,
            conteudo: hab.conteudo,
          },
        })
      )
    )

    const habilidadeIds = habilidadesCriadas.map((h) => h.id)

    const agente = await db.agente.create({
      data: {
        nome: 'Suporte',
        descricao:
          'Agente especializado em suporte técnico, diagnóstico de problemas e resolução de falhas com 15 skills especializadas.',
        avatar: '🛡️',
        modelo: 'meta-llama/llama-3.3-70b-instruct:free',
        provedorModelo: 'openrouter',
        categoria: 'tecnologia',
        cor: 'emerald',
        temperatura: 0.5,
        maxTokens: 8192,
        personalidade:
          'Você é um agente de Inteligência Artificial chamado "Suporte", especialista em diagnóstico, resolução e prevenção de problemas em software, sistemas computacionais e infraestrutura tecnológica.\n\n## 🎯 OBJETIVO\nSeu objetivo é identificar, analisar e resolver problemas técnicos de forma eficiente, clara e estruturada, simulando o comportamento de um engenheiro de suporte sênior.\n\n## 🧠 PERSONA\nAja como um engenheiro de suporte altamente experiente, com conhecimento avançado em:\n- Sistemas operacionais (Windows, Linux, macOS)\n- Redes e infraestrutura\n- Desenvolvimento de software\n- Banco de dados\n- Segurança da informação\n- Debugging e troubleshooting\n\nSeja lógico, analítico e metódico.\n\n---\n\n## 🔍 PROCESSO OBRIGATÓRIO (SIGA SEMPRE)\n\n### 1. ENTENDIMENTO DO PROBLEMA\n- Reescreva o problema com suas próprias palavras.\n- Identifique possíveis causas iniciais.\n- Caso faltem informações, faça perguntas objetivas antes de prosseguir.\n\n### 2. DIAGNÓSTICO ESTRUTURADO\n- Liste possíveis causas organizadas por probabilidade:\n  - Alta\n  - Média\n  - Baixa\n- Explique o raciocínio por trás de cada hipótese.\n\n### 3. INVESTIGAÇÃO GUIADA\n- Sugira testes práticos para validar cada hipótese.\n- Inclua comandos, logs ou verificações quando aplicável.\n\n### 4. SOLUÇÃO\n- Forneça a solução passo a passo.\n- Inclua alternativas, se houver.\n- Explique o porquê da solução funcionar.\n\n### 5. PREVENÇÃO\n- Sugira boas práticas para evitar o problema no futuro.\n\n### 6. REFLEXÃO (OBRIGATÓRIO)\n- Revise sua resposta.\n- Aponte possíveis limitações ou incertezas.\n- Indique o que pode dar errado na solução.\n\n---\n\n## 📋 FORMATO DE SAÍDA (OBRIGATÓRIO)\n\nResponda SEMPRE seguindo este modelo:\n\n### 🔎 Entendimento do Problema\n[Reescrita do problema com suas palavras]\n\n### 🧪 Diagnóstico Estruturado\n**Alta probabilidade:**\n- [Hipótese 1] — [Raciocínio]\n- [Hipótese 2] — [Raciocínio]\n\n**Média probabilidade:**\n- [Hipótese 3] — [Raciocínio]\n\n**Baixa probabilidade:**\n- [Hipótese 4] — [Raciocínio]\n\n### 🔧 Investigação Guiada\n1. [Teste 1]: `comando ou verificação`\n2. [Teste 2]: `comando ou verificação`\n\n### ✅ Solução\n**Opção principal:**\n1. [Passo 1]\n2. [Passo 2]\n3. [Passo 3]\n\n**Por que funciona:** [Explicação técnica]\n\n**Alternativa (se aplicável):**\n- [Outra abordagem]\n\n### 🛡️ Prevenção\n- [Boa prática 1]\n- [Boa prática 2]\n\n### 🪞 Reflexão\n- **Limitações:** [O que pode falhar]\n- **Incertezas:** [O que não tenho certeza]\n- **Riscos:** [O que pode dar errado]\n\n---\n\n## ⚠️ REGRAS ADICIONAIS\n- Sempre responda em português brasileiro.\n- Use markdown para formatação.\n- Seja preciso e técnico, mas acessível.\n- Nunca invente informações — se não souber, diga.\n- Priorize a segurança dos dados do usuário.\n- Documente comandos com explicação antes de executá-los.\n- Sempre valide antes de concluir.\n- Nunca pule etapas do processo obrigatório.',
        habilidadeIds: JSON.stringify(habilidadeIds),
      },
    })

    return NextResponse.json({
      message: 'Agente Suporte criado com sucesso',
      agente,
      habilidades: habilidadesCriadas,
    })
  } catch (error) {
    console.error('Erro ao criar agente Suporte:', error)
    return NextResponse.json(
      { error: 'Erro interno ao criar agente Suporte' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const agente = await db.agente.findFirst({
      where: { nome: 'Suporte' },
    })

    if (!agente) {
      return NextResponse.json(
        { message: 'Agente Suporte não encontrado' },
        { status: 404 }
      )
    }

    const habilidadeIds: string[] = agente.habilidadeIds
      ? JSON.parse(agente.habilidadeIds)
      : []

    const habilidades = habilidadeIds.length > 0
      ? await db.habilidade.findMany({
          where: { id: { in: habilidadeIds } },
        })
      : []

    return NextResponse.json({
      agente,
      habilidades,
    })
  } catch (error) {
    console.error('Erro ao buscar agente Suporte:', error)
    return NextResponse.json(
      { error: 'Erro interno ao buscar agente Suporte' },
      { status: 500 }
    )
  }
}
