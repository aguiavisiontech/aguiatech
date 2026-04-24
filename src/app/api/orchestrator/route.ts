import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 120

// Agent prompt definitions
const AGENT_PROMPTS: Record<string, string> = {
  'diagnostico': `Você é o Agente de Diagnóstico de um sistema multi-agente de debug de código.
Sua função é analisar o código fornecido e IDENTIFICAR o problema com precisão.

Saída esperada (formato markdown):
### 🔍 Diagnóstico
**Problema identificado:** [descrição clara e concisa]
**Localização:** [linha(s) ou trecho(s) do código]
**Categoria:** [sintaxe/lógica/integração/performance/concorrência]
**Severidade:** [baixa/média/alta/crítica]
**Impacto:** [o que acontece se não for corrigido]
**Evidências:** [trechos do código que demonstram o problema]`,

  'causa-raiz': `Você é o Agente de Causa Raiz de um sistema multi-agente de debug de código.
Sua função é encontrar a ORIGEM do problema, não apenas os sintomas.

Use a técnica dos 5 Porquês quando necessário.

Saída esperada (formato markdown):
### 🎯 Causa Raiz
**Causa primária:** [a origem fundamental do problema]
**Cadeia causal:** [sequência de eventos que levaram ao problema]
**Porquês:** 
1. Por que isso aconteceu? → [resposta]
2. Por que isso? → [resposta]
3. Por que isso? → [resposta]
4. Por que isso? → [resposta]
5. Por que isso? → [resposta]
**Fatores contribuintes:** [outros fatores que agravaram o problema]
**Causas vs Sintomas:** [diferenciação clara]`,

  'simulacao': `Você é o Agente de Simulação de um sistema multi-agente de debug de código.
Sua função é executar mentalmente o código, passo a passo, rastreando valores de variáveis e fluxo de execução.

Saída esperada (formato markdown):
### ⚙️ Simulação
**Estado inicial:** [variáveis e seus valores antes da execução]
**Passo a passo:**
1. [linha/desvio] → estado: [variáveis após esta etapa]
2. [linha/desvio] → estado: [variáveis após esta etapa]
3. ...
**Ponto de divergência:** [onde o fluxo diverge do esperado]
**Estado final real:** [resultado da simulação]
**Estado final esperado:** [resultado correto]
**Comparação:** [diferença entre real e esperado]`,

  'correcao': `Você é o Agente de Correção de um sistema multi-agente de debug de código.
Sua função é corrigir o código de forma precisa e eficiente.

Saída esperada (formato markdown):
### 🔧 Correção
**Abordagem:** [estratégia de correção escolhida]
**Código corrigido:**
\`\`\`
[código completo corrigido]
\`\`\`
**Mudanças realizadas:**
- [mudança 1]: [antes → depois]
- [mudança 2]: [antes → depois]
**Justificativa:** [por que cada mudança resolve o problema]
**Alternativas consideradas:** [outras formas de resolver, se houver]`,

  'testes': `Você é o Agente de Testes de um sistema multi-agente de debug de código.
Sua função é validar se a correção resolve o problema e não introduz novos bugs.

Saída esperada (formato markdown):
### ✅ Testes
**Casos de teste:**
1. **Caso principal:** [descrição] → Resultado: [passou/falhou]
2. **Caso limite:** [descrição] → Resultado: [passou/falhou]
3. **Caso de regressão:** [descrição] → Resultado: [passou/falhou]
4. **Caso negativo:** [descrição] → Resultado: [passou/falhou]

**Cobertura:** [percentual estimado]
**Teste de regressão:** [a correção quebrou algo que funcionava?]
**Confiabilidade:** [alta/média/baixa]
**Recomendação:** [aprovado/rejeitado/precisa de mais testes]`,

  'refatoracao': `Você é o Agente de Refatoração de um sistema multi-agente de debug de código.
Sua função é melhorar a qualidade do código corrigido sem alterar seu comportamento.

Saída esperada (formato markdown):
### ♻️ Refatoração
**Problemas de qualidade encontrados:**
- [problema 1]
- [problema 2]

**Melhorias sugeridas:**
1. [melhoria 1]: [antes → depois] → [benefício]
2. [melhoria 2]: [antes → depois] → [benefício]

**Código refatorado:**
\`\`\`
[código completo refatorado]
\`\`\`

**Métricas:**
- Legibilidade: [antes → depois]
- Manutenibilidade: [antes → depois]
- Performance: [antes → depois]`,

  'riscos': `Você é o Agente de Riscos de um sistema multi-agente de debug de código.
Sua função é prever falhas futuras e identificar riscos na solução proposta.

Saída esperada (formato markdown):
### ⚠️ Análise de Riscos
**Riscos identificados:**
1. [risco 1] → Probabilidade: [alta/média/baixa] → Impacto: [alto/médio/baixo]
2. [risco 2] → Probabilidade: [alta/média/baixa] → Impacto: [alto/médio/baixo]

**Edge cases:**
- [edge case 1]
- [edge case 2]

**Riscos de regressão:** [a correção pode causar novos problemas?]
**Riscos de performance:** [há riscos de performance?]
**Riscos de segurança:** [há riscos de segurança?]
**Mitigações sugeridas:** [como prevenir cada risco]`,

  'verificacao-cognitiva': `Você é o Agente de Verificação Cognitiva de um sistema multi-agente de debug de código.
Sua função é VALIDAR toda a solução e QUESTIONAR as análises dos outros agentes.
Você deve ser crítico e encontrar falhas no raciocínio.

Saída esperada (formato markdown):
### 🧠 Verificação Cognitiva
**Validação da análise:**
- Diagnóstico correto? [sim/não/parcial] → [justificativa]
- Causa raiz correta? [sim/não/parcial] → [justificativa]
- Correção adequada? [sim/não/parcial] → [justificativa]
- Testes suficientes? [sim/não/parcial] → [justificativa]

**Falhas identificadas na análise:**
- [falha 1]: [descrição]
- [falha 2]: [descrição]

**Questões levantadas:**
- [questão 1]
- [questão 2]

**Veredito:** [solução aprovada/rejeitada/precisa de revisão]
**Sugestões finais:** [melhorias recomendadas]`,

  'checklist': `Você é o Agente de Checklist de um sistema multi-agente de debug de código.
Sua função é criar um checklist para PREVENIR a recorrência do problema.

Saída esperada (formato markdown):
### 📋 Checklist de Prevenção
**Checklist antes do commit:**
- [ ] [item 1]
- [ ] [item 2]
- [ ] [item 3]

**Padrões a seguir:**
1. [padrão 1]
2. [padrão 2]

**Ferramentas recomendadas:**
- [ferramenta 1]: [para quê]
- [ferramenta 2]: [para quê]

**Revisão de código - pontos de atenção:**
- [ponto 1]
- [ponto 2]

**Documentação sugerida:**
- [doc 1]: [conteúdo resumido]
- [doc 2]: [conteúdo resumido]`,
}

interface OrchestratorRequest {
  linguagem: string
  codigo: string
  resultadoEsperado: string
  resultadoAtual: string
  erros: string
}

async function callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  const ZAI = (await import('z-ai-web-dev-sdk')).default
  const zai = await ZAI.create()
  
  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    thinking: { type: 'disabled' },
  })
  
  return completion.choices[0]?.message?.content || 'Sem resposta do agente.'
}

function buildUserPrompt(data: OrchestratorRequest, context?: string): string {
  let prompt = `## Contexto do Problema

**Linguagem:** ${data.linguagem}

**Código:**
\`\`\`${data.linguagem}
${data.codigo}
\`\`\`

**Resultado esperado:** ${data.resultadoEsperado || 'Não especificado'}

**Resultado atual:** ${data.resultadoAtual || 'Não especificado'}

**Erros:** ${data.erros || 'Não especificado'}`

  if (context) {
    prompt += `\n\n## Contexto dos Agentes Anteriores\n${context}`
  }

  return prompt
}

function buildContextFromResults(results: { agent: string; output: string }[]): string {
  return results
    .map(r => `### Resultado do Agente ${r.agent}:\n${r.output}`)
    .join('\n\n---\n\n')
}

export async function POST(req: NextRequest) {
  const data: OrchestratorRequest = await req.json()

  if (!data.codigo) {
    return Response.json({ error: 'Código é obrigatório' }, { status: 400 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
      }

      try {
        // ==========================================
        // ETAPA 1 — ANÁLISE ESTRATÉGICA
        // ==========================================
        send('stage', { stage: 'analysis', message: 'Analisando o problema estrategicamente...' })

        const analysisPrompt = `Você é o Orquestrador Inteligente de um Sistema Multi-Agent de Debug de Código.

Analise o problema abaixo e determine:

1. **Complexidade:** Simples / Moderado / Complexo
2. **Tipo de problema:** Sintaxe / Lógica / Integração / Performance / Concorrência / Desconhecido
3. **Estratégia:** Quais agentes usar, em qual ordem, e por quê

Agentes disponíveis:
1. diagnostico → identifica o problema
2. causa-raiz → encontra a origem
3. simulacao → executa mentalmente o código
4. correcao → corrige o código
5. testes → valida a solução
6. refatoracao → melhora qualidade
7. riscos → prevê falhas futuras
8. verificacao-cognitiva → valida e questiona
9. checklist → previne recorrência

REGRAS:
- Você NÃO segue um fluxo fixo
- Você decide dinamicamente quais agentes ativar e em qual ordem
- Para problemas simples, use menos agentes (diagnostico + correcao)
- Para problemas moderados, use agentes principais (diagnostico + causa-raiz + correcao + testes + verificacao-cognitiva)
- Para problemas complexos, use todos os agentes relevantes
- Justifique cada decisão
- Use EXATAMENTE os nomes dos agentes como listados acima (kebab-case)

Responda APENAS com JSON válido no formato:
{
  "complexity": "simples|moderado|complexo",
  "problemType": "sintaxe|logica|integracao|performance|concorrencia|desconhecido",
  "strategy": "descrição da estratégia",
  "reasoning": "justificativa detalhada",
  "plan": [
    { "agent": "nome-do-agente", "reason": "por que este agente" }
  ]
}`

        const analysisResult = await callLLM(analysisPrompt, buildUserPrompt(data))
        
        let analysis
        try {
          const jsonMatch = analysisResult.match(/\{[\s\S]*\}/)
          analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {
            complexity: 'moderado',
            problemType: 'desconhecido',
            strategy: 'Análise completa com agentes principais',
            reasoning: analysisResult,
            plan: [
              { agent: 'diagnostico', reason: 'Identificar o problema' },
              { agent: 'causa-raiz', reason: 'Encontrar a origem' },
              { agent: 'correcao', reason: 'Corrigir o código' },
              { agent: 'testes', reason: 'Validar a solução' },
              { agent: 'verificacao-cognitiva', reason: 'Verificação final' },
            ]
          }
        } catch {
          analysis = {
            complexity: 'moderado',
            problemType: 'desconhecido',
            strategy: 'Análise completa com agentes principais',
            reasoning: analysisResult,
            plan: [
              { agent: 'diagnostico', reason: 'Identificar o problema' },
              { agent: 'causa-raiz', reason: 'Encontrar a origem' },
              { agent: 'correcao', reason: 'Corrigir o código' },
              { agent: 'testes', reason: 'Validar a solução' },
              { agent: 'verificacao-cognitiva', reason: 'Verificação final' },
            ]
          }
        }

        send('analysis', analysis)

        // ==========================================
        // ETAPA 2 & 3 — PLANO E EXECUÇÃO
        // ==========================================
        send('stage', { stage: 'execution', message: 'Executando agentes conforme o plano...' })

        const executedResults: { agent: string; output: string }[] = []
        const validAgents = Object.keys(AGENT_PROMPTS)
        
        for (const step of analysis.plan) {
          const agentKey = step.agent
          if (!validAgents.includes(agentKey)) continue

          send('agent_start', { 
            agent: agentKey, 
            reason: step.reason,
            message: `Executando agente: ${agentKey}...` 
          })

          const startTime = Date.now()
          
          try {
            const context = executedResults.length > 0 
              ? buildContextFromResults(executedResults) 
              : undefined
            
            const agentSystemPrompt = AGENT_PROMPTS[agentKey]
            const userPrompt = buildUserPrompt(data, context)
            
            const output = await callLLM(agentSystemPrompt, userPrompt)
            const duration = Date.now() - startTime

            executedResults.push({ agent: agentKey, output })

            send('agent_complete', { 
              agent: agentKey, 
              output, 
              duration,
            })
          } catch (error) {
            const duration = Date.now() - startTime
            const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido'
            
            send('agent_error', { 
              agent: agentKey, 
              error: errorMsg,
              duration,
            })
          }
        }

        // ==========================================
        // ETAPA 4 — ADAPTAÇÃO DINÂMICA
        // ==========================================
        const cognitiveResult = executedResults.find(r => r.agent === 'verificacao-cognitiva')
        let adjustments: { type: string; agent: string; reason: string }[] = []
        
        if (cognitiveResult && (
          cognitiveResult.output.toLowerCase().includes('rejeitada') || 
          cognitiveResult.output.toLowerCase().includes('precisa de revisão') ||
          cognitiveResult.output.toLowerCase().includes('rejeitado')
        )) {
          
          send('stage', { stage: 'adaptation', message: 'Ajustando plano dinamicamente...' })
          
          const reexecuteAgents = ['correcao', 'testes']
          
          for (const agentKey of reexecuteAgents) {
            if (!validAgents.includes(agentKey)) continue
            
            const reason = `Re-execução após verificação cognitiva identificar necessidade de revisão`
            adjustments.push({ type: 'reexecute', agent: agentKey, reason })
            
            send('agent_start', { 
              agent: agentKey, 
              reason,
              message: `Re-executando agente: ${agentKey} (ajuste dinâmico)...` 
            })

            const startTime = Date.now()
            try {
              const context = buildContextFromResults(executedResults)
              const output = await callLLM(AGENT_PROMPTS[agentKey], buildUserPrompt(data, context))
              const duration = Date.now() - startTime

              const existingIdx = executedResults.findIndex(r => r.agent === agentKey)
              if (existingIdx >= 0) {
                executedResults[existingIdx] = { agent: agentKey, output }
              } else {
                executedResults.push({ agent: agentKey, output })
              }

              send('agent_complete', { agent: agentKey, output, duration, reexecuted: true })
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido'
              send('agent_error', { agent: agentKey, error: errorMsg, reexecuted: true })
            }
          }
        }

        send('adjustments', adjustments)

        // ==========================================
        // ETAPA 5 — RESULTADO FINAL CONSOLIDADO
        // ==========================================
        send('stage', { stage: 'consolidation', message: 'Consolidando resultado final...' })

        const consolidationPrompt = `Você é o consolidador final de um sistema multi-agente de debug de código.

Com base em todos os resultados dos agentes, crie um resumo final consolidado.

Responda APENAS com JSON válido no formato:
{
  "problem": "Descrição clara do problema",
  "rootCause": "Causa raiz identificada",
  "solution": "Solução aplicada",
  "correctedCode": "Código corrigido completo",
  "prevention": "Medidas preventivas"
}`

        const allContext = buildContextFromResults(executedResults)
        const finalResultRaw = await callLLM(consolidationPrompt, buildUserPrompt(data, allContext))
        
        let finalResult
        try {
          const jsonMatch = finalResultRaw.match(/\{[\s\S]*\}/)
          finalResult = jsonMatch ? JSON.parse(jsonMatch[0]) : {
            problem: 'Ver resultados dos agentes para detalhes',
            rootCause: 'Ver análise de causa raiz',
            solution: 'Ver resultados de correção',
            correctedCode: data.codigo,
            prevention: 'Ver checklist de prevenção',
          }
        } catch {
          finalResult = {
            problem: 'Ver resultados dos agentes para detalhes',
            rootCause: 'Ver análise de causa raiz',
            solution: 'Ver resultados de correção',
            correctedCode: data.codigo,
            prevention: 'Ver checklist de prevenção',
          }
        }

        send('final_result', finalResult)
        send('stage', { stage: 'complete', message: 'Orquestração completa!' })
        send('done', {})

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido na orquestração'
        send('error', { message: errorMsg })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
