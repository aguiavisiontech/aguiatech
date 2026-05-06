---
Task ID: 4
Agent: backend-api-agent
Task: Implement new MCP integration backend APIs

Work Log:
- Examined existing project structure, Prisma schema (IntegracaoMCP, LogIntegracao, FerramentaMCP models), and old conexoes-mcp API routes
- Deleted old `/api/conexoes-mcp/` directory entirely
- Created 8 new API route files under `/api/integracoes-mcp/`:
  1. `route.ts` - GET (list with tools count + latest log), POST (create with type-specific config validation)
  2. `[id]/route.ts` - GET (single with tools + recent logs), PUT (update with field validation), DELETE (cascade)
  3. `[id]/conectar/route.ts` - POST (test connection per type: n8n fetches workflows, WhatsApp checks phone number, Telegram calls getMe, stdio/sse mark as connected)
  4. `[id]/desconectar/route.ts` - POST (disconnect, update status, create log)
  5. `[id]/logs/route.ts` - GET (paginated, default 50 per page)
  6. `[id]/ferramentas/route.ts` - GET (list tools), POST (add tool with JSON validation)
  7. `[id]/ferramentas/[ferramentaId]/route.ts` - PUT (update tool), DELETE (delete tool + log)
  8. `[id]/webhook/route.ts` - POST (receive webhooks from external services, create log)
- Overwrote placeholder implementations left by previous agent in conectar and desconectar routes with full spec-compliant versions
- Enhanced POST create endpoint to accept config as both JSON string and object
- Added proper ferramentasCount and ultimoLog fields to list endpoint response
- Ran `bun run lint` — zero errors
- Ran full integration test suite against all endpoints — all 15 test cases passed
- Verified 404 handling, cascade delete, pagination, and error responses

Stage Summary:
- All 8 API routes implemented and tested successfully
- Old conexoes-mcp routes completely removed
- Connection testing logic implemented for n8n, WhatsApp, Telegram, stdio, and sse types
- All routes use NextRequest/NextResponse, Prisma client from @/lib/db, and proper error handling
- Lint passes with zero errors
