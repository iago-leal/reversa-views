# Roadmap: fases fora do cânone, ciclo e encerramento não declarado

> Identificador: `015-fases-fora-do-canone`
> Data: `2026-09-21`
> Requirements: `_reversa_forward/015-fases-fora-do-canone/requirements.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

O julgamento do nome de fase sai de dentro de `lerExtracao` e vira função pura própria, com uma
precedência de cinco degraus: fase canônica, família do encerramento, fase de ciclo, etapa aprovada
e, por fim, nome desconhecido. Os três primeiros degraus são forma; o quarto consulta o mapa, que
ganha um terceiro conjunto de registros, o das etapas; o quinto é o que continua anomalia. Sobre
esse julgamento, o eixo da descoberta passa a fazer quatro coisas que não fazia: desconta a
`fase-desconhecida` de todo nome reconhecido, em qualquer das três listas; informa o ciclo corrente
e a situação das cinco fases nele; lista as etapas aprovadas presentes; e reconhece o encerramento
sem declaração, descontando a `fase-atual-ja-concluida` que o acompanha. Uma anomalia nova nomeia o
encerramento declarado com fase pendente, para que o defeito do `afla` não suma junto com o ruído.

Do lado da manutenção, o aprendizado ganha uma passagem de fases ao lado da de checkpoints, com as
duas perguntas que a prova de viabilidade sustentou, e um comando novo conta as anomalias da raiz
por código. A camada herdada não é tocada, e nenhum `state.json` é reescrito.

## 2. Princípios aplicados

O projeto não tem `.reversa/principles.md`. Como nas features anteriores, os não-objetivos e os
requisitos não funcionais das specs cumprem esse papel.

| Princípio de fato | Como a feature se relaciona | Status |
|-----------|------------------------------|--------|
| NG-05, não sanear os arquivos do Reversa | O reconhecimento acontece em memória, o nome bruto acompanha o reconhecido até a tela, e a lista herdada de anomalias continua cruzando o canal inteira | respeita |
| NG-03, decidir o que a tela mostra pertence ao painel | O desconto continua sendo composto do lado da tela, em `src/webview/domain/anomalies-view.ts`, sobre a identidade que o eixo entrega | respeita |
| NG-01, NG-04 e RNF-04, leitura sem escrita, sem processo filho e sem rede | O classificador de nomes é função pura sobre o `state.json` que a sonda já trouxe. Quem fala com o motor continua sendo um arquivo só, `scripts/equivalencias/motor.js`, fora do pacote | respeita |
| RNF-01, leitura abaixo de 200 ms | Nenhum arquivo novo é aberto; o custo é o de classificar algumas dezenas de cadeias curtas por projeto | respeita |
| Camada herdada intocada (`heranca-e-sincronia.md`, RF de adaptações) | `derivePhases` segue registrando `fase-desconhecida` sobre tudo o que está fora do cânone. A dívida com a origem vai a `PROCEDENCIA.md`, sem adaptação nova | respeita |
| Carga cresce só por acréscimo (`ponte-e-host.md#9-modelo-de-dados`) | Os campos novos do eixo são opcionais e entram ao fim; o do mapa também | respeita |
| Propor não é dispor (adendo 012) | O aprendizado escreve só a proposta, a promoção escreve só o mapa e não importa o motor | respeita |

Nenhum conflito.

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|----|---------|----------------|--------------------------|-------------|
| D-01 | O julgamento do nome vive em módulo puro novo, `src/domain/fases.ts`, com a função `classificarNome(bruto, mapa)`, e `discovery-state.ts` passa a usá-la para `phase`, `completed` e `pending` | Hoje a precedência está embutida em `lerExtracao` e só olha `phase`. Três consumidores precisam do mesmo julgamento (extração, desconto e ciclo), e uma função só é o que impede que divirjam | Estender `lerExtracao` no lugar; três testes espalhados pelo módulo | 🟢 |
| D-02 | A precedência é: canônica, encerramento, ciclo, etapa aprovada, desconhecida. Os dois primeiros degraus ficam exatamente como a 011 os escreveu | RF-02: `concluido-c3` tem sufixo numérico e precisa ler como encerramento. As suítes da 011 passam sem linha reescrita porque o que elas exercitam não muda de lugar na ordem | Ciclo antes do encerramento, que quebraria o `afla` | 🟢 |
| D-03 | Na leitura, o sufixo é reconhecido **por prefixo conhecido**: para cada fase canônica, e depois para cada etapa aprovada, o nome casa quando começa pela base e o resto tem a forma `^[-_]\S*?(\d+)$`. A leitura nunca extrai a base de um nome que não conhece | A extração genérica da base é ambígua: em `re-extracao-003`, tanto `re` quanto `re-extracao` são bases possíveis. Partindo da base conhecida, a ambiguidade não existe, e `-c2`, `-2`, `-ciclo-2` e `_c2` casam pela mesma regra | Expressão regular única com base livre, que leria `verificacao` como base de `verificacao-regressao-c3` | 🟢 |
| D-04 | Na **coleta**, onde a base ainda não é conhecida, o candidato é proposto pela forma estreita do sufixo: separador, letras opcionais coladas e inteiro ao fim (`[-_][a-z]*\d+$`). `re-extracao-003`, `-004` e `-005` viram um candidato só, `re-extracao`, com os três nomes como evidência | É a única forma que extrai a base certa dos nomes medidos. O erro possível é propor `x-ciclo` para `x-ciclo-2`, e ele cai diante de uma pessoa, que é para isso que a proposta existe; aprovada a base, a leitura reconhece as variantes por D-03 | Propor cada nome com sufixo como candidato próprio, que pediria três aprovações para a mesma etapa e contraria a RN-03 | 🟡 |
| D-05 | A comparação da etapa com o mapa ignora caixa e espaços nas bordas, e não remove diacríticos; a das fases canônicas continua exata | RN-02, e o precedente de `valorComparavel` na 012: `concluido` e `concluído` são grafias que uma pessoa aprova em separado. Afrouxar a canônica faria `Escavacao` deixar de ser o erro de grafia que a RN-04 manda mostrar | Normalização comum às duas | 🟢 |
| D-06 | `MapaDeEquivalencias` ganha `etapas`, **opcional**, com `nome`, `aprovadoEm` e `evidencia`. O gerador passa a escrevê-lo sempre, e `lerMapaDeModulo` e `fundir` passam a carregá-lo | Opcional porque as suítes da 012 montam mapas à mão com dois campos, e nenhuma pode ser reescrita. O cuidado com `lerMapaDeModulo` é o risco maior da feature: como está, ele devolve só `pares` e `naoAgentes`, e uma promoção de checkpoints apagaria as etapas já aprovadas | Campo obrigatório; mapa das etapas em módulo separado, que duplicaria o gerador e o rito | 🟢 |
| D-07 | `ExtractionSituation` ganha o valor `encerrada-sem-declaracao`, em vez de uma marca ao lado de `encerrada` | A tela e o terminal testam `situacao === 'encerrada'` para escrever "o processo declarou o fim na fase X". Com valor próprio, essa frase não dispara sobre quem não declarou nada, e a RN-06 continua valendo só para o encerramento declarado | Booleano `declarada`, que obrigaria a revisitar todo teste de `encerrada` | 🟢 |
| D-08 | O desconto continua sendo a tripla inteira em `absorvidas`, e a lista cresce: toda `fase-desconhecida` cujo detalhe classifique como ciclo ou etapa, e a `fase-atual-ja-concluida` cujo detalhe seja o `phase` de uma extração encerrada sem declaração. A regra antiga do encerramento fica como está | `anomalies-view.ts` já desconta por tripla, para a tela e para o terminal; nada muda do lado de lá. Host anterior não manda essas triplas, e as anomalias voltam à tela, que é o RF-11 | Descontar por código; filtrar no host, que violaria NG-03 | 🟢 |
| D-09 | A anomalia nova tem o código `encerramento-com-pendencia`, entra em `DiscoveryStateAnomalyCode`, e o detalhe nomeia o `phase` e os nomes reconhecidos que ficaram em `pending`. Nome não reconhecido em `pending` não entra no detalhe: ele já tem a sua `fase-desconhecida` | RN-06 e RF-07. Uma anomalia por projeto, e não uma por nome pendente, porque o defeito é um só: a declaração contradiz a lista | Uma anomalia por nome; reaproveitar `fase-desconhecida` | 🟢 |
| D-10 | O eixo ganha dois campos opcionais: `ciclo`, com o número e as cinco fases na situação do ciclo corrente, cada uma com o nome bruto que a sustenta; e `etapas`, com nome bruto, base aprovada, situação (`concluida`, `pendente` ou `em-curso`) e sufixo. Ausentes quando não há ciclo nem etapa | RF-09, RF-10 e RF-22. A situação usa os mesmos três valores da camada herdada (`done`, `current`, `pending`), para que o cartão troque a fonte sem trocar o desenho | Substituir `process.discovery.phases`, que é herdado e cruza o canal sem transformação | 🟢 |
| D-11 | No ciclo corrente, a fase canônica que não aparece em lista alguma com o sufixo do ciclo lê como pendente | É o que a camada herdada faz com a fase canônica ausente das duas listas, e o requirements não trata o caso. Não há projeto medido nessa forma | Situação própria "não registrada", que seria a sexta coisa no cartão | 🟡 |
| D-12 | O encerramento sem declaração exige: `pending` vazio; `phase` reconhecido (canônico, de ciclo ou etapa aprovada) e presente em `completed`; e as cinco fases do ciclo corrente em `completed`, sendo as canônicas quando não há ciclo | RN-11 na redação da segunda rodada. O `capacities`, com `pending` povoado, fica de fora pela primeira condição | Exigir só `phase` em `completed`, que alcançaria extração em curso com fase repetida | 🟢 |
| D-13 | As frases novas (ciclo, etapa em curso, linha das etapas, encerramento sem declaração) nascem em `src/webview/domain/labels.ts`, que a tela e o terminal já partilham, e são desenhadas em `DiscoverySection.tsx` e em `src/cli/quadro/secoes.ts` | É como a 014 prendeu a paridade: texto único, dois desenhos. A suíte `cli-paridade` ganha os casos novos | Texto escrito duas vezes | 🟢 |
| D-14 | A passagem das fases do aprendizado tem quatro filtros antes do motor, nesta ordem: forma de identificador (RN-07), o que a forma ou o mapa já decidem, erro de grafia por distância de edição até 2 sobre o nome inteiro e sobre cada base possível (RN-12), e só então as perguntas | Cada filtro tira do motor o que não é dele. A distância sobre "cada base possível" percorre os separadores do nome e testa o que sobra à esquerda quando o resto tem forma de sufixo; é barato e pega `escavacão-c2` e `escavacão-ciclo-2` | Perguntar tudo ao motor; distância só sobre o nome inteiro, recusada na segunda rodada | 🟢 |
| D-15 | O motor ganha duas perguntas, natureza e comparação, nos enunciados da rodada 3 da prova, dentro do mesmo `scripts/equivalencias/motor.js`, com o pedido e o tempo-limite fatorados para os três classificadores | A frase "único arquivo do repositório que fala com um serviço" precisa continuar verdadeira ao pé da letra. Detalhe em `interfaces/motor-local.md` | Arquivo novo com `fetch` próprio | 🟢 |
| D-16 | A comparação só é perguntada entre nomes que partilhem ao menos uma palavra, descontadas as preposições, entre os candidatos julgados `etapa` e contra as etapas já aprovadas | Resolve a segunda pendência das lacunas. O número de pares cresce com o quadrado; com o corte, os oito nomes de hoje pedem 3 pares em vez de 28, e o placar da prova não muda, porque todo par sem palavra comum era `diferentes` | Comparar todos os pares; limiar de distância de edição, que juntaria `re-extracao` e `regressao` | 🟢 |
| D-17 | A proposta mostra a razão do motor **só na comparação**. Na natureza, mostra o veredito e a evidência medida (projetos, lista e nomes vizinhos), sem razão | Resolve a primeira pendência das lacunas. A prova mediu razão falsa em sete dos oito positivos da natureza, e pôr texto falso ao lado de uma caixa de aprovação é pior que não pôr texto. O RF-14 fica lido assim: a razão acompanha o agrupamento, e a evidência acompanha o nome | Mostrar a razão com aviso; trocar de modelo, quando o `gemma4` errou `iago` e é mais lento | 🟢 |
| D-18 | Os vizinhos enviados ao motor passam pelo filtro da RN-07 antes de sair | O requisito de privacidade deixa sair "os nomes vizinhos da mesma lista", e no `DelphiSga` os vizinhos são vinte valores em prosa que descrevem o projeto. Sem o filtro, a prosa sairia como contexto de um nome legítimo | Enviar o nome sem vizinhos, que a prova não mediu | 🟢 |
| D-19 | O classificador é duplicado em `scripts/equivalencias/fases.js`, e uma suíte de paridade o prende a `src/domain/fases.ts` sobre os mesmos casos | É o precedente de `elidir.js` com `elisao-paridade.spec.ts`: os scripts de manutenção são CommonJS e não importam a fonte em TypeScript. A paridade por suíte é o que a casa já usa para esse corte | Fazer o aprendizado depender de `out-cli/`, que obrigaria a construir a ferramenta de terminal para aprender | 🟢 |
| D-20 | A contagem é `scripts/contar-anomalias.js`, casca fina sobre `src/cli/contagem.ts`, compilado em `out-cli/` como o painel da 014. Ela lê cada subpasta da raiz que tenha `.reversa/state.json` com `readWorkspace`, compõe com `composeAnomalies` e soma por código. Aceita o mapa por parâmetro | A contagem tem de ser "a que o painel exibe", e só há um jeito de garantir isso: passar pela mesma leitura e pela mesma composição. O mapa por parâmetro é o que permite à promoção contar com o mapa que acabou de fundir, sem recompilar nada | Reimplementar a leitura em script; contar só a lista herdada, que ignoraria o desconto | 🟢 |
| D-21 | O aprendizado e a promoção chamam a contagem ao fim e imprimem a tabela. Sem `out-cli/`, nomeiam `npm run compile:cli` e terminam com o mesmo código de saída que teriam; `preaprender:equivalencias`, `prepromover:equivalencias` e `precontar:anomalias` constroem a unidade | RF-16 pede a chamada, e não que a falta da ferramenta de terminal derrube uma promoção já escrita | Falhar a promoção; contagem embutida nos dois scripts | 🟡 |
| D-22 | Os códigos ao alcance do mapa são uma constante ao lado da contagem: `checkpoint-sem-conclusao-declarada` e `fase-desconhecida` | RN-10. É dado pequeno e muda só quando o mapa ganha eixo, que é mudança de código de todo modo | Deduzir do mapa, que não sabe que códigos produz | 🟢 |
| D-23 | `scripts/estragar-descoberta.js` ganha três casos: `ciclo-com-etapa`, `encerramento-com-pendencia` e `encerrada-sem-declaracao` | RF-18 pede ao menos os dois primeiros; o terceiro custa uma forma a mais e é o único jeito de ver o RF-20 no preview sem abrir um dos onze projetos | Só os dois exigidos | 🟢 |

## 4. Premissas

Nenhuma sobre dúvida em aberto: o `requirements.md` chegou a esta etapa sem marcador `[DÚVIDA]`. As
duas pendências que a prova de viabilidade deixou para o plano estão resolvidas em D-16 e D-17. Duas
deduções ficam como 🟡 nas decisões, e não como premissa: a base proposta na coleta (D-04) e a fase
do ciclo ausente das listas (D-11).

## 5. Delta arquitetural

| Componente | Arquivo de origem no legado | Tipo de mudança | Resumo |
|------------|------------------------------|-----------------|--------|
| Classificador de nomes de fase | novo | componente-novo | `src/domain/fases.ts`, função pura com a precedência de cinco degraus |
| Eixo do estado da descoberta | `_reversa_sdd/addenda/011-estado-terminal-e-checkpoints.md` e `012-equivalencias-de-checkpoint.md` | regra-alterada | `src/domain/discovery-state.ts` classifica as três listas, amplia `absorvidas`, deriva o ciclo e as etapas, reconhece o encerramento sem declaração e registra `encerramento-com-pendencia` |
| Formas do domínio | `_reversa_sdd/sdd/leitura-do-processo.md#9-modelo-de-dados` | contrato-alterado | `ExtractionSituation`, `DiscoveryStateAnomalyCode`, `DiscoveryStateAxis` e `MapaDeEquivalencias` crescem por acréscimo; formas novas para ciclo e etapa |
| Mapa de equivalências | `_reversa_sdd/addenda/012-equivalencias-de-checkpoint.md` | contrato-alterado | `src/domain/equivalencias.ts` ganha a lista `etapas`, vazia até a primeira promoção |
| Canal host para tela | `_reversa_sdd/sdd/ponte-e-host.md#9-modelo-de-dados` | contrato-alterado | `discoveryState` cresce por dentro; detalhe em `interfaces/protocolo-webview.md` |
| Seção da Descoberta | `_reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais` | regra-alterada | `DiscoverySection.tsx` desenha a frase do ciclo, as fases do ciclo corrente, a linha das etapas, a etapa em curso e o encerramento sem declaração |
| Painel de linha de comando | `_reversa_sdd/addenda/014-cli-do-processo.md` | regra-alterada | `src/cli/quadro/secoes.ts` desenha o mesmo, com as frases de `labels.ts` |
| Contagem da raiz | `_reversa_sdd/addenda/014-cli-do-processo.md` | componente-novo | `src/cli/contagem.ts` e `scripts/contar-anomalias.js` |
| Ferramentas de manutenção | `_reversa_sdd/addenda/012-equivalencias-de-checkpoint.md` | regra-alterada | `aprender-equivalencias.js` ganha a passagem das fases; `promover-equivalencias.js` lê a seção de fases; os dois chamam a contagem |
| Auxiliares das equivalências | idem | componente-novo | `scripts/equivalencias/fases.js`, `coletar-fases.js` e `grafia.js`; `motor.js`, `proposta.js` e `gerar-mapa.js` alterados |
| Auxiliar do estado doente | `_reversa_sdd/sdd/empacotamento-e-verificacao.md#6-requisitos-funcionais` | regra-alterada | `estragar-descoberta.js` ganha três casos |
| Procedência da herança | `_reversa_sdd/sdd/heranca-e-sincronia.md#6-requisitos-funcionais` | regra-alterada | `src/heranca/PROCEDENCIA.md`, subseção de pendências de origem, nomeia a fase de ciclo. É o único arquivo sob `src/heranca/` tocado, e ele é da casa, não da origem |

## 6. Delta no modelo de dados

- Resumo das mudanças: quatro formas crescem e três nascem. `ExtractionSituation` vai de três para
  quatro valores; `DiscoveryStateAnomalyCode` de um para dois; `DiscoveryStateAxis` ganha `ciclo` e
  `etapas`, opcionais; `MapaDeEquivalencias` ganha `etapas`, opcional. Nascem `EtapaAprovada`,
  `CicloCorrente` e `EtapaReconhecida`. A extensão continua sem persistir nada, e o único arquivo
  escrito no repositório segue sendo o módulo do mapa, pela promoção.
- Detalhe completo em: `_reversa_forward/015-fases-fora-do-canone/data-delta.md`

## 7. Delta de contratos externos

| Contrato | Tipo | Arquivo de detalhe |
|----------|------|--------------------|
| Canal do host para a tela | mensagem interna | `_reversa_forward/015-fases-fora-do-canone/interfaces/protocolo-webview.md` |
| Motor de inferência local | HTTP em `localhost` | `_reversa_forward/015-fases-fora-do-canone/interfaces/motor-local.md` |
| Comando de contagem | linha de comando | `_reversa_forward/015-fases-fora-do-canone/interfaces/contar-anomalias.md` |

## 8. Plano de migração

1. O classificador e as formas nascem com o mapa **sem etapa alguma**. Nesse ponto, o projeto sem
   fase de ciclo lê como lia (RF-04), e as suítes da 011, da 012 e da 014 passam sem reescrita. É o
   ponto de controle que separa estrutura de comportamento.
2. O gerador do mapa aprende a ler e a escrever `etapas` **antes** de a promoção aprender a aprovar
   uma. Invertida a ordem, a primeira promoção de checkpoints apagaria as etapas.
3. O reconhecimento pela forma entra: o `afla` perde dez `fase-desconhecida` sem decisão de ninguém
   e ganha a `encerramento-com-pendencia`.
4. O aprendizado roda sobre `~/dev` e escreve a proposta com a seção de fases. Você marca e promove.
5. A contagem roda ao fim e mostra, por código, o que mudou e o que continua fora do alcance.
6. Nenhum `state.json` de projeto algum é tocado em passo nenhum.

## 9. Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| A promoção apagar as etapas aprovadas, por `lerMapaDeModulo` devolver só dois campos | alto | alto, se a ordem do passo 2 for invertida | D-06 e o passo 2 da migração; suíte que promove um par sobre mapa com etapa e confere que a etapa continua lá |
| A forma larga do sufixo reconhecer o que não é ciclo, como `revisao-v2` | baixo | baixo | Foi decisão da primeira rodada, pergunta 1. O nome bruto fica à vista na linha da fase, de modo que a leitura é conferível na tela |
| Os dois classificadores, o da leitura e o dos scripts, divergirem | médio | médio | D-19: suíte de paridade sobre a mesma tabela de casos, no molde de `elisao-paridade` |
| O motor juntar trabalhos diferentes num grupo | médio | baixo | A prova não mediu nenhum falso `mesma`; o corte por palavra comum (D-16) reduz a superfície; e a RN-02 tirou o efeito do agrupamento sobre o mapa |
| A aprovação em bloco, sem leitura | alto | médio | Caixas nascem desmarcadas, uma por nome, com a evidência medida ao lado, como na 012 |
| A contagem demorar demais sobre a raiz inteira | baixo | médio | 64 leituras abaixo de 200 ms cada ficam perto de 13 s no pior caso; a saída nomeia o projeto em leitura, para que a espera tenha progresso |
| O detalhe da anomalia nova ficar longo, com cinco nomes | baixo | alto | A composição já lida com linha longa (`trava-sem-data`); a suíte do RF-16 confere a soma justamente nesses casos |
| O pacote da tela crescer além da guarda de 60 % | baixo | baixo | O classificador vive no host; a tela ganha frases e um ramo de desenho. Medição no critério de pronto |

## 10. Critério de pronto

- [ ] Todas as ações do `actions.md` marcadas `[X]`
- [ ] `cross-check.md` (se executado) sem CRITICAL nem HIGH
- [ ] `regression-watch.md` gerado
- [ ] Com o mapa sem etapas, a leitura dos projetos de referência sem ciclo é idêntica à de antes (RF-04)
- [ ] As suítes da 011, da 012 e da 014 passam sem uma linha reescrita
- [ ] No `afla`, com as quatro etapas aprovadas, nenhuma `fase-desconhecida` chega à tela, e a `encerramento-com-pendencia` aparece uma vez
- [ ] Nos onze projetos medidos, a extração lê como encerrada sem declaração; no `capacities`, não
- [ ] Promover um par de checkpoint sobre um mapa com etapas deixa as etapas intactas
- [ ] `npm run aprender:equivalencias` deixa `src/domain/equivalencias.ts` idêntico byte a byte
- [ ] A suíte inteira passa com o motor local **desligado**
- [ ] `npm run contar:anomalias -- ~/dev --json` soma o mesmo que as leituras individuais, e `git status` não acusa alteração
- [ ] A suíte de paridade entre tela e terminal passa com os casos novos
- [ ] O pacote da tela permanece abaixo da guarda de 60 % do teto, com o número registrado
- [ ] Leitura da referência abaixo de 200 ms, com o número registrado
- [ ] Re-extração reversa executada e sem regressão vermelha (recomendado, não obrigatório)

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-21 | Versão inicial gerada por `/reversa-plan`, depois de duas rodadas de esclarecimento e da prova de viabilidade do motor | reversa |
