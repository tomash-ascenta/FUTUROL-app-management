# Security Policy

## Přehled zabezpečení

FUTUROL je interní firemní aplikace přístupná přes veřejnou URL. Tento dokument popisuje bezpečnostní opatření a postupy.

## Architektura zabezpečení

### 🔐 Autentizace

| Mechanismus | Implementace |
|-------------|--------------|
| Session management | SvelteKit cookies (HttpOnly, Secure) |
| Password hashing | bcrypt (cost factor 10) |
| Session expiry | Automatické po neaktivitě |
| Login throttling | Rate limiting na API |

### 🛡️ Autorizace

```
Uživatel → Role → Oprávnění → Přístup k datům
```

**Role v systému:**
- `ADMIN` - Plný přístup, správa uživatelů
- `MANAGER` - Správa zakázek a klientů
- `TECHNICIAN` - Práce s přiřazenými zakázkami
- `VIEWER` - Pouze čtení

### 🌐 Síťové zabezpečení

- **HTTPS only** - Veškerá komunikace šifrována (Let's Encrypt)
- **Nginx reverse proxy** - Aplikace není přímo vystavena
- **Docker isolation** - Kontejnerizace služeb
- **Firewall** - Pouze porty 22, 80, 443
- **Security headers** (aktivní na serveru):
  - `X-Frame-Options: SAMEORIGIN` - ochrana proti clickjacking
  - `X-Content-Type-Options: nosniff` - MIME sniffing ochrana
  - `X-XSS-Protection: 1; mode=block` - XSS filtr
  - `Referrer-Policy: strict-origin-when-cross-origin`

### 🚦 Rate Limiting

- **Login endpoint** (`/api/auth/login`) chráněn rate limiting
- Max 5 pokusů za 15 minut na IP adresu
- Max 5 pokusů za 15 minut na osobní číslo
- Automatický 15minutový blok po překročení

## Bezpečnostní praktiky v kódu

### Server-side validace

```typescript
// ✅ Správně - validace na serveru
export const actions = {
  create: async ({ request, locals }) => {
    if (!locals.user) throw redirect(303, '/login');
    
    const data = await request.formData();
    const validated = schema.parse(data); // Zod validace
    // ...
  }
};
```

### SQL Injection ochrana

```typescript
// ✅ Správně - Prisma ORM s parametrizovanými dotazy
const user = await prisma.user.findUnique({
  where: { email: userInput }
});

// ❌ Nikdy - raw SQL s interpolací
// db.query(`SELECT * FROM users WHERE email = '${userInput}'`)
```

### XSS ochrana

- Svelte automaticky escapuje HTML výstup
- CSP headers nastaveny v Nginx
- Žádné `{@html}` bez sanitizace

### CSRF ochrana

- SvelteKit form actions mají built-in CSRF ochranu
- Same-site cookies

## Citlivá data

### Uložení

| Data | Úložiště | Ochrana |
|------|----------|---------|
| Hesla | PostgreSQL | bcrypt hash |
| Session | Cookie | HttpOnly, Secure, SameSite |
| API keys | .env | Není v gitu |
| Uploads | /uploads | Mimo webroot |

### Soubory NIKDY v gitu

```gitignore
.env
.env.local
*.pem
*.key
uploads/
node_modules/
.DS_Store
```

---

## Data Protection & Privacy

### GDPR Compliance

**Futurol App zpracovává osobní údaje zákazníků:**

| Typ dat | Účel | Právní základ |
|---------|------|---------------|
| Jméno, telefon, email | Správa zakázek | Plnění smlouvy |
| Adresa realizace | Zaměření a montáž | Plnění smlouvy |
| Historie objednávek | Zákaznický servis | Oprávněný zájem |
| GPS koordináty | Navigace technika | Oprávněný zájem |

### Data Retention

| Typ dat | Doba uchovávání |
|---------|-----------------|
| Zákaznická data | 10 let (účetní zákon) |
| Zakázky | 10 let |
| Zaměření | Trvale (pro servis) |
| Audit logy | 2 roky |
| Leady (nekonvertované) | 1 rok |

### Práva subjektů údajů

```typescript
// Right to access - GET /api/customers/:id/gdpr-export
// Right to rectification - PUT /api/customers/:id
// Right to erasure - DELETE /api/customers/:id (soft delete)
// Right to data portability - JSON/PDF export
```

**Implementace:**
```bash
# Export všech dat zákazníka
GET /api/customers/:id/export
# Vrátí JSON se všemi zakázkami, zaměřeními, servisy

# Anonymizace (místo delete)
PATCH /api/customers/:id/anonymize
# Nahradí osobní údaje generickými hodnotami
```

### Data Encryption

| Data | At Rest | In Transit |
|------|---------|------------|
| Databáze | PostgreSQL default | TLS/SSL |
| Uploads | Filesystem | HTTPS |
| Cookies | N/A | HttpOnly + Secure |
| API komunikace | N/A | HTTPS only |

**Možné vylepšení:**
- [ ] Encrypt citlivá pole v DB (Prisma middleware)
- [ ] E2E encryption pro fotky z měření
- [ ] Backup encryption

---

## Penetration Testing

### Self-Assessment Checklist

**Authentication:**
- [x] Brute force ochrana (rate limiting)
- [x] Silné hashování (bcrypt cost 10)
- [x] Session expiry (8h)
- [ ] Two-factor authentication (budoucí)
- [x] Password complexity rules (6-digit PIN)

**Authorization:**
- [x] Role-based access control
- [x] Server-side ověření
- [x] Horizontal access control (user může vidět jen svá data)
- [x] Vertical access control (role omezení)

**Input Validation:**
- [x] Zod schema validation
- [x] SQL injection ochrana (Prisma)
- [x] XSS ochrana (Svelte auto-escape)
- [x] CSRF ochrana (SvelteKit built-in)
- [ ] File upload validation (budoucí - MIME type check)

**Data Protection:**
- [x] HTTPS only
- [x] Secure cookies
- [x] Security headers
- [ ] Content Security Policy (doporučeno přidat)
- [x] No sensitive data in URLs

### Recommended External Testing

**Nástroje:**
```bash
# OWASP ZAP - automatický scan
zap-cli quick-scan https://futurol.ascentalab.cz

# SQLMap - SQL injection test
sqlmap -u "https://futurol.ascentalab.cz/api/customers" --cookie="auth_token=..."

# Nikto - web server scan
nikto -h https://futurol.ascentalab.cz
```

**Profesionální penetrační test:**
- Doporučeno: 1x ročně
- Focus: Authentication, Authorization, Data leakage
- Budget: 50 000 - 150 000 Kč

---

## Backup & Disaster Recovery

### Backup Strategy

**Databáze:**
```bash
# Denní automatický backup (cron)
0 2 * * * /home/vpsuser/backup_db.sh

# Uchovávání:
- Denní backupy: 7 dní
- Týdenní backupy: 4 týdny
- Měsíční backupy: 12 měsíců
```

**Application Code:**
```bash
# Git repository - automaticky zálohováno na GitHub
# Lokální backup config:
tar -czf config_backup.tar.gz .env futurol-nginx.conf radce-nginx.conf
```

**Uploads:**
```bash
# Týdenní backup uploads složky
# Sync na external storage (Google Drive, S3)
rclone sync /home/vpsuser/app/FUTUROL-app-management/uploads gdrive:futurol-uploads
```

### Recovery Procedures

**RTO (Recovery Time Objective):** 4 hodiny  
**RPO (Recovery Point Objective):** 24 hodin (denní backup)

**Disaster Recovery Plan:**

1. **Database corruption:**
   ```bash
   # Stop app
   docker compose stop app
   
   # Restore from latest backup
   gunzip -c latest_backup.sql.gz | docker exec -i futurol-db psql -U futurol futurol
   
   # Verify data integrity
   docker exec futurol-db psql -U futurol -c "SELECT COUNT(*) FROM customers;"
   
   # Restart app
   docker compose start app
   ```

2. **Server compromise:**
   ```bash
   # Rebuild server from scratch
   # Restore code from Git
   # Restore DB from off-site backup
   # Rotate all secrets (JWT, DB passwords)
   # Audit access logs
   ```

3. **Accidental data deletion:**
   ```bash
   # Soft delete umožňuje recovery
   UPDATE customers SET isActive = true WHERE id = 'uuid';
   
   # Nebo restore z backup na určitý timestamp
   ```

---

## Secure Development Lifecycle

### Code Review Checklist

**Před merge do main:**
- [ ] Žádné hardcoded credentials
- [ ] Všechny API endpoints mají autorizaci
- [ ] User input je validovaný (Zod schema)
- [ ] Citlivé operace logují do AuditLog
- [ ] Chybové zprávy neodhalují interní detaily
- [ ] Dependency vulnerabilities opraveny (`npm audit`)

### Secrets Management

**DO:**
- ✅ Používej .env pro lokální dev
- ✅ Používej environment variables v Docker
- ✅ Rotuj secrets každých 90 dní
- ✅ Používej silné random hodnoty (`openssl rand -base64 32`)

**DON'T:**
- ❌ Necommituj .env do Gitu
- ❌ Nesdílej production secrets v Slack/Email
- ❌ Nepoužívej stejné secrets pro dev/prod
- ❌ Neloguj sensitive data

### Security Training

**Povinné pro všechny vývojáře:**
- OWASP Top 10 (https://owasp.org/www-project-top-ten/)
- Secure coding best practices
- GDPR základy

---

## Compliance & Audit Trail

### Audit Logging

**Co logujeme:**
```typescript
AuditLog {
  action: 'LOGIN' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT'
  entityType: 'Customer' | 'Order' | 'Measurement'
  entityId: uuid
  employeeId: uuid
  oldValue: json
  newValue: json
  ipAddress: string
  createdAt: datetime
}
```

**Implementace:**
```typescript
// Middleware pro auto-logging
await db.auditLog.create({
  data: {
    action: 'UPDATE',
    entityType: 'Customer',
    entityId: customer.id,
    employeeId: locals.user.employeeId,
    oldValue: oldCustomer,
    newValue: updatedCustomer,
    ipAddress: event.request.headers.get('x-forwarded-for')
  }
});
```

**Retention:**
- Audit logy: 2 roky
- Login attempts: 30 dní
- Access logs (Nginx): 90 dní

---

## Hlášení bezpečnostních problémů

### Postup

1. **NEHLASTE** bezpečnostní problémy přes veřejné GitHub Issues
2. Kontaktujte přímo: **security@futurol.cz** nebo **tomas@ascentalab.cz**
3. Popište problém s co nejvíce detaily
4. Vyčkejte na potvrzení (do 48 hodin)

### Co hlásit

- Autentizační/autorizační bypassy
- SQL injection, XSS, CSRF zranitelnosti
- Únik citlivých dat
- Privilege escalation
- Neautorizovaný přístup k datům jiných uživatelů

### Co NEHLÁSIT

- Spam přes kontaktní formuláře (nemáme)
- Denial of Service (interní app)
- Brute force bez rate limiting bypass

## Bezpečnostní checklist pro vývoj

### Před každým deployem

- [ ] Žádné hardcoded credentials v kódu
- [ ] Všechny user inputy validovány
- [ ] Autorizace kontrolována na server-side
- [ ] Citlivé operace logované
- [ ] Dependencies aktualizovány (`npm audit`)

### Pravidelně (měsíčně)

- [ ] `npm audit` a oprava vulnerabilit
- [ ] Review access logů
- [ ] Kontrola neaktivních uživatelských účtů
- [ ] Zálohy databáze funkční

## Závislosti a aktualizace

### Kontrola zranitelností

```bash
# Lokálně
npm audit

# Automatická oprava
npm audit fix

# Pouze produkční závislosti
npm audit --production
```

### Kritické balíčky

| Balíček | Účel | Důležitost |
|---------|------|------------|
| @prisma/client | DB přístup | Kritická |
| bcrypt | Hashování hesel | Kritická |
| svelte | Frontend | Vysoká |

## Incident Response

### Při podezření na breach

1. **Izolace** - Okamžitě odpojit aplikaci
   ```bash
   ssh vpsuser@37.46.208.167 "cd /home/vpsuser/app/FUTUROL-app-management && docker compose stop app"
   ```

2. **Dokumentace** - Zaznamenat čas, příznaky, postižené systémy

3. **Analýza** - Kontrola logů
   ```bash
   docker compose logs app --since 24h > incident_logs.txt
   ```

4. **Oprava** - Identifikace a oprava zranitelnosti

5. **Obnovení** - Po ověření nasadit opravenou verzi

6. **Post-mortem** - Dokumentace incidentu a preventivních opatření

## Kontakty

| Role | Kontakt |
|------|---------|
| Security lead | tomas@ascentalab.cz |
| DevOps | vpsuser@37.46.208.167 |
| Emergency | +420 XXX XXX XXX |

---

*Poslední aktualizace: Leden 2026*
*Verze: 1.0*
