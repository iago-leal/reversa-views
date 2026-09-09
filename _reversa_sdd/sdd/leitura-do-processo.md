# Spec: leitura-do-processo

> Selo 🟡 PLANEJADO em todos os itens. Componente 1 de 5 do `reversa-views`.

**Versão:** 1.0
**Status:** Rascunho
**Autor:** reversa-spec-sdd
**Data:** 2026-09-09
**Reviewers:** N/A

---

## 1. Resumo

🟡 A camada que transforma os arquivos que o Reversa deixa no disco num processo tipado, pronto
para ser desenhado na tela. É herdada do `scrum-harness`, onde já existe repartida em modelo puro
e sonda de leitura, e chega aqui sem a camada de rota, que a extensão não precisa. Ela lê e julga;
não escreve, não decide o que mostrar e não conhece o editor.

---

## 2. Contexto e Motivação

**Problema:**
🟡 O Reversa não tem runtime. O estado do processo existe apenas como arquivos em `.reversa/`,
`_reversa_sdd/` e `_reversa_forward/`, e a única leitura pronta é `reversa status`, que imprime
projeto, fase e duas listas. Qualquer painel precisa antes de tudo de alguém que leia esses
arquivos e responda o que eles significam.

Significar é a parte difícil. O estágio da feature ativa não está escrito em campo algum: ele se
deduz de quais artefatos existem fisicamente na pasta, e o campo `current-stage` que parece
respondê-lo é declarado informativo pelo próprio framework. As cinco fases da descoberta vivem
em três campos que podem discordar entre si, porque um agente os mantém ao longo de sessões que
às vezes terminam no meio. Uma ação por fechar dentro de uma emenda reabre a feature inteira.

**Evidências:**
🟡 O `scrum-harness` já pagou esse custo. O modelo dele tem 1.674 linhas e 16 suítes de teste, e
a sonda tem 4 módulos e 4 suítes. Nenhuma dessas regras é adivinhável a partir dos arquivos; todas
foram lidas do código-fonte do framework e documentadas linha a linha.

**Por que agora:**
🟡 O `scrum-harness` roda Reversa 1.3.3, a mesma versão instalada neste projeto. A herança nasce
alinhada ao framework real, e adiar apenas aumenta a chance de divergência entre as duas cópias.

---

## 3. Goals (Objetivos)

- [ ] G-01: 🟡 Entregar o processo completo do Reversa como valor tipado, a partir de um caminho
  de raiz de workspace, sem que o consumidor precise conhecer o layout dos arquivos.
- [ ] G-02: 🟡 Degradar sob arquivo ausente, corrompido ou editado à mão, informando o que degradou,
  em vez de lançar exceção ao consumidor.
- [ ] G-03: 🟡 Reproduzir o comportamento do Reversa mesmo onde ele surpreende, jamais o idealizando,
  porque um painel que prevê algo diferente do que o framework fará é pior que painel nenhum.
- [ ] G-04: 🟡 Manter a separação entre julgar e ler, de modo que o julgamento seja testável sem
  tocar em disco.

**Métricas de sucesso:**

| Métrica | Baseline atual | Target | Prazo |
|---|---|---|---|
| 🟡 Suítes herdadas que passam sem adaptação de regra | 🟡 0, o código ainda não foi copiado | 🟡 20 de 20 | 🟡 30 dias |
| 🟡 Tempo de leitura completa de um workspace com Reversa instalado | 🟡 Desconhecido | 🟡 Abaixo de 200ms | 🟡 30 dias |
| 🟡 Módulos que importam `node:fs` na camada de julgamento | 🟡 0 na origem | 🟡 0 | 🟡 Permanente |

---

## 4. Non-Goals (Fora do Escopo)

- NG-01: 🟡 Escrever, criar, remover ou renomear qualquer arquivo. A camada expõe leitura e nada
  mais, e a ausência das demais capacidades é verificável por inspeção do módulo que toca o disco.
- NG-02: 🟡 A camada de rota HTTP da origem. A extensão roda em Node e lê direto, de modo que a
  rota, a exigência de caminho absoluto na query e o tratamento de falha de transporte ficam de fora.
- NG-03: 🟡 Decidir o que a tela mostra. Esta camada entrega o processo inteiro, com os oito eixos
  que o modelo já calcula, e a seleção do que aparece pertence ao componente do painel.
- NG-04: 🟡 Observar o disco por conta própria. Quem decide quando ler é o host.
- NG-05: 🟡 Corrigir, normalizar ou sanear os arquivos do Reversa. Um valor fora do conjunto
  canônico é preservado e sinalizado, nunca reescrito nem descartado em silêncio.

---

## 5. Usuários e Personas

**Usuário primário:** 🟡 O host da extensão, que pede o processo de uma raiz de workspace e o
repassa ao painel. É código, não pessoa, e a spec o trata como tal: o contrato precisa ser
suficiente para quem não vai ler documentação.

**Usuário secundário:** 🟡 O Retomador e o Operador, indiretamente. Nenhum dos dois toca esta
camada, e ambos dependem de ela dizer a verdade sobre o processo.

**Jornada atual (sem a feature):**
1. 🟡 O usuário abre os arquivos do Reversa manualmente.
2. 🟡 Deduz o estágio olhando quais artefatos existem na pasta da feature.
3. 🟡 Erra quando confia no campo que o framework declara informativo.

**Jornada futura (com a feature):**
1. 🟡 O host informa a raiz do workspace.
2. 🟡 A sonda lê os arquivos que existem e ignora com registro os que não pode ler.
3. 🟡 O modelo julga e devolve o processo tipado, com a lista do que degradou.

---

## 6. Requisitos Funcionais

### 6.1 Requisitos Principais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | 🟡 O sistema deve compor a leitura em duas partes, uma que toca o disco e outra que julga, sendo que a segunda não importa nenhum módulo de sistema de arquivos | Must | 🟡 Uma busca por importação de `node:fs` na camada de julgamento retorna zero resultados |
| RF-02 | 🟡 O sistema deve resolver as pastas de saída e de ciclo forward a partir do estado do Reversa, aplicando os padrões do framework quando os campos faltarem | Must | 🟡 Um workspace com pasta de saída personalizada é lido corretamente sem configuração adicional |
| RF-03 | 🟡 O sistema deve derivar as cinco fases da descoberta por precedência normativa, em que a lista de concluídas vence o campo de fase corrente, que por sua vez vence a lista de pendentes | Must | 🟡 Um estado com os três campos em desacordo produz sempre as cinco fases canônicas na ordem do framework |
| RF-04 | 🟡 O sistema deve classificar o estágio da feature ativa pelos artefatos fisicamente presentes na pasta, ignorando o campo autodeclarado | Must | 🟡 Uma pasta com requisitos e sem plano é classificada como estágio de requisitos, qualquer que seja o campo no arquivo de ponteiro |
| RF-05 | 🟡 O sistema deve separar a entrega concluída sem adendo da entrega concluída com adendo, e tratar adendo superado como ausente | Must | 🟡 Uma feature com todas as ações fechadas e adendo marcado como superado é classificada como pendente de convergência |
| RF-06 | 🟡 O sistema deve contar as ações da feature varrendo o arquivo inteiro, sem filtro de seção, reportando fechadas, abertas e emendas | Must | 🟡 Uma ação aberta dentro da seção de emendas reabre a feature, como o framework faz |
| RF-07 | 🟡 O sistema deve registrar toda degradação encontrada durante a leitura, nomeando o arquivo, o código do problema e o detalhe | Must | 🟡 Um arquivo de estado com fase desconhecida produz uma anomalia que nomeia a fase |
| RF-08 | 🟡 O sistema deve recusar caminho declarado pelo Reversa que escape da raiz do workspace, e relatar a recusa | Must | 🟡 Um ponteiro absoluto ou com travessia de diretório é recusado, e a recusa aparece no relatório da sonda |
| RF-09 | 🟡 O sistema deve deixar de ler arquivo acima do teto de bytes e relatar o truncamento, em vez de carregar sem limite | Must | 🟡 Um arquivo acima do teto não é lido, e seu caminho consta da lista de truncados |
| RF-10 | 🟡 O sistema deve preservar campos desconhecidos encontrados nos arquivos, em vez de descartá-los | Should | 🟡 Uma chave nova num checkpoint sobrevive à leitura e fica disponível ao consumidor |
| RF-11 | 🟡 O sistema deve devolver um processo válido e marcado como não instalado quando o Reversa não existe no workspace | Must | 🟡 Uma pasta vazia produz processo com a marca de não instalado e sem exceção |
| RF-12 | 🟡 O sistema deve relatar o que a sonda de fato leu, incluindo a pasta da feature e a da sessão de ideação resolvidas | Should | 🟡 O relatório da sonda nomeia as pastas lidas ou informa a ausência de cada uma |

### 6.2 Fluxo Principal (Happy Path)

1. 🟡 O host informa a raiz absoluta do workspace.
2. 🟡 A sonda lê os arquivos de caminho fixo do Reversa.
3. 🟡 O modelo resolve as pastas de saída e de ciclo forward a partir do estado lido.
4. 🟡 A sonda resolve os ponteiros para a pasta da feature e a da sessão de ideação, recusando o
   que escapar da raiz.
5. 🟡 A sonda lê os arquivos que dependem desses ponteiros e monta o retrato bruto.
6. 🟡 O modelo julga cada eixo e reúne as anomalias de todos eles.
7. 🟡 O consumidor recebe o processo tipado e o relatório da sonda.

### 6.3 Fluxos Alternativos

**Fluxo Alternativo A, Reversa não instalado:**
1. 🟡 A sonda não encontra o arquivo de estado.
2. 🟡 O retrato bruto sai vazio e o processo é marcado como não instalado.
3. 🟡 O consumidor recebe resposta normal, não erro.

**Fluxo Alternativo B, ponteiro que escapa da raiz:**
1. 🟡 A sonda identifica caminho absoluto ou com travessia.
2. 🟡 A leitura daquele ramo é abandonada e a recusa entra no relatório.
3. 🟡 Os demais eixos seguem sendo lidos.

---

## 7. Requisitos Não-Funcionais

| ID | Requisito | Valor alvo | Observação |
|----|-----------|-----------|------------|
| RNF-01 | 🟡 Tempo de leitura completa | 🟡 Abaixo de 200ms num workspace típico | 🟡 A leitura ocorre na abertura do painel e a cada releitura pedida |
| RNF-02 | 🟡 Teto de bytes por arquivo | 🟡 256 KB, herdado da origem | 🟡 Protege contra arquivo de log crescido sem limite |
| RNF-03 | 🟡 Teto de adendos lidos numa passada | 🟡 50, em ordem de nome | 🟡 Herdado da origem |
| RNF-04 | 🟡 Superfície de escrita exposta | 🟡 Nenhuma função capaz de escrever, criar, remover ou executar | 🟡 Verificável por inspeção do módulo que toca o disco |
| RNF-05 | 🟡 Cobertura de teste da camada de julgamento | 🟡 As 20 suítes herdadas passando | 🟡 São o contrato herdado, e não devem ser reescritas |

---

## 8. Design e Interface

**Componentes afetados:** 🟡 Nenhuma interface visual. O componente expõe uma função de leitura de
disco, uma função de julgamento e os tipos que ambas trocam.

**Comportamento esperado:**
🟡 Uma chamada, um resultado. O consumidor informa a raiz e recebe o processo mais o relatório da
sonda. Não há estado interno entre chamadas, não há cache e não há assinatura de eventos.

**Estados da resposta:**
- 🟡 Não instalado: o processo vem marcado como tal, com os eixos vazios e sem anomalia de erro.
- 🟡 Instalado e íntegro: todos os eixos preenchidos e a lista de anomalias vazia.
- 🟡 Instalado e degradado: eixos preenchidos com o que foi possível ler, e a lista de anomalias
  nomeando cada degradação.
- 🟡 Parcialmente recusado: um ou mais ponteiros escaparam da raiz, e o relatório da sonda os nomeia.

---

## 9. Modelo de Dados

🟡 Duas estruturas atravessam o componente, e nenhuma delas é persistida.

```
RetratoBruto {
  estado: texto ou vazio          // o arquivo de estado do Reversa
  politica: texto ou vazio        // a configuracao de escrita no legado
  requisitosAtivos: texto ou vazio
  arquivosDaFeature: lista ou vazio   // vazio e ausencia; lista vazia e pasta vazia
  acoes, requisitos, progresso: texto ou vazio
  adendos: lista de nomes e corpos
  impacto, regressao, migracao, ideacao: texto ou vazio
}

ProcessoDoReversa {
  instalado: booleano
  descoberta: fases, checkpoints, identidade do projeto
  politica: veredito vigente e pastas gravaveis
  forward: estagio, feature, acoes, duvidas, pausadas, adendo
  progresso: eventos e reducao por acao
  impacto, regressao, migracao, ideacao: os quatro eixos restantes
  anomalias: tudo que degradou, de todos os eixos
}
```

🟡 A distinção entre ausência e vazio é carregada de sentido e não é estilo: ausência de pasta
significa que não há feature ativa, enquanto pasta existente e vazia significa feature recém-criada.

**Migrações necessárias:** 🟡 Não. O componente não persiste nada.

---

## 10. Integrações e Dependências

| Dependência | Tipo | Impacto se indisponível |
|-------------|------|------------------------|
| 🟡 Sistema de arquivos local | Obrigatória | 🟡 Toda falha de leitura é tratada como ausência do arquivo, e o processo sai degradado em vez de falhar |
| 🟡 Formato dos arquivos do Reversa 1.3.3 | Obrigatória | 🟡 Mudança de formato aparece como anomalia, que é o sinal previsto para disparar a ressincronização |
| 🟡 Código de origem no `scrum-harness` | De construção | 🟡 Consultado na cópia inicial e a cada ressincronização; depois da cópia não participa do build |
| 🟡 Rede, serviço remoto ou API | Nenhuma | 🟡 O componente não fala com nada fora do disco local, e portanto não tem timeout nem indisponibilidade externa a tratar |

---

## 11. Edge Cases e Tratamento de Erros

| Cenário | Trigger | Comportamento esperado |
|---------|---------|----------------------|
| EC-01: 🟡 Arquivo de estado com JSON inválido | 🟡 Edição à mão, ou escrita interrompida por estouro de contexto | 🟡 O processo sai com os padrões do framework, e uma anomalia nomeia o arquivo e a falha de parse |
| EC-02: 🟡 Fase declarada fora do conjunto canônico | 🟡 Agente gravou nome novo, ou houve erro de digitação | 🟡 As cinco fases canônicas saem na ordem do framework, e o nome estranho vira anomalia |
| EC-03: 🟡 Fase listada ao mesmo tempo como corrente e concluída | 🟡 Estado escrito pela metade | 🟡 A precedência resolve em favor de concluída, e a contradição vira anomalia |
| EC-04: 🟡 Linha corrompida no arquivo de progresso | 🟡 Escrita interrompida, ou linha truncada | 🟡 A linha é ignorada, as demais são lidas, e o trecho inicial da linha entra na anomalia |
| EC-05: 🟡 Ponteiro para pasta fora da raiz do workspace | 🟡 Caminho absoluto, ou travessia de diretório | 🟡 A leitura daquele ramo é recusada e registrada, e os outros eixos seguem sendo lidos |
| EC-06: 🟡 Arquivo acima do teto de bytes | 🟡 Arquivo de progresso crescido ao longo de uma feature longa | 🟡 O arquivo não é lido, seu caminho consta da lista de truncados, e o eixo sai vazio em vez de parcial |
| EC-07: 🟡 Pasta da feature existente e vazia | 🟡 Pipeline interrompido imediatamente após criar a pasta | 🟡 O estágio sai como pasta criada sem requisitos, distinto de não haver feature ativa |
| EC-08: 🟡 Falha de permissão de leitura no sistema de arquivos | 🟡 Arquivo sem permissão, ou volume desmontado | 🟡 Tratada como ausência, sem exceção ao consumidor, com o eixo correspondente vazio |
| EC-09: 🟡 Marcador de ação em caixa baixa | 🟡 Agente gravou fora da convenção do framework | 🟡 A linha não conta como ação, reproduzindo o framework, e uma anomalia nomeia a linha |

---

## 12. Segurança e Privacidade

- **Autenticação:** 🟡 Não se aplica. O componente roda no processo da extensão, com as permissões
  de quem abriu o editor.
- **Autorização:** 🟡 Limitada por construção à leitura, e por caminho à raiz do workspace. Ponteiro
  que escape da raiz é recusado.
- **Dados sensíveis:** 🟡 O componente lê arquivos do próprio projeto do usuário, que podem conter
  qualquer coisa que o Reversa tenha escrito. Nada é transmitido, armazenado fora da memória do
  processo, nem enviado a serviço algum.
- **Auditoria:** 🟡 O relatório da sonda registra o que foi lido, o que foi recusado e o que foi
  truncado, e serve de trilha de auditoria da própria leitura.

---

## 13. Plano de Rollout

- **Estratégia:** 🟡 Cópia única no início do projeto, com os testes herdados executados antes de
  qualquer outro componente ser escrito. Sem sinalizador de funcionalidade, porque o componente é
  pré-requisito de todos os demais.
- **Como reverter:** 🟡 O componente é código copiado, sem estado e sem efeito colateral. Reverter
  é remover a cópia; nada no disco do usuário terá sido alterado.
- **Monitoramento pós-entrega:** 🟡 A lista de anomalias é o instrumento. Anomalia recorrente de
  campo desconhecido indica que o Reversa mudou de formato e que a ressincronização está devida.

---

## 14. Open Questions

| # | Pergunta | Impacto | Dono | Prazo |
|---|---------|---------|------|-------|
| OQ-01 | 🟡 O teto de 256 KB por arquivo, herdado da origem, é adequado a um arquivo de progresso de feature longa? | Médio | 🟡 iago | 🟡 Primeira feature longa observada |
| OQ-02 | 🟡 Vale expor uma leitura parcial, que atualize um eixo isolado, ou a leitura completa basta pelo custo medido? | Baixo | 🟡 iago | 🟡 Após medir o tempo real de leitura |
| OQ-03 | 🟡 A ideação e a migração devem ser lidas mesmo estando fora do escopo da primeira versão, ou a leitura deve ser podada junto com a tela? | Baixo | 🟡 iago | 🟡 Antes da cópia inicial |

---

## 15. Decisões Tomadas (Decision Log)

| Decisão | Alternativas consideradas | Racional |
|---------|--------------------------|---------|
| 🟡 Vendorizar o modelo e a sonda | 🟡 Depender por caminho relativo, extrair pacote comum, reimplementar do zero | 🟡 O repositório precisa clonar e compilar sozinho depois de meses de pausa; a dependência relativa cruzaria duas árvores de diretório e arrastaria dependências de um terceiro repositório |
| 🟡 Descartar a camada de rota | 🟡 Copiar tudo e ignorar a rota | 🟡 Código morto envelhece e confunde na retomada; a extensão roda em Node e lê direto |
| 🟡 Manter a separação entre ler e julgar | 🟡 Fundir num módulo só, já que o consumidor é único | 🟡 A separação é o que torna as 20 suítes herdadas executáveis sem tocar em disco |
| 🟡 Preservar valores fora do conjunto canônico | 🟡 Normalizar para o valor mais próximo, ou descartar | 🟡 Descartar esconde a divergência entre a cópia e o framework, que é exatamente o risco de maior impacto do projeto |
| 🟡 Ler os oito eixos, mesmo mostrando seis | 🟡 Podar a leitura junto com a tela | 🟡 O julgamento vem inteiro da origem, e podá-lo criaria divergência com as suítes herdadas sem economizar tempo mensurável |

---

## Apêndice

### Referências
- 🟡 `_reversa_sdd/prd.md`, seções 4, 5 e 6
- 🟡 `_reversa_sdd/personas.md`
- 🟡 Origem do modelo e da sonda: `~/HARNESS/scrum-harness/packages/reversa-domain` e `packages/reversa-probe`

### Histórico de Revisões

| Versão | Data | Autor | Mudanças |
|--------|------|-------|---------|
| 1.0 | 2026-09-09 | reversa-spec-sdd | Criação inicial |

---

## Relatório de avaliação (spec_scorer.py)

```
============================================================
  SPEC QUALITY REPORT
  Arquivo: leitura-do-processo.md
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

Iterações: 2 (95 → 100, termo vago removido)
