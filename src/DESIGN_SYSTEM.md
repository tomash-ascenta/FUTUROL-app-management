# 🎨 Glassmorphism Design System

> Dokumentace pro vývojáře — elegantní UI komponenty s glass efektem

---

## Filozofie designu

Design je postaven na **glassmorphism** efektu — poloprůhledné komponenty s rozmazaným pozadím vytvářejí dojem skleněných karet, které "plavou" nad gradientním pozadím.

**Klíčové charakteristiky:**
- Poloprůhledná pozadí (10-18% opacity)
- Blur efekt (backdrop-filter)
- Jemné světlé bordery
- Minimální zaoblení rohů (profesionální vzhled)
- Subtle hover animace s "lift" efektem

---

## 📦 CSS Custom Properties

```css
:root {
    /* Border radius - minimální zaoblení pro profesionální vzhled */
    --radius-sm: 2px;
    --radius-md: 3px;
    --radius-lg: 4px;
    --radius-xl: 5px;
    --radius-2xl: 6px;
    --radius-full: 9999px;
    
    /* Shadows */
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
    
    /* Transitions */
    --transition-fast: 150ms ease;
    --transition-normal: 200ms ease;
    --transition-slow: 300ms ease;
    
    /* Colors */
    --success: #10b981;
    --error: #ef4444;
    --warning: #f59e0b;
}
```

---

## 🪟 Glassmorphism Base

Základní recept pro všechny glass komponenty:

```css
.glass-component {
    /* Poloprůhledné pozadí */
    background: rgba(255, 255, 255, 0.1);   /* 10-12% opacity */
    
    /* Blur efekt */
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);    /* Safari podpora */
    
    /* Jemný border pro definici */
    border: 1px solid rgba(255, 255, 255, 0.15);
    
    /* Zaoblení */
    border-radius: var(--radius-lg);  /* 4px pro karty, --radius-xl pro větší sekce */
}

/* Hover state */
.glass-component:hover {
    background: rgba(255, 255, 255, 0.18);
    border-color: rgba(255, 255, 255, 0.3);
}
```

---

## 🃏 Format Cards

Interaktivní karty pro výběr — kliknutelné, s hover/active stavy:

```css
.format-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 0.5rem;
    padding: 1rem 1.25rem;
    
    /* Glassmorphism základ */
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 4px;
    
    cursor: pointer;
    min-width: 100px;
    min-height: 80px;
    
    /* Plynulé přechody */
    transition: 
        transform 0.2s ease,
        background 0.2s ease,
        border-color 0.2s ease,
        box-shadow 0.2s ease;
}

/* Hover state — "zdvižení" karty */
.format-card:hover {
    transform: translateY(-3px);
    background: rgba(255, 255, 255, 0.18);
    border-color: rgba(255, 255, 255, 0.3);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

/* Active/click state */
.format-card:active {
    transform: translateY(-1px);
    background: rgba(255, 255, 255, 0.22);
}

/* Ikona v kartě */
.format-card .format-icon {
    width: 28px;
    height: 28px;
    color: rgba(255, 255, 255, 0.8);
    transition: color 0.2s ease, transform 0.2s ease;
}

.format-card:hover .format-icon {
    color: white;
    transform: scale(1.1);
}

/* Text v kartě */
.format-card .format-name {
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.8rem;
}

.format-card:hover .format-name {
    color: white;
}
```

### HTML struktura

```html
<div class="format-card">
    <div class="format-icon">
        <svg><!-- Icon SVG --></svg>
    </div>
    <span class="format-name">Markdown</span>
</div>
```

---

## 🔘 Upload Button (Primary CTA)

Velké elegantní tlačítko s animovaným gradient borderem:

```css
.upload-btn-elegant {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 2rem 3rem;
    
    /* Glassmorphism */
    background: rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 5px;
    
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
}

/* Animovaný gradient border - pseudo-element */
.upload-btn-elegant::before {
    content: '';
    position: absolute;
    inset: -2px;
    background: linear-gradient(135deg, 
        rgba(255, 255, 255, 0.3) 0%,
        rgba(255, 255, 255, 0.1) 50%,
        rgba(255, 255, 255, 0.3) 100%);
    border-radius: inherit;
    z-index: -1;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.upload-btn-elegant:hover::before {
    opacity: 1;
}

.upload-btn-elegant:hover {
    background: rgba(255, 255, 255, 0.18);
    transform: translateY(-2px);
    box-shadow: 
        0 12px 40px rgba(0, 0, 0, 0.15),
        0 0 0 1px rgba(255, 255, 255, 0.2);
}

.upload-btn-elegant:active {
    transform: translateY(0);
}

/* Icon container uvnitř tlačítka */
.upload-btn-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 4px;
    transition: all 0.3s ease;
}

.upload-btn-icon svg {
    width: 28px;
    height: 28px;
    color: rgba(255, 255, 255, 0.9);
    transition: transform 0.3s ease;
}

.upload-btn-elegant:hover .upload-btn-icon {
    background: rgba(255, 255, 255, 0.25);
}

.upload-btn-elegant:hover .upload-btn-icon svg {
    transform: translateY(-3px);  /* Ikona "vyskočí" nahoru */
}

/* Text */
.upload-btn-text {
    font-size: 1.1rem;
    font-weight: 600;
    color: white;
    letter-spacing: 0.02em;
}

.upload-btn-hint {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.5);
}
```

### HTML struktura

```html
<label class="upload-btn-elegant">
    <input type="file" hidden>
    <div class="upload-btn-icon">
        <svg><!-- Upload icon --></svg>
    </div>
    <span class="upload-btn-text">Upload File</span>
    <span class="upload-btn-hint">or drag & drop</span>
</label>
```

---

## ✅ Success/Download Button

Gradient CTA tlačítko pro pozitivní akce:

```css
.download-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    
    /* Gradient pozadí */
    background: linear-gradient(135deg, #10b981, #059669);
    
    color: white;
    padding: 1rem;
    border-radius: 4px;
    font-weight: 600;
    font-size: 1rem;
    text-decoration: none;
    border: none;
    cursor: pointer;
    
    transition: all 0.2s ease;
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
}

.download-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}
```

---

## 🔲 Ghost/Outline Button

Sekundární akce, transparentní pozadí:

```css
.ghost-btn {
    padding: 0.75rem 1.5rem;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    color: rgba(255, 255, 255, 0.8);
    font-weight: 500;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
}

.ghost-btn:hover {
    border-color: rgba(255, 255, 255, 0.4);
    background: rgba(255, 255, 255, 0.05);
    color: white;
}
```

---

## 📊 Progress Bar

Minimalistický progress bar s glow efektem:

```css
.progress-container {
    padding: 1.5rem;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 5px;
}

.progress-bar {
    height: 6px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 9999px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, 
        rgba(255, 255, 255, 0.6), 
        rgba(255, 255, 255, 0.9));
    width: 0%;
    transition: width 0.3s ease;
    border-radius: 9999px;
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);  /* Glow efekt */
}

.progress-text {
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 0.75rem;
}
```

---

## 📋 Glass Container/Section

Pro větší sekce a kontejnery:

```css
.glass-section {
    max-width: 420px;
    margin: 0 auto;
    text-align: center;
    background: rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    padding: 2rem 1.5rem;
    border-radius: 5px;
}

.glass-section h3 {
    font-size: 1.25rem;
    color: white;
    font-weight: 600;
    margin-bottom: 0.75rem;
}
```

---

## 🎯 Design Tokens — Quick Reference

| Token | Hodnota | Použití |
|-------|---------|---------|
| **Background opacity** | 10-12% normální, 18-22% hover | Glassmorphism základ |
| **Blur** | `20px` | Konzistentní pro všechny komponenty |
| **Border opacity** | 15-20% normální, 25-30% hover | Definice hran |
| **Border radius** | 2-6px | Profesionální, ne "bublinkový" |
| **Hover transform** | `translateY(-2px)` až `-3px` | Lift efekt |
| **Active transform** | `translateY(0)` nebo `-1px` | Stlačení |
| **Transition** | `0.2s ease` | Standardní animace |
| **Transition (smooth)** | `0.3s cubic-bezier(0.4, 0, 0.2, 1)` | Premium feel |
| **Text primary** | `white` nebo `rgba(255,255,255,0.9)` | Hlavní text |
| **Text secondary** | `rgba(255,255,255,0.5-0.7)` | Hints, popisky |

---

## 🌈 Page Background

Komponenty fungují nejlépe na tmavém gradientu:

```css
body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
    min-height: 100vh;
}

/* Jemný overlay pro lepší čitelnost */
body::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.05);
    z-index: -1;
}
```

### Alternativní gradienty

```css
/* Modrý (default) */
background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);

/* Zelený */
background: linear-gradient(135deg, #064e3b 0%, #1e3a5f 100%);

/* Fialový */
background: linear-gradient(135deg, #1e1b4b 0%, #4c1d95 100%);

/* Tmavě šedý */
background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
```

---

## 🔔 Status Icons

Ikonky pro success/error stavy:

```css
.status-icon {
    width: 56px;
    height: 56px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    margin: 0 auto 1rem;
}

/* Success */
.status-icon.success {
    background: rgba(16, 185, 129, 0.2);
    border: 2px solid rgba(16, 185, 129, 0.5);
    color: #4ade80;
}

/* Error */
.status-icon.error {
    background: rgba(239, 68, 68, 0.2);
    border: 2px solid rgba(239, 68, 68, 0.5);
    color: #f87171;
}

/* Warning */
.status-icon.warning {
    background: rgba(245, 158, 11, 0.2);
    border: 2px solid rgba(245, 158, 11, 0.5);
    color: #fbbf24;
}
```

---

## 📱 Responsive Considerations

```css
/* Mobile adjustments */
@media (max-width: 640px) {
    .format-card {
        min-width: 80px;
        padding: 0.75rem 1rem;
    }
    
    .upload-btn-elegant {
        padding: 1.5rem 2rem;
    }
    
    .glass-section {
        padding: 1.5rem 1rem;
    }
}
```

---

## ⚡ Performance Tips

1. **Backdrop-filter je náročný** — používejte jen na viditelné elementy
2. **Nepoužívejte blur na velké plochy** — může zpomalit scrollování
3. **Testujte na Safari** — `-webkit-backdrop-filter` je nutný
4. **Fallback bez blur:**
   ```css
   @supports not (backdrop-filter: blur(20px)) {
       .glass-component {
           background: rgba(30, 30, 50, 0.95);
       }
   }
   ```

---

## 🎨 Příklad kompletní komponenty

```html
<div class="glass-section">
    <div class="status-icon success">✓</div>
    <h3>Conversion Complete</h3>
    <a href="#" class="download-btn">
        <span>⬇</span>
        Download File
    </a>
    <button class="ghost-btn" style="margin-top: 1rem;">
        New Conversion
    </button>
</div>
```

---

*Design System vytvořen pro Ascenta Lab • 2026*
