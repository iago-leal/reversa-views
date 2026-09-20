# Roadmap: equivalências de checkpoint reconhecidas por aprovação

> Identificador: `012-equivalencias-de-checkpoint`
> Data: `2026-09-20`
> Requirements: `_reversa_forward/012-equivalencias-de-checkpoint/requirements.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

O eixo da descoberta ganha uma quarta fonte de decisão, colocada depois das duas que a feature 011
fixou: `completed_at`, depois `modules_pending`, e só então o mapa de equivalências aprovadas. O mapa
é dado, não palpite: ele nasce vazio, cresce por ato humano e viaja compilado dentro do pacote da
extensão. Nada da camada de leitura muda de natureza, e ela continua pura, síncrona e sem rede.

O modelo local vive do outro lado da cerca, em duas ferramentas de manutenção que o `npm run build`
não invoca. A primeira lê os `state.json`, elide o conteúdo, pergunta ao motor e escreve uma proposta
em Markdown com uma caixa de marcação por item. A segunda lê as caixas marcadas e regenera o módulo
do mapa, sem falar com modelo algum. Entre as duas está você, e é isso que separa esta feature de um
reconhecimento automático.

A tela absorve duas consequências das respostas de ontem: o checkpoint passa a ter quatro situações,
com a falha desenhada como falha, e as entradas que não nomeiam agente saem da contagem de
checkpoints para uma lista própria, em vez de continuarem acusadas de não declarar conclusão.

## 2. Princípios aplicados

O projeto não tem `.reversa/principles.md`, de modo que não há princípios formais a confrontar. O
que cumpre esse papel aqui são os não-objetivos e os requisitos não funcionais das specs, e eles
foram tratados como princípios para efeito desta verificação.

| Princípio de fato | Como a feature se relaciona | Status |
|-----------|------------------------------|--------|
| NG-05, não sanear os arquivos do Reversa | Nenhum `state.json` é lido para reescrita. O mapa traduz em memória e o valor bruto acompanha o reconhecido até a tela | respeita |
| NG-01 e RNF-04, nenhuma superfície de escrita na leitura | Quem escreve são dois scripts de manutenção, fora da extensão. A camada de leitura não ganha `node:fs` de escrita, `child_process` nem cliente de rede | respeita |
| RNF-01, leitura abaixo de 200 ms | O mapa é estrutura já carregada em memória no momento da leitura, e a consulta é busca por chave | respeita |
| "Rede, serviço remoto ou API: Nenhuma" | A extensão continua sem falar com nada. O motor local é consultado apenas pela ferramenta de manutenção, que não é embarcada no pacote | respeita |
| NG-03, decidir o que a tela mostra pertence ao painel | A quarta situação e a lista das entradas que não são agentes são decisões de exibição, tomadas na camada de exibição, como a 011 fez com a absorção | respeita |
| RF-04 de `empacotamento-e-verificacao.md`, fonte e scripts fora do pacote | Os dois scripts novos ficam em `scripts/`, que o `.vscodeignore` já exclui. Só o módulo do mapa entra, por `out/` | respeita |

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|----|---------|----------------|--------------------------|-------------|
| D-01 | O mapa é um **módulo TypeScript versionado**, `src/domain/equivalencias.ts`, gerado pelo promotor no molde de `scripts/gerar-revisao-heranca.js` | O `.vscodeignore` exclui tudo e reinclui apenas `out/**` e `media/**`, e `scripts/conteudo-esperado.js` prevê somente `extension/out/`. Um `.json` em `src/` não entraria no pacote e reprovaria o RF-20. Como módulo, ele compila junto, viaja em `out/domain/equivalencias.js` sem alterar a lista do pacote, e ainda ganha verificação de tipo | `.json` com `resolveJsonModule`; `.json` em `media/`; mapa lido do disco em tempo de execução, que violaria NG-04 | 🟢 |
| D-02 | O mapa é **versionado**, ao contrário do carimbo da construção | O par de precedentes do repositório decide: `gerar-carimbo-da-construcao.js` produz arquivo ignorado porque muda a cada commit, e `gerar-revisao-heranca.js` produz arquivo versionado porque muda só quando alguém decide. O mapa é do segundo tipo, e a sua história em git é a trilha de auditoria das aprovações | Arquivo ignorado e reconstruído; mapa por máquina fora do repositório, recusado na sessão de esclarecimentos | 🟢 |
| D-03 | O mapa entra por `DiscoveryStateInput`, como terceiro campo, e o padrão real é ligado em `src/host/reading.ts` | Mantém `readDiscoveryState` função pura de entrada para saída, que é o que permite a suíte rodar sem modelo e sem disco. É o mesmo desenho que `ReadingDeps` já usa para os cinco leitores | Importar o mapa dentro do domínio, acoplando o julgamento ao dado e dificultando o teste de mapa vazio | 🟢 |
| D-04 | `CheckpointSituation` ganha o quarto valor `falhou`, e `CheckpointState` ganha `reconhecidoPor`, com campo e valor, nulo quando a decisão veio do esquema | Resposta 1b da sessão de esclarecimentos. A procedência precisa viajar junto da situação, porque a RN-04 proíbe que o reconhecido fique indistinguível do provado | Situação separada de procedência em dois campos paralelos, que permitiria o estado inconsistente de procedência sem reconhecimento | 🟢 |
| D-05 | As entradas que não nomeiam agente saem de `checkpoints` para uma lista própria no eixo, `registrosNaoAgentes` | O RF-17 exige que saiam da contagem, e mantê-las na mesma lista com uma marca obrigaria todo consumidor a filtrar, com o risco de um esquecer | Marca booleana dentro de `CheckpointState`; remoção silenciosa, que perderia a informação de que a entrada existe | 🟡 |
| D-06 | A unidade aprovável tem **duas formas**: par campo mais valor, para checkpoints, e chave nua, para entradas que não são agentes | Decorre da RN-10. Uma entrada sem campo de estado não tem par a traduzir, e forçá-la ao mesmo formato exigiria um valor inventado | Aprovar a chave como par com valor vazio, que confundiria ausência com decisão | 🟡 |
| D-07 | O aprendizado e a promoção são **dois** scripts distintos, `scripts/aprender-equivalencias.js` e `scripts/promover-equivalencias.js` | A RN-12 exige que propor e promover sejam atos separados. Dois arquivos tornam a separação verificável por inspeção: o primeiro não importa o gerador do mapa, o segundo não importa o cliente do motor | Um script com subcomandos, em que a separação viraria convenção interna | 🟢 |
| D-08 | O transporte até o motor é **injetável**, e a suíte o substitui por um duplo | É a regra que o repositório já segue em `ReadingDeps` e em `scripts/preview/`. Sem isso, a suíte passaria a depender de um serviço no ar, e a promessa de suíte verde sem modelo cairia | Testar por integração real; pular teste do classificador | 🟢 |
| D-09 | A elisão da carga é função pura em módulo próprio, testada sobre os checkpoints reais medidos | A RN-09 é requisito de privacidade, e requisito de privacidade que não tem teste é intenção. Isolá-la permite afirmar o que sai da máquina olhando uma função de vinte linhas | Elisão embutida no montador do pedido, sem ponto de teste | 🟢 |
| D-10 | A proposta é Markdown com uma caixa por item e, sob cada uma, um bloco de dados cercado que a promoção lê | Aprovar tem de ser marcar, pela resposta 4a, e promover tem de ser determinístico. Texto livre seria legível e não parseável; dados puros seriam parseáveis e ilegíveis | Tabela Markdown parseada por coluna, frágil a quebra de linha; JSON puro, que obrigaria a editar dados à mão | 🟡 |
| D-11 | A promoção **recusa** par já presente no mapa com leitura divergente, nomeando o conflito, em vez de sobrescrever | Mapa é decisão acumulada, e sobrescrever calado apagaria uma decisão anterior sem que ninguém visse | Última aprovação vence; duplicata permitida com desempate na leitura | 🟢 |
| D-12 | A proposta nomeia, ao fim, os pares que o motor não classificou dentro do tempo-limite, e o arquivo é escrito mesmo assim | O RNF de resiliência recusa retentativa automática. O que não classificou é informação, não erro fatal, e esconder isso faria a proposta parecer completa | Abortar a execução inteira; retentativa automática com recuo exponencial | 🟡 |

## 4. Premissas

Nenhuma. O `requirements.md` entrou nesta etapa sem marcador `[DÚVIDA]`, e as cinco dúvidas da
versão inicial foram respondidas na sessão de 2026-09-20. As duas deduções que o documento declara,
a da RN-10 e a do lugar onde as entradas não-agentes aparecem, estão registradas como 🟡 nas
decisões D-05 e D-06 acima, e não como premissas sobre dúvida em aberto.

## 5. Delta arquitetural

| Componente | Arquivo de origem no legado | Tipo de mudança | Resumo |
|------------|------------------------------|-----------------|--------|
| Eixo do estado da descoberta | `_reversa_sdd/sdd/leitura-do-processo.md#8-design-e-interface`, via adendo 011 | regra-alterada | `src/domain/discovery-state.ts` passa a consultar o mapa depois das duas regras do esquema, e a produzir quatro situações em vez de três |
| Formas do domínio | `_reversa_sdd/sdd/leitura-do-processo.md#9-modelo-de-dados` | contrato-alterado | `CheckpointSituation` ganha `falhou`; `CheckpointState` ganha `reconhecidoPor`; `DiscoveryStateAxis` ganha `registrosNaoAgentes` |
| Mapa de equivalências | novo | componente-novo | `src/domain/equivalencias.ts`, módulo de dados versionado, gerado por ato humano e consumido pela leitura |
| Leitura do workspace | `_reversa_sdd/sdd/ponte-e-host.md#6-requisitos-funcionais` | regra-alterada | `src/host/reading.ts` liga o mapa real ao ramo do eixo, no mesmo bloco protegido dos demais |
| Canal host para tela | `_reversa_sdd/sdd/ponte-e-host.md#9-modelo-de-dados` | contrato-alterado | `SetProcessData.discoveryState` cresce por acréscimo dentro de si; detalhe em `interfaces/protocolo-webview.md` |
| Seção da Descoberta | `_reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais` | regra-alterada | `src/webview/ui/DiscoverySection.tsx` desenha quatro situações, a procedência do reconhecimento e a lista dos registros que não são agentes |
| Composição das anomalias | `_reversa_sdd/sdd/painel-do-processo.md#11-edge-cases-e-tratamento-de-erros` | regra-alterada | `src/webview/domain/anomalies-view.ts` continua a única composição, agora sobre uma lista que já nasce menor |
| Ferramentas de manutenção | `_reversa_sdd/sdd/empacotamento-e-verificacao.md#6-requisitos-funcionais` | componente-novo | `scripts/aprender-equivalencias.js` e `scripts/promover-equivalencias.js`, quinto e sexto auxiliares fora do build |
| Auxiliar do estado doente | `_reversa_sdd/sdd/empacotamento-e-verificacao.md#6-requisitos-funcionais` | regra-alterada | `scripts/estragar-descoberta.js` ganha o caso `falha`, para que a quarta situação seja conferível no preview sem depender de projeto real que tenha falhado |

## 6. Delta no modelo de dados

- Resumo das mudanças: quatro formas tocadas e uma criada. `CheckpointSituation` passa de três
  valores para quatro; `CheckpointState` ganha a procedência do reconhecimento; `DiscoveryStateAxis`
  ganha a lista das entradas que não são agentes; `DiscoveryStateInput` ganha o mapa. A forma nova é
  o próprio registro do mapa, nas suas duas variantes. Nada é persistido pela extensão: o único
  arquivo escrito no repositório é o módulo do mapa, e quem o escreve é o promotor.
- Detalhe completo em: `_reversa_forward/012-equivalencias-de-checkpoint/data-delta.md`

## 7. Delta de contratos externos

| Contrato | Tipo | Arquivo de detalhe |
|----------|------|--------------------|
| Canal do host para a tela | mensagem interna | `_reversa_forward/012-equivalencias-de-checkpoint/interfaces/protocolo-webview.md` |
| Motor de inferência local | HTTP em `localhost` | `_reversa_forward/012-equivalencias-de-checkpoint/interfaces/motor-local.md` |

## 8. Plano de migração

1. As formas novas nascem com o mapa **vazio**, e a suíte da 011 passa sem reescrita. É o RF-15, e é
   o ponto de controle que separa mudança de estrutura de mudança de comportamento.
2. O aprendizado roda sobre `~/dev` e produz a primeira proposta, com os sete vocabulários medidos.
3. Você lê, marca o que aprova e promove. O módulo do mapa nasce nesse ato, com a data e a evidência.
4. A leitura do `med-reversa` passa de sete anomalias para uma, e a que sobra é a do `plano_aprovado`
   enquanto ele não for decidido como registro que não é agente.
5. Nenhum `state.json` de projeto algum é tocado em passo nenhum.

## 9. Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Aprovação em bloco, sem leitura, transformando o rito em carimbo | alto | médio | A proposta traz a justificativa do motor e a evidência por par, e as caixas nascem **desmarcadas**: aprovar exige ato por item |
| Motor classificar `status: "success"` como conclusão em projeto onde significa outra coisa | médio | baixo | O par guarda a evidência de origem, a decisão é humana, e a procedência na tela permite desfazer a leitura olhando a linha |
| A quarta situação quebrar a leitura de host anterior | médio | baixo | O campo cresce por acréscimo, e ausência continua significando leitura que não aconteceu, como a 011 fixou |
| O pacote crescer além da guarda de 60 % | baixo | baixo | A 011 fechou em 52,3 % do teto; o mapa é dado textual e a seção ganha um ramo. Medição faz parte do critério de pronto |
| Dois pares iguais com leituras diferentes entrarem no mapa | médio | baixo | D-11: a promoção recusa e nomeia o conflito |
| O promotor escrever módulo que não compila, a partir de valor com aspas ou barra invertida | médio | médio | Escapar em vez de interpolar, que é a lição já registrada no gerador do carimbo para o caminho do clone |

## 10. Critério de pronto

- [ ] Todas as ações do `actions.md` marcadas `[X]`
- [ ] `cross-check.md` (se executado) sem CRITICAL nem HIGH
- [ ] `regression-watch.md` gerado
- [ ] Com o mapa vazio, a suíte da 011 passa sem uma linha reescrita (RF-15)
- [ ] A leitura do `med-reversa` com o mapa povoado devolve uma anomalia, e não sete
- [ ] `npm run aprender:equivalencias` deixa `src/domain/equivalencias.ts` idêntico byte a byte
- [ ] A suíte inteira passa com o motor local **desligado**
- [ ] O pacote da tela permanece abaixo da guarda de 60 % do teto, com o número registrado
- [ ] `out/domain/equivalencias.js` aparece na listagem do pacote, e nenhum caminho novo fora do previsto
- [ ] Re-extração reversa executada e sem regressão vermelha (recomendado, não obrigatório)

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-20 | Versão inicial gerada por `/reversa-plan` | reversa |
