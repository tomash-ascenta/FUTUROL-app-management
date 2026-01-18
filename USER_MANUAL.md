# Uživatelská příručka

Průvodce pro zaměstnance - jak používat interní aplikaci Futurol App.

> **Software:** © Ascenta Lab | **Provozovatel:** FARDAL s.r.o. (Futurol.cz)

---

## 📋 Obsah

- [Přihlášení](#přihlášení)
- [Dashboard](#dashboard)
- [Správa zákazníků](#správa-zákazníků)
- [Správa zakázek](#správa-zakázek)
- [Zaměření pergoly](#zaměření-pergoly)
- [Servisní zásahy](#servisní-zásahy)
- [Poptávky z Rádce](#poptávky-z-rádce)
- [Můj profil](#můj-profil)
- [Často kladené otázky](#často-kladené-otázky)

---

## Přihlášení

### Jak se přihlásit

1. Otevři **https://futurol.ascentalab.cz**
2. Zadej své **4-místné osobní číslo** (např. `0001`)
3. Zadej svůj **6-místný PIN**
4. Klikni na **Přihlásit**

![Login screen](docs/screenshots/login.png)

### Testovací přístupy

| Role | Osobní číslo | PIN |
|------|--------------|-----|
| Administrátor | `0001` | `123456` |
| Ředitel | `0010` | `123456` |
| Obchodník | `0003` | `123456` |
| Zaměřovač | `0002` | `123456` |

### Problémy s přihlášením

**"Neplatné osobní číslo nebo PIN"**
- Zkontroluj, jestli máš správné osobní číslo (4 číslice)
- Ujisti se, že PIN je správný (6 číslic)
- Kontaktuj administrátora pro reset PINu

**"Příliš mnoho pokusů"**
- Počkej 15 minut
- Systém blokuje po 5 neúspěšných pokusech

**Zapomněl jsem PIN**
- Kontaktuj administrátora
- Administrátor ti nastaví nový PIN

---

## Dashboard

Po přihlášení vidíš hlavní přehled s klíčovými metrikami:

### Přehledové karty (KPI)

Na vrcholu dashboardu jsou 4 karty s klíčovými čísly:

| Karta | Co znamená |
|-------|-----------|
| **Konverze tento měsíc** | Počet leadů konvertovaných na zákazníky v aktuálním měsíci |
| **Čekající follow-upy** | Nesplněné follow-upy s datem do dneška (musíš jednat!) |
| **Podepsané smlouvy** | Zakázky ve fázi "Smlouva" - čekají na výrobu |
| **Otevřené servisy** | Servisní tikety, které je třeba vyřídit |

### Pipeline zakázek

Vizuální přehled všech aktivních zakázek podle fáze:

```
Lead → Zákazník → Nabídka → Zaměření → Smlouva → Výroba → Montáž → Předání
 (2)      (1)       (3)       (1)        (2)       (1)      (0)      (0)
```

**Co jednotlivé fáze znamenají:**
- **Lead** - nový kontakt, zatím nekomunikovaný
- **Zákazník** - kontaktovaný zákazník, čekáme na další krok
- **Nabídka** - odeslaná cenová nabídka, čekáme na rozhodnutí
- **Zaměření** - naplánované/provedené zaměření
- **Smlouva** - podepsaná smlouva, čekáme na výrobu
- **Výroba** - pergola se vyrábí
- **Montáž** - probíhá instalace u zákazníka
- **Předání** - zakázka dokončena a předána zákazníkovi

### Follow-upy

Sekce "Follow-up připomínky" zobrazuje zákazníky, které je třeba kontaktovat:

- 🔴 **Červené** - dnes nebo po termínu (urgentní!)
- 🟠 **Oranžové** - zítra
- ⚪ **Šedé** - později tento týden

**Kliknutím na zákazníka** se dostaneš do jeho detailu.

---

## Správa zákazníků

### Zobrazení zákazníků

1. V menu klikni na **Zákazníci**
2. Zobrazí se seznam všech zákazníků
3. Můžeš:
   - **Vyhledávat** (jméno, telefon, email)
   - **Řadit** (dle jména, data vytvoření)
   - **Filtrovat** (zdroj: manuální, Rádce, import)

### Vytvoření nového zákazníka

1. Klikni na **+ Nový zákazník**
2. Vyplň povinná pole:
   - **Jméno a příjmení** (např. "Jan Novák")
   - **Telefon** (např. "+420777888999")
3. Volitelně vyplň:
   - Email
   - Firma (pro B2B)
   - Poznámka
4. **Adresa realizace:**
   - Ulice a číslo
   - Město
   - PSČ
   - Země (výchozí: CZ)
   - Poznámka (např. "Vjezd ze dvora")
5. Klikni **Uložit**

### Úprava zákazníka

1. V seznamu zákazníků klikni na zákazníka
2. V detailu klikni **Upravit**
3. Uprav požadované pole
4. Klikni **Uložit změny**

### Smazání zákazníka

⚠️ **Pouze admin** může mazat zákazníky.

1. Otevři detail zákazníka
2. Klikni **Smazat zákazníka**
3. Potvrď smazání

**Poznámka:** Nelze smazat zákazníka, který má zakázky nebo servisy.

### Správa adres zákazníka

**Přidání nové adresy:**
1. Otevři detail zákazníka
2. V sekci **Adresy** klikni **+ Přidat adresu**
3. Vyplň ulici, město a PSČ
4. Klikni **Uložit**

**Editace adresy:**
1. U konkrétní adresy klikni na ikonu ✏️ (tužka)
2. Uprav požadované údaje
3. Klikni **Uložit změny**

**Poznámka:** Adresy jsou dostupné při vytváření/editaci zakázek jako místo realizace.

---

## Správa zakázek

### Vytvoření zakázky

1. V menu klikni na **Zakázky**
2. Klikni **+ Nová zakázka**
3. Vyber **zákazníka** (nebo vytvoř nového)
4. Vyber **adresu realizace**
5. Volitelně vyber **typ pergoly**
6. Nastav:
   - Prioritu (nízká, normální, vysoká, urgentní)
   - Odhadovanou cenu
   - Termín dokončení
7. Klikni **Vytvořit zakázku**

### Stavy zakázky

Zakázka prochází těmito stavy:

```
Lead (Poptávka)
  ↓
Kontaktován
  ↓
Naplánováno zaměření
  ↓
Zaměřeno ✓
  ↓
Nabídka odeslána
  ↓
Nabídka schválena
  ↓
Ve výrobě
  ↓
Vyrobeno
  ↓
Naplánována montáž
  ↓
Namontováno
  ↓
Dokončeno ✓
```

### Změna stavu zakázky

1. Otevři detail zakázky
2. Klikni na tlačítko **Upravit**
3. Změň stav, prioritu nebo jiné údaje
4. Klikni **Uložit změny**

**Historie změn** stavů se ukládá automaticky.

### Editace zakázky

1. Otevři detail zakázky
2. Klikni **Upravit** (vpravo nahoře)
3. Můžeš měnit:
   - **Stav zakázky** (lead, kontaktováno, ve výrobě...)
   - **Priorita** (nízká, normální, vysoká, urgentní)
   - **Typ pergoly** (Klasik, Horizontal, Klimo...)
   - **Místo realizace** (z adres zákazníka)
   - **Předběžná hodnota** (Kč)
   - **Konečná hodnota** (Kč)
   - **Deadline**
4. Klikni **Uložit změny**

### Filtrace zakázek

```
Filtruj dle:
• Stavu (lead, kontaktován, zaměřeno...)
• Zákazníka
• Termínu (od-do)
• Priority
```

---

## Zaměření pergoly

### Vytvoření zaměření

1. Otevři **detail zakázky**
2. Klikni **Zaměřit zakázku**
3. Projdi **7 kroků** formuláře:

#### Krok 1: Typ pergoly
- Vyber typ (HORIZONTAL, KLASIK, KLIMO, ...)

#### Krok 2: Rozměry
- **Šířka** (mm)
- **Hloubka** (mm)
- **Montážní výška** (mm)
- **Podchozí výška** (mm, volitelné)

#### Krok 3: Konstrukce
- Počet střešních profilů (2-9)
- Počet nohou (1-6)
- Délka nohou (2000-4000 mm)
- Barva konstrukce (RAL kód)
- Barva střechy (RAL kód)

#### Krok 4: Montáž
- **Typ zdiva** (cihla, beton, dřevo...)
- **Zateplení** (typ, tloušťka)
- **Kotvení** (závitové tyče, thermax...)
- **Betonové patky** (ano/ne, počet)
- **Odvod vody** (vpravo, vlevo, obojí)
- **Elektro** (přívod, příprava)

#### Krok 5: Příslušenství
- **Dálkový ovladač** (typ)
- **Motor** (IO, WT)
- **Větrný senzor** (ano/ne)
- **LED osvětlení** (typ, počet pásků)
- **Venkovní zásuvky** (počet)
- **Tahoma** (chytrá domácnost)

#### Krok 6: Screenové rolety
Pro každou pozici (přední, levá, pravá):
- Šířka (mm)
- Látka (SE6 kód)

#### Krok 7: Logistika a poznámky
- **Parkování** (přístup, vzdálenost)
- **Prostor** (pro složení materiálu)
- **Doba montáže** (odhad)
- **Terén** (standardní/nestandardní)
- **Přístup** (standardní/nestandardní)
- **Doplňující poznámky**

4. Klikni **Uložit zaměření**

### Inline editace zaměření

Po vytvoření můžeš jednotlivé položky upravovat přímo v detailu:

1. Klikni na hodnotu, kterou chceš upravit
2. Zadej novou hodnotu
3. Klikni mimo nebo stiskni Enter
4. Změna se uloží automaticky

### Export PDF protokolu

1. Otevři **detail zaměření**
2. Klikni **Stáhnout PDF**
3. PDF se automaticky vygeneruje a stáhne

**PDF obsahuje:**
- Základní údaje zákazníka
- Všechny rozměry
- Konstrukce a montáž
- Příslušenství a rolety
- Logistické poznámky
- Fotodokumentaci (pokud je)

### Odeslání protokolu emailem

> **Poznámka:** Tato funkce je dostupná pouze pro **Full licenci**.

1. Otevři **detail zaměření**
2. Klikni tlačítko **Odeslat zákazníkovi** (obálka)
3. V modalu zkontroluj/uprav **email příjemce**
4. Volitelně přidej **vlastní zprávu**
5. Klikni **Odeslat**

**Po odeslání:**
- Zobrazí se potvrzení s animací ✓
- V detailu zaměření se zobrazí info "Protokol odeslán..."
- Email obsahuje PDF protokol jako přílohu

**Zákazník obdrží:**
- Email z adresy `noreply@futurol.ascentalab.cz`
- Předmět: "Protokol zaměření | FUT-2026-XXXX | Futurol.cz"
- PDF přílohu s protokolem

### Fotodokumentace

**Připravujeme** - možnost nahrát fotky přímo z mobilního zařízení.

---

## Servisní zásahy

### Vytvoření servisního požadavku

1. V menu klikni na **Servis**
2. Klikni **+ Nový servis**
3. Vyplň:
   - **Zákazník** (povinné)
   - **Zakázka** (volitelné - pokud se týká konkrétní pergoly)
   - **Typ servisu:**
     - Záruční oprava
     - Placený servis
     - Údržba
     - Reklamace
   - **Priorita** (nízká, normální, vysoká, urgentní)
   - **Popis problému**
   - **Plánovaný termín**
4. Klikni **Vytvořit servis**

### Přiřazení technika

**Pouze admin** může přiřazovat techniky:

1. Otevři detail servisu
2. Klikni **Přiřadit technika**
3. Vyber technika ze seznamu
4. Klikni **Uložit**

### Řešení servisu (pro techniky)

1. Otevři **detail servisu**
2. Změň stav na **V řešení**
3. Po dokončení:
   - Klikni **Vyřešit servis**
   - Zadej **popis řešení**
   - Klikni **Uložit**
4. Servis se automaticky přesune do stavu **Vyřešeno**

### Stavy servisu

```
Nový
  ↓
Přiřazeno (technik)
  ↓
Naplánováno (termín)
  ↓
V řešení
  ↓
Vyřešeno ✓
  ↓
Uzavřeno
```

---

## Poptávky z Rádce

### Zobrazení poptávek

1. V menu klikni na **Poptávky**
2. Zobrazí se seznam všech poptávek z B2C Rádce
3. Každá poptávka obsahuje:
   - Jméno, telefon, email
   - Doporučený produkt
   - Odpovědi z dotazníku
   - Datum odeslání

### Statistiky

```
┌─────────────────────────────────┐
│ Nové: 8                         │
│ Rozpracované: 5                 │
│ Získané: 23                     │
│ Ztracené: 4                     │
└─────────────────────────────────┘
```

### Konverze poptávky na zákazníka

1. Otevři **detail poptávky**
2. Klikni **Vytvořit zákazníka**
3. Systém automaticky předvyplní:
   - Jméno
   - Telefon
   - Email
   - Doporučený produkt
4. Doplň chybějící údaje (adresa)
5. Klikni **Uložit**

### Změna stavu poptávky

- **Nová** → **Kontaktován** (po prvním kontaktu)
- **Kontaktován** → **Schůzka naplánována**
- **Schůzka naplánována** → **Nabídka odeslána**
- **Nabídka odeslána** → **Získáno** / **Ztraceno**

---

## Můj profil

### Změna PINu

1. V menu klikni na své jméno
2. Vyber **Můj profil**
3. Klikni **Změnit PIN**
4. Zadej:
   - Současný PIN (6 číslic)
   - Nový PIN (6 číslic)
   - Nový PIN znovu (pro potvrzení)
5. Klikni **Změnit**

**Bezpečnostní doporučení:**
- Používej unikátní PIN (ne datum narození)
- Nesdílej PIN s nikým
- Měň PIN každých 90 dní

### Odhlášení

1. V menu klikni na své jméno
2. Vyber **Odhlásit**
3. Budeš přesměrován na přihlašovací stránku

**Poznámka:** Session vyprší automaticky po 8 hodinách nečinnosti.

---

## Často kladené otázky

### Jak vytvořím zakázku pro nového zákazníka?

1. Nejprve vytvoř **nového zákazníka** (Zákazníci → + Nový)
2. Pak vytvoř **zakázku** a vyber tohoto zákazníka

Nebo přímo při vytváření zakázky klikni **+ Nový zákazník** v selectu.

### Můžu smazat zakázku?

Ne, zakázky nelze smazat. Můžeš ji pouze změnit na stav **Zrušeno**.

### Jak označím zakázku jako prioritní?

1. Otevři detail zakázky
2. Klikni na **Priorita**
3. Vyber **Vysoká** nebo **Urgentní**

### Kam se ukládají PDF protokoly?

PDF protokoly se generují automaticky při kliknutí na **Stáhnout PDF** v detailu zaměření.
Jsou uloženy na serveru v `/uploads/measurements/`.

### Můžu upravit zaměření po uložení?

Ano! Použij **inline editaci** - klikni na hodnotu, kterou chceš upravit.

### Co znamená "Soft delete"?

Když smažeš zákazníka, ve skutečnosti se jen označí jako neaktivní (`isActive=false`).
Data zůstávají v databázi pro účetní a právní účely.

### Jak dlouho platí má session?

Session platí **8 hodin** od posledního přihlášení. Pak se musíš přihlásit znovu.

### Můžu přistupovat z mobilu?

Ano! Aplikace je plně responzivní a funguje na mobilech a tabletech.

### Kde najdu audit log?

**Pouze admin** má přístup k audit logu: Dashboard → Admin → Audit logy

### Jak resetuji PIN?

Nemůžeš sám. Kontaktuj **administrátora**, který ti nastaví nový PIN.

---

## Technická podpora

### Problémy s aplikací

- **Email:** tomas@ascentalab.cz
- **Telefon:** +420 XXX XXX XXX (pracovní doba 8-17)

### Hlášení chyb

Pokud najdeš chybu:
1. Udělej screenshot problému
2. Zapiš si, co jsi dělal před chybou
3. Kontaktuj podporu s těmito informacemi

### Nápověda přímo v aplikaci

Většina stránek má ikonu **?** v pravém horním rohu - tam najdeš kontextovou nápovědu.

---

**Poslední aktualizace:** 13. ledna 2026  
**Verze:** 1.0
