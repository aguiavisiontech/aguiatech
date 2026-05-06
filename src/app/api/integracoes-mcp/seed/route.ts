import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    // Check if already seeded
    const existing = await db.integracaoMCP.count()
    if (existing > 0) {
      return NextResponse.json({ message: 'Dados já existem', count: existing })
    }

    // Create sample n8n integration
    const n8n = await db.integracaoMCP.create({
      data: {
        nome: 'n8n Produção',
        tipo: 'n8n',
        descricao: 'Servidor n8n de produção com workflows de automação',
        ativa: true,
        conectado: true,
        status: 'conectado',
        config: JSON.stringify({
          baseUrl: 'https://n8n.empresa.com.br',
          apiKey: 'n8n_api_sk_xxxxxxxxxxxxx',
          defaultWorkflowIds: ['wf_001', 'wf_002', 'wf_003'],
        }),
        webhookUrl: 'https://n8n.empresa.com.br/webhook/mcp-aguiatech',
        metricas: JSON.stringify({ workflows: 15, execucoes: 234, sucesso: 98.5 }),
        tags: JSON.stringify(['producao', 'automacao', 'n8n']),
        criadoPor: 'admin',
        prioridade: 10,
        ultimaSync: new Date(),
        ferramentas: {
          create: [
            { nome: 'executar_workflow', descricao: 'Executa um workflow n8n específico', categoria: 'automacao', requerAprovacao: false, ativa: true, usoContagem: 142 },
            { nome: 'listar_workflows', descricao: 'Lista todos os workflows disponíveis', categoria: 'consulta', requerAprovacao: false, ativa: true, usoContagem: 89 },
            { nome: 'obter_execucao', descricao: 'Obtém detalhes de uma execução de workflow', categoria: 'consulta', requerAprovacao: false, ativa: true, usoContagem: 56 },
          ],
        },
        logs: {
          create: [
            { acao: 'conectar', detalhes: 'Conexão estabelecida com sucesso', status: 'sucesso', duracao: 230 },
            { acao: 'sync', detalhes: '15 workflows sincronizados', status: 'sucesso', duracao: 1500 },
            { acao: 'executar', detalhes: 'Workflow "notificar_cliente" executado', status: 'sucesso', duracao: 340 },
            { acao: 'webhook', detalhes: 'Webhook recebido e processado', status: 'sucesso', duracao: 120 },
            { acao: 'erro', detalhes: 'Timeout ao executar workflow "backup_dados"', status: 'erro', duracao: 30000 },
          ],
        },
      },
    })

    // Create sample n8n dev integration
    const n8nDev = await db.integracaoMCP.create({
      data: {
        nome: 'n8n Desenvolvimento',
        tipo: 'n8n',
        descricao: 'Servidor n8n de desenvolvimento e testes',
        ativa: true,
        conectado: false,
        status: 'desconectado',
        config: JSON.stringify({
          baseUrl: 'http://localhost:5678',
          apiKey: 'n8n_dev_sk_testkey',
          defaultWorkflowIds: ['wf_dev_001'],
        }),
        tags: JSON.stringify(['desenvolvimento', 'testes']),
        criadoPor: 'dev',
        prioridade: 5,
        ferramentas: {
          create: [
            { nome: 'testar_workflow', descricao: 'Testa um workflow em ambiente de dev', categoria: 'teste', requerAprovacao: false, ativa: true, usoContagem: 12 },
          ],
        },
        logs: {
          create: [
            { acao: 'criar', detalhes: 'Integração criada', status: 'sucesso' },
            { acao: 'conectar', detalhes: 'Servidor não disponível', status: 'erro', duracao: 5000 },
          ],
        },
      },
    })

    // Create sample WhatsApp integration
    const whatsapp = await db.integracaoMCP.create({
      data: {
        nome: 'WhatsApp Business API',
        tipo: 'whatsapp',
        descricao: 'Integração com WhatsApp Business para atendimento automatizado',
        ativa: true,
        conectado: true,
        status: 'conectado',
        config: JSON.stringify({
          phoneNumberId: '123456789012345',
          businessAccountId: 'BIZ_987654321',
          accessToken: 'EAAxxxxxxxxxxxxxxx_yyyyyyy',
          verifyToken: 'my_verify_token_2024',
          wabaId: 'WABA_1234567890',
        }),
        webhookUrl: 'https://api.aguiatech.com.br/webhook/whatsapp',
        metricas: JSON.stringify({ mensagensEnviadas: 1250, mensagensRecebidas: 980, tempoMedioResposta: 2.5 }),
        tags: JSON.stringify(['producao', 'whatsapp', 'atendimento']),
        criadoPor: 'admin',
        prioridade: 9,
        ultimaSync: new Date(),
        ferramentas: {
          create: [
            { nome: 'enviar_mensagem', descricao: 'Envia mensagem de texto via WhatsApp', categoria: 'comunicacao', requerAprovacao: false, ativa: true, usoContagem: 450 },
            { nome: 'enviar_template', descricao: 'Envia mensagem usando template aprovado', categoria: 'comunicacao', requerAprovacao: true, ativa: true, usoContagem: 230 },
            { nome: 'listar_contatos', descricao: 'Lista contatos do WhatsApp Business', categoria: 'consulta', requerAprovacao: false, ativa: true, usoContagem: 67 },
            { nome: 'enviar_midia', descricao: 'Envia imagem, documento ou áudio', categoria: 'comunicacao', requerAprovacao: true, ativa: true, usoContagem: 89 },
          ],
        },
        logs: {
          create: [
            { acao: 'conectar', detalhes: 'WhatsApp Business API conectado', status: 'sucesso', duracao: 450 },
            { acao: 'webhook', detalhes: 'Webhook verificado com sucesso', status: 'sucesso', duracao: 80 },
            { acao: 'executar', detalhes: 'Template "saudacao" enviado para +5511999999999', status: 'sucesso', duracao: 200 },
            { acao: 'aviso', detalhes: 'Rate limit atingido, aguardando 60s', status: 'aviso' },
          ],
        },
      },
    })

    // Create sample Telegram integration
    const telegram = await db.integracaoMCP.create({
      data: {
        nome: 'Bot Telegram Aguiatech',
        tipo: 'telegram',
        descricao: 'Bot do Telegram para interações e notificações',
        ativa: true,
        conectado: true,
        status: 'conectado',
        config: JSON.stringify({
          botToken: '7123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxxxx',
          defaultChatId: '-1001234567890',
          allowedUpdates: ['message', 'callback_query', 'inline_query'],
        }),
        webhookUrl: 'https://api.aguiatech.com.br/webhook/telegram',
        metricas: JSON.stringify({ comandosProcessados: 567, usuariosAtivos: 23 }),
        tags: JSON.stringify(['producao', 'telegram', 'bot']),
        criadoPor: 'admin',
        prioridade: 8,
        ultimaSync: new Date(),
        ferramentas: {
          create: [
            { nome: 'enviar_mensagem', descricao: 'Envia mensagem para chat do Telegram', categoria: 'comunicacao', requerAprovacao: false, ativa: true, usoContagem: 234 },
            { nome: 'enviar_teclado', descricao: 'Envia mensagem com teclado inline', categoria: 'interacao', requerAprovacao: false, ativa: true, usoContagem: 120 },
            { nome: 'obter_atualizacoes', descricao: 'Obtém atualizações pendentes do bot', categoria: 'consulta', requerAprovacao: false, ativa: true, usoContagem: 890 },
          ],
        },
        logs: {
          create: [
            { acao: 'conectar', detalhes: 'Bot Telegram conectado com sucesso', status: 'sucesso', duracao: 180 },
            { acao: 'webhook', detalhes: 'Webhook configurado automaticamente', status: 'sucesso', duracao: 320 },
            { acao: 'executar', detalhes: 'Comando /start processado para usuário 12345', status: 'sucesso', duracao: 50 },
          ],
        },
      },
    })

    // Create sample STDIO integration
    const stdio = await db.integracaoMCP.create({
      data: {
        nome: 'MCP Memory Server',
        tipo: 'stdio',
        descricao: 'Servidor MCP de memória para armazenamento de contexto',
        ativa: true,
        conectado: true,
        status: 'conectado',
        config: JSON.stringify({
          command: 'npx',
          args: '-y @modelcontextprotocol/server-memory',
        }),
        metricas: JSON.stringify({ operacoes: 456, memoriaUsada: '12MB' }),
        tags: JSON.stringify(['memoria', 'contexto', 'mcp']),
        criadoPor: 'admin',
        prioridade: 7,
        ultimaSync: new Date(),
        ferramentas: {
          create: [
            { nome: 'salvar_memoria', descricao: 'Salva informações na memória de longo prazo', categoria: 'memoria', requerAprovacao: false, ativa: true, usoContagem: 234 },
            { nome: 'buscar_memoria', descricao: 'Busca informações na memória', categoria: 'consulta', requerAprovacao: false, ativa: true, usoContagem: 567 },
            { nome: 'listar_memorias', descricao: 'Lista todas as memórias armazenadas', categoria: 'consulta', requerAprovacao: false, ativa: true, usoContagem: 89 },
          ],
        },
        logs: {
          create: [
            { acao: 'conectar', detalhes: 'STDIO server iniciado com sucesso', status: 'sucesso', duracao: 1500 },
            { acao: 'executar', detalhes: 'Memória salva com sucesso', status: 'sucesso', duracao: 45 },
          ],
        },
      },
    })

    // Create another STDIO
    const stdio2 = await db.integracaoMCP.create({
      data: {
        nome: 'MCP Filesystem Server',
        tipo: 'stdio',
        descricao: 'Servidor MCP para operações de sistema de arquivos',
        ativa: true,
        conectado: false,
        status: 'erro',
        mensagemErro: 'Processo encerrado inesperadamente (exit code 1)',
        config: JSON.stringify({
          command: 'npx',
          args: '-y @modelcontextprotocol/server-filesystem /tmp/aguiatech',
        }),
        tags: JSON.stringify(['arquivos', 'filesystem', 'mcp']),
        criadoPor: 'admin',
        prioridade: 3,
        ferramentas: {
          create: [
            { nome: 'ler_arquivo', descricao: 'Lê conteúdo de um arquivo', categoria: 'arquivo', requerAprovacao: false, ativa: true, usoContagem: 45 },
            { nome: 'escrever_arquivo', descricao: 'Escreve conteúdo em um arquivo', categoria: 'arquivo', requerAprovacao: true, ativa: true, usoContagem: 12 },
          ],
        },
        logs: {
          create: [
            { acao: 'conectar', detalhes: 'STDIO server iniciado', status: 'sucesso', duracao: 800 },
            { acao: 'erro', detalhes: 'Processo encerrado: exit code 1 - diretório não encontrado', status: 'erro', duracao: null },
          ],
        },
      },
    })

    // Create sample SSE integration
    const sse = await db.integracaoMCP.create({
      data: {
        nome: 'MCP SSE Gateway',
        tipo: 'sse',
        descricao: 'Gateway MCP via Server-Sent Events para integrações externas',
        ativa: true,
        conectado: true,
        status: 'conectado',
        config: JSON.stringify({
          url: 'https://mcp-gateway.empresa.com.br/sse',
          headers: { 'Authorization': 'Bearer sk_gateway_xxxxx', 'X-Custom-Header': 'aguiatech' },
        }),
        metricas: JSON.stringify({ conexoes: 3, eventos: 1234 }),
        tags: JSON.stringify(['gateway', 'sse', 'externo']),
        criadoPor: 'admin',
        prioridade: 6,
        ultimaSync: new Date(),
        ferramentas: {
          create: [
            { nome: 'listar_recursos', descricao: 'Lista recursos disponíveis no gateway', categoria: 'consulta', requerAprovacao: false, ativa: true, usoContagem: 34 },
            { nome: 'executar_comando', descricao: 'Executa comando remoto via SSE', categoria: 'execucao', requerAprovacao: true, ativa: true, usoContagem: 78 },
          ],
        },
        logs: {
          create: [
            { acao: 'conectar', detalhes: 'Conexão SSE estabelecida', status: 'sucesso', duracao: 320 },
            { acao: 'sync', detalhes: 'Recursos sincronizados com gateway', status: 'sucesso', duracao: 890 },
          ],
        },
      },
    })

    // Create another SSE with syncing status
    const sse2 = await db.integracaoMCP.create({
      data: {
        nome: 'MCP Analytics SSE',
        tipo: 'sse',
        descricao: 'Servidor MCP de analytics via SSE',
        ativa: true,
        conectado: false,
        status: 'sincronizando',
        config: JSON.stringify({
          url: 'https://analytics-mcp.empresa.com.br/sse',
        }),
        tags: JSON.stringify(['analytics', 'sse', 'dados']),
        criadoPor: 'analista',
        prioridade: 4,
        ferramentas: {
          create: [
            { nome: 'gerar_relatorio', descricao: 'Gera relatório de analytics', categoria: 'relatorio', requerAprovacao: false, ativa: true, usoContagem: 5 },
          ],
        },
        logs: {
          create: [
            { acao: 'sync', detalhes: 'Sincronização em andamento...', status: 'aviso' },
          ],
        },
      },
    })

    return NextResponse.json({
      message: 'Dados de demonstração criados com sucesso!',
      integracoes: { n8n: n8n.id, n8nDev: n8nDev.id, whatsapp: whatsapp.id, telegram: telegram.id, stdio: stdio.id, stdio2: stdio2.id, sse: sse.id, sse2: sse2.id },
    })
  } catch (error) {
    console.error('Erro ao criar dados de demonstração:', error)
    return NextResponse.json({ error: 'Erro ao criar dados de demonstração' }, { status: 500 })
  }
}
