#!/bin/bash
# ============================================
# Aguiatech - Script de Atualização Rápida
# ============================================
# Uso: bash update.sh
# ============================================

set -e
APP_DIR="/opt/aguiatech"
APP_NAME="aguiatech"

echo "🔄 Atualizando Aguiatech..."

cd "$APP_DIR"

echo "  ⬇️  Baixando alterações..."
git pull origin main

echo "  📦 Instalando dependências..."
bun install

echo "  🗃️  Sincronizando banco de dados..."
bun run db:push

echo "  🔨 Fazendo build..."
bun run build

echo "  ♻️  Reiniciando aplicação..."
pm2 restart "$APP_NAME"

echo ""
echo "✅ Aguiatech atualizado com sucesso!"
pm2 status "$APP_NAME"
