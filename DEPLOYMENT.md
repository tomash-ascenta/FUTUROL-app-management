# Deployment Guide

Kompletní průvodce nasazením Futurol App do produkčního prostředí.

---

## 🏗️ CI/CD Architektura

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────────┐      ┌─────────────┐
│   GitHub    │ push │  GitHub Actions  │ push │      GHCR       │ pull │     VPS     │
│    Repo     │─────▶│   (Build Job)    │─────▶│   Container     │─────▶│  (Deploy)   │
│             │      │   7GB RAM ✓      │      │   Registry      │      │             │
└─────────────┘      └──────────────────┘      └─────────────────┘      └─────────────┘
```

**Proč tato architektura?**
- ✅ Build probíhá na GitHub Actions (7GB RAM) - žádné OOM problémy
- ✅ VPS pouze stahuje hotový image - šetří RAM a čas
- ✅ GHCR package je veřejný - nepotřebuje autentizaci
- ✅ Automatický deploy při push do main

**Klíčové soubory:**
- `.github/workflows/deploy.yml` - CI/CD workflow
- `docker-compose.yml` - kontejnerová orchestrace
- `Dockerfile` - build instrukcí

---

## 📋 Obsah

- [Prerequisites](#prerequisites)
- [VPS Initial Setup](#vps-initial-setup)
- [První nasazení](#první-nasazení)
- [Aktualizace aplikace](#aktualizace-aplikace)
- [Rollback](#rollback)
- [Monitoring & Logs](#monitoring--logs)
- [Backup & Restore](#backup--restore)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Místní prostředí
- Git
- SSH klíč pro přístup na VPS
- Přístup k repository: `tomash-ascenta/FUTUROL-app-management`

### VPS Requirements
- Ubuntu 22.04 LTS nebo novější
- Min 2 GB RAM, 2 CPU cores
- Min 20 GB disk space
- Root nebo sudo přístup
- Statická IP adresa
- Doménové jméno (optional pro SSL)

---

## VPS Initial Setup

### 1. Připojení na VPS

```bash
# SSH na server
ssh vpsuser@37.46.208.167

# Nebo použij klíč
ssh -i ~/.ssh/futurol_rsa vpsuser@37.46.208.167
```

### 2. Instalace Docker & Docker Compose

```bash
# Update systému
sudo apt update && sudo apt upgrade -y

# Instalace Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Přidání uživatele do docker group
sudo usermod -aG docker $USER

# Odhlásit a znovu přihlásit pro aplikování změn
exit
ssh vpsuser@37.46.208.167

# Ověření instalace
docker --version
docker compose version
```

### 3. Instalace Nginx

```bash
# Instalace Nginx
sudo apt install nginx -y

# Start a enable
sudo systemctl start nginx
sudo systemctl enable nginx

# Ověření
sudo systemctl status nginx
```

### 4. Instalace Certbot (SSL)

```bash
# Instalace Certbot
sudo apt install certbot python3-certbot-nginx -y

# Získání SSL certifikátu
sudo certbot --nginx -d futurol.ascentalab.cz -d radce.ascentalab.cz

# Automatická obnova
sudo certbot renew --dry-run
```

### 5. Konfigurace Firewall

```bash
# Povolit základní porty
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# Povolit pouze z důvěryhodných IP (optional)
# sudo ufw allow from 1.2.3.4 to any port 22

# Enable firewall
sudo ufw enable
sudo ufw status
```

### 6. Vytvoření složky pro aplikaci

```bash
# Vytvoř app directory
mkdir -p ~/app
cd ~/app

# Klonuj repository
git clone https://github.com/tomash-ascenta/FUTUROL-app-management.git
cd FUTUROL-app-management
```

---

## První nasazení

### 1. Konfigurace Environment Variables

```bash
# Zkopíruj .env.example
cp .env.example .env

# Edituj .env
nano .env
```

**Důležité proměnné pro produkci:**
```bash
# Database
DATABASE_URL="postgresql://futurol:STRONG_PASSWORD_HERE@db:5432/futurol"
DB_PASSWORD="STRONG_PASSWORD_HERE"

# JWT secrets (generuj silné)
JWT_SECRET="$(openssl rand -base64 32)"
JWT_REFRESH_SECRET="$(openssl rand -base64 32)"

# Node environment
NODE_ENV="production"

# URLs
PUBLIC_APP_URL="https://futurol.ascentalab.cz"
PUBLIC_ADVISOR_URL="https://radce.ascentalab.cz"
```

**Vygeneruj silné tajné klíče:**
```bash
# JWT secrets
openssl rand -base64 32
openssl rand -base64 32

# Database password
openssl rand -base64 16
```

### 2. Nginx konfigurace

```bash
# Zkopíruj config
sudo cp futurol-nginx.conf /etc/nginx/sites-available/futurol
sudo cp radce-nginx.conf /etc/nginx/sites-available/radce

# Enable sites
sudo ln -s /etc/nginx/sites-available/futurol /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/radce /etc/nginx/sites-enabled/

# Odstranění default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test konfigurace
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 3. Build a spuštění Docker kontejnerů

```bash
# Build images
docker compose build

# Spuštění v detached mode
docker compose up -d

# Sledování logů
docker compose logs -f
```

### 4. Inicializace databáze

```bash
# Připoj se do app kontejneru
docker exec -it futurol-app sh

# Pusni migrace
npx prisma migrate deploy

# Seedni data (testovací uživatele)
npx prisma db seed

# Exit z kontejneru
exit
```

### 5. Ověření

```bash
# Zkontroluj running containers
docker compose ps

# Test API
curl http://localhost:8081/api/health

# Test přes Nginx
curl https://futurol.ascentalab.cz

# Sleduj logy
docker compose logs -f app
```

---

## Aktualizace aplikace

### Automatický deploy přes GitHub Actions (doporučeno)

**Push do `main` větve automaticky spustí deployment:**

1. **Build** - GitHub Actions sestaví Docker image (7GB RAM, žádné OOM problémy)
2. **Push** - Image se uloží do GitHub Container Registry (`ghcr.io/tomash-ascenta/futurol-app-management:latest`)
3. **Deploy** - VPS stáhne hotový image a restartuje kontejner

```bash
# Stačí pushnout změny
git push origin main
```

Workflow je definován v `.github/workflows/deploy.yml`.

### Ruční deploy (z lokálního stroje)

```bash
# Stáhne nový image z GHCR a restartuje kontejner
ssh vpsuser@37.46.208.167 "cd /home/vpsuser/app/FUTUROL-app-management && \\
  docker pull ghcr.io/tomash-ascenta/futurol-app-management:latest && \\
  docker tag ghcr.io/tomash-ascenta/futurol-app-management:latest futurol-app:latest && \\
  docker compose up -d"
```

### Ruční deploy přímo na VPS

```bash
# SSH na VPS
ssh vpsuser@37.46.208.167
cd ~/app/FUTUROL-app-management

# Stáhni a spusť nový image
docker pull ghcr.io/tomash-ascenta/futurol-app-management:latest
docker tag ghcr.io/tomash-ascenta/futurol-app-management:latest futurol-app:latest
docker compose up -d

# Aplikuj migrace (pokud jsou)
docker exec -it futurol-app npx prisma migrate deploy

# Sleduj logy
docker compose logs -f app
```

### Starší deploy.sh skript (DEPRECATED)

> ⚠️ **Poznámka:** Skript `deploy.sh` používá lokální build na VPS, což může selhat kvůli nedostatku RAM (OOM). Doporučujeme používat automatický deploy přes GitHub Actions.

```bash
# Pouze pokud je GHCR nedostupný
./deploy.sh
```

### Zero-downtime deploy (pokročilé)

Pro minimální výpadek:

```bash
# 1. Build nový image pod jiným názvem
docker build -t futurol-app:new .

# 2. Spusť nový kontejner na jiném portu
docker run -d -p 8082:3000 --name futurol-app-new \
  --env-file .env \
  --network futurol-app_default \
  futurol-app:new

# 3. Test nového kontejneru
curl http://localhost:8082/api/health

# 4. Přepni Nginx na nový port
# Edit nginx config: proxy_pass http://localhost:8082;
sudo nginx -t && sudo systemctl reload nginx

# 5. Zastav starý kontejner
docker stop futurol-app
docker rm futurol-app

# 6. Přejmenuj nový kontejner
docker rename futurol-app-new futurol-app
```

---

## Rollback

### Rollback Git verze

```bash
# Zobraz historii commitů
git log --oneline

# Rollback na konkrétní commit
git checkout <commit-hash>

# Rebuild a restart
docker compose build app
docker compose up -d app --force-recreate
```

### Rollback Docker image

```bash
# Zobraz dostupné images
docker images | grep futurol-app

# Spusť starší verzi
docker run -d -p 8081:3000 --name futurol-app \
  --env-file .env \
  --network futurol-app_default \
  futurol-app:<old-tag>
```

### Rollback databáze

**⚠️ POZOR: Prisma nepodporuje automatický rollback migrací!**

```bash
# 1. Záloha DB (před rollbackem!)
docker exec futurol-db pg_dump -U futurol futurol > backup_before_rollback.sql

# 2. Manuální rollback SQL (připrav si dopředu)
# Vytvoř down migration script při každé změně schema

# 3. Restore z backup
docker exec -i futurol-db psql -U futurol futurol < backup.sql
```

---

## Monitoring & Logs

### Docker logs

```bash
# Všechny kontejnery
docker compose logs -f

# Pouze app
docker compose logs -f app

# Pouze DB
docker compose logs -f db

# Posledních 100 řádků
docker compose logs --tail=100 app

# Logy od určitého času
docker compose logs --since="2026-01-13T10:00:00" app
```

### System logs

```bash
# Nginx access log
sudo tail -f /var/log/nginx/access.log

# Nginx error log
sudo tail -f /var/log/nginx/error.log

# System journal
sudo journalctl -u nginx -f
```

### Monitoring zdrojů

```bash
# CPU a RAM usage kontejnerů
docker stats

# Disk usage
df -h
docker system df

# Network
docker network ls
docker network inspect futurol-app_default
```

### Health checks

```bash
# API health endpoint
curl http://localhost:8081/api/health

# Database connection test
docker exec futurol-db psql -U futurol -c "SELECT 1;"

# Container health
docker inspect futurol-app | grep -A5 Health
```

---

## Backup & Restore

### Databázový backup

**Automatický denní backup (cron):**

```bash
# Vytvoř backup script
cat > ~/backup_db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/vpsuser/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/futurol_db_$TIMESTAMP.sql"

mkdir -p $BACKUP_DIR
docker exec futurol-db pg_dump -U futurol futurol > $BACKUP_FILE
gzip $BACKUP_FILE

# Smaž backupy starší 30 dní
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
EOF

chmod +x ~/backup_db.sh

# Přidej do cron (každý den ve 2:00)
crontab -e
# Přidej řádek:
# 0 2 * * * /home/vpsuser/backup_db.sh >> /home/vpsuser/backup_db.log 2>&1
```

**Manuální backup:**

```bash
# Backup databáze
docker exec futurol-db pg_dump -U futurol futurol > backup_$(date +%Y%m%d).sql

# Komprese
gzip backup_$(date +%Y%m%d).sql

# Stažení na lokální PC
scp vpsuser@37.46.208.167:~/backup_*.sql.gz ./backups/
```

### Restore databáze

```bash
# Zastav app kontejner (aby nepsal do DB)
docker compose stop app

# Restore z backup
cat backup.sql | docker exec -i futurol-db psql -U futurol futurol

# Nebo z gzipu
gunzip -c backup.sql.gz | docker exec -i futurol-db psql -U futurol futurol

# Restart app
docker compose start app
```

### Backup uploads složky

```bash
# Backup uploads
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/

# Restore
tar -xzf uploads_backup_20260113.tar.gz
```

### Off-site backup (doporučeno)

```bash
# Nahrát na Google Drive, Dropbox, S3...
# Příklad s rclone:
rclone copy ~/backups/ gdrive:futurol-backups/
```

---

## Troubleshooting

### App kontejner se nespustí

```bash
# Zobraz logy
docker compose logs app

# Časté příčiny:
# 1. Chybí .env - zkontroluj existenci
# 2. DB není ready - počkej na healthcheck
# 3. Port konflikt - změň port v docker-compose.yml
```

### Nginx 502 Bad Gateway

```bash
# Zkontroluj app kontejner
docker ps | grep futurol-app

# Zkontroluj port mapping
docker port futurol-app

# Test lokálního připojení
curl http://localhost:8081

# Restart app
docker compose restart app
```

### SSL certifikát vypršel

```bash
# Obnov certifikát
sudo certbot renew

# Force renewal
sudo certbot renew --force-renewal

# Reload Nginx
sudo systemctl reload nginx
```

### Plný disk

```bash
# Zkontroluj využití
df -h
docker system df

# Vyčisti Docker
docker system prune -a --volumes

# Vyčisti staré logy
sudo journalctl --vacuum-time=7d
```

### Pomalý výkon

```bash
# Zkontroluj zdroje
docker stats
htop

# Restart kontejnerů
docker compose restart

# Případně upgrade VPS
```

---

## Best Practices

### ✅ DO
- Používej deploy.sh pro konzistentní nasazení
- Pravidelně zálohuj databázi (denně)
- Monitoruj logy a disk space
- Aktualizuj system packages (`sudo apt update && sudo apt upgrade`)
- Rotuj JWT secrets každých 90 dní
- Testuj změny v development před nasazením

### ❌ DON'T
- Nikdy necommituj .env do Gitu
- Nikdy nerestartuj DB kontejner bez zálohy
- Nepoužívej `docker compose down` (smaže volumes!)
- Nedávej root přístup všem
- Nezapomeň na SSL renewal

---

## Checklist před nasazením

- [ ] .env má produkční hodnoty
- [ ] JWT secrets jsou silné a unikátní
- [ ] Database password je silné
- [ ] Nginx konfigurace je testovaná (`nginx -t`)
- [ ] SSL certifikáty jsou platné
- [ ] Firewall je nakonfigurovaný
- [ ] Backup strategie je nastavená
- [ ] Monitoring je funkční
- [ ] Emergency kontakty jsou známé

---

## Emergency Contacts

- **DevOps:** Tomáš Havelka - tomash@ascenta.cz
- **VPS Provider:** [Info v VPS_CREDENTIALS.md]
- **DNS Provider:** [Info v VPS_CREDENTIALS.md]

---

**Naposledy aktualizováno:** 13. ledna 2026  
**Verze:** 1.0
