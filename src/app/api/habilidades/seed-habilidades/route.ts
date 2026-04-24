import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const habilidadesSeed = [
  // ── Categoria: nucleo ──
  {
    nome: 'Busca Web',
    categoria: 'nucleo',
    descricao:
      'Pesquisa informações em tempo real na internet usando mecanismos de busca avançados',
    conteudo:
      'Você é um agente de pesquisa web. Quando o usuário fizer uma pergunta, use a ferramenta de busca web para encontrar informações atualizadas e relevantes. Sintetize os resultados de forma clara e organizada em português brasileiro.',
    parametros:
      '{"tipo": "web_search", "sdk_method": "functions.invoke", "sdk_function": "web_search", "parametros_entrada": ["query", "num", "recency_days"], "saida_formato": "lista_resultados"}',
  },
  {
    nome: 'Chat Inteligente',
    categoria: 'nucleo',
    descricao:
      'Conversação natural com IA usando modelo de linguagem avançado para responder perguntas e realizar tarefas',
    conteudo:
      'Você é o Aguiatech, um assistente de IA brasileiro inteligente e prestativo. Responda todas as perguntas de forma clara, detalhada e em português brasileiro. Use seu conhecimento para ajudar o usuário com qualquer tarefa.',
    parametros:
      '{"tipo": "llm_chat", "sdk_method": "chat.completions.create", "parametros_entrada": ["messages", "model"], "saida_formato": "texto"}',
  },
  {
    nome: 'Geração de Imagem',
    categoria: 'nucleo',
    descricao:
      'Cria imagens a partir de descrições textuais usando IA generativa avançada',
    conteudo:
      'Você é um agente de criação visual. Quando o usuário descrever uma imagem, crie um prompt detalhado em inglês para a geração de imagem. O prompt deve ser descritivo, com detalhes de estilo, composição, iluminação e atmosfera. Sempre responda em português explicando o que será gerado.',
    parametros:
      '{"tipo": "image_generation", "sdk_class": "ImageGeneration", "sdk_method": "generate", "parametros_entrada": ["prompt", "size"], "saida_formato": "imagem_base64", "tamanhos_disponiveis": ["1024x1024", "512x512", "768x768"]}',
  },

  // ── Categoria: avancado ──
  {
    nome: 'Análise de Imagem',
    categoria: 'avancado',
    descricao:
      'Compreende e analisa imagens usando modelo de visão computacional avançado',
    conteudo:
      'Você é um agente de análise visual. Quando receber uma imagem, analise-a detalhadamente: descreva o conteúdo, identifique objetos, pessoas, textos, cores, emoções e contexto. Forneça insights relevantes sobre a imagem em português brasileiro.',
    parametros:
      '{"tipo": "vlm_analysis", "sdk_class": "VLM", "sdk_method": "analyze", "parametros_entrada": ["image", "question"], "saida_formato": "texto_descritivo"}',
  },
  {
    nome: 'Síntese de Voz',
    categoria: 'avancado',
    descricao:
      'Converte texto em áudio com voz natural usando tecnologia TTS avançada',
    conteudo:
      'Você é um agente de síntese de voz. Converta o texto fornecido pelo usuário em áudio com voz natural e expressiva. O áudio deve ser claro, com boa pronúncia e entonação adequada ao conteúdo.',
    parametros:
      '{"tipo": "tts", "sdk_class": "TTS", "sdk_method": "synthesize", "parametros_entrada": ["text", "voice", "speed"], "saida_formato": "audio_base64", "vozes_disponiveis": ["alloy", "echo", "fable", "onyx", "nova", "shimmer"]}',
  },
  {
    nome: 'Transcrição de Áudio',
    categoria: 'avancado',
    descricao:
      'Converte fala em texto com alta precisão usando reconhecimento de fala avançado',
    conteudo:
      'Você é um agente de transcrição de áudio. Quando receber um arquivo de áudio, transcreva todo o conteúdo falado com alta precisão. Identifique diferentes falantes quando possível e mantenha a formatação adequada. Responda em português brasileiro.',
    parametros:
      '{"tipo": "asr", "sdk_class": "ASR", "sdk_method": "transcribe", "parametros_entrada": ["audio", "language"], "saida_formato": "texto_transcrito", "idiomas_suportados": ["pt-BR", "en-US", "es-ES", "fr-FR"]}',
  },

  // ── Categoria: experimental ──
  {
    nome: 'Resumo de Texto',
    categoria: 'experimental',
    descricao:
      'Resume textos longos em versões concisas mantendo as informações essenciais',
    conteudo:
      'Você é um agente especializado em resumos. Quando receber um texto longo, crie um resumo conciso que capture as ideias principais, dados-chave e conclusões. O resumo deve ser claro, objetivo e em português brasileiro. Mantenha no máximo 20% do tamanho original.',
    parametros:
      '{"tipo": "llm_chat", "sdk_method": "chat.completions.create", "parametros_entrada": ["messages"], "saida_formato": "texto_resumido", "prompt_prefix": "Resuma o seguinte texto de forma concisa, mantendo as informações essenciais:"}',
  },
  {
    nome: 'Tradução Multilíngue',
    categoria: 'experimental',
    descricao:
      'Traduz textos entre múltiplos idiomas com contexto cultural e naturalidade',
    conteudo:
      'Você é um agente tradutor profissional. Quando receber um texto, traduza-o mantendo o tom, estilo e nuances culturais. Adapte expressões idiomáticas e referências culturais para o idioma de destino. Responda sempre com a tradução e uma breve nota sobre adaptações culturais feitas.',
    parametros:
      '{"tipo": "llm_chat", "sdk_method": "chat.completions.create", "parametros_entrada": ["messages"], "saida_formato": "texto_traduzido", "idiomas": ["pt-BR", "en-US", "es-ES", "fr-FR", "de-DE", "ja-JP", "zh-CN"]}',
  },
  {
    nome: 'Análise de Sentimento',
    categoria: 'experimental',
    descricao:
      'Analisa o sentimento e as emoções em textos para entender percepções e opiniões',
    conteudo:
      'Você é um agente de análise de sentimento. Quando receber um texto, analise o sentimento geral (positivo, negativo, neutro), a intensidade emocional, emoções específicas detectadas (alegria, tristeza, raiva, surpresa, etc.) e palavras-chave que influenciam o sentimento. Apresente os resultados de forma estruturada em português brasileiro.',
    parametros:
      '{"tipo": "llm_chat", "sdk_method": "chat.completions.create", "parametros_entrada": ["messages"], "saida_formato": "analise_estruturada", "categorias": ["positivo", "negativo", "neutro", "misto"]}',
  },
  {
    nome: 'Geração de Código',
    categoria: 'experimental',
    descricao:
      'Gera código em diversas linguagens de programação a partir de descrições em linguagem natural',
    conteudo:
      'Você é um agente de desenvolvimento de software. Quando o usuário descrever uma funcionalidade, gere código limpo, bem comentado e seguindo as melhores práticas. Inclua exemplos de uso e tratamento de erros. Sempre explique o código gerado em português brasileiro.',
    parametros:
      '{"tipo": "llm_chat", "sdk_method": "chat.completions.create", "parametros_entrada": ["messages"], "saida_formato": "codigo_fonte", "linguagens": ["TypeScript", "Python", "JavaScript", "Rust", "Go", "Java", "C++"]}',
  },
  {
    nome: 'Extração de Dados',
    categoria: 'experimental',
    descricao:
      'Extrai dados estruturados de textos não estruturados usando IA',
    conteudo:
      'Você é um agente de extração de dados. Quando receber um texto não estruturado e uma especificação dos dados desejados, extraia as informações relevantes e as organize em formato estruturado (JSON). Identifique entidades, relações, datas, valores e outros dados relevantes. Responda em português brasileiro.',
    parametros:
      '{"tipo": "llm_chat", "sdk_method": "chat.completions.create", "parametros_entrada": ["messages"], "saida_formato": "json_estruturado", "tipos_dados": ["entidades", "datas", "valores", "relações", "contatos"]}',
  },
  {
    nome: 'Leitura de Página Web',
    categoria: 'experimental',
    descricao:
      'Extrai e compreende o conteúdo de páginas web a partir de URLs',
    conteudo:
      'Você é um agente de leitura web. Quando receber uma URL, extraia o conteúdo principal da página, remova elementos desnecessários (navegação, anúncios, rodapés), e apresente o conteúdo de forma organizada e legível em português brasileiro. Identifique o tipo de conteúdo (artigo, documentação, notícia, etc.).',
    parametros:
      '{"tipo": "web_reader", "sdk_method": "functions.invoke", "sdk_function": "web_reader", "parametros_entrada": ["url"], "saida_formato": "conteudo_extraido"}',
  },
]

export async function POST() {
  try {
    const nomes = habilidadesSeed.map((h) => h.nome)

    const existentes = await db.habilidade.findMany({
      where: { nome: { in: nomes } },
      select: { nome: true },
    })

    const nomesExistentes = new Set(existentes.map((h) => h.nome))

    const novasHabilidades = habilidadesSeed.filter(
      (h) => !nomesExistentes.has(h.nome)
    )

    if (novasHabilidades.length === 0) {
      return NextResponse.json({
        mensagem: 'Todas as 12 habilidades já existem no banco de dados.',
        criadas: [],
        totalCriadas: 0,
        totalExistentes: 12,
      })
    }

    const criadas = await db.$transaction(
      novasHabilidades.map((h) =>
        db.habilidade.create({
          data: {
            nome: h.nome,
            categoria: h.categoria,
            descricao: h.descricao,
            conteudo: h.conteudo,
            parametros: h.parametros,
          },
        })
      )
    )

    return NextResponse.json({
      mensagem: `${criadas.length} habilidade(s) criada(s) com sucesso.`,
      criadas,
      totalCriadas: criadas.length,
      totalExistentes: nomesExistentes.size,
    })
  } catch (error) {
    console.error('Erro ao semear habilidades:', error)
    return NextResponse.json(
      { error: 'Erro ao semear habilidades no banco de dados' },
      { status: 500 }
    )
  }
}
