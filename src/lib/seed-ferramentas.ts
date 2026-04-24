import { db } from './db'

const ferramentasSeed = [
  {
    nome: 'buscar_web',
    categoria: 'nucleo',
    descricao: 'Busca informações na web usando mecanismos de busca',
    toolset: 'z-ai-web-dev-sdk',
    parametros: JSON.stringify({ query: 'string', maxResults: 'number' }),
    requerAprovacao: false,
    ativa: true,
  },
  {
    nome: 'terminal',
    categoria: 'nucleo',
    descricao: 'Executa comandos no terminal do sistema',
    toolset: 'system',
    parametros: JSON.stringify({ command: 'string', timeout: 'number' }),
    requerAprovacao: true,
    ativa: true,
  },
  {
    nome: 'ler_arquivo',
    categoria: 'nucleo',
    descricao: 'Lê o conteúdo de um arquivo do sistema de arquivos',
    toolset: 'system',
    parametros: JSON.stringify({ path: 'string' }),
    requerAprovacao: false,
    ativa: true,
  },
  {
    nome: 'escrever_arquivo',
    categoria: 'nucleo',
    descricao: 'Escreve conteúdo em um arquivo do sistema de arquivos',
    toolset: 'system',
    parametros: JSON.stringify({ path: 'string', content: 'string' }),
    requerAprovacao: true,
    ativa: true,
  },
  {
    nome: 'navegador',
    categoria: 'avancado',
    descricao: 'Navega em páginas web usando navegador headless',
    toolset: 'z-ai-web-dev-sdk',
    parametros: JSON.stringify({ url: 'string', action: 'string' }),
    requerAprovacao: false,
    ativa: true,
  },
  {
    nome: 'gerar_imagem',
    categoria: 'avancado',
    descricao: 'Gera imagens usando IA a partir de descrições textuais',
    toolset: 'z-ai-web-dev-sdk',
    parametros: JSON.stringify({ prompt: 'string', size: 'string' }),
    requerAprovacao: false,
    ativa: true,
  },
  {
    nome: 'executar_codigo',
    categoria: 'avancado',
    descricao: 'Executa código em um ambiente sandbox isolado',
    toolset: 'system',
    parametros: JSON.stringify({ language: 'string', code: 'string' }),
    requerAprovacao: true,
    ativa: true,
  },
  {
    nome: 'enviar_mensagem',
    categoria: 'avancado',
    descricao: 'Envia mensagens via Telegram, Discord ou Slack',
    toolset: 'integrations',
    parametros: JSON.stringify({ platform: 'string', channel: 'string', message: 'string' }),
    requerAprovacao: true,
    ativa: true,
  },
  {
    nome: 'listar_arquivos',
    categoria: 'nucleo',
    descricao: 'Lista arquivos e diretórios em um caminho especificado',
    toolset: 'system',
    parametros: JSON.stringify({ path: 'string', recursive: 'boolean' }),
    requerAprovacao: false,
    ativa: true,
  },
  {
    nome: 'analisar_dados',
    categoria: 'experimental',
    descricao: 'Analisa dados e gera insights estatísticos',
    toolset: 'analytics',
    parametros: JSON.stringify({ data: 'any', format: 'string' }),
    requerAprovacao: false,
    ativa: true,
  },
]

export async function seedFerramentas() {
  for (const ferramenta of ferramentasSeed) {
    const existing = await db.ferramenta.findUnique({ where: { nome: ferramenta.nome } })
    if (!existing) {
      await db.ferramenta.create({ data: ferramenta })
    }
  }
  console.log('✅ Ferramentas seed concluído')
}
