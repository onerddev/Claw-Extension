<div align="center">

# ✦ Claw

**Extensão Chrome com IA para Kahoot, StopotS e mais**

![Version](https://img.shields.io/badge/versão-10.0-d4a85a?style=flat-square)
![Manifest](https://img.shields.io/badge/manifest-v3-5a9e6f?style=flat-square)
![Model](https://img.shields.io/badge/IA-Groq%20·%20llama--3.3--70b-6b6b6b?style=flat-square)
![License](https://img.shields.io/badge/licença-MIT-48484d?style=flat-square)

</div>

---

## O que é

Claw é uma extensão Chrome que usa IA (Groq + Llama 3.3) para responder automaticamente perguntas do **Kahoot** e preencher categorias do **StopotS**, com tradutor universal integrado e interface no estilo Claude.

---

## Funcionalidades

### 🎮 Kahoot
- Detecta a pergunta em tempo real com sistema de seletores em 3 camadas
- Consulta o Groq e **destaca** a resposta correta com outline branco
- Apaga as alternativas erradas (13% de opacidade)
- Suporte a múltipla escolha, verdadeiro/falso e questões dissertativas
- Overlay discreto no canto da tela com status em tempo real

### 🛑 StopotS
- Detecta a **letra sorteada** automaticamente com 12 seletores + fallback por tamanho de fonte
- Expande **120+ abreviações** (PCH, FDS, MSÉ, CEP, JLR, PDA, MST, SNB...)
- Preenche todos os inputs com o trick correto do Angular (`nativeInputValueSetter` + evento `input` com `bubbles: true`)
- **Cache turbo** — salva respostas geradas e responde offline instantaneamente na próxima vez
- Clica no botão STOP automaticamente após preencher tudo

### 🌐 Tradutor universal
- Selecione qualquer texto em qualquer página e um tooltip com a tradução aparece
- Tradução manual pelo popup
- Auto-traduz perguntas do Kahoot quando estão em inglês, espanhol, etc.
- Suporte: Inglês · Espanhol · Francês · Alemão · Italiano · Japonês · Chinês · Coreano · Árabe · Russo

### ⚙️ Configurações

| Funcionalidade | Descrição |
|---|---|
| **Delay humano** | Slider 0–8s de espera antes de agir. Simula tempo de leitura. |
| **Modo stealth** | `Alt+H` oculta/mostra o overlay instantaneamente |
| **Modo professor** | Erra de propósito 1 a cada X perguntas (configurável 3–10) |
| **Cache turbo** | StopotS offline quando já conhece a letra + categoria |

### 📊 Estatísticas
- Contador de perguntas respondidas (hoje e total)
- Histórico das últimas 100 interações com data e hora
- Painel de cache com contador e botão de limpeza

---

## Instalação

### Requisitos
- Google Chrome ou qualquer navegador baseado em Chromium
- Modo Desenvolvedor habilitado em `chrome://extensions`

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/onerddev/Claw.git
```

2. Abra o Chrome e acesse `chrome://extensions`
3. Ative o **Modo Desenvolvedor** no canto superior direito
4. Clique em **"Carregar sem compactação"** e selecione a pasta clonada
5. O ícone aparece na barra do Chrome — pronto!

> **Chromebook da escola:** se o Modo Desenvolvedor estiver bloqueado pelo administrador, a única forma é publicar na Chrome Web Store ($5 taxa única).

---

## Como usar

**Kahoot**
1. Abra uma sessão do Kahoot no Chrome
2. Clique no ícone do Claw e ative o toggle do Kahoot
3. Entre no quiz — a extensão detecta e destaca automaticamente

**StopotS**
1. Abra o StopotS no Chrome
2. Ative o toggle do StopotS no popup
3. Quando a rodada começar, a extensão preenche e clica STOP sozinha

**Tradutor**
1. Ative o Tradutor universal no popup
2. Selecione qualquer texto em qualquer site
3. Tooltip com a tradução em PT-BR aparece imediatamente

---

## Estrutura do projeto

```
Claw/
├── manifest.json       # Configuração MV3
├── popup.html          # Interface do popup (página única, sem abas)
├── popup.js            # Lógica dos toggles, chat e tradutor
├── kahoot.js           # Content script — Kahoot
├── stopots.js          # Content script — StopotS
├── translator.js       # Content script — Tradutor universal
├── stats.js            # Estatísticas e cache (localStorage)
├── claude-icon.png     # Ícone principal (estrela do Claude)
├── mascot.png          # Mascote
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## Stack

| Componente | Tecnologia |
|---|---|
| Plataforma | Chrome Extension · Manifest V3 |
| IA (texto) | Groq API · `llama-3.3-70b-versatile` |
| IA (visão) | Groq API · `meta-llama/llama-4-scout-17b-16e-instruct` |
| Storage | `chrome.storage.sync` + `chrome.storage.local` |
| UI | HTML · CSS · JS puro · Inter (Google Fonts) |
| Cache | localStorage · limite de 2000 entradas |

---

## API Key do Groq

A chave está embutida em `kahoot.js`, `stopots.js` e `translator.js`. Para usar a sua própria:

1. Acesse [console.groq.com](https://console.groq.com) e crie uma conta gratuita
2. Gere uma nova API Key
3. Substitua `GROQ_KEY` nos três arquivos:

```js
const GROQ_KEY = 'gsk_sua_chave_aqui';
```

> O tier gratuito do Groq é suficiente para uso diário — sem custo.

---

## Como a detecção funciona

### Kahoot — 3 camadas de seletores

O Kahoot atualiza seus seletores CSS com frequência. O Claw usa fallback em cascata:

```
1. data-functional-selector="question-title"   ← mais estável
2. [class*="QuestionTitle"]                    ← fragmento de classe
3. aria-label nos botões                       ← último recurso
```

### StopotS — trick do Angular

O StopotS usa two-way binding com Angular. Para o valor ser detectado corretamente:

```js
// Sem isso, o Angular ignora a mudança
const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
setter.call(el, value);
el.dispatchEvent(new Event('input', { bubbles: true }));
el.dispatchEvent(new Event('change', { bubbles: true }));
```

### Cache turbo — chave composta

```js
// Chave: "letra|categoria" normalizada
const key = (letter + '|' + cat).toLowerCase();
// Na segunda vez que a letra B aparece com "PCH" → resposta instantânea
```

---

## Changelog

### v10.0 — atual
- Cache turbo para StopotS com resposta offline instantânea
- Estatísticas locais com histórico das últimas 100 interações
- Delay humano configurável (0–8s)
- Modo stealth (`Alt+H`)
- Modo professor com frequência de erro configurável
- Interface completamente redesenhada — página única sem abas
- Ícones SVG únicos por funcionalidade
- Ícone do Claude em todos os tamanhos da extensão

### v9.0
- StopotS reescrito do zero — sem bugs de IDs duplicados
- `setState(cls, msg)` corrigido (className em vez de dataset.state)
- Overlay com IDs únicos sem colisão com o Kahoot

### v8.0
- Animações: shimmer no loading, fadeUp nas páginas, pulse nos dots
- Toggle com spring animation (`cubic-bezier(.34,1.56,.64,1)`)
- Dot de status global no header com estado ao vivo

### v7.0
- Sistema de detecção em 3 camadas para o Kahoot
- Overlay redesenhado com header separado
- Re-leitura da tela antes de responder (mais preciso)

### v2.0
- Tradutor universal com tooltip ao selecionar texto
- Chat com visão (Llama 4 Scout) para análise de prints

### v1.0
- Kahoot e StopotS funcionais
- Chat com IA no popup

---

## Licença

MIT — use, modifique e distribua à vontade.

---

<div align="center">
  <sub>Feito com Groq · Llama 3.3 · Chrome MV3</sub>
</div>
