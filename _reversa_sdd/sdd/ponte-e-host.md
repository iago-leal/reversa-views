# Spec: ponte-e-host

> Selo 🟡 PLANEJADO em todos os itens. Componente 2 de 5 do `reversa-views`.

**Versão:** 1.0
**Status:** Rascunho
**Autor:** reversa-spec-sdd
**Data:** 2026-09-09
**Reviewers:** N/A

---

## 1. Resumo

🟡 O lado da extensão que roda em Node: ativa o painel na barra lateral, resolve qual raiz de
workspace observar, pede o processo à camada de leitura e o entrega à webview por um canal de
mensagens de mão dupla. Também atende o que a webview pede de volta: reler, abrir um arquivo no
editor, registrar no log. O padrão da ponte é herdado do `vscode-kanban`, onde um único módulo é a
única porta de entrada e saída, e nenhum componente chama a API do host por conta própria.

---

## 2. Contexto e Motivação

**Problema:**
🟡 A webview roda num navegador embutido e não pode tocar o disco. Tudo que ela mostra precisa
chegar por mensagem, e tudo que ela pede precisa sair por mensagem. Sem uma fronteira única, cada
componente visual acaba com o próprio `postMessage`, o protocolo se espalha por dezenas de arquivos
e deixa de ser verificável num lugar só.

Há uma exigência a mais, vinda da seção 10 do PRD: o usuário quer, no futuro, disparar agentes do
Reversa pelo painel. Um canal de mão única, que só empurra dados para a tela, teria de ser refeito
nesse dia. O canal nasce de mão dupla, ainda que a primeira versão use a volta apenas para reler
e abrir arquivo.

**Evidências:**
🟡 O `vscode-kanban` resolveu o mesmo problema com um módulo de ponte de 255 linhas, um arquivo de
mensagens tipadas e a regra de que nada fora dali chama o host. O protocolo dele ficou congelado
por compatibilidade, e a disciplina foi o que permitiu congelá-lo: só há um lugar para olhar.

**Por que agora:**
🟡 O host é o primeiro componente que toca a API do editor, e as decisões dele, sobretudo a forma
do envelope de mensagem e a política de segurança do documento, condicionam o painel inteiro. Se
forem tomadas depois, o painel é que terá de mudar.

---

## 3. Goals (Objetivos)

- [ ] G-01: 🟡 Mostrar o painel preenchido na abertura, sem comando prévio, em menos de 1 s após
  a webview sinalizar que carregou.
- [ ] G-02: 🟡 Concentrar toda troca com a webview num único módulo de ponte de cada lado, com o
  protocolo declarado em um só arquivo de tipos.
- [ ] G-03: 🟡 Tratar a ausência de workspace, a presença de várias raízes e a falha de leitura como
  estados nomeados, jamais como exceção não capturada.
- [ ] G-04: 🟡 Deixar pronto o ponto de extensão para ações de despacho, sem implementá-las, de
  modo que o botão futuro seja acréscimo de um comando ao protocolo e não reforma do canal.

**Métricas de sucesso:**

| Métrica | Baseline atual | Target | Prazo |
|---|---|---|---|
| 🟡 Tempo entre a webview sinalizar que carregou e receber o processo | 🟡 Não existe | 🟡 Abaixo de 1 s | 🟡 30 dias |
| 🟡 Módulos que chamam a API de mensagens do host fora da ponte | 🟡 Não existe | 🟡 0 | 🟡 Permanente |
| 🟡 Estados de entrada tratados por nome | 🟡 Não existe | 🟡 5 de 5 | 🟡 30 dias |

---

## 4. Non-Goals (Fora do Escopo)

- NG-01: 🟡 Despachar comando ao terminal. O protocolo prevê o lugar do comando de ação, e a
  primeira versão não o implementa.
- NG-02: 🟡 Observar o disco e reler por conta própria quando um arquivo mudar. A releitura é
  pedida pela webview ou por comando de paleta, e a observação automática fica adiada conforme a
  premissa 2 do `ideation.md`.
- NG-03: 🟡 Escrever qualquer arquivo. O host lê pela camada de leitura, abre arquivo no editor e
  nada mais.
- NG-04: 🟡 Persistir preferência do usuário além do estado que a própria webview guarda no host,
  como qual seção estava recolhida.
- NG-05: 🟡 Oferecer configuração de caminho. A raiz é sempre resolvida a partir do workspace
  aberto, e o Reversa é sempre procurado no lugar onde o framework o instala.

---

## 5. Usuários e Personas

**Usuário primário:** 🟡 O Retomador, que abre o editor depois de semanas e espera encontrar o
painel já preenchido na barra lateral, sem lembrar comando algum.

**Usuário secundário:** 🟡 O Operador, que acabou de rodar um agente no terminal e pede a
releitura para confirmar que o estágio avançou.

**Jornada atual (sem a feature):**
1. 🟡 O usuário abre os arquivos do Reversa um a um no editor.
2. 🟡 Deduz o estado de cabeça, ou roda um comando no terminal que mostra pouco.

**Jornada futura (com a feature):**
1. 🟡 O usuário abre o repositório, e o painel aparece na barra lateral já preenchido.
2. 🟡 Clica no arquivo que o painel aponta, e ele abre no editor.
3. 🟡 Depois de rodar um agente, aciona a releitura e vê o novo estado.

---

## 6. Requisitos Funcionais

### 6.1 Requisitos Principais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | 🟡 O sistema deve contribuir um contêiner de visão na barra de atividades e registrar nele um provedor de webview, de modo que o painel exista sem comando de paleta | Must | 🟡 O ícone aparece na barra de atividades após a instalação, e clicar nele abre o painel |
| RF-02 | 🟡 O sistema deve ativar-se apenas quando o contêiner de visão for aberto, e não na inicialização do editor | Must | 🟡 O evento de ativação declarado no manifesto é o da visão, e o editor não carrega a extensão antes disso |
| RF-03 | 🟡 O sistema deve resolver a raiz a observar a partir das pastas do workspace, e declarar à webview qual raiz escolheu | Must | 🟡 Com uma pasta aberta, o painel mostra o processo dela e nomeia o caminho |
| RF-04 | 🟡 O sistema deve, havendo várias raízes, escolher a primeira que contenha instalação do Reversa e informar as demais como não observadas | Must | 🟡 Com duas raízes e Reversa na segunda, o painel mostra a segunda e nomeia a primeira como ignorada |
| RF-05 | 🟡 O sistema deve enviar o processo à webview somente depois que ela sinalizar que carregou | Must | 🟡 Nenhuma mensagem de dados sai antes da mensagem de pronto chegar |
| RF-06 | 🟡 O sistema deve receber toda mensagem da webview por um único ouvinte, e rejeitar mensagem sem nome de comando reconhecido, registrando a rejeição no log | Must | 🟡 Uma mensagem com comando desconhecido gera entrada no log e nenhum efeito |
| RF-07 | 🟡 O usuário deve poder pedir releitura pela webview e por comando de paleta, e ambos os caminhos produzem o mesmo resultado | Must | 🟡 A releitura pela paleta e a pelo botão entregam o mesmo processo à webview |
| RF-08 | 🟡 O usuário deve poder abrir no editor um arquivo apontado pelo painel, e o sistema deve recusar caminho fora da raiz observada | Must | 🟡 Clicar no nome de um artefato abre o arquivo; um caminho com travessia é recusado com registro no log |
| RF-09 | 🟡 O sistema deve servir o documento da webview com política de segurança que admita script apenas por nonce, e recurso local apenas da pasta de saída da extensão | Must | 🟡 A política declarada no documento não contém origem coringa, e todo script carrega o nonce da sessão |
| RF-10 | 🟡 O sistema deve manter o contexto da webview quando ela for ocultada, para que o retorno não repita a leitura | Should | 🟡 Alternar para outra visão e voltar não dispara nova leitura |
| RF-11 | 🟡 O sistema deve expor um canal de log da webview para o canal de saída da extensão, com nome próprio | Must | 🟡 Uma mensagem de log enviada pela webview aparece no canal de saída com o nome da extensão |
| RF-12 | 🟡 O sistema deve declarar no arquivo de tipos do protocolo o comando de ação de despacho, marcado como reservado e sem tratador na primeira versão | Should | 🟡 O tipo existe no arquivo de mensagens, e enviá-lo produz rejeição registrada, não erro |
| RF-13 | 🟡 O sistema deve entregar à webview, junto com o processo, o relatório da sonda e o momento da leitura | Must | 🟡 A mensagem de dados carrega os três campos |

### 6.2 Fluxo Principal (Happy Path)

1. 🟡 O usuário clica no ícone da extensão na barra de atividades.
2. 🟡 O editor ativa a extensão e pede ao provedor que resolva a webview.
3. 🟡 O host monta o documento com nonce e política de segurança, e o entrega à webview.
4. 🟡 A webview carrega o bundle e envia a mensagem de pronto.
5. 🟡 O host resolve a raiz do workspace e chama a camada de leitura.
6. 🟡 O host envia à webview o processo, o relatório da sonda e o momento da leitura.
7. 🟡 O painel aparece preenchido.

### 6.3 Fluxos Alternativos

**Fluxo Alternativo A, releitura pedida:**
1. 🟡 A webview envia a mensagem de reler, ou o usuário aciona o comando na paleta.
2. 🟡 O host chama a camada de leitura de novo e envia o processo atualizado.

**Fluxo Alternativo B, abrir arquivo:**
1. 🟡 A webview envia a mensagem de abrir, com o caminho relativo do artefato.
2. 🟡 O host resolve o caminho dentro da raiz observada, recusa se escapar, e abre o documento no editor.

**Fluxo Alternativo C, sem workspace:**
1. 🟡 O editor foi aberto sem pasta alguma.
2. 🟡 O host envia à webview o estado de sem diretório, e nenhuma leitura é tentada.

---

## 7. Requisitos Não-Funcionais

| ID | Requisito | Valor alvo | Observação |
|----|-----------|-----------|------------|
| RNF-01 | 🟡 Latência entre pronto e dados | 🟡 Abaixo de 1 s | 🟡 Inclui a leitura do disco |
| RNF-02 | 🟡 Custo de ativação | 🟡 Zero quando o painel nunca é aberto | 🟡 Garantido pelo evento de ativação restrito à visão |
| RNF-03 | 🟡 Segurança do documento | 🟡 Script só por nonce, sem avaliação dinâmica, recurso local só da pasta de saída | 🟡 Mais restrito que a origem, que precisava de avaliação dinâmica por um componente de terceiro |
| RNF-04 | 🟡 Pontos que chamam a API de mensagens | 🟡 Exatamente um de cada lado | 🟡 Verificável por busca no código |
| RNF-05 | 🟡 Versão mínima do editor | 🟡 A que embarca o Chromium exigido pelo tema, herdada do `vscode-kanban` | 🟡 Declarada no manifesto e no alvo do empacotador |

---

## 8. Design e Interface

**Componentes afetados:** 🟡 O manifesto da extensão, o módulo de ativação, o provedor de webview,
o gerador do documento e os dois módulos de ponte, um de cada lado.

**Comportamento esperado:**
🟡 O host é silencioso. Ele não mostra notificação, não abre diálogo e não muda o foco do editor.
Toda comunicação com o usuário passa pela webview, exceto o canal de saída de log, que só quem
procurar verá.

**Estados do host:**
- 🟡 Sem diretório: o editor não tem pasta aberta. A webview recebe esse estado e nenhuma leitura ocorre.
- 🟡 Carregando: a webview sinalizou pronto e a leitura está em curso.
- 🟡 Sem Reversa: a leitura terminou e o processo veio marcado como não instalado.
- 🟡 Instalado: a leitura terminou com processo válido, degradado ou não.
- 🟡 Erro: a camada de leitura lançou, o que não deveria ocorrer, e o host capturou, registrou e
  enviou à webview o estado de erro com a mensagem.

---

## 9. Modelo de Dados

🟡 O protocolo é a única estrutura do componente, e não é persistida. O envelope segue a origem:
um nome de comando e uma carga, sem identificador de correlação e sem confirmação.

```
Envelope { command: texto, data: qualquer }

Do host para a webview:
  setProcess   { process, probe, readAt }   // o retrato completo
  setEntry     { kind, message?, root?, ignoredRoots? }  // sem-diretorio | carregando | erro

Da webview para o host:
  onLoaded     sem carga
  reload       sem carga
  openFile     { path }                     // relativo a raiz observada
  log          { message }
  dispatch     { agent }                    // RESERVADO, sem tratador na primeira versao
```

🟡 O estado que a webview guarda no host, para pintar antes da primeira resposta, limita-se a
preferências de exibição, como seções recolhidas. O processo nunca é guardado ali, para que a
tela não mostre retrato antigo como se fosse atual.

**Migrações necessárias:** 🟡 Não.

---

## 10. Integrações e Dependências

| Dependência | Tipo | Impacto se indisponível |
|-------------|------|------------------------|
| 🟡 API de extensão do editor | Obrigatória | 🟡 Sem ela não há extensão; a versão mínima é declarada no manifesto e o editor recusa instalar abaixo dela |
| 🟡 Componente `leitura-do-processo` | Obrigatória | 🟡 Se lançar, o host captura, registra e envia o estado de erro; a webview mostra a falha com nome, em vez de tela em branco |
| 🟡 Componente `painel-do-processo` | Obrigatória | 🟡 Se o bundle não carregar, a mensagem de pronto nunca chega, e o host permanece em espera sem enviar dados; o documento exibe aviso estático de falha de carregamento |
| 🟡 Rede ou serviço remoto | Nenhuma | 🟡 O host não faz requisição alguma, e portanto não há timeout nem indisponibilidade a tratar |

---

## 11. Edge Cases e Tratamento de Erros

| Cenário | Trigger | Comportamento esperado |
|---------|---------|----------------------|
| EC-01: 🟡 Editor aberto sem pasta | 🟡 Janela vazia ou arquivo solto | 🟡 O host envia o estado de sem diretório e não tenta ler |
| EC-02: 🟡 Várias raízes sem Reversa em nenhuma | 🟡 Workspace multirraiz sem instalação | 🟡 O host escolhe a primeira raiz, a leitura vem como não instalado, e as demais raízes são nomeadas como não observadas |
| EC-03: 🟡 Webview descartada e recriada pelo editor | 🟡 Memória baixa, ou recarga da janela | 🟡 A nova instância envia pronto de novo, e o host repete a leitura; nada depende de instância anterior |
| EC-04: 🟡 Mensagem malformada vinda da webview | 🟡 Defeito no bundle, ou carga sem nome de comando | 🟡 Rejeitada com entrada no log que nomeia o problema; nenhum efeito colateral |
| EC-05: 🟡 Arquivo apontado pelo painel não existe mais | 🟡 Apagado entre a leitura e o clique | 🟡 O host tenta abrir, captura a falha, registra no log e envia à webview aviso que nomeia o arquivo |
| EC-06: 🟡 Camada de leitura lança exceção | 🟡 Defeito não previsto, ou falha de permissão fora do tratamento dela | 🟡 O host captura, registra a pilha no log e envia o estado de erro com a mensagem; o painel mostra o erro e o botão de tentar de novo |
| EC-07: 🟡 Mensagem de dados enviada antes da webview estar pronta | 🟡 Leitura concluída antes do bundle carregar | 🟡 Não ocorre por construção: o host só envia após receber pronto. Se receber pronto duas vezes, envia duas vezes |
| EC-08: 🟡 Caminho de abertura com travessia de diretório | 🟡 Carga adulterada, ou defeito na webview | 🟡 Recusado antes de qualquer chamada ao editor, com registro no log |
| EC-09: 🟡 Comando reservado de despacho recebido | 🟡 Webview de versão futura, ou teste | 🟡 Rejeitado com registro no log que nomeia o comando como reservado; nenhum terminal é aberto |

---

## 12. Segurança e Privacidade

- **Autenticação:** 🟡 Não se aplica; o host roda com as permissões de quem abriu o editor.
- **Autorização:** 🟡 A webview só pode pedir ao host o que o protocolo nomeia, e o host só abre
  arquivo dentro da raiz observada. Tudo o mais é rejeitado com registro.
- **Dados sensíveis:** 🟡 O processo do Reversa atravessa o canal de mensagens dentro do próprio
  editor e não sai da máquina. O estado guardado no host não contém o processo, apenas preferências
  de exibição.
- **Auditoria:** 🟡 O canal de saída de log registra toda rejeição, toda falha capturada e todo
  caminho recusado, com nome e motivo.

---

## 13. Plano de Rollout

- **Estratégia:** 🟡 Entrega única com o painel, por VSIX local. O host não tem comportamento
  observável sem a webview, e portanto não se entrega separado.
- **Como reverter:** 🟡 Desinstalar a extensão. Nada foi escrito no workspace, nem em configuração
  do usuário além do estado interno da webview, que o editor descarta com a extensão.
- **Monitoramento pós-entrega:** 🟡 O canal de saída de log. Rejeição recorrente indica descompasso
  entre o protocolo dos dois lados; falha capturada recorrente indica defeito na camada de leitura.

---

## 14. Open Questions

| # | Pergunta | Impacto | Dono | Prazo |
|---|---------|---------|------|-------|
| OQ-01 | 🟡 Havendo várias raízes com Reversa, vale oferecer seletor no painel, ou a primeira basta até que o caso apareça de verdade? | Médio | 🟡 iago | 🟡 Quando o caso ocorrer |
| OQ-02 | 🟡 O painel deve viver num contêiner próprio na barra de atividades, ou dentro do explorador, como visão adicional? | Médio | 🟡 iago | 🟡 Antes do primeiro protótipo |
| OQ-03 | 🟡 O comando de paleta para reler deve existir na primeira versão, ou o botão da webview basta? | Baixo | 🟡 iago | 🟡 Antes do primeiro protótipo |

---

## 15. Decisões Tomadas (Decision Log)

| Decisão | Alternativas consideradas | Racional |
|---------|--------------------------|---------|
| 🟡 Provedor de webview em contêiner de visão, e não painel de editor | 🟡 Painel de editor aberto por comando, como a origem faz | 🟡 A persona primária não lembra comando; a barra lateral é o lugar onde se olha sem procurar |
| 🟡 Canal de mão dupla desde a primeira versão | 🟡 Mão única, com o host empurrando dados | 🟡 O botão de despacho futuro exigiria refazer o canal; a volta já é usada para reler e abrir arquivo |
| 🟡 Envelope sem identificador de correlação | 🟡 Requisição e resposta com identificador | 🟡 Herdado da origem, onde funcionou por anos; a primeira versão tem uma única resposta possível para cada pedido |
| 🟡 Política de segurança sem avaliação dinâmica | 🟡 Herdar a política da origem, que a admite | 🟡 A origem precisava dela por um editor de código de terceiro; aqui nenhuma dependência a exige |
| 🟡 Processo nunca guardado no estado da webview | 🟡 Guardar para pintar de imediato ao voltar | 🟡 Retrato antigo pintado como atual contraria o objetivo do painel; o custo de reler é menor que o de enganar |

---

## Apêndice

### Referências
- 🟡 `_reversa_sdd/prd.md`, seções 4, 6, 8 e 10
- 🟡 `_reversa_sdd/sdd/leitura-do-processo.md`
- 🟡 Origem da ponte: `~/dev/vscode-kanban/src/webview/bridge/` e `src/html.ts`

### Histórico de Revisões

| Versão | Data | Autor | Mudanças |
|--------|------|-------|---------|
| 1.0 | 2026-09-09 | reversa-spec-sdd | Criação inicial |

---

## Relatório de avaliação (spec_scorer.py)

```
============================================================
  SPEC QUALITY REPORT
  Arquivo: /Users/iagoleal/dev/reversa-views/_reversa_sdd/sdd/ponte-e-host.md
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
