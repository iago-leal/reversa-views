# Spec: empacotamento-e-verificacao

> Selo 🟡 PLANEJADO em todos os itens. Componente 5 de 5 do `reversa-views`.

**Versão:** 1.0
**Status:** Rascunho
**Autor:** reversa-spec-sdd
**Data:** 2026-09-09
**Reviewers:** N/A

---

## 1. Resumo

🟡 Como o código vira extensão instalada, e como se verifica que a tela está certa antes disso.
Duas unidades de compilação, uma para o host em Node e outra para a webview em navegador, um
comando de build que produz as duas, um comando que gera o VSIX, e um preview que serve a webview
num navegador comum, com host fingido, para que defeito visual apareça numa captura de tela e não
no editor do usuário. Tudo herdado do `vscode-kanban`, onde cada peça existe por um defeito que
passou por suíte verde.

---

## 2. Contexto e Motivação

**Problema:**
🟡 Extensão de editor com webview tem dois alvos de execução que não se misturam: o host roda em
Node com a API do editor, a webview roda num Chromium embutido sem Node algum. Um único
compilador com uma única configuração aceita importação cruzada que só falha em tempo de execução,
e falha dentro do editor do usuário.

O segundo problema é que tela errada não falha teste. O `vscode-kanban` registrou três defeitos
que passaram por suíte verde e só apareceram numa captura: coluna esmagada a 28 px, quadro servido
sem sistema de desenho, e quadro que perdeu o sentido das cores. Cada vez, a solução foi o mesmo
harness improvisado, reconstruído e descartado. O preview é esse harness, mantido.

**Evidências:**
🟡 O `vscode-kanban` tem `tsconfig.json` para o host e `tsconfig.webview.json` para a webview, esta
com verificação estrita e sem emissão, porque o empacotador é quem emite. O alvo do empacotador é
fixado no Chromium 108, que é o que o Electron da versão mínima do editor embarca. O preview aceita
workspace, tema e porta como argumentos e declara na tela o que não consegue simular.

**Por que agora:**
🟡 O build é pré-condição de qualquer teste no editor, e o preview é pré-condição de qualquer
entrega. Sem os dois, o painel só pode ser verificado instalando no editor a cada mudança.

---

## 3. Goals (Objetivos)

- [ ] G-01: 🟡 Produzir a extensão completa com um comando, em menos de 30 s a partir do zero.
- [ ] G-02: 🟡 Impedir, em tempo de compilação, que a webview importe módulo de Node ou que o host
  importe módulo de navegador.
- [ ] G-03: 🟡 Gerar VSIX instalável que não carregue nada além do necessário, com as pastas do
  Reversa, o código-fonte e os testes excluídos por lista explícita.
- [ ] G-04: 🟡 Servir a webview num navegador comum, com host fingido, a partir de qualquer
  workspace da máquina, para verificação visual dos sete estados da tela.

**Métricas de sucesso:**

| Métrica | Baseline atual | Target | Prazo |
|---|---|---|---|
| 🟡 Tempo do build completo a partir do zero | 🟡 Não existe | 🟡 Abaixo de 30 s | 🟡 30 dias |
| 🟡 Tamanho do bundle da webview | 🟡 Não existe | 🟡 Abaixo de 400 KB | 🟡 30 dias |
| 🟡 Tamanho do VSIX | 🟡 Não existe | 🟡 Abaixo de 2 MB | 🟡 30 dias |
| 🟡 Estados da tela verificáveis no preview sem o editor | 🟡 0 de 7 | 🟡 7 de 7 | 🟡 30 dias |

---

## 4. Non-Goals (Fora do Escopo)

- NG-01: 🟡 Publicar no Marketplace. O VSIX é instalado localmente; publisher, ícone de loja e
  changelog público ficam adiados conforme o PRD.
- NG-02: 🟡 Integração contínua. O build e a suíte rodam na máquina do mantenedor; nenhum serviço
  remoto executa nada.
- NG-03: 🟡 Teste de ponta a ponta com o editor real. O `vscode-kanban` tem esse harness, e ele é
  caro de manter; a primeira versão verifica a webview pelo preview e o host por teste de unidade
  com a API do editor simulada.
- NG-04: 🟡 Assinar o VSIX. Instalação local não exige assinatura.
- NG-05: 🟡 Minificar o host. Só a webview é empacotada e minificada; o host é compilado como está.

---

## 5. Usuários e Personas

**Usuário primário:** 🟡 O mantenedor no papel de quem constrói: roda o build, olha o preview,
gera o VSIX e instala.

**Usuário secundário:** 🟡 O Retomador, que volta depois de meses, clona e precisa que o build
funcione de primeira, sem passo esquecido.

**Jornada atual (sem a feature):**
1. 🟡 Não há como transformar o código em extensão nem verificar a tela sem o editor.

**Jornada futura (com a feature):**
1. 🟡 O usuário roda o build e obtém host e webview compilados.
2. 🟡 Roda o preview contra um workspace real e confere a tela nos sete estados.
3. 🟡 Gera o VSIX, instala no editor e abre o painel.

---

## 6. Requisitos Funcionais

### 6.1 Requisitos Principais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | 🟡 O sistema deve compilar o host e a webview como unidades separadas, cada uma com a própria configuração de compilador, e a da webview sem tipos de Node | Must | 🟡 Uma importação de módulo de Node dentro da webview falha na verificação de tipos |
| RF-02 | 🟡 O sistema deve empacotar a webview com alvo fixado no Chromium que o Electron da versão mínima do editor embarca, e declarar essa versão no manifesto da extensão | Must | 🟡 O alvo do empacotador e a versão mínima do manifesto apontam para o mesmo Electron |
| RF-03 | 🟡 O sistema deve oferecer um único comando de build que limpa a saída, compila o host, empacota a webview e copia os recursos estáticos | Must | 🟡 O comando produz a pasta de saída completa a partir de um clone limpo |
| RF-04 | 🟡 O sistema deve oferecer um comando de empacotamento que gera o VSIX, e uma lista de exclusão que deixa fora as pastas do Reversa, o código-fonte, os testes, a cobertura e os scripts de desenvolvimento | Must | 🟡 Listar o conteúdo do VSIX não mostra nenhuma dessas pastas |
| RF-05 | 🟡 O sistema deve oferecer um preview que serve o bundle da webview num navegador comum, com host fingido, lendo o processo de um workspace passado por argumento | Must | 🟡 Apontar o preview para este repositório mostra o painel com o processo real dele |
| RF-06 | 🟡 O preview deve aceitar o tema como argumento, entre claro, escuro e os dois de alto contraste, escrevendo no corpo do documento a classe que o editor escreveria | Must | 🟡 Cada um dos quatro temas repinta o painel |
| RF-07 | 🟡 O preview deve aceitar um estado de entrada forçado como argumento, para exibir as telas de sem diretório, sem Reversa e erro sem depender de workspace que as produza | Must | 🟡 Os sete estados da spec do painel são alcançáveis por argumento |
| RF-08 | 🟡 O preview deve declarar na própria tela que é preview e não o editor, e listar o que não simula | Must | 🟡 Uma faixa fixa no topo do navegador nomeia o preview e seus limites |
| RF-09 | 🟡 O sistema deve oferecer um comando de teste que roda as suítes herdadas do modelo e da sonda, as funções de decisão do painel e o host com a API do editor simulada | Must | 🟡 Um único comando roda tudo e falha se qualquer parte falhar |
| RF-10 | 🟡 O sistema deve oferecer um comando de verificação de tipos da webview separado do build, para uso durante o desenvolvimento | Should | 🟡 O comando roda em menos de 10 s e não emite arquivo |
| RF-11 | 🟡 O sistema deve incluir a configuração de depuração que abre o editor de desenvolvimento com a extensão carregada a partir da pasta de saída | Should | 🟡 A configuração existe e aponta para a pasta de saída do build |
| RF-12 | 🟡 O sistema deve falhar o build quando o bundle da webview exceder o teto de tamanho | Should | 🟡 Um bundle acima do teto interrompe o build com o tamanho medido e o teto |
| RF-13 | 🟡 O sistema deve oferecer modo de observação que reempacota a webview a cada alteração, com mapa de fontes embutido | Could | 🟡 Alterar um arquivo da webview reempacota sem reiniciar o comando |

### 6.2 Fluxo Principal (Happy Path)

1. 🟡 O usuário clona o repositório e instala as dependências.
2. 🟡 Roda o comando de build, que produz host e webview na pasta de saída.
3. 🟡 Roda a suíte de testes, que passa.
4. 🟡 Roda o preview contra um workspace com Reversa e confere a tela.
5. 🟡 Roda o comando de empacotamento, que gera o VSIX.
6. 🟡 Instala o VSIX no editor e abre o painel.

### 6.3 Fluxos Alternativos

**Fluxo Alternativo A, desenvolvimento da webview:**
1. 🟡 O usuário roda o modo de observação e o preview ao mesmo tempo.
2. 🟡 Altera um componente, e o navegador mostra a alteração após recarregar.

**Fluxo Alternativo B, bundle acima do teto:**
1. 🟡 Uma dependência nova infla o bundle.
2. 🟡 O build para com o tamanho medido e o teto, antes de gerar VSIX.

---

## 7. Requisitos Não-Funcionais

| ID | Requisito | Valor alvo | Observação |
|----|-----------|-----------|------------|
| RNF-01 | 🟡 Tempo do build completo | 🟡 Abaixo de 30 s | 🟡 Do zero, com dependências já instaladas |
| RNF-02 | 🟡 Tamanho do bundle da webview | 🟡 Abaixo de 400 KB | 🟡 Alcançado cortando os tokens do tema aos que a interface nomeia |
| RNF-03 | 🟡 Tamanho do VSIX | 🟡 Abaixo de 2 MB | 🟡 O do `vscode-kanban` tem 14 MB por carregar um editor de código de terceiro; este não o carrega |
| RNF-04 | 🟡 Ferramentas exigidas | 🟡 Node e o gerenciador de pacotes; tudo o mais vem como dependência de desenvolvimento | 🟡 Nenhuma instalação global |
| RNF-05 | 🟡 Reprodutibilidade | 🟡 Arquivo de trava de dependências versionado | 🟡 O clone de daqui a um ano instala as mesmas versões |

---

## 8. Design e Interface

**Componentes afetados:** 🟡 As duas configurações de compilador, o script de empacotamento da
webview, a lista de exclusão do VSIX, o script do preview e sua pasta de apoio, a configuração de
depuração, e os comandos declarados no manifesto do pacote.

**Comportamento esperado:**
🟡 Todo comando é declarado no manifesto do pacote e nomeado pelo que faz. Toda falha para com a
causa e o que fazer, nunca com pilha de exceção crua. O preview é uma página só, sem instalação,
que abre no navegador padrão.

**Estados do preview:**
- 🟡 Servindo: a página carrega o bundle real, com o processo lido do workspace informado.
- 🟡 Estado forçado: a página mostra a tela de entrada pedida por argumento, sem ler workspace.
- 🟡 Bundle ausente: o preview recusa iniciar e diz para rodar o build antes.
- 🟡 Workspace sem Reversa: a página mostra a tela de sem Reversa, que é o comportamento esperado do painel.

---

## 9. Modelo de Dados

🟡 Nenhuma estrutura persistida. O preview mantém em memória o processo lido, e o host fingido
responde às mensagens da ponte com esse processo. A configuração do preview é lida da linha de comando:

```
ArgumentosDoPreview {
  workspace: caminho, por padrao o proprio repositorio
  tema: claro | escuro | claro-alto-contraste | escuro-alto-contraste
  estado: nenhum | sem-diretorio | sem-reversa | erro
  porta: numero
  semBuild: booleano
}
```

**Migrações necessárias:** 🟡 Não.

---

## 10. Integrações e Dependências

| Dependência | Tipo | Impacto se indisponível |
|-------------|------|------------------------|
| 🟡 Compilador TypeScript | Obrigatória | 🟡 Sem ele não há build; vem como dependência de desenvolvimento e o arquivo de trava fixa a versão |
| 🟡 Empacotador esbuild | Obrigatória | 🟡 Mesmo regime |
| 🟡 Ferramenta de empacotamento de extensão | Obrigatória para gerar VSIX | 🟡 Ausente: o comando falha com a instrução de instalar como dependência de desenvolvimento; build e preview seguem funcionando |
| 🟡 Navegador na máquina | Obrigatória para o preview | 🟡 Ausente: o preview serve na porta e imprime o endereço, sem abrir nada |
| 🟡 Componentes `leitura-do-processo` e `painel-do-processo` | Obrigatórias | 🟡 O preview usa a leitura real e o painel real; se um deles falhar, a falha aparece na página com nome |
| 🟡 Rede ou serviço remoto | Nenhuma em build e teste | 🟡 A instalação de dependências toca a rede uma vez; depois disso nada mais, e não há timeout nem indisponibilidade a tratar |

---

## 11. Edge Cases e Tratamento de Erros

| Cenário | Trigger | Comportamento esperado |
|---------|---------|----------------------|
| EC-01: 🟡 Ferramenta de VSIX ausente | 🟡 Dependência não instalada | 🟡 O comando de empacotamento para com a instrução de instalação; nenhum arquivo parcial é deixado |
| EC-02: 🟡 VSIX contendo pasta indevida | 🟡 Lista de exclusão desatualizada | 🟡 O comando de empacotamento lista o conteúdo ao final, e o README instrui a conferir; a verificação automática é questão aberta |
| EC-03: 🟡 Bundle acima do teto | 🟡 Dependência nova ou tokens de tema não cortados | 🟡 O build para com o tamanho e o teto, antes do VSIX |
| EC-04: 🟡 Preview sem bundle construído | 🟡 Clone recém-feito | 🟡 O preview recusa iniciar e diz para rodar o build, a menos que o argumento de sem build tenha sido passado por engano, caso em que diz isso |
| EC-05: 🟡 Porta do preview ocupada | 🟡 Outro preview aberto | 🟡 O preview para com a porta ocupada e sugere o argumento de porta |
| EC-06: 🟡 Versão do editor abaixo da mínima | 🟡 Editor desatualizado | 🟡 O editor recusa instalar o VSIX pela versão declarada no manifesto; a extensão nunca chega a rodar num Chromium mais velho que o alvo |
| EC-07: 🟡 Build parcial | 🟡 Host compila e a webview falha | 🟡 O comando para na primeira falha e não copia recursos; a pasta de saída fica incompleta e o VSIX não é gerado |
| EC-08: 🟡 Workspace do preview sem permissão de leitura | 🟡 Pasta protegida | 🟡 A leitura degrada como no editor, e a página mostra o painel com as anomalias correspondentes |
| EC-09: 🟡 Dependências instaladas com arquivo de trava ignorado | 🟡 Instalação sem o arquivo de trava | 🟡 O README instrui a instalação limpa pelo arquivo de trava; a verificação do arquivo é questão aberta |

---

## 12. Segurança e Privacidade

- **Autenticação:** 🟡 Não se aplica.
- **Autorização:** 🟡 O preview serve apenas na interface local da máquina e recusa conexão de
  outra origem. Lê o workspace informado com as permissões do usuário e não escreve nada.
- **Dados sensíveis:** 🟡 O preview mostra o processo do Reversa do workspace informado, no
  navegador do próprio usuário. Não há persistência nem envio.
- **Auditoria:** 🟡 O log do preview no terminal registra o workspace lido, o tema e o estado forçado.

---

## 13. Plano de Rollout

- **Estratégia:** 🟡 O build entra antes de qualquer componente ser escrito, porque é como se
  verifica que eles compilam. O preview entra junto com o painel. O empacotamento entra por último,
  quando houver algo a instalar.
- **Como reverter:** 🟡 Desinstalar o VSIX do editor. O build e o preview não deixam nada fora do
  repositório além da pasta de saída, ignorada pelo git.
- **Monitoramento pós-entrega:** 🟡 O tamanho do bundle e do VSIX a cada empacotamento, impressos ao
  final do comando, comparados aos tetos.

---

## 14. Open Questions

| # | Pergunta | Impacto | Dono | Prazo |
|---|---------|---------|------|-------|
| OQ-01 | 🟡 O conteúdo do VSIX deve ser verificado automaticamente contra a lista de exclusão, falhando o empacotamento se uma pasta indevida entrar? | Médio | 🟡 iago | 🟡 Antes do primeiro empacotamento |
| OQ-02 | 🟡 O preview deve recarregar o navegador sozinho quando o bundle mudar, ou o recarregamento manual basta? | Baixo | 🟡 iago | 🟡 Após uso real |
| OQ-03 | 🟡 O corte de tokens de tema deve ser herdado tal como está, ou o painel usa tão poucos tokens que uma lista fixa basta? | Baixo | 🟡 iago | 🟡 Antes do primeiro build |

---

## 15. Decisões Tomadas (Decision Log)

| Decisão | Alternativas consideradas | Racional |
|---------|--------------------------|---------|
| 🟡 Duas unidades de compilação | 🟡 Uma configuração para tudo | 🟡 Importação cruzada entre Node e navegador só falha em tempo de execução, dentro do editor do usuário; a separação a torna erro de compilação |
| 🟡 Preview fora do editor desde a primeira versão | 🟡 Verificar só instalando no editor | 🟡 Três defeitos do `vscode-kanban` passaram por suíte verde e só apareceram em captura; o preview é o harness que os pegou, mantido |
| 🟡 Estado de entrada forçado por argumento | 🟡 Criar workspaces de fixtura para cada estado | 🟡 Sem diretório e erro não têm workspace que os produza; o argumento cobre os sete estados sem fixtura |
| 🟡 VSIX local sem publicação | 🟡 Marketplace | 🟡 Registrado no PRD; sem publisher, sem compromisso de suporte, e o desenho não impede publicar depois |
| 🟡 Sem teste de ponta a ponta com o editor real | 🟡 Herdar o harness do `vscode-kanban` | 🟡 Caro de manter, e a primeira versão tem pouco comportamento no host além de ler e repassar; teste de unidade com API simulada basta até que o botão de despacho exista |
| 🟡 Alvo do empacotador fixado no Chromium do Electron | 🟡 Alvo genérico moderno | 🟡 Sintaxe mais nova que o Chromium embarcado quebra em tempo de execução sem erro de build; o alvo explícito converte isso em erro de compilação |

---

## Apêndice

### Referências
- 🟡 `_reversa_sdd/prd.md`, seções 5, 6 e 7
- 🟡 `_reversa_sdd/sdd/painel-do-processo.md`, seção 8, para os sete estados
- 🟡 Origem: `~/dev/vscode-kanban/tsconfig.webview.json`, `scripts/build-webview.js`, `scripts/preview.js`, `.vscodeignore`

### Histórico de Revisões

| Versão | Data | Autor | Mudanças |
|--------|------|-------|---------|
| 1.0 | 2026-09-09 | reversa-spec-sdd | Criação inicial |

---

## Relatório de avaliação (spec_scorer.py)

```
============================================================
  SPEC QUALITY REPORT
  Arquivo: /Users/iagoleal/dev/reversa-views/_reversa_sdd/sdd/empacotamento-e-verificacao.md
============================================================

  SCORE TOTAL: 100.0/100  —  ⭐ Excelente — Pronta para implementação

  BREAKDOWN POR DIMENSÃO:
  Dimensão             Score      Peso     Contribuição
  --------------------------------------------------
  Completude           100%       30%     30.0/pt
  Testabilidade        100%       25%     25.0/pt
  Clareza              100%       20%     20.0/pt
  Escopo               100%       15%     15.0/pt
  Edge Cases           100%       10%     10.0/pt

  ✅ PONTOS FORTES:
     ✅ Seção 1 (Resumo) presente e preenchida
     ✅ Seção 2 (Contexto) presente e preenchida
     ✅ Seção 3 (Goals) presente e preenchida
     ✅ Seção 4 (Non-Goals) presente e preenchida
     ✅ Seção 5 (Usuários) presente e preenchida

============================================================
```

Iterações: 1 (100)
