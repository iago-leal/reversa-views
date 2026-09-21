# Vigilância de regressão: 015-fases-fora-do-canone

**Data:** 2026-09-21
**Feature:** `015-fases-fora-do-canone`
**Cenário:** greenfield.

Este projeto não tem extração de `/reversa`: o contexto vem de `_reversa_sdd/prd.md` e das cinco specs
de `_reversa_sdd/sdd/`. Não há regra 🟢 confirmada sobre código existente, e por isso o watch principal
nasce vazio. O que esta entrega deixou de verdades a manter está em "Observações", sem peso de
regressão. Elas ganham peso quando uma `/reversa` futura, rodando sobre o código novo, confirmar cada
uma como 🟢.

O modo de regredir próprio desta feature é o **reconhecimento que escorrega para saneamento**. Tudo o
que ela faz é decidir o que merece a atenção de quem lê, e nada do que ela faz pode alterar o que o
disco diz: o nome que a tela mostra é o bruto, a lista herdada cruza o canal inteira, e nenhum
`state.json` é reescrito. Uma mudança futura que normalizasse o nome antes de mostrá-lo, que filtrasse
a lista herdada no host ou que descontasse por código em vez de por tripla passaria por melhoria e
seria regressão.

O segundo modo é a **divergência entre os dois classificadores**. `src/domain/fases.ts` e
`scripts/equivalencias/fases.js` são gêmeos por necessidade, e o que os prende é uma suíte sobre a
mesma tabela de casos. Regra mudada num só deles faz o painel reconhecer o que o aprendizado ainda
propõe, ou o contrário, sem que nada mais caia.

## Watch principal

| ID | Origem (arquivo, seção) | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|----|-------------------------|-----------------------------|---------------------|-------------------|

Vazio, por cenário.

## Histórico de re-extrações

Nenhuma até aqui.

## Arquivadas

Nenhuma até aqui.

## Observações

Sem peso de regressão até que uma extração as confirme.

| ID | Origem (arquivo, seção) | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|----|-------------------------|-----------------------------|---------------------|-------------------|
| W001 | `requirements.md`, RN-01 e RF-02 | A precedência do julgamento é canônica, encerramento, ciclo, etapa aprovada, desconhecida, e `concluido-c3` lê como encerramento | presença | O ciclo testado antes do encerramento, ou a comparação canônica deixando de ser exata |
| W002 | `requirements.md`, RN-01 | A fase de ciclo é reconhecida pela forma, a partir de base conhecida, com o resto em `^[-_]\S*?(\d+)$`; `geracao-c`, `geracao-2a` e `geracao2` não casam | redação | Lista literal de nomes de ciclo, ou extração genérica da base na leitura |
| W003 | `requirements.md`, RN-02 e RN-03 | A etapa só é reconhecida por aprovação no mapa, comparada sem caixa e sem bordas e COM diacríticos; o sufixo numérico vale sobre a base aprovada, e a base mais longa vence | presença | Etapa reconhecida sem registro no mapa, ou diacríticos removidos na comparação |
| W004 | `requirements.md`, RN-03 e RN-08 | O inteiro de uma etapa com sufixo é `sufixo`, e nunca entra na conta do ciclo; nenhuma chave de topo além de `phase`, `completed` e `pending` é lida | ausência | `re-extracao-005` fazendo o painel declarar ciclo 5, ou leitura de `cycle` e `cycle_N` |
| W005 | `requirements.md`, RN-04 | O desconto casa arquivo, código e detalhe ao mesmo tempo, e alcança só nome reconhecido; o erro de grafia continua na tela | presença | Desconto por código, ou `escavacão` sumindo da lista de anomalias |
| W006 | `requirements.md`, RN-05 | Reconhecer não é sanear: a lista herdada cruza o canal inteira, o nome mostrado é o bruto, nenhum `state.json` é escrito | ausência | Filtro da lista herdada no host, nome normalizado na tela, ou escrita em arquivo de projeto |
| W007 | `requirements.md`, RN-06 e RF-07 | Encerramento declarado com nome reconhecido em `pending` produz UMA anomalia `encerramento-com-pendencia`, com o `phase` e os pendentes no detalhe | presença | Uma anomalia por nome, ou o defeito sumindo junto com as `fase-desconhecida` |
| W008 | `requirements.md`, RN-11 e RF-20 | O encerramento sem declaração exige as três condições juntas, cede ao encerramento declarado, e desconta só a `fase-atual-ja-concluida` sobre o `phase` | presença | Extração com `pending` povoado lendo como encerrada, ou a frase do encerramento declarado dita sobre arquivo que nada declarou |
| W009 | `requirements.md`, RF-04 | Com o mapa sem etapas, o projeto sem fase de ciclo lê como lia; os campos `ciclo` e `etapas` vêm AUSENTES, e não vazios | ausência | Campo novo presente e vazio, ou suíte das features 011, 012 e 014 reescrita para passar |
| W010 | `roadmap.md`, D-06 | A releitura do módulo do mapa devolve as três listas, e promover checkpoint sobre mapa com etapas deixa as etapas intactas | presença | `lerMapaDeModulo` devolvendo só `pares` e `naoAgentes` a partir de módulo que traz `etapas` |
| W011 | `requirements.md`, RN-02 | Cada etapa aprovada é registro independente, com `nome`, `aprovadoEm` e `evidencia`, e nada mais | ausência | Campo de grupo, de sinônimo ou de leitura no registro da etapa |
| W012 | `requirements.md`, RN-07 e RNF de privacidade | Só valor com forma de identificador é candidato, e os vizinhos enviados ao motor passam pelo mesmo filtro antes de sair | ausência | Prosa de um `pending` defeituoso na proposta ou na mensagem ao motor |
| W013 | `requirements.md`, RN-12 e RF-21 | Nome a até dois caracteres de uma fase canônica, medido sobre o nome inteiro e sobre cada base possível, vai à lista sem caixa e não vai ao motor | presença | `escavacão-c2` com caixa de aprovação |
| W014 | `requirements.md`, RN-09 e RF-17 | O motor roda só no aprendizado; conexão recusada em qualquer pergunta encerra a rodada sem escrever nada; a promoção não importa o motor | ausência | Proposta pela metade, ou `motor.js` alcançável a partir da promoção, da contagem, da extensão ou da suíte |
| W015 | `roadmap.md`, D-15 | `scripts/equivalencias/motor.js` é o único arquivo do repositório que fala com um serviço, e fica fora do pacote | ausência | Segundo `fetch` no repositório, ou `scripts/` dentro do `.vsix` |
| W016 | `roadmap.md`, D-17 | A proposta mostra a razão do motor só na comparação; ao lado de cada nome vai a evidência medida | ausência | Razão da pergunta de natureza ao lado de uma caixa de aprovação |
| W017 | `roadmap.md`, D-19 | Os dois classificadores dizem o mesmo sobre a mesma tabela de casos | presença | `tests/fases-paridade.spec.ts` afrouxada, ou caso acrescentado num lado só |
| W018 | `requirements.md`, RN-10 e RF-16 | A contagem é a da raiz inteira, por código, passa por `readWorkspace` e `composeAnomalies`, marca os códigos ao alcance do mapa e não escreve nada | presença | Releitura do disco por caminho próprio em `src/cli/contagem.ts`, ou contagem que cala sobre projeto sem leitura |
| W019 | `roadmap.md`, D-13, e adendo 014 | As frases do ciclo, das etapas, da etapa em curso e do encerramento sem declaração nascem em `labels.ts` e são as mesmas na tela e no terminal | presença | Frase escrita em `DiscoverySection.tsx` ou em `src/cli/quadro/secoes.ts` |
| W020 | `requirements.md`, RN-08 e RN-13 | Havendo ciclo, são cinco fases, as do ciclo corrente, com o nome bruto ao lado; com etapa em curso, nenhuma das cinco é a atual | presença | Sexta fase no cartão, ciclo anterior desenhado, ou fase marcada como corrente ao lado de etapa em curso |
| W021 | `interfaces/protocolo-webview.md` | `SetProcessData` não ganha campo no topo; `discoveryState` cresce por campos opcionais ao fim, e a tela diante de host anterior desenha o que desenhava na 014 | ausência | Campo novo obrigatório, ou frase nova dita sem o campo que a sustenta |
| W022 | `requirements.md`, RF-19 | A fase de ciclo consta das pendências de origem de `src/heranca/PROCEDENCIA.md`, e o total de adaptações declaradas não mudou | presença | Adaptação nova na camada herdada, ou arquivo da origem tocado |
