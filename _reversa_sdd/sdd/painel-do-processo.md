# Spec: painel-do-processo

> Selo 🟡 PLANEJADO em todos os itens. Componente 3 de 5 do `reversa-views`.

**Versão:** 1.0
**Status:** Rascunho
**Autor:** reversa-spec-sdd
**Data:** 2026-09-09
**Reviewers:** N/A

---

## 1. Resumo

🟡 A tela. Recebe o processo tipado pela ponte e o desenha na barra lateral do editor: seis eixos
na primeira versão, cinco estados de entrada, e uma ordem de leitura ditada pela persona primária,
que precisa saber onde está antes de saber qualquer outra coisa. Toda decisão de apresentação vive
em função pura, fora dos componentes visuais, para ser testável sem navegador, no mesmo corte que
o `scrum-harness` e o `vscode-kanban` já praticam.

---

## 2. Contexto e Motivação

**Problema:**
🟡 O processo do Reversa chega como estrutura com oito eixos, dezenas de campos e uma lista de
anomalias. Despejar tudo na tela produz um painel denso que ninguém lê, e a persona primária, que
volta depois de semanas, precisa de orientação e não de inventário. A ordem, a ênfase e a omissão
são o produto; os dados já existem.

O segundo problema é a confiança. Um painel que mostra o estado errado é pior que painel nenhum,
porque o usuário age sobre ele. Por isso o diagnóstico entra na primeira versão: anomalias,
recusas da sonda e a versão do modelo herdado ficam visíveis, e o painel declara quando degradou.

**Evidências:**
🟡 A seção equivalente do `scrum-harness` tem 394 linhas de componente e 150 de decisões puras, e
já exibe os oito eixos. O que muda aqui é a seleção de seis e a ordem, guiadas pela métrica de
sucesso do PRD: retomar um projeto parado há 30 dias e saber o próximo passo sem abrir arquivo.

**Por que agora:**
🟡 O painel é o único componente que o usuário vê, e é onde a métrica de sucesso se mede. Os outros
quatro existem para que este funcione.

---

## 3. Goals (Objetivos)

- [ ] G-01: 🟡 Responder em uma dobra de tela, sem rolagem, as três perguntas do Retomador: em que
  fase está a descoberta, em que estágio está a feature ativa, e o que aguarda decisão humana.
- [ ] G-02: 🟡 Nomear todo estado de entrada e todo estado degradado, de modo que nenhuma situação
  produza tela em branco ou tela que pareça íntegra sem ser.
- [ ] G-03: 🟡 Manter toda decisão de apresentação em função pura, com cobertura de teste de 100%
  nessas funções, e nenhuma regra dentro de componente visual.
- [ ] G-04: 🟡 Seguir o tema do editor, incluindo alto contraste, sem paleta própria.

**Métricas de sucesso:**

| Métrica | Baseline atual | Target | Prazo |
|---|---|---|---|
| 🟡 Perguntas do Retomador respondidas sem rolagem, em painel de 320 px de largura | 🟡 0 de 3 | 🟡 3 de 3 | 🟡 30 dias |
| 🟡 Cobertura de teste das funções de decisão de apresentação | 🟡 Não existe | 🟡 100% de linhas | 🟡 30 dias |
| 🟡 Regras de apresentação encontradas dentro de componente visual | 🟡 Não existe | 🟡 0 | 🟡 Permanente |

---

## 4. Non-Goals (Fora do Escopo)

- NG-01: 🟡 Os eixos de impacto no legado, regressão vigiada, migração, ideação e trilha de
  execução. O processo os traz, e a tela não os desenha na primeira versão.
- NG-02: 🟡 Renderizar o conteúdo dos artefatos do Reversa. O painel aponta o arquivo e o editor o
  abre; nenhum Markdown é interpretado dentro da webview.
- NG-03: 🟡 Atualização automática. A tela mostra o momento da leitura e oferece o botão de reler;
  não consulta o disco por conta própria.
- NG-04: 🟡 Botão de disparar agente. O lugar dele fica previsto no cabeçalho, e a primeira versão
  não o desenha.
- NG-05: 🟡 Paleta de cores própria ou fonte própria. Tudo vem dos tokens do tema do editor.

---

## 5. Usuários e Personas

**Usuário primário:** 🟡 O Retomador, que olha o painel uma vez, no início de uma sessão depois de
semanas, e precisa sair dele sabendo o que fazer.

**Usuário secundário:** 🟡 O Operador, que olha o painel várias vezes na mesma sessão, sempre para
confirmar que um estágio avançou, e para quem o botão de reler e a contagem de ações são o que importa.

**Jornada atual (sem a feature):**
1. 🟡 O usuário abre o arquivo de estado e lê três campos que podem discordar entre si.
2. 🟡 Abre a pasta da feature e deduz o estágio pelos arquivos presentes.
3. 🟡 Não descobre que a entrega não convergiu, porque nada anuncia isso.

**Jornada futura (com a feature):**
1. 🟡 O usuário abre a barra lateral e vê o cabeçalho com projeto, fase e feature ativa.
2. 🟡 Vê a faixa de bloqueio humano, se houver, no topo.
3. 🟡 Clica no artefato apontado e retoma o trabalho.

---

## 6. Requisitos Funcionais

### 6.1 Requisitos Principais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | 🟡 O sistema deve desenhar tela distinta para cada um dos cinco estados de entrada: sem diretório, carregando, sem Reversa, instalado e erro | Must | 🟡 Cada estado tem título próprio, e nenhum deles é tela vazia |
| RF-02 | 🟡 O sistema deve exibir no cabeçalho o nome do projeto, a versão do Reversa lida, a raiz observada, o momento da leitura e o botão de reler | Must | 🟡 Os cinco itens estão presentes com processo instalado |
| RF-03 | 🟡 O sistema deve exibir uma faixa de bloqueio humano acima de todo o resto quando houver entrega não convergida, migração aguardando ou decisões pendentes, nomeando cada razão | Must | 🟡 Uma feature com todas as ações fechadas e sem adendo produz a faixa com a razão nomeada e o comando sugerido |
| RF-04 | 🟡 O sistema deve desenhar as cinco fases da descoberta na ordem do framework, com status visual distinto para concluída, corrente e pendente | Must | 🟡 As cinco aparecem sempre, mesmo com estado vazio, e a corrente é distinguível sem cor |
| RF-05 | 🟡 O sistema deve listar os checkpoints por agente, distinguindo o que ainda corre do que concluiu, com a data de conclusão quando houver | Must | 🟡 Um checkpoint sem data de conclusão aparece como em andamento |
| RF-06 | 🟡 O sistema deve exibir o ciclo forward com o estágio nomeado em linguagem legível, a feature ativa, a contagem de ações fechadas, abertas e emendas, o número de dúvidas, as features pausadas e o adendo | Must | 🟡 Cada um dos sete itens aparece, ou é declarado ausente por nome |
| RF-07 | 🟡 O sistema deve exibir a política de escrita no legado com o veredito vigente e as pastas em que o Reversa pode escrever | Must | 🟡 Com a política travada, o painel diz que a edição do legado está desligada e lista as pastas próprias |
| RF-08 | 🟡 O sistema deve listar toda anomalia com arquivo, código e detalhe, e declarar no cabeçalho quando a leitura degradou | Must | 🟡 Um processo com uma anomalia mostra a lista e o aviso no cabeçalho; com zero, mostra que a leitura foi íntegra |
| RF-09 | 🟡 O sistema deve exibir o relatório da sonda: as pastas lidas, os caminhos recusados e os arquivos truncados | Must | 🟡 Uma recusa aparece com o caminho e o motivo |
| RF-10 | 🟡 O usuário deve poder clicar no nome de um artefato e tê-lo aberto no editor, por mensagem à ponte | Must | 🟡 O clique envia a mensagem de abrir com o caminho relativo, e nenhum componente chama o host diretamente |
| RF-11 | 🟡 O sistema deve seguir o tema do editor, incluindo os dois de alto contraste, lendo a classe que o editor escreve no corpo do documento | Must | 🟡 Trocar o tema do editor repinta o painel sem releitura |
| RF-12 | 🟡 O usuário deve poder recolher e expandir cada seção, e o sistema deve guardar essa preferência no estado da webview | Should | 🟡 Recolher uma seção, ocultar o painel e voltar mantém a seção recolhida |
| RF-13 | 🟡 O sistema deve implementar toda decisão de apresentação em funções puras separadas dos componentes visuais, incluindo o estado de entrada, as razões de bloqueio, o rótulo de estágio e a ordem das seções | Must | 🟡 As funções são importáveis e testáveis sem navegador, e os componentes só as chamam |
| RF-14 | 🟡 O sistema deve ordenar as seções assim: faixa de bloqueio, ciclo forward, descoberta, política, anomalias, relatório da sonda | Must | 🟡 A ordem no documento renderizado corresponde à declarada |
| RF-15 | 🟡 O sistema deve reservar no cabeçalho o espaço da ação de despacho, sem desenhar botão, de modo que a inclusão futura não desloque os demais itens | Could | 🟡 A estrutura do cabeçalho tem o lugar nomeado e vazio |

### 6.2 Fluxo Principal (Happy Path)

1. 🟡 A webview carrega e envia à ponte a mensagem de pronto.
2. 🟡 A ponte entrega o processo, o relatório da sonda e o momento da leitura.
3. 🟡 A função de estado de entrada decide que o processo está instalado.
4. 🟡 A função de bloqueio humano lista as razões, e a faixa aparece se houver alguma.
5. 🟡 As seções são desenhadas na ordem declarada, com o tema do editor.
6. 🟡 O usuário lê o cabeçalho e a faixa, e sabe o próximo passo.

### 6.3 Fluxos Alternativos

**Fluxo Alternativo A, releitura pelo Operador:**
1. 🟡 O usuário clica em reler.
2. 🟡 O painel marca o cabeçalho como relendo, sem apagar o conteúdo anterior.
3. 🟡 O novo processo chega e substitui o anterior, com o momento da leitura atualizado.

**Fluxo Alternativo B, leitura degradada:**
1. 🟡 O processo chega com anomalias.
2. 🟡 O cabeçalho ganha o aviso de leitura degradada, e a seção de anomalias lista cada uma.
3. 🟡 As demais seções são desenhadas com o que foi possível ler.

**Fluxo Alternativo C, sem Reversa:**
1. 🟡 O processo chega marcado como não instalado.
2. 🟡 A tela explica o que o Reversa é, mostra o comando de instalação e oferece verificar de novo.

---

## 7. Requisitos Não-Funcionais

| ID | Requisito | Valor alvo | Observação |
|----|-----------|-----------|------------|
| RNF-01 | 🟡 Largura mínima suportada | 🟡 300 px sem rolagem horizontal | 🟡 A barra lateral do editor costuma ter entre 300 e 400 px |
| RNF-02 | 🟡 Tempo de pintura após receber o processo | 🟡 Abaixo de 100ms | 🟡 O processo típico tem menos de 50 KB |
| RNF-03 | 🟡 Acessibilidade | 🟡 Status de fase e de checkpoint distinguíveis sem cor; toda ação acionável por teclado | 🟡 Alto contraste é tema suportado, não exceção |
| RNF-04 | 🟡 Tamanho do bundle da webview | 🟡 Abaixo de 400 KB | 🟡 Herdado do `vscode-kanban`, que o alcança cortando os tokens do tema |
| RNF-05 | 🟡 Cobertura de teste das funções de decisão | 🟡 100% de linhas | 🟡 Os componentes visuais não são testados por unidade; o preview é a evidência deles |

---

## 8. Design e Interface

**Componentes afetados:** 🟡 Toda a webview: cabeçalho, faixa de bloqueio, seis seções, telas de
estado de entrada, e o módulo de decisões puras.

**Comportamento esperado:**
🟡 O painel é uma coluna. No topo, o cabeçalho com identidade e o botão de reler. Abaixo, a faixa
de bloqueio, quando houver, em destaque visual que use forma e texto além de cor. Depois as seções,
cada uma com título, contagem quando fizer sentido e corpo recolhível. Nome de artefato é sempre
clicável e abre no editor. Nada pisca, nada anima, nada muda de lugar entre releituras.

**Estados da UI:**
- 🟡 Sem diretório: título que explica que o painel precisa de uma pasta aberta, sem botão.
- 🟡 Carregando: uma linha que diz que está lendo, sem indicador giratório.
- 🟡 Sem Reversa: explicação de duas frases sobre o que o Reversa é, o comando de instalação em
  bloco copiável e o botão de verificar de novo.
- 🟡 Erro: título que diz que não foi possível ler, a mensagem em bloco, e o botão de tentar de novo.
- 🟡 Instalado e íntegro: cabeçalho com marca de leitura íntegra, sem faixa se nada bloqueia.
- 🟡 Instalado e degradado: cabeçalho com aviso de degradação, e a seção de anomalias expandida por padrão.
- 🟡 Relendo: o conteúdo anterior permanece visível, e o cabeçalho indica a releitura em curso.

---

## 9. Modelo de Dados

🟡 O painel não persiste dado de processo. A única estrutura guardada é a preferência de exibição,
no estado que a webview mantém no host:

```
PreferenciasDeExibicao {
  secoesRecolhidas: lista de nomes de secao
}
```

🟡 O processo recebido é o tipo de fio declarado pela ponte, e o painel o consome sem transformar
nem armazenar. A função de estado de entrada devolve um valor nomeado entre os cinco, e a função de
bloqueio devolve a lista de razões, cada uma com o comando do Reversa sugerido.

**Migrações necessárias:** 🟡 Não.

---

## 10. Integrações e Dependências

| Dependência | Tipo | Impacto se indisponível |
|-------------|------|------------------------|
| 🟡 Componente `ponte-e-host` | Obrigatória | 🟡 Sem mensagem de dados, o painel permanece no estado de carregando; se a ponte relatar erro, mostra o estado de erro com a mensagem |
| 🟡 Tokens de tema do Primer | Obrigatória | 🟡 Se o CSS não carregar, os componentes perdem medidas e colapsam; o preview detecta isso antes da entrega |
| 🟡 React | Obrigatória | 🟡 Empacotado no bundle; não há carga remota |
| 🟡 Rede ou serviço remoto | Nenhuma | 🟡 A webview não faz requisição alguma, e a política de segurança do documento a impede de fazer; não há timeout nem indisponibilidade a tratar |

---

## 11. Edge Cases e Tratamento de Erros

| Cenário | Trigger | Comportamento esperado |
|---------|---------|----------------------|
| EC-01: 🟡 Processo com estado vazio | 🟡 Reversa recém-instalado, sem fase alguma iniciada | 🟡 As cinco fases aparecem como pendentes, o forward diz que não há feature ativa, e nenhuma faixa aparece |
| EC-02: 🟡 Dezenas de anomalias | 🟡 Arquivo de progresso corrompido em massa | 🟡 A seção mostra as dez primeiras e a contagem total, com controle para expandir o resto |
| EC-03: 🟡 Nome de feature ou caminho longo | 🟡 Nome curto com dezenas de caracteres | 🟡 Quebra de linha dentro da célula; nunca rolagem horizontal |
| EC-04: 🟡 Painel mais estreito que o mínimo | 🟡 Usuário arrasta a barra lateral | 🟡 Abaixo de 300 px o conteúdo empilha e a faixa vira uma linha; nada é cortado |
| EC-05: 🟡 Estágio fora do conjunto que a tela conhece | 🟡 Modelo herdado mais novo que o rótulo da tela | 🟡 O valor bruto é exibido entre crases, com aviso de rótulo desconhecido, em vez de falha de renderização |
| EC-06: 🟡 Tema do editor trocado com o painel aberto | 🟡 Usuário muda o tema | 🟡 O painel repinta pela classe do corpo, sem releitura e sem perder seções recolhidas |
| EC-07: 🟡 Mensagem de dados recebida duas vezes em sequência | 🟡 Duas releituras rápidas | 🟡 A última vence; o momento da leitura mostra o mais recente |
| EC-08: 🟡 Falha de renderização de um componente | 🟡 Defeito em um dos eixos | 🟡 Um limite de erro por seção isola a falha: a seção mostra que falhou e as demais seguem visíveis |
| EC-09: 🟡 Estado da webview com nome de seção que não existe mais | 🟡 Extensão atualizada com seções renomeadas | 🟡 Nomes desconhecidos são ignorados; as seções atuais abrem expandidas |

---

## 12. Segurança e Privacidade

- **Autenticação:** 🟡 Não se aplica.
- **Autorização:** 🟡 A webview só envia à ponte os comandos do protocolo, e só por um módulo. Não
  há entrada de texto livre na primeira versão.
- **Dados sensíveis:** 🟡 O painel exibe nomes de arquivo e trechos de anomalia do próprio projeto
  do usuário, na tela dele. Nada é enviado a lugar algum, e a política de segurança do documento
  bloqueia qualquer requisição externa.
- **Auditoria:** 🟡 Falha de renderização capturada por limite de erro é enviada ao log da extensão
  pela ponte, com o nome da seção.

---

## 13. Plano de Rollout

- **Estratégia:** 🟡 Entrega única por VSIX local, junto com o host. O preview fora do editor é o
  portão de saída: nenhuma versão é empacotada sem captura de tela dos sete estados listados na seção 8.
- **Como reverter:** 🟡 Desinstalar a extensão. O painel não escreve nada fora do estado interno da
  webview.
- **Monitoramento pós-entrega:** 🟡 A própria seção de anomalias, e o log da extensão para falhas de
  renderização isoladas por limite de erro.

---

## 14. Open Questions

| # | Pergunta | Impacto | Dono | Prazo |
|---|---------|---------|------|-------|
| OQ-01 | 🟡 A faixa de bloqueio deve sugerir o comando do Reversa em texto copiável, ou apenas nomear a razão? | Médio | 🟡 iago | 🟡 Antes do primeiro protótipo |
| OQ-02 | 🟡 Os checkpoints devem aparecer por padrão expandidos ou recolhidos, dado que numa descoberta longa são dezenas? | Baixo | 🟡 iago | 🟡 Após uso real |
| OQ-03 | 🟡 O relatório da sonda deve ficar recolhido por padrão quando não houver recusa nem truncamento? | Baixo | 🟡 iago | 🟡 Antes do primeiro protótipo |

---

## 15. Decisões Tomadas (Decision Log)

| Decisão | Alternativas consideradas | Racional |
|---------|--------------------------|---------|
| 🟡 Seis eixos, com diagnóstico incluído | 🟡 Três eixos de núcleo; os oito eixos | 🟡 O diagnóstico é a defesa contra o painel mentir em silêncio, risco de maior impacto do PRD; os cinco adiados custam tela e não leitura |
| 🟡 Ordem ditada pela persona primária, com bloqueio no topo | 🟡 Ordem cronológica do pipeline, como a origem faz | 🟡 O Retomador precisa do que aguarda decisão dele antes de qualquer histórico |
| 🟡 Decisões de apresentação em função pura | 🟡 Lógica dentro dos componentes | 🟡 Herdado das duas origens: componente visual não se testa por unidade, e o que pode estar errado precisa ser testável |
| 🟡 Conteúdo anterior mantido durante a releitura | 🟡 Limpar e mostrar carregando | 🟡 O Operador relê várias vezes por sessão; piscar a tela a cada vez é atrito sem informação |
| 🟡 Limite de erro por seção | 🟡 Um limite para o painel inteiro | 🟡 Um eixo defeituoso não deve esconder os outros cinco; a persona primária precisa do que sobrou |
| 🟡 Sem indicador giratório | 🟡 Animação de carregamento | 🟡 A leitura leva menos de 1 s; animação para esse intervalo chama atenção sem informar |

---

## Apêndice

### Referências
- 🟡 `_reversa_sdd/prd.md`, seções 3, 4, 8 e 9
- 🟡 `_reversa_sdd/personas.md`
- 🟡 `_reversa_sdd/sdd/ponte-e-host.md`, seção 9, para o protocolo
- 🟡 Origem da seção: `~/HARNESS/scrum-harness/packages/ui-scrum/src/client/Reversa.tsx` e `reversa-view.ts`
- 🟡 Origem do tema: `~/dev/vscode-kanban/src/webview/theme/`

### Histórico de Revisões

| Versão | Data | Autor | Mudanças |
|--------|------|-------|---------|
| 1.0 | 2026-09-09 | reversa-spec-sdd | Criação inicial |

---

## Relatório de avaliação (spec_scorer.py)

```
============================================================
  SPEC QUALITY REPORT
  Arquivo: /Users/iagoleal/dev/reversa-views/_reversa_sdd/sdd/painel-do-processo.md
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
