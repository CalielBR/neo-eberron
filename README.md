# ⚙ Eberron Wiki — Arquivos da Casa Cannith

> Uma wiki steampunk imersiva sobre o cenário de D&D 5e de Eberron.  
> Criada para ser hospedada via **GitHub Pages** — sem backend, sem dependências.

---

## 🗺 Páginas

| Página                       | Conteúdo                                                                           |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| **O Mundo** (`#home`)        | Lore de Eberron: A Última Guerra, Casas Dracônicas, Magia & Tecnologia, Cosmologia |
| **Ilustrações** (`#gallery`) | Galeria de imagens 4K com frames em cobre                                          |
| **Localidades** (`#locs`)    | Cards das principais localidades de Khorvaire                                      |
| **Contato** (`#contact`)     | Informações de contato e sobre o projeto                                           |

---

## 🚀 Como Publicar no GitHub Pages

1. **Crie um repositório** no GitHub (ex: `eberron-wiki`)
2. **Faça upload** de todos os arquivos desta pasta
3. Vá em **Settings → Pages**
4. Em _Source_, selecione `main` branch, pasta `/ (root)`
5. Clique em **Save**
6. Seu site estará em: `https://seuusuario.github.io/eberron-wiki`

---

## 🖼 Adicionando Imagens

1. Organize suas imagens em subpastas dentro de `images/` para manter o projeto limpo:
   - `images/home/` -> Imagens da página inicial.
   - `images/gallery/` -> Ilustrações da galeria.
   - `images/map/` -> Arquivos do mapa-múndi.
   - `images/locs/` -> Imagens específicas de localidades.

2. Em `index.html`, na seção `#page-gallery`, substitua cada `.img-placeholder` por:

```html
<img src="images/gallery/nome-do-arquivo.webp" alt="Descrição da imagem" />
```

---

## ✏️ Personalizando Contatos

Edite a seção `#page-contact` em `index.html`:

- Troque `seuemail@exemplo.com` pelo seu e-mail real
- Atualize os links do GitHub, Discord e D&D Beyond

---

## 🎨 Customizando o Tema

Todas as cores estão em variáveis CSS no topo de `css/style.css`:

```css
:root {
  --parchment: #f4e8c1; /* cor do papel */
  --copper: #b87333; /* acentos de cobre */
  --gold: #c9a227; /* dourado */
  --rust: #7a3b1e; /* vermelho-ferrugem */
  --ink: #1a0f00; /* cor do texto */
}
```

---

## 📜 Licença

Projeto fan não-oficial. Todo o conteúdo do universo Eberron pertence à **Wizards of the Coast** e a **Keith Baker**.  
O código deste site é livre para uso pessoal e adaptação.

---

_"Toda engrenagem tem um propósito." — Eberron, 998 YK_
