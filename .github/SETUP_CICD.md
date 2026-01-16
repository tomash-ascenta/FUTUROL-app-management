# CI/CD Setup Guide

Automatické nasazení na VPS pomocí GitHub Actions a GitHub Container Registry (GHCR).

## 🏗️ Architektura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CI/CD Pipeline                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │ 1. Lint & Type  │    │ 2. Build Test   │    │ 3. Docker Build │         │
│  │    Check        │───▶│    (npm build)  │───▶│    & Push GHCR  │         │
│  └─────────────────┘    └─────────────────┘    └────────┬────────┘         │
│                                                         │                   │
│                                                         ▼                   │
│                                               ┌─────────────────┐           │
│                                               │ 4. Deploy to    │           │
│                                               │    Production   │           │
│                                               └─────────────────┘           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🎯 Co to dělá?

Pipeline se spouští při **push do `main`** nebo **manuálně** a prochází těmito kroky:

| Krok | Job | Popis |
|------|-----|-------|
| 1 | **Lint & Type Check** | `svelte-check` - kontrola TypeScript a Svelte |
| 2 | **Build Test** | `npm run build` - ověří že aplikace jde sestavit |
| 3 | **Docker Build** | Sestaví image a pushne do GHCR (pouze main) |
| 4 | **Deploy** | SSH na VPS, pull image, restart kontejneru |

### Klíčové vlastnosti:

- ✅ **Sekvenční závislosti** - deploy pouze po úspěšných testech
- ✅ **Concurrency** - nový push zruší předchozí běžící workflow
- ✅ **Docker cache** - rychlejší build díky GitHub Actions cache
- ✅ **PR safe** - na pull request jen testy, ne deploy
- ✅ **Cleanup** - automatické mazání starých Docker images

---

## 🔧 Nastavení GitHub Secrets

Pro automatický deploy potřebuješ **3 secrets** v GitHub repository.

### Krok 1: Jdi do repository settings

1. **https://github.com/tomash-ascenta/FUTUROL-app-management**
2. Settings → Secrets and variables → Actions
3. Klikni **New repository secret**

### Krok 2: Vytvoř tyto secrets

| Secret | Hodnota |
|--------|---------|
| `VPS_HOST` | `37.46.208.167` |
| `VPS_USER` | `vpsuser` |
| `VPS_SSH_KEY` | Celý obsah SSH private key (viz níže) |

#### SSH klíč (VPS_SSH_KEY)
```bash
# Zkopíruj CELÝ obsah private key (včetně BEGIN/END)
cat ~/.ssh/futurol_deploy

# Mělo by to vypadat takto:
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
...
-----END OPENSSH PRIVATE KEY-----
```

---

## 🔓 GHCR Package Visibility

GHCR package musí být **public** aby VPS mohla stahovat bez autentizace:

1. Jdi na https://github.com/tomash-ascenta?tab=packages
2. Klikni na `app-futurol`
3. **Package settings** → **Change visibility** → **Public**

---

## 🚀 Jak to použít?

### Automatický deploy

```bash
# Lokálně commitni a pushni změny
git add .
git commit -m "feat: přidána nová funkce"
git push origin main

# 🎉 GitHub Actions automaticky:
# 1. Sestaví Docker image (na GitHub serverech)
# 2. Pushne do GHCR
# 3. SSH na VPS, pullne image, restartuje kontejner
```

### Manuální deploy (z GitHub UI)

1. Jdi na GitHub → Actions tab
2. Vyber workflow **Deploy to VPS**
3. Klikni **Run workflow**
4. Vyber branch `main`
5. Klikni **Run workflow**

---

## 📊 Monitoring deploymentů

### Zobrazení logů

```bash
# GitHub UI
GitHub → Actions → vyber konkrétní workflow run → zobraz logy

# Nebo SSH na VPS a sleduj logy
ssh vpsuser@37.46.208.167
docker compose logs -f app
```

### Status badge do README

Přidej do `README.md`:

```markdown
![CI/CD](https://github.com/tomash-ascenta/FUTUROL-app-management/actions/workflows/ci-cd.yml/badge.svg)
```

---

## 🔒 Bezpečnost

### ✅ Best Practices

- ✅ SSH klíč je uložen jako GitHub Secret (encrypted at rest)
- ✅ Private key není nikdy v repository
- ✅ Klíč je použitelný pouze pro deployment (ne root přístup)
- ✅ SSH connection je přes port 22 s klíčem (ne password)

### 🔐 Další zabezpečení (optional)

```bash
# Na VPS - omez SSH přístup jen z GitHub IP ranges
sudo nano /etc/ssh/sshd_config

# Přidej:
AllowUsers vpsuser

# Povolit pouze z GitHub Actions IPs (https://api.github.com/meta)
# Nebo použij fail2ban pro ochranu
```

---

## 🐛 Troubleshooting

### ❌ "Permission denied (publickey)"

**Problém:** SSH klíč není správně nastavený

**Řešení:**
```bash
# 1. Zkontroluj, že public key je v authorized_keys na VPS
ssh vpsuser@37.46.208.167
cat ~/.ssh/authorized_keys

# 2. Zkontroluj oprávnění
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# 3. Zkontroluj, že GitHub Secret obsahuje CELÝ private key včetně BEGIN/END
```

### ❌ "deploy.sh: command not found"

**Problém:** Deploy script není executable

**Řešení:**
```bash
ssh vpsuser@37.46.208.167
cd /home/vpsuser/app/FUTUROL-app-management
chmod +x deploy.sh
```

### ❌ "Git pull failed"

**Problém:** Git konflikty nebo změny na serveru

**Řešení:**
```bash
ssh vpsuser@37.46.208.167
cd /home/vpsuser/app/FUTUROL-app-management

# Zahoď lokální změny (POZOR!)
git reset --hard origin/main
```

### ❌ GHCR unauthorized

**Problém:** VPS nemůže stáhnout image z GHCR

**Řešení:**
```bash
# Ujisti se, že package je public:
# https://github.com/tomash-ascenta?tab=packages → app-futurol → Package settings → Public
```

### ❌ OOM při buildu (SIGKILL)

**Problém:** Pokud se někdo pokusí stavět lokálně na VPS

**Řešení:** Nikdy nestavět na VPS! Vždy použij GitHub Actions (push do main).

### ❌ Workflow se nespustil

**Problém:** Workflow není v main branch nebo je chyba v YAML

**Řešení:**
```bash
# Zkontroluj syntax YAML
cat .github/workflows/deploy.yml | yamllint

# Ujisti se, že workflow je v main branch
git checkout main
git pull
ls -la .github/workflows/
```

---

## 🎨 Customizace

### Změna trigger podmínek

```yaml
# Deploy pouze při tagu
on:
  push:
    tags:
      - 'v*.*.*'

# Deploy pouze určité soubory
on:
  push:
    branches:
      - main
    paths:
      - 'src/**'
      - 'prisma/**'
      - 'package.json'
```

### Přidání notifikací

```yaml
- name: 📧 Notify on Slack
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "❌ Deployment failed!"
      }
```

### Přidání rollback

```yaml
- name: 🔄 Rollback on failure
  if: failure()
  uses: appleboy/ssh-action@v1.0.0
  with:
    host: ${{ secrets.VPS_HOST }}
    username: ${{ secrets.VPS_USER }}
    key: ${{ secrets.VPS_SSH_KEY }}
    script: |
      cd /home/vpsuser/app/FUTUROL-app-management
      # Stáhni předchozí verzi image (pokud existuje)
      docker pull ghcr.io/tomash-ascenta/futurol-app-management:previous || true
      docker tag ghcr.io/tomash-ascenta/futurol-app-management:previous futurol-app:latest
      docker compose up -d
```

---

## 📚 Další zdroje

- GitHub Actions docs: https://docs.github.com/en/actions
- GitHub Container Registry: https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry
- SSH Action: https://github.com/appleboy/ssh-action
- Workflow syntax: https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions

---

## 📋 Workflow soubor

Aktuální workflow je v `.github/workflows/ci-cd.yml` a obsahuje:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:

# Zruší předchozí běžící workflow při novém push
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:        # 1. Lint & Type Check
  build-test:  # 2. Build Test (needs: lint)
  docker-build: # 3. Docker Build (needs: build-test, only main)
  deploy:      # 4. Deploy (needs: docker-build, only main)
```

---

**Aktualizováno:** 16. ledna 2026
