# Efeito de Virar Folha — Header + Body + Footer

O efeito atual anima apenas `.page-section` (o conteúdo central).  
O objetivo é fazer **toda a página** — header, conteúdo e footer — virar como uma folha de livro ao trocar de aba.

---

## Estratégia

Em vez de animar elementos separados, envolve-se tudo num único container `.page-sheet` e aplica-se a animação de flip nele.  
O header e footer ficam **dentro** da folha — assim viram junto com o conteúdo.

---

## 1. Alterar o HTML — `index.html`

### Estrutura atual
```html
<div class="page-inner">
  <header class="site-header">...</header>

  <section class="page-section active" id="page-home">...</section>
  <section class="page-section" id="page-gallery">...</section>
  <!-- demais sections -->

  <footer class="site-footer">...</footer>
</div>
```

### Estrutura nova
Cada `.page-section` passa a ser um `.page-sheet` que contém o header, a section e o footer:

```html
<div class="page-inner">

  <div class="page-sheet active" id="sheet-home">
    <header class="site-header">...</header>
    <section id="page-home">...</section>
    <footer class="site-footer">...</footer>
  </div>

  <div class="page-sheet" id="sheet-gallery">
    <header class="site-header">...</header>
    <section id="page-gallery">...</section>
    <footer class="site-footer">...</footer>
  </div>

  <!-- repetir para mapa, locs, contact -->

</div>
```

> **Atenção:** o header e footer são **duplicados** em cada sheet.  
> É trabalhoso, mas garante que o flip abranja tudo.  
> Alternativa mais simples na seção 4.

---

## 2. Alterar o CSS — `style.css`

### Remover as regras antigas de `.page-section`
Apague ou substitua o bloco da seção 18 (Page Transitions):

```css
/* REMOVER */
.page-section        { display: none; opacity: 0; }
.page-section.active { display: block; opacity: 1; animation: pageEnter ...; }
.page-section.leaving { ... animation: pageLeave ...; }
@keyframes pageEnter { ... }
@keyframes pageLeave { ... }
```

### Adicionar as novas regras para `.page-sheet`

```css
/* ── PAGE SHEET — full page flip ── */

/* Container perspective — must wrap .page-inner */
.page-inner {
  perspective: 1400px;
  perspective-origin: 50% 40%;
  position: relative;    /* already set; keep it */
  overflow: hidden;      /* prevent content leaking during flip */
}

/* Each sheet stacks on top of the previous */
.page-sheet {
  display: none;
  opacity: 0;
  position: relative;
  transform-style: preserve-3d;
  backface-visibility: hidden;
  will-change: transform, opacity;
}

/* Active sheet — visible and animated in */
.page-sheet.active {
  display: block;
  opacity: 1;
  animation: sheetEnter 0.75s cubic-bezier(0.16, 1, 0.3, 1) both;
  transform-origin: left center;
}

/* Leaving sheet — pinned absolutely while it folds away */
.page-sheet.leaving {
  display: block;
  position: absolute;
  inset: 0;
  z-index: 10;
  pointer-events: none;
  animation: sheetLeave 0.6s cubic-bezier(0.7, 0, 0.84, 0) both;
  transform-origin: right center;
}

/* Incoming: unfolds from the right like a page opening */
@keyframes sheetEnter {
  0% {
    opacity: 0;
    transform: perspective(1400px) rotateY(-20deg) translateX(60px);
    filter: brightness(0.65) blur(2px);
  }
  20% { opacity: 1; }
  100% {
    opacity: 1;
    transform: perspective(1400px) rotateY(0deg) translateX(0);
    filter: brightness(1) blur(0);
  }
}

/* Outgoing: folds away to the left */
@keyframes sheetLeave {
  0% {
    opacity: 1;
    transform: perspective(1400px) rotateY(0deg) translateX(0);
    filter: brightness(1) blur(0);
  }
  100% {
    opacity: 0;
    transform: perspective(1400px) rotateY(25deg) translateX(-80px);
    filter: brightness(0.5) blur(2px);
  }
}
```

---

## 3. Alterar o JS — `main.js`

Substitua os seletores de `.page-section` por `.page-sheet`  
e mude os IDs de `page-{id}` para `sheet-{id}`:

```js
function showPage(pageId, tabEl) {
  // ANTES: document.getElementById('page-' + pageId)
  const target = document.getElementById('sheet-' + pageId);
  if (!target) return false;

  // ANTES: document.querySelector('.page-section.active')
  const current = document.querySelector('.page-sheet.active');
  if (current && current === target) return false;

  playPageSound();
  window.scrollTo({ top: 0, behavior: 'instant' });

  // Header transition: remover — o header já vira junto com o sheet
  // Apagar o bloco inteiro de step 3 (header.classList.add('page-transitioning'))

  // Outgoing sheet
  if (current) {
    current.classList.remove('active');
    current.classList.add('leaving');
    current.addEventListener('animationend', () => {
      current.classList.remove('leaving');
      current.style.opacity = '';
    }, { once: true });
  }

  // Incoming sheet
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      target.classList.add('active');
    });
  });

  // Update tabs
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  if (tabEl) tabEl.classList.add('active');

  // Update URL
  try {
    history.pushState(null, '', '#' + pageId);
  } catch (e) {
    window.location.hash = pageId;
  }

  return false;
}
```

Também atualizar `handleHash`:
```js
function handleHash() {
  const hash = window.location.hash.replace('#', '');
  const validPages = ['home', 'gallery', 'mapa', 'locs', 'contact'];
  if (hash && validPages.includes(hash)) {
    const tab = document.querySelector(`.nav-tab[data-page="${hash}"]`);
    showPage(hash, tab);
  }
}
```

E `handleMapInit` — mudar o seletor interno se necessário:
```js
// Dentro de handleMapInit, o initMap() continua igual.
// Apenas confirmar que mapViewport, mapCanvas, mapImg
// ainda têm os mesmos IDs — sim, não mudam.
```

---

## 4. Alternativa mais simples (sem duplicar header/footer)

Se não quiser duplicar o header e footer em cada sheet, a abordagem mais simples é animar **o `.page-inner` inteiro** com um fade + leve rotação no eixo Y, aplicado via classe no container pai:

```css
.page-inner.flipping {
  animation: innerFlip 0.6s cubic-bezier(0.4, 0, 0.2, 1) both;
}

@keyframes innerFlip {
  0%   { opacity: 1; transform: perspective(1200px) rotateY(0deg); }
  45%  { opacity: 0; transform: perspective(1200px) rotateY(-12deg); }
  55%  { opacity: 0; transform: perspective(1200px) rotateY(12deg); }
  100% { opacity: 1; transform: perspective(1200px) rotateY(0deg); }
}
```

No JS, dentro de `showPage()`, antes de trocar a section ativa:

```js
const inner = document.querySelector('.page-inner');

inner.classList.remove('flipping');
void inner.offsetWidth; // force reflow

// Troca de conteúdo no ponto médio da animação (quando opacity == 0)
setTimeout(() => {
  // aqui faz o swap: remove active do current, add active ao target
  if (current) {
    current.classList.remove('active');
    current.classList.add('leaving');
    // ... animationend cleanup
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { target.classList.add('active'); });
  });
}, 270); // ~45% de 600ms

inner.classList.add('flipping');
inner.addEventListener('animationend', () => {
  inner.classList.remove('flipping');
}, { once: true });
```

> **Vantagem:** zero mudança no HTML, header e footer entram no flip automaticamente.  
> **Desvantagem:** o efeito é simétrico (não é um "virar" direcional real, é um fade com leve rotação).

---

## Resumo de qual abordagem escolher

| Abordagem | Realismo do flip | Trabalho no HTML | Recomendado para |
|-----------|-----------------|-----------------|-----------------|
| `.page-sheet` por página | Alto — vira como folha real | Alto — duplicar header/footer | Projetos com header diferente por página |
| Animar `.page-inner` | Médio — flip simétrico suave | Zero | Este projeto — header/footer igual em todas as páginas |

**Para este projeto, a Alternativa 4 é a mais indicada.**  
O header e footer são idênticos em todas as abas — não há necessidade de duplicá-los. O flip no `.page-inner` produz um efeito elegante com mínima mudança de código.
