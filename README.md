# Claw

> Extensão Chrome com IA para responder Kahoot, StopotS e muito mais — alimentada por Groq + Llama.

<br/>

## O que é

Claw é uma extensão Chrome que usa inteligência artificial para te ajudar em jogos de quiz online. Ela detecta automaticamente perguntas e categorias, consulta um modelo de linguagem e exibe a resposta em tempo real — com interface limpa no estilo Claude.

<br/>

## Funcionalidades

###  Kahoot
- Detecta a pergunta automaticamente usando múltiplas camadas de seletores CSS
- Consulta o Groq (Llama 3.3 70b) e identifica a resposta correta
- Destaca a alternativa certa com borda branca e apaga as erradas
- Overlay discreto no canto da tela com status em tempo real

### StopotS
- Detecta a letra sorteada e todas as categorias da rodada
- Expande abreviações brasileiras (MSÉ, PCH, FDS, JLR, PDA, CEP...)
- Preenche todos os inputs usando o trick correto do Angular (nativeInputValueSetter)
- Cache turbo: responde offline e instantaneamente quando já conhece a letra

### 🌐 Tradutor universal
- Selecione qualquer texto em qualquer página → aparece tooltip com tradução PT-BR
- Auto-traduz perguntas do Kahoot quando estão em outro idioma
- Caixa de tradução manual direto no popup
- Suporte a 9 idiomas + detecção automática

###  Configurações
- **Delay humano** — slider de 0 a 8s para simular tempo de leitura
- **Modo stealth** — `Alt+H` oculta o overlay completamente
- **Modo professor** — erra de propósito 1 a cada N perguntas
- **Cache turbo** — respostas salvas localmente por letra/categoria

###  Estatísticas
- Contador de perguntas respondidas hoje e no total
- Histórico das últimas 100 perguntas com respostas
- Entradas de cache do StopotS com opção de limpar

###  Chat com IA
- Converse com o Llama 3.3 70b direto do popup
- Mande um print de qualquer questão → análise por visão (Llama 4 Scout)
- Útil para questões dissertativas ou quando a extensão não detecta

<br/>

## Tecnologias

| Componente | Tecnologia |
|---|---|
| Modelo de texto | `llama-3.3-70b-versatile` via Groq |
| Modelo de visão | `meta-llama/llama-4-scout-17b-16e-instruct` via Groq |
| Extensão | Chrome Manifest V3 |
| Interface | HTML + CSS + Inter font |
| Cache | `chrome.storage.local` |
| Configurações | `chrome.storage.sync` |

<br/>

## Estrutura de arquivos

```
claw/
├── manifest.json       # Manifest V3 com permissões e content scripts
├── popup.html          # Interface principal da extensão
├── popup.js            # Lógica do popup (toggles, chat, tradutor)
├── kahoot.js           # Content script do Kahoot
├── stopots.js          # Content script do StopotS
├── translator.js       # Content script do tradutor universal
├── stats.js            # Gerenciamento de estatísticas e cache
├── claude-icon.png     # Ícone da extensão (estrela laranja do Claude)
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

<br/>

## Instalação

A extensão não está publicada na Chrome Web Store. Para instalar em modo desenvolvedor:

**1. Baixe o código**
```bash
git clone https://github.com/onerddev/Claw-Extension.git
```

**2. Abra o Chrome e acesse**
```
chrome://extensions/
```

**3. Ative o modo desenvolvedor**

Clique no toggle "Modo do desenvolvedor" no canto superior direito.

**4. Carregue a extensão**

Clique em "Carregar sem compactação" e selecione a pasta do projeto.

**5. Pronto**

O ícone da estrela laranja vai aparecer na barra do Chrome.

> **Chromebook da escola:** Se o modo desenvolvedor estiver bloqueado pelo administrador, não é possível instalar extensões não-oficiais. A solução é publicar na Chrome Web Store ($5 única vez).

<br/>

## Como usar

### Kahoot
1. Abra o Kahoot e entre no jogo
2. Clique no ícone do Claw e ative o toggle **Kahoot**
3. O overlay aparece no canto da tela
4. Quando a pergunta aparecer, o Claw destaca automaticamente a resposta certa

### StopotS
1. Abra o StopotS e entre em uma sala
2. Ative o toggle **StopotS** no popup
3. Quando a rodada começar e a letra for sorteada, o Claw preenche tudo
4. O botão STOP é clicado automaticamente

### Tradutor
1. Ative o toggle **Tradutor**
2. Selecione qualquer texto em qualquer site
3. O tooltip de tradução aparece automaticamente

<br/>

## API Key Groq

A extensão usa a API do Groq para processar as perguntas. O Groq oferece um tier gratuito generoso.

Para trocar a API key, edite a constante `GROQ_KEY` nos arquivos `kahoot.js`, `stopots.js`, `translator.js` e `popup.js`.

Crie sua chave em: [console.groq.com](https://console.groq.com)

<br/>

## Abreviações suportadas no StopotS

O Claw reconhece e expande automaticamente as abreviações mais usadas no StopotS brasileiro:

| Abreviação | Categoria completa |
|---|---|
| PCH / P.C.H | Parte do Corpo Humano |
| CEP / C.E.P | Cidade, Estado ou País |
| FDS / F.D.S | Filme, Desenho ou Série |
| JLR / J.L.R | Jornal, Livro ou Revista |
| PDA / P.D.A | Personagem de Desenho Animado |
| MSÉ / MSE | Adjetivo que descreve uma pessoa |
| MST | Objeto ou coisa material |
| SNB | Bebida |
| MME | Marca famosa |

E mais de 100 outras categorias reconhecidas automaticamente.

<br/>

## Overlay do Kahoot

O overlay no canto da tela mostra:

- **Mascote** + badge identificando o jogo
- **Ponto de status** — âmbar (processando), verde (respondido), vermelho (erro)
- **Texto de status** com a resposta encontrada
- **Barra de progresso** durante o carregamento
- **Botão "Analisar agora"** para forçar nova análise
- **Atalho Alt+H** para ocultar quando em modo stealth

<br/>

## Limitações conhecidas

- O Kahoot atualiza os seletores CSS frequentemente — se parar de detectar, use o botão "Analisar agora"
- O StopotS usa Angular com two-way binding — o trick do `nativeInputValueSetter` pode não funcionar em versões futuras do StopotS
- O Groq tem limite de requisições no tier gratuito (muito generoso para uso normal)
- A extensão não funciona em abas incógnito por padrão (é possível habilitar nas configurações do Chrome)

<br/>

## Versão

**v10** — Interface redesenhada, cache turbo, estatísticas, histórico, modo stealth, modo professor, delay humano configurável.

<br/>

## Licença

MIT — Não copie ou faça igual por favor empatia!
