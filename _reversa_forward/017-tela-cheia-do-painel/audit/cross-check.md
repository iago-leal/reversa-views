# Cross-check: tela cheia do painel de linha de comando

> Identificador: `017-tela-cheia-do-painel`
> Data: `2026-09-21` (segunda rodada, após as edições decididas pelo usuário sobre a primeira)
> Artefatos analisados:
> - `_reversa_forward/017-tela-cheia-do-painel/requirements.md`
> - `_reversa_forward/017-tela-cheia-do-painel/roadmap.md`
> - `_reversa_forward/017-tela-cheia-do-painel/actions.md`
>
> Lidos como apoio, sem serem objeto de finding próprio: `interfaces/teclado.md`, `data-delta.md`,
> `investigation.md`, `onboarding.md`, os adendos 014 e 016 em `_reversa_sdd/addenda/`, as pastas
> `_reversa_forward/014-cli-do-processo/` e `016-visual-do-painel-cli/`, e os fontes de `src/cli/`,
> `tests/cli-*` e `amostras/painel/`. Não há `domain.md`, `architecture.md` nem
> `.reversa/principles.md` neste projeto (greenfield); o eixo 3 foi conferido contra os adendos, as
> specs de `_reversa_sdd/sdd/` e o código.
>
> Os IDs `A001` a `A009` são os da primeira rodada, mantidos para que as linhas de histórico dos
> artefatos que os citam continuem legíveis. Este relatório é estritamente leitor: nenhum dos
> artefatos acima foi alterado por ele.

## Resumo

| Severidade | Abertos | Resolvidos desde a primeira rodada |
|------------|---------|------------------------------------|
| CRITICAL | 0 | 0 |
| HIGH | 0 | 1 (A001) |
| MEDIUM | 0 | 2 (A002, A003) |
| LOW | 3 | 3 (A005, A007, A008) |
| **Total** | **3** | **6** |

## Findings abertos

| ID | Severidade | Eixo | Descrição | Onde está |
|----|------------|------|-----------|-----------|
| A004 | LOW | Cobertura | A segunda cláusula do RF-09, "manter a seleção visível e o bloco dela inteiro quando a janela encolhe", é comportamento herdado da 016 (D-19, `ajustarDeslocamento`) e não recebe ação nem teste; D-04 e T010/T018 cobrem só o agrupamento da rajada. A conferência fica no `onboarding.md` §4. Sem correção necessária antes do coding; se o usuário quiser prendê-la por suíte, cabe uma ação sobre `tests/cli-navegacao.spec.ts` ou sobre a suíte de `medidas.ts` | `requirements.md` RF-09; `roadmap.md` D-04; `actions.md` T010, T018 |
| A006 | LOW | Consistência | O modo privado `?2026` recebe três nomes: "saída sincronizada" (RN-02, RN-06, RNF de compatibilidade, persona do Operador remoto), "atualização sincronizada" (RF-08, cenário "redesenho sem apagamento", D-03, T016) e "sincronização" (D-10, T009, T017). O referente é inequívoco, porque todos nomeiam os bytes; uniformizar é cosmético | `requirements.md` §3, §4, §5, §6, §7; `roadmap.md` D-03, D-10; `actions.md` T009, T016, T017 |
| A009 | LOW | Cobertura | O RNF de desempenho amplia o piso da 016 ("do pedido à sequência pronta para escrever, menos de 50 ms"), mas nenhuma ação estende a medição existente, que cobre a composição, à vestidura e à montagem da sequência. É Should, e a cláusula da escrita única está coberta pela T008 | `requirements.md` §6, primeira linha; `roadmap.md` §10; `actions.md` (nenhuma ação) |

Nenhum finding CRITICAL ou HIGH: o critério de pronto do roadmap ("`cross-check.md` sem CRITICAL nem
HIGH") está satisfeito por esta rodada.

## Findings resolvidos desde a primeira rodada

| ID | Era | O que foi feito | Conferido em |
|----|-----|-----------------|--------------|
| A001 | HIGH | O usuário decidiu admitir a diferença em `amostras/painel/ajuda.txt`. RN-01 e RF-16 nomeiam a exceção; a D-09 registra a regeneração e descarta congelar a amostra; o critério de pronto pede diferença só em `ajuda.txt`; T020 passou de 🟡 a 🟢 e o resumo do `actions.md` foi reescrito; `data-delta.md` §4 e §7 e `onboarding.md` §6.3 dizem a mesma coisa. RF-06 e RF-16 deixaram de colidir | `requirements.md` RN-01, RF-16, §8, §11; `roadmap.md` D-09, §5, §10, §11; `actions.md` resumo, T020, histórico; `data-delta.md` §4, §7; `onboarding.md` §6.3 |
| A002 | MEDIUM | Entrou a T024, em `tests/cli-quadro.spec.ts`, que confere `TABELA_DE_AJUDA`: as duas linhas novas com a promessa de cada uma, a ausência de "mouse" e a presença de toda tecla de movimento; T021 depende dela. O critério do RF-06, a D-09 e o `interfaces/teclado.md` §5 nomeiam essa suíte em vez da "suíte da navegação" | `requirements.md` RF-06; `roadmap.md` D-09; `actions.md` T021, T024; `interfaces/teclado.md` §5 |
| A003 | MEDIUM | O RF-10 passou a ser citado pela D-12 e pela T016, com a explicação de que `aoRetomar` e `dancar` do laço chamam o `desenhar` novo sem linha alterada; o critério de aceite do RF-10 e a D-12 declaram que, sem suíte de sinais, a ordem da dança e a retomada são conferidas pelo `onboarding.md` §5. A D-12 registra a suíte de sinais como alternativa descartada | `requirements.md` RF-10; `roadmap.md` D-12, §5; `actions.md` T016 |
| A005 | LOW | O marcador `[//]` foi retirado da T022, que compartilha `src/cli/terminal.ts` com a T016; o resumo passou a 11 paralelizáveis | `actions.md` resumo, T022 |
| A007 | LOW | No delta arquitetural, `ContextoDeNavegacao` com `linhas` saiu da linha "Vocabulário" e entrou na de "Máquina de navegação" (`src/cli/navegacao.ts`); o compositor passou de `componente-novo` a `contrato-alterado` | `roadmap.md` §5 |
| A008 | LOW | Os ponteiros de D-06 e RF-12 apontam agora para `_reversa_forward/014-cli-do-processo/roadmap.md` e `requirements.md`, onde os identificadores vivem | `roadmap.md` §5 |

## Itens verificados que passaram

### Eixo 1, Cobertura

- RF-01 → D-05, D-06, D-07, D-08 → T003, T004, T005, T011, T012, T013.
- RF-02 → D-05, D-07, D-08 → T003, T005, T006, T011, T013.
- RF-06 → D-09 → T019, T020, T023, T024, `interfaces/teclado.md`.
- RF-07 → D-01, D-02 → T008, T016.
- RF-08 → D-03 → T008, T009, T016, T017.
- RF-09, primeira cláusula (rajada) → D-04 → T010, T018 (a segunda cláusula é o A004).
- RF-10 → D-01, D-03, D-12 → T016; ordem da dança conferida pelo `onboarding.md` §5, como o critério
  de aceite agora declara.
- RF-16 → D-09, D-12 → T020, T021.
- RN-01 a RN-08: cada regra tem decisão que a honra (RN-01 → D-09/T020 com a exceção nomeada;
  RN-02 → D-03/T017; RN-03 → D-08/T013; RN-04 → `interfaces/teclado.md` §1; RN-05 → D-05/D-06/T011 e
  guarda de `tests/cli-boundaries.spec.ts` em T021; RN-06 → D-03 sem consulta ao terminal; RN-07 →
  princípios do roadmap §2; RN-08 → T021 e T023).
- D-01 a D-10 e D-12 têm ação correspondente; D-11 é declaradamente passo humano, com destino nas
  notas de execução do `actions.md`, como o roadmap pede.
- Cenários Gherkin: "página abaixo num quadro longo" (T004, T005, T013); "página abaixo no fim"
  (T004); "página sem linha navegável" (T004); "meia página" (T005, T006, T013); "redesenho sem
  apagamento de tela" (T008, T016); "rajada de redimensionamento" (T010, T018); "interrupção no meio
  de um desenho" (T009, T017); "retomada da suspensão" (T016 via D-12, `onboarding.md` §5.3);
  "ajuda com as teclas novas" (T019, T020, T024); "passada intocada" (T021); "roda do trackpad no
  iTerm2" (passo humano, `onboarding.md` §2, D-11).

### Eixo 2, Consistência

- Todo RF citado no roadmap e no actions existe no requirements (RF-01, RF-02, RF-06, RF-07, RF-08,
  RF-09, RF-10, RF-16); os retirados (RF-03, RF-04, RF-05, RF-11 a RF-15) não são citados em lugar
  algum além da nota de retirada.
- Todo D-nn citado no actions existe no roadmap (D-01 a D-12); toda RN citada existe no requirements;
  os IDs de finding citados nos históricos (A001, A002, A003, A005, A007, A008) existem neste relatório.
- Identificadores do legado citados nos três documentos existem: RN-02, RN-05, RN-08, RF-12, D-05,
  D-06 da 014 e RN-06, RN-07, RN-08, RF-20, D-07, D-17, D-19 da 016, em `_reversa_forward/`; RF-13 e
  RNF-03 em `_reversa_sdd/sdd/painel-do-processo.md`; as âncoras `#resumo-da-entrega`,
  `#impacto-por-artefato-da-extracao` e `#o-que-o-texto-deliberadamente-nao-diz` existem nos dois
  adendos; `#1-principio` e `#4-como-a-decisao-entra-no-codigo` existem no `teclado.md` da 014.
- Os nomes das quatro teclas, os bytes e as cinco constantes novas do terminal são idênticos em
  requirements, roadmap, actions, `data-delta.md` e `interfaces/teclado.md`.
- A exceção `ajuda.txt` é dita com as mesmas palavras nos seis lugares que antes a negavam.
- "Janela útil", "altura útil" e `alturaVisivel` designam a mesma medida, e o código confirma.
- O contrato de `interfaces/teclado.md` aparece no roadmap §7, com tipo e arquivo de detalhe.
- A ordem de restauração é a mesma no cenário "interrupção no meio de um desenho", na D-03, na T009 e
  na T017, e é a inversa da entrada registrada em `src/cli/terminal.ts`.

### Eixo 3, Coerência com o legado

- Não há `domain.md`; nenhuma regra 🟢 dos adendos 014 e 016 é contradita: escape confinado a
  `terminal.ts`, reconhecimento puro de teclas, apresentação sem consulta ao terminal, nomes vigiados
  fora de `src/cli/`, nada escrito em disco, nada persistido. A regeneração de `ajuda.txt` segue o
  regime das amostras da 016 ("gerados de um estado fixo por função pura ... com suíte que compara o
  gerado com o gravado").
- Componentes citados existem no código: `TECLAS` com quinze nomes (`src/cli/tipos.ts:177-195`);
  `EFEITOS` com cinco (`:204`); `ContextoDeNavegacao` (`src/cli/navegacao.ts:31-39`); `navegar` como
  `switch` exaustivo sem `default` (`:170-226`); `fundo()` (`:104`); `LIMPAR` e o `desenhar` numa
  única escrita (`src/cli/terminal.ts:32,178-193`); `aoRedimensionar` sem agrupamento (`:210-215`);
  `CONTROLES` (`src/cli/teclas.ts:26-36`); `Montagem`, `montar`, `linhasDaSecao`,
  `contextoDeNavegacao`, `indiceDaSelecao`, `blocoDaSelecao`, `alturaUtil` (`src/cli/quadro/index.ts`);
  `TABELA_DE_AJUDA`, `painelDeAjuda` e `emSeteBits` (`src/cli/quadro/ajuda.ts`); `aoRetomar` e `dancar`
  no laço (`src/cli/laco.ts:221-240`); a variante `ajuda` das amostras (`src/cli/amostras.ts:77`); as
  sete suítes-alvo em `tests/`; os scripts `test`, `compile:cli`, `check:webview`, `painel` e
  `amostras:painel` em `package.json`.
- O estado de partida descrito no requirements §2 corresponde ao código nesta data.
- `tests/cli-terminal.spec.ts` prende hoje o `2J` em quatro asserções, o que confirma a necessidade
  da D-10 e da T008.

### Eixo 4, Sanidade do actions

- Todas as dependências apontam para IDs existentes (T001 a T024); nenhuma aponta para fora da lista.
- Não há ciclo.
- Contagens do resumo corretas: 24 ações, 11 marcadas `[//]`, cadeia mais longa de seis elos.
- Nenhuma dupla `[//]` compartilha arquivo alvo.
- T024 não é `[//]` e depende da T007, que é a outra ação sobre `tests/cli-quadro.spec.ts`.
- A ordem entre T001 e T013 está documentada como restrição de compilação, com a dependência de T020
  ajustada para respeitá-la.
