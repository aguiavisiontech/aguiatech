#!/bin/bash
# ============================================
# Aguiatech - Script de Deploy para VPS
# ============================================
# Uso: bash deploy.sh
# 
# Pré-requisitos na VPS:
#   - Ubuntu 22.04+ ou Debian 12+
#   - 8GB RAM (KVM2)
#   - Acesso root ou sudo
# ============================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔══════════════════════════════════════╗"
echo "║    Aguiatech - Deploy na VPS         ║"
echo "║    Plataforma de Agentes de IA       ║"
echo "╚══════════════════════════════════════╝"
echo -e "${NC}"

# ============================================
# 1. CONFIGURAÇÃO DE VARIÁVEIS
# ============================================
APP_NAME="aguiatech"
APP_DIR="/opt/aguiatech"
APP_PORT=3000
APP_USER="aguiatech"
NODE_VERSION="22"
REPO_URL="https://github.com/aguiavisiontech/aguiatech.git"
DOMAIN="${1:-}"  # Opcional: domínio para nginx

# ============================================
# 2. INSTALAR DEPENDÊNCIAS DO SISTEMA
# ============================================
echo -e "${YELLOW}[1/8] Instalando dependências do sistema...${NC}"
sudo apt-get update -qq
sudo apt-get install -y -qq \
  curl wget git build-essential \
  nginx certbot python3-certbot-nginx \
  ufw > /dev/null 2>&1

echo -e "${GREEN}✓ Dependências instaladas${NC}"

# ============================================
# 3. INSTALAR BUN (Runtime JS)
# ============================================
echo -e "${YELLOW}[2/8] Instalando Bun...${NC}"
if ! command -v bun &> /dev/null; then
  curl -fsSL https://bun.sh/install | bash
  export PATH="$HOME/.bun/bin:$PATH"
  echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc
fi
echo -e "${GREEN}✓ Bun instalado: $(bun --version)${NC}"

# ============================================
# 4. CONFIGURAR SWAP (se não existir)
# ============================================
echo -e "${YELLOW}[3/8] Configurando swap...${NC}"
if [ ! -f /swapfile ]; then
  sudo fallocate -l 4G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
  sudo sysctl vm.swappiness=10
  echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
  echo -e "${GREEN}✓ Swap de 4GB configurado${NC}"
else
  echo -e "${GREEN}✓ Swap já existe${NC}"
fi

# ============================================
# 5. CRIAR USUÁRIO E CLONAR REPOSITÓRIO
# ============================================
echo -e "${YELLOW}[4/8] Preparando aplicação...${NC}"

# Criar usuário do sistema (se não existir)
if ! id "$APP_USER" &>/dev/null; then
  sudo useradd -m -s /bin/bash "$APP_USER"
  echo -e "${GREEN}✓ Usuário $APP_USER criado${NC}"
fi

# Clonar ou atualizar repositório
if [ -d "$APP_DIR" ]; then
  echo -e "${CYAN}Atualizando repositório existente...${NC}"
  cd "$APP_DIR"
  git pull origin main
else
  echo -e "${CYAN}Clonando repositório...${NC}"
  sudo git clone "$REPO_URL" "$APP_DIR"
fi

sudo chown -R "$APP_USER:$APP_USER" "$APP_DIR"
cd "$APP_DIR"

echo -e "${GREEN}✓ Código-fonte pronto${NC}"

# ============================================
# 6. INSTALAR DEPENDÊNCIAS E BUILD
# ============================================
echo -e "${YELLOW}[5/8] Instalando dependências e fazendo build...${NC}"

# Instalar dependências
sudo -u "$APP_USER" bash -c "cd $APP_DIR && bun install"

# Gerar Prisma Client
sudo -u "$APP_USER" bash -c "cd $APP_DIR && bun run db:generate"

# Criar banco de dados
sudo -u "$APP_USER" bash -c "cd $APP_DIR && bun run db:push"

# Build de produção
echo -e "${CYAN}Fazendo build (pode demorar alguns minutos)...${NC}"
sudo -u "$APP_USER" bash -c "cd $APP_DIR && bun run build"

echo -e "${GREEN}✓ Build completo${NC}"

# ============================================
# 7. CONFIGURAR PM2 (Process Manager)
# ============================================
echo -e "${YELLOW}[6/8] Configurando PM2...${NC}"

# Instalar PM2 globalmente
sudo -u "$APP_USER" bash -c 'bun install -g pm2'

# Criar arquivo .env de produção se não existir
if [ ! -f "$APP_DIR/.env.production" ]; then
  sudo -u "$APP_USER" bash -c "cat > $APP_DIR/.env.production << 'EOF'
DATABASE_URL=file:$APP_DIR/db/custom.db
NODE_ENV=production
PORT=3000
EOF"
fi

# Copiar ecosystem.config.js se existir
if [ -f "$APP_DIR/ecosystem.config.js" ]; then
  echo -e "${CYAN}Usando ecosystem.config.js existente${NC}"
fi

# Iniciar com PM2
cd "$APP_DIR"
sudo -u "$APP_USER" bash -c "cd $APP_DIR && pm2 delete $APP_NAME 2>/dev/null || true"
sudo -u "$APP_USER" bash -c "cd $APP_DIR && pm2 start ecosystem.config.js"

# Salvar PM2 para auto-start
sudo -u "$APP_USER" bash -c "pm2 save"

# Configurar PM2 para iniciar com o sistema
sudo env PATH="$PATH:/home/$APP_USER/.bun/bin" \
  /home/$APP_USER/.bun/bin/pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER" 2>/dev/null || true

echo -e "${GREEN}✓ PM2 configurado e aplicação rodando${NC}"

# ============================================
# 8. CONFIGURAR NGINX (Reverse Proxy)
# ============================================
echo -e "${YELLOW}[7/8] Configurando Nginx...${NC}"

if [ -n "$DOMAIN" ]; then
  # Configuração com domínio
  sudo tee /etc/nginx/sites-available/"$APP_NAME" > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    # Upload de arquivos até 50MB
    client_max_body_size 50M;

    # Compressão
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
}
EOF

  # Ativar site
  sudo ln -sf /etc/nginx/sites-available/"$APP_NAME" /etc/nginx/sites-enabled/
  sudo rm -f /etc/nginx/sites-enabled/default
  sudo nginx -t
  sudo systemctl reload nginx

  # SSL com Certbot
  echo -e "${CYAN}Configurando SSL com Let's Encrypt...${NC}"
  sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "admin@$DOMAIN" 2>/dev/null || true

  echo -e "${GREEN}✓ Nginx configurado com SSL para $DOMAIN${NC}"
else
  # Configuração sem domínio (IP direto)
  sudo tee /etc/nginx/sites-available/"$APP_NAME" > /dev/null << EOF
server {
    listen 80 default_server;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    client_max_body_size 50M;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
}
EOF

  sudo ln -sf /etc/nginx/sites-available/"$APP_NAME" /etc/nginx/sites-enabled/
  sudo rm -f /etc/nginx/sites-enabled/default
  sudo nginx -t
  sudo systemctl reload nginx

  echo -e "${GREEN}✓ Nginx configurado (acesso via IP)${NC}"
fi

# ============================================
# 9. CONFIGURAR FIREWALL
# ============================================
echo -e "${YELLOW}[8/8] Configurando firewall...${NC}"
sudo ufw --force enable
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS
sudo ufw --force reload

echo -e "${GREEN}✓ Firewall configurado${NC}"

# ============================================
# RESUMO FINAL
# ============================================
echo ""
echo -e "${GREEN}╔══════════════════════════════════════╗"
echo "║    🎉 DEPLOY CONCLUÍDO COM SUCESSO!  ║"
echo "╚══════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}📊 Informações do Deploy:${NC}"
echo "  ├── Aplicação:  $APP_NAME"
echo "  ├── Diretório:  $APP_DIR"
echo "  ├── Porta:      $APP_PORT"
echo "  ├── Processo:   PM2 ($APP_NAME)"
echo "  ├── Proxy:      Nginx"
echo "  ├── Swap:       4GB"
echo "  └── Banco:      SQLite ($APP_DIR/db/custom.db)"

if [ -n "$DOMAIN" ]; then
  echo ""
  echo -e "${CYAN}🌐 Acesso:${NC}"
  echo "  ├── URL:    https://$DOMAIN"
  echo "  └── IP:     http://$(curl -s ifconfig.me 2>/dev/null || echo 'SEU_IP')"
else
  echo ""
  echo -e "${CYAN}🌐 Acesso:${NC}"
  echo "  └── URL:    http://$(curl -s ifconfig.me 2>/dev/null || echo 'SEU_IP')"
fi

echo ""
echo -e "${CYAN}🔧 Comandos úteis:${NC}"
echo "  ├── pm2 status              # Ver status da aplicação"
echo "  ├── pm2 logs $APP_NAME      # Ver logs em tempo real"
echo "  ├── pm2 restart $APP_NAME   # Reiniciar aplicação"
echo "  ├── pm2 monit               # Monitorar recursos"
echo "  └── sudo nginx -t           # Testar config do Nginx"
echo ""
echo -e "${CYAN}🔄 Para atualizar:${NC}"
echo "  cd $APP_DIR && git pull && bun install && bun run build && pm2 restart $APP_NAME"
echo ""
