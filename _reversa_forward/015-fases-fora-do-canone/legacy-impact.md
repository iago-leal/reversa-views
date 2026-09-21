# Impacto sobre o legado: `015-fases-fora-do-canone`

> Data: `2026-09-21`
> Feature: `015-fases-fora-do-canone`
> Cenário: **greenfield**. Feature greenfield, sem legado pré-existente. Âncora: `prd.md` + specs SDD.
> Política de edição no momento da execução: `allowLegacyEdits: true` com `allowedPaths` **vazio**,
> isto é, liberação **irrestrita** de toda a raiz do projeto. Nenhuma escrita foi recusada e nenhum
> arquivo pré-existente foi apagado.

Este projeto nasceu por `/reversa-new` e nunca passou por extração reversa: não há `architecture.md`
nem `domain.md`, e por isso não há regra 🟢 extraída de código a preservar ou a modificar. O mapeamento
abaixo aponta para as cinco specs de `_reversa_sdd/sdd/` e para os adendos 011, 012 e 014, que são a
âncora real.

Ao contrário da 014, que só acrescentava, esta entrega **muda comportamento já entregue**, e em três
pontos deliberados: a situação da extração ganha um quarto valor, de modo que onze projetos medidos
deixam de ler como "em curso"; o desconto de anomalia deixa de olhar só o `phase`; e o módulo gerado
do mapa passa a trazer uma terceira lista a partir da próxima promoção. Os três estão na tabela do que
foi alterado, separados do que é novo, porque é essa a distinção de que o dia da extração vai precisar.

## Arquivos afetados

### Componentes novos

| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |
|---|---|---|---|---|
| `src/domain/fases.ts` | `leitura-do-processo` | `componente-novo` | HIGH | O julgamento de um nome de fase, função pura com a precedência de cinco degraus; é a única autoridade sobre o que é fase canônica, encerramento, ciclo, etapa aprovada ou nome desconhecido (D-01 a D-03, D-05) |
| `scripts/equivalencias/fases.js` | `empacotamento-e-verificacao` | `componente-novo` | HIGH | Gêmeo CommonJS do classificador, para os scripts de manutenção; preso à fonte pela suíte de paridade (D-19) |
| `scripts/equivalencias/grafia.js` | `empacotamento-e-verificacao` | `componente-novo` | MEDIUM | Distância de edição e bases possíveis de um nome; é o filtro que impede erro de grafia de virar etapa aprovada (RN-12, D-14) |
| `scripts/equivalencias/coletar-fases.js` | `empacotamento-e-verificacao` | `componente-novo` | HIGH | A coleta das fases, com os três filtros antes do motor, a base candidata e os pares elegíveis; é onde a promessa de privacidade sobre os vizinhos é cumprida (D-04, D-16, D-18) |
| `src/cli/contagem.ts` | `painel-do-processo` | `componente-novo` | HIGH | A contagem da raiz pela mesma leitura e pela mesma composição do painel; decide o que é projeto pela leitura do host, sem caminho de arquivo do Reversa (D-20, D-22) |
| `scripts/contar-anomalias.js` | `empacotamento-e-verificacao` | `componente-novo` | MEDIUM | Casca do comando, no molde de `scripts/painel.js`; também é por onde o aprendizado e a promoção chamam a contagem |
| Dezesseis suítes e três auxiliares em `tests/`, e sete amostras em `tests/fixtures/descoberta/` | as cinco specs | `componente-novo` | MEDIUM | Catorze suítes novas cobrem o classificador, o eixo, o mapa, a coleta, o motor, a proposta, a rodada inteira, a contagem, a paridade dos classificadores, o cartão, o canal e os casos doentes |

### Componentes pré-existentes alterados

| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |
|---|---|---|---|---|
| `src/domain/discovery-state.ts` | `leitura-do-processo`, adendos 011 e 012 | `regra-alterada` | HIGH | O eixo julga as três listas pelo classificador; amplia `absorvidas` a toda `fase-desconhecida` sobre fase de ciclo ou etapa aprovada e à `fase-atual-ja-concluida` do encerramento sem declaração; deriva `ciclo` e `etapas`; registra `encerramento-com-pendencia`. `declaraEncerramento` e a lista das canônicas mudaram de módulo, sem mudar de regra |
| `src/domain/types.ts` | `leitura-do-processo`, seção 9 | `delta-de-dados` | HIGH | `ExtractionSituation` vai a quatro valores, `DiscoveryStateAnomalyCode` a dois, `DiscoveryStateAxis` ganha `ciclo` e `etapas` opcionais ao fim, `MapaDeEquivalencias` ganha `etapas` opcional; nascem `FaseCanonica`, `CicloCorrente`, `FaseDoCiclo`, `EtapaReconhecida` e `EtapaAprovada` |
| `scripts/equivalencias/gerar-mapa.js` | adendo 012 | `regra-alterada` | HIGH | `lerMapaDeModulo`, `fundir` e `gerarModulo` passam a carregar `etapas`. Era o risco maior da feature: a promoção funde sobre o que a releitura devolve, e o que não voltasse dela deixaria de existir no módulo regenerado |
| `scripts/equivalencias/motor.js` | adendo 012 | `delta-de-contrato-externo` | MEDIUM | O pedido e o tempo-limite foram fatorados em `criarPergunta`, e nasceram as perguntas de natureza e de comparação. Continua sendo o único arquivo do repositório que fala com um serviço |
| `scripts/equivalencias/proposta.js` | adendo 012 | `regra-alterada` | MEDIUM | A proposta ganha a seção de fases, com caixas por nome, grupos pelo fecho dos pares `mesma`, razão só na comparação e duas listas sem caixa; ganha `lerEtapasMarcadas` e a anotação da raiz varrida |
| `scripts/aprender-equivalencias.js` | adendo 012 | `regra-alterada` | MEDIUM | Ganha a passagem das fases depois da dos checkpoints e antes de qualquer escrita, e a contagem da raiz ao fim |
| `scripts/promover-equivalencias.js` | adendo 012 | `regra-alterada` | MEDIUM | Lê as etapas marcadas, funde-as, aceita `--destino=` e `--raiz=`, e conta a raiz com o mapa que acabou de fundir. Continua sem importar o motor |
| `src/webview/domain/labels.ts` | `painel-do-processo` | `regra-nova` | MEDIUM | Cinco funções de frase, partilhadas pela tela e pelo terminal, e o rótulo da quarta situação |
| `src/webview/ui/DiscoverySection.tsx` | `painel-do-processo` | `regra-alterada` | MEDIUM | Havendo ciclo, as cinco fases trocam de fonte; nascem a frase do ciclo, a linha das etapas, a frase da etapa em curso e a do encerramento sem declaração. Sem os campos novos, o cartão é o de antes |
| `src/cli/quadro/secoes.ts` | adendo 014 | `regra-alterada` | MEDIUM | O mesmo desenho, com as mesmas frases |
| `scripts/estragar-descoberta.js` | `empacotamento-e-verificacao` | `regra-nova` | LOW | Três casos doentes em lista própria, aceitos pelo mesmo comando |
| `src/heranca/PROCEDENCIA.md` | `heranca-e-sincronia` | `regra-nova` | LOW | Terceira linha na subseção de pendências de origem. É arquivo da casa, e não da origem; o total de adaptações declaradas não mudou |
| `package.json` | `empacotamento-e-verificacao` | `regra-nova` | LOW | Quatro scripts ao fim: a contagem e os três passos que constroem a unidade de terminal |
| `tests/host-manifest.spec.ts`, `tests/host-protocol.spec.ts`, `tests/cli-paridade.spec.tsx` | `ponte-e-host`, adendo 014 | `regra-alterada` | LOW | Duas guardas de inventário atualizadas por acréscimo (scripts e campos do eixo), e cinco casos novos na suíte de paridade, sem tocar nos existentes |

## Diff conceitual por componente

**Leitura do processo.** Até aqui, o nome de fase era julgado dentro de `lerExtracao`, só sobre
`phase`, em três degraus. Agora há um classificador próprio, de cinco degraus, e o eixo o aplica às
três listas. O efeito observável é que o projeto re-extraído deixa de produzir uma anomalia por fase
de ciclo, e passa a informar em que ciclo está e como estão as cinco fases nele. A camada herdada não
foi tocada: `derivePhases` continua registrando `fase-desconhecida` sobre tudo o que está fora do
cânone, a lista herdada continua cruzando o canal inteira, e o que muda é a identidade do que a
composição desconta. Duas leituras novas nascem sobre a mesma forma: o encerramento que ninguém
declarou, medido em onze projetos, e o encerramento declarado sobre trabalho pendente, que é defeito
de gravação e ganha anomalia própria para não sumir junto com o ruído.

**Mapa de equivalências.** O mapa ganha um terceiro conjunto de registros, o das etapas. O regime é o
mesmo dos pares: propor não é dispor, a proposta nasce desmarcada, a promoção não conhece o motor.
Duas diferenças são deliberadas. Não há conflito possível entre etapas, porque o registro não carrega
leitura, e aprovar de novo só une a evidência. E cada nome é registro independente, sem relação de
sinônimo: o agrupamento que o motor sugere é apresentação da proposta e não chega ao mapa.

**Ponte e host.** Nenhum campo novo no topo de `SetProcessData`. O que cresce é o interior de
`discoveryState`, por campos opcionais ao fim, e uma tela diante de host anterior desenha o que
desenhava na 014, com as anomalias de fase de volta.

**Painel do processo, nas duas superfícies.** As frases novas vivem num lugar só, `labels.ts`, e são
desenhadas duas vezes. A suíte de paridade cobre os cinco casos.

**Empacotamento e verificação.** Nasce um comando só de leitura que conta, por código e por projeto, o
que o painel exibe na raiz inteira, e diz quais códigos o mapa alcança. Ele passa pela leitura e pela
composição reais, e por isso mora na unidade de terminal, fora do pacote.

## Preservadas

Seção vazia, por cenário: projeto greenfield, sem regra 🟢 extraída de código. O que esta entrega
preservou de propósito está em `regression-watch.md`, seção de observações: as promessas negativas da
leitura (sem escrita, sem processo filho, sem rede), a camada herdada intocada, o motor como único
cliente de serviço e fora do pacote, e a leitura idêntica do projeto sem ciclo e sem etapa aprovada.

## Modificadas

Seção vazia, pelo mesmo motivo. As três mudanças deliberadas de comportamento entregue, que uma
extração futura deve encontrar já na forma nova, são: a quarta situação da extração, o desconto
ampliado a nome reconhecido em qualquer das três listas, e a terceira lista do módulo gerado do mapa.
