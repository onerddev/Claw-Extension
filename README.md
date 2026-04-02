


<div align="center">
  <img height="400" src="https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/dark/claude-color.png"  />
</div>

###

<h1 align="center">Claw Extension by Emanuel Felipe</h1>

###

<div>
  <img style="100%" src="https://capsule-render.vercel.app/api?type=waving&height=100&section=header&reversal=false&fontSize=70&fontAlign=50&fontAlignY=50&stroke=-&animation=twinkling&descSize=20&descAlign=50&descAlignY=50&color=gradient"  />
</div>

###

<h3 align="center">Oque é o Claw?</h3>

###

<h6 align="left">A extensão é um assistente inteligente para navegador que utiliza inteligência artificial para automatizar tarefas e interagir com páginas da web. Ela permite que o usuário execute ações por meio de comandos simples, como pesquisar conteúdos, reproduzir mídias ou preencher informações automaticamente.<br><br>Seu principal diferencial é a capacidade de entender a intenção do usuário e transformá-la em ações reais dentro do navegador, tornando a navegação mais rápida e eficiente. Além disso, oferece recursos como tradução, resumo de conteúdo e integração com diferentes plataformas.<br><br>Com isso, a extensão aumenta a produtividade, reduz tarefas repetitivas e transforma o navegador em um ambiente mais inteligente e automatizado.</h6>

###

<h3 align="center">Funções do Claw</h3>

###

<p align="left">O Claw é uma extensão avançada para navegador que utiliza inteligência artificial para automatizar tarefas e interagir diretamente com páginas da web. Seu núcleo é um agente de IA integrado ao navegador, capaz de compreender comandos em linguagem natural e executá-los por meio de ações reais, como navegação, cliques, digitação e manipulação de elementos da página.<br><br>O sistema de navegação permite abrir e controlar abas, acessar URLs, recarregar páginas, navegar no histórico e realizar rolagens precisas. Já a interação com elementos possibilita clicar, digitar, selecionar opções, preencher formulários completos, utilizar atalhos de teclado e executar ações avançadas em qualquer interface web.<br><br>A extensão também possui recursos de leitura e análise de páginas, como extração de texto, links, imagens, tabelas e inputs, além de fornecer informações estruturadas sobre o conteúdo. É possível ainda manipular o DOM com funcionalidades como injeção de CSS e JavaScript, captura de tela e espera inteligente por elementos.<br><br>O Claw conta com um chat flutuante integrado, que permite interação contínua com a IA em qualquer site, além de comandos por voz e texto com reconhecimento rápido de intenções. O sistema inclui um modo de estudo, capaz de gerar resumos, perguntas, pontos-chave e destacar palavras complexas com definições automáticas.<br><br>Entre as integrações específicas, destacam-se os bots para Kahoot e StopotS. No Kahoot, a extensão detecta perguntas automaticamente, utiliza IA para sugerir respostas, realiza preenchimento automático em questões abertas, oferece tradução e exibe estatísticas de desempenho. No StopotS, identifica letras e categorias e gera respostas automaticamente, preenchendo os campos do jogo.<br><br>A extensão também inclui um tradutor integrado, ferramentas de explicação de texto selecionado, análise de produtividade, sistema de estatísticas, memória persistente de contexto e preferências, além de um sistema anti-detecção que simula comportamento humano.<br><br>Outro diferencial é o sistema de plugins por site, com integrações para plataformas como YouTube, Gmail, WhatsApp Web e Google Docs. Essas integrações permitem resumir vídeos, sugerir respostas de e-mail, melhorar mensagens, analisar documentos e executar ações específicas dentro de cada ambiente.<br><br>A arquitetura é modular e escalável, com execução em segundo plano por meio de um service worker, integração com múltiplos modelos de IA e suporte a diferentes tipos de processamento, como tradução, visão e raciocínio.<br><br>Em síntese, o Claw transforma o navegador em um ambiente inteligente e automatizado, permitindo que o usuário delegue tarefas complexas à inteligência artificial, aumentando a produtividade e simplificando a interação com a web.</p>

###

<h3 align="center">API Key</h3>

###

<h5 align="center">API Key da Groq na extensão Claw <br><br>Onde conseguir a API Key: Acesse console.groq.com Crie uma conta ou faça login Vá em API Keys no menu lateral Clique em "Create API Key" Copie a chave gerada (começa com gsk_...) Onde aplicar nos arquivos: A chave é usada no arquivo ai_agent.js, na constante GROQ_API_KEY (linha ~1), que faz as chamadas para https://api.groq.com/openai/v1/chat/completions. Essa mesma chave é compartilhada por todos os módulos que usam IA:  Arquivo	Função ai_agent.js	Agente principal (navegação, cliques, leitura) kahoot.js	Bot do Kahoot (busca respostas) stopots.js	Bot do StopotS (preenche categorias) study_mode.js	Modo estudo (resumos, questões) page_tools.js	Resumo de páginas e seleções translator.js	Traduções com Llama 4 background.js	Chamadas centralizadas via chrome.runtime Todos esses arquivos referenciam a mesma API key — ela é definida uma vez e propagada via background.js ou diretamente nos content scripts.  ⚠️ Dica de segurança: Nunca compartilhe sua chave publicamente. A Groq oferece um plano gratuito com limites generosos de requisições por minuto.</h5>

###

<div align="center">
</div>

###

<h3 align="center">Official WebSite</h3>

###

<p align="center">https://clawchrome.lovable.app</p>

###
