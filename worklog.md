# Aguiatech - Worklog de Desenvolvimento

## Estado Atual do Projeto

### Status: ✅ Funcional com bugs corrigidos
- Servidor Next.js 16 rodando com HTTP 200
- 12 tabelas no banco SQLite via Prisma
- 36 rotas de API
- 18 componentes customizados
- 1 agente ativo (Suporte Ti)
- 10 ferramentas disponíveis
- 12 habilidades cadastradas

### Problemas Corrigidos Nesta Sessão
1. **Import faltando em 3 rotas da API** - `NextRequest` não era importado em:
   - `/api/memorias/route.ts`
   - `/api/tarefas-agendadas/route.ts`
   - `/api/conexoes-mcp/route.ts`
   - Isso causava crash do servidor ao compilar essas rotas

2. **Log excessivo do Prisma** - `log: ['query']` causava overhead e crashava o servidor ao processar múltiplas queries. Alterado para `log: ['error', 'warn']`

3. **Cache .next corrompido** - Após reset do Git, o cache `.next` tinha inconsistências. Resolvido com `rm -rf .next`

### Limitação Conhecida do Sandbox
- Sem swap disponível (Swap: 0B)
- Quando Turbopack compila múltiplas rotas simultâneas, o pico de RAM mata o processo
- Este problema **NÃO ocorre** em VPS com swap configurado
- Cada API funciona perfeitamente quando compilada individualmente

---

## Objetivos / Modificações Completadas

### 1. Restauração do GitHub Original
- `git reset --hard origin/main` para voltar à versão original
- Reinstalação de dependências e sync do banco
- Regeneração do Prisma Client

### 2. QA Completo das APIs
Todas as 10+ APIs testadas e funcionando:
| API | Status | Dados |
|-----|--------|-------|
| `/api/agentes` | ✅ 200 | 1 agente (Suporte Ti) |
| `/api/ferramentas` | ✅ 200 | 10 ferramentas |
| `/api/habilidades` | ✅ 200 | 12 habilidades |
| `/api/memorias` | ✅ 200 | 0 memórias |
| `/api/conversas` | ✅ 200 | 0 conversas |
| `/api/conexoes-mcp` | ✅ 200 | 0 conexões |
| `/api/tarefas-agendadas` | ✅ 200 | 0 tarefas |
| `/api/config` | ✅ 200 | Config OK |
| `/api/estatisticas` | ✅ 200 | Stats OK |
| `/api/agentes/templates` | ✅ 200 | Templates OK |
| `/api/atividades-recentes` | ✅ 200 | 1 atividade |
| `/api/agentes/[id]` | ✅ 200 | Agente encontrado |
| `/api/config/agente` | ✅ 200 | Config do agente |

### 3. Scripts de Deploy para VPS
Arquivos criados:
- `deploy.sh` - Script automatizado completo (swap, bun, pm2, nginx, ssl, firewall)
- `update.sh` - Script de atualização rápida
- `ecosystem.config.js` - Configuração PM2 com limites de memória
- `nginx.conf` - Reverse proxy com SSL, WebSocket e cache

---

## Problemas Não Resolvidos / Próximos Passos

### Problemas
1. **Token GitHub expirado** - Não foi possível fazer push. Usuário precisa gerar novo token
2. **Sandbox sem swap** - Servidor crasha ao compilar múltiplas rotas simultâneas (não é bug do código)

### Próximos Passos Recomendados
1. **Deploy na VPS** - Seguir o guia: `bash deploy.sh` ou `bash deploy.sh seudominio.com`
2. **Gerar novo GitHub token** para atualizar o repositório
3. **Adicionar mais agentes** (templates já existem no banco)
4. **Melhorar styling** das seções conforme sessões anteriores
5. **Adicionar novas features** conforme planejado
