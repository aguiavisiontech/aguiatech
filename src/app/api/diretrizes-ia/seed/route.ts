import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const PRINCIPIOS = [
  {
    principio: 1,
    nome: 'Pense Antes de Codar',
    icone: 'Brain',
    cor: 'amber',
    descricao: 'Não assuma. Não esconda confusão. Exponha os trade-offs.',
    detalhes: JSON.stringify({
      pontos: [
        'Declare suposições explicitamente — Se incerto, pergunte em vez de adivinhar',
        'Apresente múltiplas interpretações — Não escolha silenciosamente quando há ambiguidade',
        'Questione quando pertinente — Se uma abordagem mais simples existir, diga',
        'Pare quando confuso — Nomeie o que está obscuro e peça esclarecimento',
      ],
      teste: 'Cada suposição foi declarada? Há ambiguidade não resolvida?',
    }),
    ativa: true,
    aderencia: 85,
    usoContagem: 42,
  },
  {
    principio: 2,
    nome: 'Simplicidade Primeiro',
    icone: 'Minimize2',
    cor: 'emerald',
    descricao: 'Código mínimo que resolve o problema. Nada especulativo.',
    detalhes: JSON.stringify({
      pontos: [
        'Sem funcionalidades além do que foi pedido',
        'Sem abstrações para código de uso único',
        'Sem "flexibilidade" ou "configurabilidade" não solicitadas',
        'Sem tratamento de erros para cenários impossíveis',
        'Se 200 linhas poderiam ser 50, reescreva',
      ],
      teste: 'Um engenheiro sênior diria que está complicado demais? Se sim, simplifique.',
    }),
    ativa: true,
    aderencia: 72,
    usoContagem: 38,
  },
  {
    principio: 3,
    nome: 'Mudanças Cirúrgicas',
    icone: 'Scissors',
    cor: 'sky',
    descricao: 'Toque apenas o necessário. Limpe apenas a sua bagunça.',
    detalhes: JSON.stringify({
      pontos: [
        'Não "melhore" código adjacente, comentários ou formatação',
        'Não refatore o que não está quebrado',
        'Mantenha o estilo existente, mesmo que você faria diferente',
        'Se notar código morto não relacionado, mencione — não delete',
        'Remova imports/variáveis que AS SUAS mudanças tornaram obsoletos',
      ],
      teste: 'Cada linha alterada se rastreia diretamente à solicitação do usuário?',
    }),
    ativa: true,
    aderencia: 90,
    usoContagem: 55,
  },
  {
    principio: 4,
    nome: 'Execução Orientada a Objetivos',
    icone: 'Target',
    cor: 'rose',
    descricao: 'Defina critérios de sucesso. Execute em loop até verificar.',
    detalhes: JSON.stringify({
      pontos: [
        '"Adicionar validação" → "Escreva testes para entradas inválidas e depois faça passarem"',
        '"Corrigir o bug" → "Escreva um teste que reproduza o bug e depois faça passar"',
        '"Refatorar X" → "Garanta que os testes passem antes e depois"',
        'Para múltiplos passos: 1. [Passo] → verificar: [checagem]',
      ],
      teste: 'Critérios de sucesso fortes permitem execução independente em loop.',
    }),
    ativa: true,
    aderencia: 68,
    usoContagem: 30,
  },
  {
    principio: 5,
    nome: 'Comunicação Contínua',
    icone: 'MessageCircle',
    cor: 'violet',
    descricao: 'Mantenha o humano informado. Incerteza nunca deve ser silenciosa.',
    detalhes: JSON.stringify({
      pontos: [
        'Se encontrar um obstáculo inesperado, reporte antes de improvisar',
        'Se o escopo crescer além do pedido original, pause e sinalize',
        'Se entre dois caminhos igualmente válidos, apresente ambos com pros/contras',
        'Ao terminar, resuma: o que foi feito, o que ficou de fora, e por quê',
      ],
      teste: 'O humano foi surpreendido por alguma decisão tomada durante a execução? Se sim, o princípio falhou.',
    }),
    ativa: true,
    aderencia: 78,
    usoContagem: 35,
  },
]

const EXEMPLOS = [
  // Princípio 1 - Pense Antes de Codar
  {
    diretrizId: 1, tipo: 'ruim', titulo: 'Suposição silenciosa',
    descricao: 'Humano pede autenticação e o LLM implementa JWT sem verificar se o projeto já usa sessões',
    explicacao: 'Escolheu uma interpretação silenciosamente e seguiu com ela sem verificar o contexto existente.',
    ordem: 1,
  },
  {
    diretrizId: 1, tipo: 'bom', titulo: 'Perguntas antes de implementar',
    descricao: 'LLM pergunta: "O projeto já usa algum mecanismo de auth? Devo usar JWT, sessões ou API key?"',
    codigo: '// Antes de implementar, confirmo:\n// 1. O projeto já usa autenticação?\n// 2. Por usuário ou por serviço?\n// 3. Já existe middleware de auth?',
    explicacao: 'Expõe suposições e pede esclarecimento antes de codar.',
    ordem: 2,
  },
  // Princípio 2 - Simplicidade Primeiro
  {
    diretrizId: 2, tipo: 'ruim', titulo: 'Supercomplexidade desnecessária',
    descricao: 'Humano pede "formata CPF" e LLM cria uma classe DocumentFormatter com 80+ linhas, validators registry e factory pattern',
    codigo: 'class DocumentFormatter {\n  constructor(doc_type, strict=true) {\n    this._validators = {}\n    this._formatters = {}\n    // ... 80 linhas depois\n  }\n}',
    explicacao: 'Abstração inflada para uma tarefa simples. Código de uso único não precisa de classe.',
    ordem: 1,
  },
  {
    diretrizId: 2, tipo: 'bom', titulo: 'Função simples e direta',
    descricao: 'Uma função de 6 linhas que resolve o problema',
    codigo: 'def formatar_cpf(cpf: str) -> str:\n    digitos = "".join(filter(str.isdigit, cpf))\n    if len(digitos) != 11:\n        raise ValueError(f"CPF inválido: {len(digitos)} dígitos")\n    return f"{digitos[:3]}.{digitos[3:6]}.{digitos[6:9]}-{digitos[9:]}"',
    explicacao: 'Código mínimo que resolve o problema. Legível, testável, sem abstrações desnecessárias.',
    ordem: 2,
  },
  // Princípio 3 - Mudanças Cirúrgicas
  {
    diretrizId: 3, tipo: 'ruim', titulo: 'Efeitos colaterais não relacionados',
    descricao: 'Humano pede "corrija o cálculo do frete" e LLM também renomeia variáveis, converte para type hints e reorganiza métodos',
    explicacao: 'Mudanças ortogonais à tarefa. Cada linha alterada deve rastrear diretamente à solicitação.',
    ordem: 1,
  },
  {
    diretrizId: 3, tipo: 'bom', titulo: 'Apenas a correção necessária',
    descricao: 'Corrige apenas a expressão e menciona o código relacionado sem tocá-lo',
    codigo: '// Antes: total = preco_produto + frete * 0.1  // BUG\n// Depois: total = preco_produto + frete  // frete já vem calculado',
    explicacao: 'Mudança cirúrgica. Nota: "calcular_desconto() tem lógica similar, mas não toquei pois não fazia parte da tarefa."',
    ordem: 2,
  },
  // Princípio 4 - Execução Orientada a Objetivos
  {
    diretrizId: 4, tipo: 'ruim', titulo: 'Implementação sem verificação',
    descricao: 'Humano pede paginação e LLM escreve 150 linhas dizendo "pronto!" sem nenhuma verificação',
    explicacao: 'Sem critérios de sucesso verificáveis. "Faça funcionar" não é critério.',
    ordem: 1,
  },
  {
    diretrizId: 4, tipo: 'bom', titulo: 'Plano com verificações',
    descricao: 'LLM apresenta plano com critérios de sucesso antes de implementar',
    codigo: '// Plano:\n// 1. Teste: page=1&limit=10 → verificar: response tem items, total, page\n// 2. Implementar params page/limit → verificar: testes passam\n// 3. Garantir offset correto → verificar: page=2 ≠ page=1',
    explicacao: 'Critérios fortes permitem execução independente em loop. Critérios fracos exigem clarificações constantes.',
    ordem: 2,
  },
  // Princípio 5 - Comunicação Contínua
  {
    diretrizId: 5, tipo: 'ruim', titulo: 'Decisão autônoma não comunicada',
    descricao: 'Ao migrar SQLite→PostgreSQL, LLM encontra sintaxe incompatível e "corrige" silenciosamente mudando o comportamento',
    explicacao: 'Obstáculo encontrado, mas reportado depois da decisão. O humano é surpreendido na entrega.',
    ordem: 1,
  },
  {
    diretrizId: 5, tipo: 'bom', titulo: 'Comunicação proativa do obstáculo',
    descricao: 'LLM para ao encontrar obstáculo, apresenta opções e pede decisão',
    codigo: '// Encontrei um obstáculo:\n// strftime("%Y-%m", data) é sintaxe SQLite.\n// No PostgreSQL: TO_CHAR(data, "YYYY-MM")\n//\n// Opções:\n// A: Altero para TO_CHAR (funcional, muda query)\n// B: Crio função de compatibilidade\n// Qual prefere?',
    explicacao: 'O humano é o arquiteto; o LLM é o construtor. Construtores não mudam a planta sem avisar.',
    ordem: 2,
  },
]

export async function POST() {
  try {
    // Limpar dados existentes
    await db.exemploDiretriz.deleteMany()
    await db.diretrizIA.deleteMany()

    // Criar princípios
    const criados = []
    for (const p of PRINCIPIOS) {
      const diretriz = await db.diretrizIA.create({ data: p })
      criados.push(diretriz)
    }

    // Criar exemplos
    const exemplosCriados = []
    for (const ex of EXEMPLOS) {
      const exemplo = await db.exemploDiretriz.create({ data: ex })
      exemplosCriados.push(exemplo)
    }

    return NextResponse.json({
      mensagem: 'Diretrizes IA semeadas com sucesso',
      diretrizes: criados.length,
      exemplos: exemplosCriados.length,
    })
  } catch (error) {
    console.error('Erro ao semear diretrizes:', error)
    return NextResponse.json({ erro: 'Falha ao semear diretrizes' }, { status: 500 })
  }
}
