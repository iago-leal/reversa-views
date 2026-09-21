# Cross-check: painel do processo na linha de comando

> Identificador: `014-cli-do-processo`
> Data: `2026-09-20`, segunda passada
> Artefatos analisados:
> `_reversa_forward/014-cli-do-processo/requirements.md`,
> `_reversa_forward/014-cli-do-processo/roadmap.md`,
> `_reversa_forward/014-cli-do-processo/actions.md`
> Consultados como apoio: `data-delta.md`, `interfaces/*`, `onboarding.md`, `_reversa_sdd/prd.md`,
> `_reversa_sdd/sdd/*`, `src/webview/domain/types.ts`, `scripts/conteudo-esperado.js`

Este relatório é leitura. Nenhum dos artefatos acima foi alterado por ele, e nenhum será. As
correções que o separam da primeira passada foram feitas fora desta auditoria, pelo usuário, e
estão registradas no histórico de cada documento.

## 1. Resumo

| Severidade | Primeira passada | Agora |
|------------|------------------|-------|
| CRITICAL | 0 | 0 |
| HIGH | 3 | **0** |
| MEDIUM | 6 | 5 |
| LOW | 3 | 3 |
| **Total aberto** | **12** | **8** |

Os três achados de severidade alta foram fechados, e com eles um dos médios. O que resta não
impede codificar: são âncoras envelhecidas, promessas negativas sem suíte que as prenda, e detalhes
de desenho que a implementação resolve sozinha se quem a fizer tiver lido esta lista.

## 2. Achados fechados desde a primeira passada

| ID | Severidade | Como foi fechado |
|----|------------|------------------|
| A001 | HIGH | A T043 desenha a linha da procedência, dizendo de onde veio a leitura corrente, quando, e se a observação degradou; a T044 acrescenta a asserção à suíte do quadro, e a T023 passou a depender das duas telas novas. A RN-09 deixou de ser promessa sem desenho |
| A002 | HIGH | A tabela de princípios do roadmap ganhou a linha que confronta o NG-04 da leitura e o NG-03 do painel, mostrando que a fronteira não foi rompida e sim deslocada: no terminal a ferramenta é o host, que é justamente quem o NG-04 autoriza a decidir quando ler |
| A003 | HIGH | A T042 desenha as quatro situações de entrada, cada uma com título e corpo, e nomeia o caso do projeto sem Reversa como resposta legítima, não como erro |
| A004 | MEDIUM | A tabela de componentes do roadmap foi completada com os oito módulos que a decomposição revelou, entre eles o laço vivo, e a coluna "toca o mundo" declara que ele trata sinais |

## 3. Achados abertos

| ID | Severidade | Eixo | Descrição | Onde está |
|----|------------|------|-----------|-----------|
| A005 | MEDIUM | Coerência com o legado | A RN-04 e o roadmap ancoram a ordem das seções no RF-14 do painel, que nomeia **seis** seções. O código fixa **onze** em `src/webview/domain/types.ts`, ampliadas pelos adendos 003, 008 e 009, e é com onze que o `data-delta.md` e a T020 trabalham. A âncora citada envelheceu | `requirements.md` RN-04; `_reversa_sdd/sdd/painel-do-processo.md:119`; `src/webview/domain/types.ts:41` |
| A006 | MEDIUM | Cobertura | O RF-09 exige que o item selecionado seja distinguível **sem depender de cor**. A ênfase abstrata resolve metade do problema, mas nenhuma ação nomeia o marcador, a inversão ou o recuo que o garante quando a cor está desligada | `requirements.md` RF-09; `actions.md` T017, T023, T024 |
| A007 | MEDIUM | Cobertura | O contrato `abertura-no-editor.md` §5 enumera quatro falhas com comportamento definido: nenhuma variável declarada, executável inexistente, editor que termina com código diferente de zero e linha sem artefato. A T025 descreve só o caminho feliz, e um dos cenários Gherkin cobra justamente a primeira | `interfaces/abertura-no-editor.md` §5; `requirements.md`, cenário "nenhum editor declarado no ambiente"; `actions.md` T025 |
| A008 | MEDIUM | Cobertura | O RF-26 proíbe dependência nova de tempo de execução, e é Must. Nenhuma ação o prende: a T034 confere escrita, processo, assinatura do disco e sequência de escape, e não o manifesto | `requirements.md` RF-26; `actions.md` T004, T034 |
| A009 | MEDIUM | Consistência | O RF-15 enumera as saídas que restauram o terminal, "falha não prevista, interrupção pelo usuário e suspensão para o editor", e não inclui a suspensão por `Ctrl+Z`, que a D-16, o contrato de teclado, o `onboarding.md` §3 e a T029 já tratam | `requirements.md` RF-15; `roadmap.md` D-16; `interfaces/teclado.md` §2; `actions.md` T029 |
| A010 | LOW | Consistência | A D-07 promete três módulos de borda, um por capacidade. O tratamento de sinais, interrupção e suspensão, mora em `laco.ts`, que é um quarto lugar tocando o mundo, ainda que delegue a restauração ao módulo do terminal. A tabela de componentes agora o declara, o que baixa o achado de inconsistência para imprecisão | `roadmap.md` D-07 e §5; `actions.md` T028, T029 |
| A011 | LOW | Cobertura | A RN-05, nenhum estado sobrevive entre execuções, não tem ação nem asserção própria. Ela decorre da ausência de escrita, que a T034 confere, mas decorrência não é verificação | `requirements.md` RN-05; `actions.md` T034 |
| A012 | LOW | Coerência com o legado | Os cabeçalhos de `src/webview/domain/sections.ts` falam em oito seções e sete cartões, contra as onze e dez de `types.ts`. É comentário envelhecido, não comportamento, e a T038 passa exatamente por esses arquivos | `src/webview/domain/sections.ts:29` e `:35`; `actions.md` T038 |

Nenhum achado CRITICAL ou HIGH permanece, de modo que esta seção não tem parágrafo de impacto. Dos
cinco médios, quatro se resolvem dentro da codificação, por quem escrever as ações citadas; só a
A009 exige tocar o `requirements.md`, e o lugar disso é o `/reversa-add` ou a edição manual, jamais
esta auditoria.

## 4. O que foi verificado e passou

**Cobertura**

- Os 26 requisitos funcionais têm decisão correspondente no roadmap
- As dezesseis decisões técnicas, D-01 a D-16, têm ao menos uma ação: nenhuma ficou órfã
- Vinte e cinco dos vinte e seis requisitos funcionais têm ação explícita; a exceção é o RF-26, da A008
- Dezesseis dos dezessete cenários Gherkin têm ação que os cobre; a exceção é o de editor ausente,
  da A007
- As dez regras de negócio têm cobertura, com a ressalva da A011 para a RN-05
- A RN-09 e o RF-13, que eram a lacuna mais grave da primeira passada, têm desenho, suíte e
  dependência

**Consistência**

- Os três contratos de `interfaces/` aparecem no roadmap §7, e o quarto, a consulta à origem da
  feature 007, é citado sem ser duplicado
- Todo identificador de requisito citado no roadmap existe no requirements
- Os identificadores do legado citados existem: NG-01, NG-03 e NG-04 da leitura; NG-03, NG-04 e os
  RF-02, RF-12, RF-13 e RF-14 do painel; EC-01 e EC-04; a pendência 1 do PRD
- A tabela de componentes do roadmap e os arquivos alvo do actions agora se correspondem
- O vocabulário é estável nos três documentos: quadro, linha do quadro, ênfase abstrata, efeito
  nomeado, janela de agrupamento, raiz observada, procedência e entrada nomeada aparecem sempre com
  o mesmo sentido
- As onze seções do `data-delta.md` batem com `SECTION_NAMES` do código

**Coerência com o legado**

- A promessa de que a extensão nunca escreve permanece intacta, e ganha suíte nova na T034
- As duas fronteiras que a feature desloca estão ambas declaradas: o NG-01 da leitura, pela criação
  de processo, e o NG-04 da leitura com o NG-03 do painel, pela observação do disco
- A fronteira da conexão única, do adendo 007, é preservada pela T027, que usa o módulo existente
- A premissa da T012 confere: `scripts/conteudo-esperado.js` prevê apenas `extension/out/` e
  `extension/media/`, de modo que `out-cli/` já seria recusado pela suíte do pacote

**Sanidade do actions**

- Os 44 identificadores cobrem T001 a T044 sem buraco nem repetição
- As três ações nascidas da auditoria, T042, T043 e T044, estão fora da ordem posicional e dentro
  das fases a que pertencem, o que é a regra: identificador do Reversa não se renumera
- Toda dependência aponta para identificador existente, verificado por varredura
- Não há ciclo: o grafo é acíclico, com profundidade máxima de dez
- Nenhuma ação marcada `[//]` compartilha arquivo alvo com outra `[//]`
- Os três arquivos que recebem mais de uma ação, `src/cli/laco.ts`, `tests/cli-quadro.spec.ts` e
  `tests/cli-boundaries.spec.ts`, têm suas ações encadeadas por dependência
- Toda ação nasce com status `[ ]` e confidência declarada

## 5. Histórico

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-20 | Auditoria inicial gerada por `/reversa-audit`: 3 HIGH, 6 MEDIUM, 3 LOW | reversa |
| 2026-09-20 | Segunda passada, depois de fechados A001, A002, A003 e A004: 0 HIGH, 5 MEDIUM, 3 LOW | reversa |
