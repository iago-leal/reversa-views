# Adendo: fases fora do cânone, ciclo e encerramento não declarado

> Identificador da feature: `015-fases-fora-do-canone`
> Data: `2026-09-21`
> Cenário: `greenfield`
> Gerado por: `/reversa-sync`

Até a 014, quem lesse a extração encontraria um julgamento de fase em três degraus, aplicado só ao
`phase`: a fase canônica, a família do encerramento que a 011 reconheceu, e o resto como anomalia. Desde
a 015 o julgamento tem **cinco degraus**, mora em módulo próprio e vale para as três listas do
`state.json`. O projeto re-extraído, que grava `escavacao-c2` e `geracao-c3`, deixa de produzir uma
anomalia por fase e passa a informar em que ciclo está.

Ao contrário da 014, que só acrescentava, esta entrega **muda comportamento já entregue** em três pontos
deliberados, e é isso que o adendo precisa deixar registrado: a situação da extração ganha um quarto
valor, o desconto de anomalia deixa de olhar só o `phase`, e o módulo gerado do mapa de equivalências
passa a trazer uma terceira lista a partir da próxima promoção.

## Vigência

Vigente desde 2026-09-21.

## Resumo da entrega

A medição sobre `~/dev` que motivou a feature achou, depois da primeira promoção da 012, anomalias de
fase que o mapa não alcançava: nomes de ciclo de re-extração, etapas que os projetos inventaram fora das
cinco fases, onze extrações terminadas que ninguém declarou encerradas, e um encerramento declarado
sobre trabalho pendente, que é defeito verdadeiro de gravação e só se via por acidente, no meio do ruído.

A resposta tem dois eixos. O primeiro é o reconhecimento **pela forma**, sem motor e sem decisão
pendente: a fase de ciclo é fase canônica seguida de `^[-_]\S*?(\d+)$`, e a extração encerrada sem
declaração exige três condições juntas (`pending` vazio, `phase` reconhecido e já concluído, as cinco
fases do ciclo corrente concluídas). O segundo é o reconhecimento **por aprovação**: o mapa de
equivalências ganha o conjunto das etapas, no mesmo regime dos pares da 012, em que o motor local
propõe, o usuário marca e a promoção, que não conhece o motor, dispõe. A prova de viabilidade reprovou a
pergunta única de três respostas (6 de 14) e fixou duas perguntas de duas respostas, natureza (14 de 14)
e comparação (7 de 9, sem falso `mesma`). Três filtros antecedem o motor: o valor sem forma de
identificador não é candidato, o que o mapa ou a forma já decidem não é perguntado de novo, e o nome a
até dois caracteres de uma fase canônica vai a uma lista sem caixa, porque erro de grafia não pode virar
etapa aprovada.

Na tela e no terminal, havendo ciclo, as cinco fases passam a ser as do ciclo corrente, sob uma frase
que o nomeia; as etapas aprovadas presentes ganham uma linha de texto com menção ao mapa; a etapa em
curso e o encerramento sem declaração ganham frase própria. As frases nascem uma vez, em
`src/webview/domain/labels.ts`, e são desenhadas duas. Nasce ainda `npm run contar:anomalias -- <raiz>`,
comando só de leitura que conta, por código e por projeto, o que o painel exibe na raiz inteira, e diz
quais códigos o mapa alcança; o aprendizado e a promoção o chamam ao fim, para que anomalia restante
não volte a ficar invisível depois de uma promoção.

Quarenta e seis ações executadas, todas marcadas `[X]` em `actions.md`, nenhuma falha; o
`progress.jsonl` tem 46 linhas `done`. A suíte foi de 2189 testes em 125 arquivos a 2424 em 139. Sobre
`~/dev`, a contagem real lê 64 projetos e 250 anomalias em 0,8 s, sem alterar arquivo algum.

**Nenhuma etapa foi aprovada nesta entrega.** O módulo gerado `src/domain/equivalencias.ts` está
intocado e segue sem a lista `etapas`; o tipo o aceita assim, e a primeira promoção depois da feature o
reescreve com o campo. Rodar o aprendizado, marcar a proposta e promover é ato do usuário.

## Impacto por artefato da extração

| Artefato | Seção | Tipo de impacto | Delta |
|---|---|---|---|
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#6-requisitos-funcionais` | componente-novo | O julgamento de um nome de fase mora agora em `src/domain/fases.ts`, função pura, com precedência canônica, encerramento, ciclo, etapa aprovada, desconhecida; a comparação canônica continua exata, e `concluido-c3` lê como encerramento, e não como ciclo. Implementa RF-01, RF-02, RF-03 e RF-05. **Registrado como W001 a W004.** |
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#6-requisitos-funcionais` | regra-alterada | O eixo da descoberta julga `phase`, `completed` e `pending`, e o desconto alcança toda `fase-desconhecida` cujo detalhe seja fase de ciclo ou etapa aprovada, venha de que lista vier. A identidade do desconto continua sendo arquivo, código e detalhe ao mesmo tempo, e o erro de grafia continua na tela. Implementa RF-06. **Registrado como W005.** |
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#9-modelo-de-dados` | delta-de-dados | `ExtractionSituation` vai a quatro valores, com `encerrada-sem-declaracao`; `DiscoveryStateAnomalyCode` a dois, com `encerramento-com-pendencia`; `DiscoveryStateAxis` ganha `ciclo` e `etapas`, opcionais e **ausentes, não vazios**, quando nada os sustenta; `MapaDeEquivalencias` ganha `etapas` opcional. Forma completa em `data-delta.md` da feature. Implementa RF-09 e RF-20. **Registrado como W008 e W009.** |
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#11-edge-cases-e-tratamento-de-erros` | regra-nova | Encerramento declarado com nome reconhecido ainda em `pending` produz **uma** anomalia por projeto, com o `phase` e os pendentes no detalhe; é o defeito que sumiria junto com o ruído se o desconto fosse só ampliado. O valor sem forma de identificador, como a prosa no `pending` do `DelphiSga`, segue anomalia e nunca é candidato a fase. Implementa RF-07 e RF-08. **Registrado como W007 e W012.** |
| `_reversa_sdd/sdd/leitura-do-processo.md` | `#4-non-goals-fora-do-escopo` | regra-nova | Reconhecer não é sanear: a lista herdada de anomalias cruza o canal inteira, o nome mostrado é o bruto do disco, nenhum `state.json` é escrito, e nenhuma chave de topo além de `phase`, `completed`, `pending` e `checkpoints` é lida (`cycle`, `cycle_N` e as grafias de re-extração ficam fora). O inteiro de uma etapa com sufixo nunca conta como ciclo. Implementa RF-04. **Registrado como W004, W006 e W009.** |
| `_reversa_sdd/addenda/011-estado-terminal-e-checkpoints.md` | tabela de impacto | regra-alterada | `declaraEncerramento` e a lista das cinco canônicas mudaram de módulo, para `src/domain/fases.ts`, sem mudar de regra; o encerramento declarado tem precedência sobre o não declarado, e as suítes da 011 passam sem linha reescrita. Leia a situação da extração da 011 como três dos quatro valores de hoje. **Registrado como W001 e W008.** |
| `_reversa_sdd/addenda/012-equivalencias-de-checkpoint.md` | tabela de impacto | regra-alterada | O mapa tem agora três conjuntos. `lerMapaDeModulo`, `fundir` e `gerarModulo` carregam `etapas`, porque a promoção funde sobre o que a releitura devolve, e o que não voltasse dela deixaria de existir no módulo regenerado. Cada etapa é registro independente, com `nome`, `aprovadoEm` e `evidencia`; não há conflito possível entre etapas, e a recusa por conflito continua valendo só para os pares. Implementa RF-03 e RF-15. **Registrado como W010 e W011.** |
| `_reversa_sdd/addenda/012-equivalencias-de-checkpoint.md` | tabela de impacto | delta-de-contrato-externo | O motor local recebe duas perguntas novas, de natureza e de comparação, sobre o mesmo transporte e o mesmo tempo-limite, fatorados em `criarPergunta`. `scripts/equivalencias/motor.js` continua sendo o único arquivo do repositório que fala com um serviço, fica fora do pacote, e a promoção continua sem importá-lo; conexão recusada em qualquer pergunta encerra a rodada sem escrever nada. Implementa RF-13 e RF-17. **Registrado como W014 e W015.** |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#6-requisitos-funcionais` | componente-novo | A coleta das fases (`scripts/equivalencias/coletar-fases.js`), o filtro de grafia (`grafia.js`) e o gêmeo CommonJS do classificador (`fases.js`) servem ao aprendizado; a proposta ganha a seção de fases, com caixas por nome, grupos pelo fecho dos pares `mesma`, razão do motor só na comparação e duas listas sem caixa. Implementa RF-12, RF-14 e RF-21. **Registrado como W012, W013, W016 e W017.** |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#8-design-e-interface` | componente-novo | `npm run contar:anomalias -- <raiz>`, com tabela em texto e `--json`: `scripts/contar-anomalias.js` é casca no molde de `scripts/painel.js`, e a contagem mora em `src/cli/contagem.ts`, na unidade de terminal, porque passa por `readWorkspace` e `composeAnomalies` reais. O `package.json` declara agora trinta scripts; os três passos `pre*` constroem a unidade de terminal antes de contar, aprender e promover. Implementa RF-16. **Registrado como W018.** |
| `_reversa_sdd/sdd/empacotamento-e-verificacao.md` | `#11-edge-cases-e-tratamento-de-erros` | regra-alterada | Duas guardas de inventário mudaram de expectativa, por acréscimo: `tests/host-manifest.spec.ts` enumera trinta scripts, e `tests/host-protocol.spec.ts` enumera sete campos no eixo, os dois opcionais ao fim. O `estragar:descoberta` aceita três casos doentes novos, em lista própria, porque a suíte do preview prende a lista original em cinco. Implementa RF-18. |
| `_reversa_sdd/sdd/ponte-e-host.md` | `#9-modelo-de-dados` | delta-de-dados | `SetProcessData` não ganha campo no topo; o que cresce é o interior de `discoveryState`, por campos opcionais ao fim. Tela nova diante de host anterior desenha o que desenhava na 014, sem ciclo e com as anomalias de fase de volta. Implementa RF-11. **Registrado como W021.** |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#6-requisitos-funcionais` | regra-alterada | Havendo ciclo, as cinco fases do cartão da Descoberta trocam de fonte: são as do ciclo corrente, com o nome bruto ao lado, sob a frase que nomeia o ciclo; ciclos anteriores não aparecem; com etapa em curso, nenhuma das cinco é a atual. Sem os campos novos, o cartão é o de antes. Implementa RF-10 e RF-22. **Registrado como W020.** |
| `_reversa_sdd/sdd/painel-do-processo.md` | `#8-design-e-interface` | regra-nova | Cinco funções de frase em `src/webview/domain/labels.ts` (ciclo, marcas das fases, linha das etapas, etapa em curso, encerramento sem declaração) e o rótulo da quarta situação, partilhados por `DiscoverySection.tsx` e por `src/cli/quadro/secoes.ts`; `tests/cli-paridade.spec.tsx` cobre os cinco casos novos. Leia como requisito das duas superfícies, no regime que a 014 inaugurou. **Registrado como W019.** |
| `_reversa_sdd/sdd/heranca-e-sincronia.md` | `#6-requisitos-funcionais` | regra-nova | A fase de ciclo consta das pendências de origem de `src/heranca/PROCEDENCIA.md`, como terceira linha: é vocabulário que os projetos gravam e a origem não reconhece. A camada herdada não foi tocada, `derivePhases` continua registrando `fase-desconhecida` sobre tudo o que está fora do cânone, e o total de adaptações declaradas não mudou. Implementa RF-19. **Registrado como W022.** |
| `_reversa_sdd/prd.md` | `#6-restricoes` | regra-nova | As promessas negativas da leitura sobrevivem inteiras: sem escrita, sem processo filho, sem rede. O motor local roda só no aprendizado, que é script de manutenção fora do pacote, e a contagem é só de leitura. **Registrado como W006, W014 e W015.** |

Dezesseis impactos: cinco `regra-alterada`, cinco `regra-nova`, três `componente-novo`, dois
`delta-de-dados` e um `delta-de-contrato-externo`.

## O que o texto deliberadamente não diz

Vale registrar, porque a extração não tem como adivinhar que uma ausência foi escolhida. Não há lista
literal de nomes de ciclo nem de etapa no código: o ciclo é forma, a etapa é aprovação, e a alternativa
da lista é a que a 011 já tinha recusado. Não há relação de sinônimo entre etapas no mapa: o
agrupamento que o motor sugere é apresentação da proposta e não chega ao módulo gerado. Os diacríticos
são preservados na comparação, de propósito, porque removê-los faria `escavacão` casar com `escavacao`
e esconderia o erro de grafia que a feature quer manter à vista.

Fica também uma divergência conhecida entre texto e código. O achado A001 da auditoria aponta um
cenário de aceite do `requirements.md` que diz "com ciclo 3" onde a RN-03 manda que o inteiro de uma
etapa com sufixo não conte como ciclo. O código segue a regra; a redação do cenário segue pendente, e
corrigi-la cabe ao `/reversa-clarify` ou à edição do usuário.

## Regras sob vigilância

O watch principal de `regression-watch.md` continua **vazio**, pelo mesmo motivo das features 001 a 014:
sem extração `/reversa` sobre este repositório não há regras 🟢 a vigiar. Na seção "Observações", sem
peso de regressão, os identificadores **W001 a W022** cobrem as regras `RN-01` a `RN-13`, os requisitos
funcionais e as decisões D-06, D-13, D-15, D-17 e D-19 do roadmap.

A esta feature o arquivo acrescenta dois modos de regredir. O primeiro é o **reconhecimento que
escorrega para saneamento**: normalizar o nome antes de mostrá-lo, filtrar a lista herdada no host ou
descontar por código em vez de por tripla passaria por melhoria e seria regressão. O segundo é a
**divergência entre os dois classificadores**, o de `src/domain/fases.ts` e o gêmeo CommonJS, presos
um ao outro só por `tests/fases-paridade.spec.ts` sobre a mesma tabela de casos; afrouxá-la é o sinal de
violação mais grave da lista.

Como nas features anteriores, a numeração recomeça em W001, e o identificador só é legível junto do nome
da feature que o escreveu.

Conteúdo integral em `_reversa_forward/015-fases-fora-do-canone/regression-watch.md`.

## Fontes

- `_reversa_forward/015-fases-fora-do-canone/legacy-impact.md`
- `_reversa_forward/015-fases-fora-do-canone/regression-watch.md`
- `_reversa_forward/015-fases-fora-do-canone/requirements.md`
- `_reversa_forward/015-fases-fora-do-canone/roadmap.md`
- `_reversa_forward/015-fases-fora-do-canone/data-delta.md`
- `_reversa_forward/015-fases-fora-do-canone/prova-de-viabilidade.md`
- `_reversa_forward/015-fases-fora-do-canone/audit/cross-check.md`
- `_reversa_forward/015-fases-fora-do-canone/progress.jsonl`
