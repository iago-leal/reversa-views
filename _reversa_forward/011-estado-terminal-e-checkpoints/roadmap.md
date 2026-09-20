# Roadmap: estado terminal da extração e conclusão dos checkpoints

> Identificador: `011-estado-terminal-e-checkpoints`
> Data: `2026-09-20`
> Requirements: `_reversa_forward/011-estado-terminal-e-checkpoints/requirements.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

Um eixo local novo, no molde dos quatro que já existem, lê o `state.json` bruto que a sonda já
traz e julga duas coisas que a herança não julga: em que situação a extração está, e em qual dos
três estados cada checkpoint está. A herança não é tocada. Ela continua dizendo o que diz,
inclusive a anomalia `fase-desconhecida` sobre a fase terminal; o que muda é que o painel passa a
saber reconhecê-la e a não desenhá-la, o que a própria spec da leitura autoriza no NG-03, ao
reservar a decisão do que a tela mostra ao componente do painel. Para que o cabeçalho e a seção de
anomalias não discordem, a composição da lista sai de `App.tsx` e vira função única, consumida
também por `readingIntegrity`. Na tela, o encerramento entra como frase na seção Descoberta, no
molde exato da frase de projeto greenfield da feature 009, e o checkpoint ganha o terceiro estado
ao lado dos dois que já tinha.

## 2. Princípios aplicados

Não existe `.reversa/principles.md` neste projeto, logo não há princípio declarado a respeitar ou
contrariar. Os invariantes que governam a feature são os da spec da leitura, e estão na tabela de
decisões abaixo: NG-01 (nenhuma escrita), NG-03 (a tela decide o que mostra), NG-05 (não sanear) e
G-03 (não idealizar o framework).

| Princípio | Como a feature se relaciona | Status |
|-----------|------------------------------|--------|
| n/a, sem `principles.md` | Os invariantes vigentes vêm de `_reversa_sdd/sdd/leitura-do-processo.md`, seções 3 e 4 | respeita |

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|----|---------|----------------|--------------------------|-------------|
| D-01 | Eixo local novo em `src/domain/discovery-state.ts`, função pura sobre o `state.json` bruto e o processo já julgado | É o molde dos quatro eixos locais que já rodam em `src/host/reading.ts`, todos puros e todos lendo do que a sonda trouxe; nenhum importa módulo de plataforma | Adaptar `state.ts` na herança; ler o disco de novo numa sonda própria | 🟢 |
| D-02 | A herança fica intocada, e a anomalia absorvida é filtrada na camada de exibição | NG-03 de `_reversa_sdd/sdd/leitura-do-processo.md#4-non-goals` reserva ao painel decidir o que mostrar; as nove adaptações de regra já declaradas em `src/heranca/PROCEDENCIA.md#5-adaptacoes` são a dívida que o projeto quer aposentar | Décima adaptação declarada; reescrever `process.anomalies` no host | 🟢 |
| D-03 | A lista de anomalias exibida passa a ser composta por uma função única, `composeAnomalies`, consumida por `App.tsx` e por `readingIntegrity` | O próprio `integrity.ts` documenta o risco: duas leituras do mesmo fato acabam discordando, e o painel declararia leitura íntegra enquanto abre as anomalias que diz não ter. Filtrar em dois lugares recriaria exatamente isso | Filtrar só em `App.tsx`; filtrar em cada consumidor | 🟢 |
| D-04 | O encerramento é reconhecido por forma: o valor é partido em `-` e `_`, cada segmento é normalizado sem diacrítico e em caixa baixa, e basta um segmento começar por `conclu` | Cobre as cinco grafias medidas em `~/dev` e as que virão, sem lista literal que nasceria desatualizada. As cinco fases canônicas não contêm a raiz, logo não há colisão | Lista literal das cinco grafias; igualdade exata com `concluido` | 🟢 |
| D-05 | As cinco fases canônicas têm precedência sobre a família: só se testa encerramento depois de falhar o conjunto canônico | Preserva RF-03 do requirements e a capacidade de acusar erro de digitação, que a abolição da anomalia perderia | Testar a família primeiro | 🟢 |
| D-06 | O estado do checkpoint é derivado em três valores, nesta precedência: `completed_at` presente, `modules_pending` não vazio, conclusão não declarada | A precedência vem do `checkpoint-guide.md` do Reversa, que declara os dois registros; a terceira via é o resto, e é o que a medição mostra ser a maioria dos casos sem `completed_at` | Reconhecer os sete nomes alternativos; manter o binário e só acrescentar anomalia | 🟢 |
| D-07 | O eixo entra no payload como campo opcional ao fim de `SetProcessData`, e o painel cai no desenho anterior quando ele não vem | É a regra de acréscimo que o protocolo já segue desde a feature 004, e o que permite uma webview anterior ignorar o campo | Campo obrigatório; versão de protocolo | 🟢 |
| D-08 | A sinalização do RF-11 nomeia os campos preservados cujo valor é lista de textos, e só quando `files` está ausente, sem chamá-los de saídas | Dizer "saídas" afirmaria o que não se sabe, já que `achados`, `lacunas` e `adrs` têm a mesma forma. Com `files` presente não há o que sinalizar, porque a lista canônica está lá | Lista fechada dos treze nomes; heurística que promove a arquivo | 🟡 |
| D-09 | A frase de encerramento é um `<p data-part="discovery-closed">` na seção Descoberta, acima das cinco fases | Molde literal da frase `discovery-greenfield` da feature 009, que resolveu o mesmo tipo de falsidade sem inventar fase | Sexta marca no bloco das fases; marca no cabeçalho | 🟢 |
| D-10 | O caminho do clone em `heranca.origens.yml` é corrigido para `~/HARNESS/scrum-harness`, e a pendência de levar a regra à origem fica registrada na `PROCEDENCIA.md`, em seção própria, sem criar adaptação | O arquivo é local e ignorado pelo git; registrar a pendência é o que evita a divergência silenciosa entre a cópia e a origem | Deixar o caminho errado; abrir a adaptação agora | 🟢 |

## 4. Premissas

Nenhuma. O `requirements.md` foi fechado sem marcador `[DÚVIDA]` na sessão de esclarecimentos de
2026-09-20, e as cinco decisões de escopo estão registradas na seção 9 daquele documento.

| Premissa | Origem (`requirements.md` seção) | Risco se errada |
|----------|----------------------------------|-----------------|
| n/a | n/a | n/a |

## 5. Delta arquitetural

| Componente | Arquivo de origem no legado | Tipo de mudança | Resumo |
|------------|------------------------------|-----------------|--------|
| leitura-do-processo | `_reversa_sdd/sdd/leitura-do-processo.md#11-edge-cases` | regra-alterada | EC-02 deixa de valer sem ressalva: fase de encerramento é estado reconhecido, e não anomalia. Pede adendo em `/reversa-sync` |
| leitura-do-processo | `_reversa_sdd/sdd/leitura-do-processo.md#6-requisitos-funcionais` | regra-nova | O estado do checkpoint passa de dois para três valores, com a precedência do `checkpoint-guide` do Reversa, e o terceiro registra anomalia por RF-07 |
| painel-do-processo | `_reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais` | regra-alterada | RF-04 ganha a frase de encerramento acima das cinco fases; RF-05 ganha o terceiro estado do checkpoint; RF-08 passa a desenhar a lista composta, sem a anomalia absorvida |
| `src/domain/discovery-state.ts` | componente local novo | componente-novo | Julgamento puro do estado da extração e dos checkpoints, mais as anomalias próprias e a identidade das herdadas que absorve |
| `src/domain/types.ts` | `_reversa_sdd/addenda/008-cronologia-do-ciclo-bugs.md` | contrato-alterado | União local de anomalia nova, pelo precedente de `BugAnomalyCode` e `GreenfieldAnomalyCode`, mais as formas do eixo |
| `src/host/reading.ts` | `_reversa_sdd/sdd/ponte-e-host.md` | regra-alterada | Mais um ramo local no mesmo `try`, alimentado por `snapshot.stateJson` e pelo processo já julgado |
| `src/host/protocol.ts` | `_reversa_sdd/sdd/ponte-e-host.md` | contrato-alterado | Campo opcional novo ao fim de `SetProcessData`, por acréscimo. Detalhe em `interfaces/protocolo-webview.md` |
| `src/webview/domain/anomalies-view.ts` | componente local novo | componente-novo | A composição única da lista exibida, com o desconto das absorvidas |
| `src/webview/domain/integrity.ts` | `_reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais` | regra-alterada | Passa a contar sobre a lista composta, em vez de somar quatro listas por conta própria |
| `src/webview/domain/labels.ts` | `_reversa_sdd/addenda/006-cartoes-e-cronologia.md` | regra-alterada | `checkpointMark` passa a ler o estado derivado; vocabulário novo para os três estados e para a situação da extração |
| `src/webview/ui/DiscoverySection.tsx` | `_reversa_sdd/addenda/009-greenfield-e-features-do-prd.md` | regra-alterada | Frase de encerramento e terceiro estado do checkpoint, com `data-situacao` no lugar de `data-done` |
| `src/webview/ui/App.tsx` | `_reversa_sdd/sdd/painel-do-processo.md#6-requisitos-funcionais` | regra-alterada | Deixa de compor a lista de anomalias no lugar e passa a chamar a composição única |
| `heranca.origens.yml` | `_reversa_sdd/sdd/heranca-e-sincronia.md` | regra-alterada | Caminho do clone corrigido para onde ele está nesta máquina |
| `src/heranca/PROCEDENCIA.md` | `src/heranca/PROCEDENCIA.md#5-adaptacoes` | contrato-alterado | Seção de pendências de origem, sem adaptação nova e sem carimbo alterado |

## 6. Delta no modelo de dados

- Resumo das mudanças: nada é persistido, como em toda a extensão. O que cresce são três formas em
  memória, o eixo `DiscoveryState`, o vocabulário de três estados do checkpoint e a união local de
  anomalia, mais um campo opcional na carga do `setProcess`. Nenhum campo existente muda de nome,
  de tipo ou de posição, e nenhum é removido.
- Detalhe completo em: `_reversa_forward/011-estado-terminal-e-checkpoints/data-delta.md`

## 7. Delta de contratos externos

| Contrato | Tipo | Arquivo de detalhe |
|----------|------|--------------------|
| canal de mensagens entre a webview e o host | arquivo (mensagens `postMessage` tipadas) | `_reversa_forward/011-estado-terminal-e-checkpoints/interfaces/protocolo-webview.md` |

## 8. Plano de migração

Não há migração de dados, porque não há dado persistido. O que existe é ordem de execução, e ela
importa por uma razão só: o filtro da anomalia absorvida não pode entrar antes de existir quem a
reconheça, sob pena de a construção intermediária esconder anomalia legítima.

1. Vocabulário e formas em `src/domain/types.ts`, sem consumidor ainda.
2. O julgamento em `src/domain/discovery-state.ts`, com suíte própria sobre fixtura sintética.
3. A fixtura derivada do `med-reversa` e a suíte que a lê, antes de qualquer mudança de tela.
4. O ramo em `src/host/reading.ts` e o campo opcional em `src/host/protocol.ts`.
5. A composição única em `src/webview/domain/anomalies-view.ts`, com `integrity.ts` passando a
   consumi-la, ainda sem filtro ativo, para provar que a lista composta é igual à soma de hoje.
6. O filtro da absorvida ligado, com a suíte mostrando a anomalia sumindo só no caso terminal.
7. A tela: `labels.ts`, `DiscoverySection.tsx` e `App.tsx`.
8. O `heranca.origens.yml` e a seção de pendências da `PROCEDENCIA.md`.

## 9. Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| O filtro da anomalia absorvida esconder anomalia legítima | alto | baixa | A absorção casa arquivo, código e detalhe, e só vale para `fase-desconhecida` cujo detalhe é o valor reconhecido como encerramento; suíte com fase estranha provando que a anomalia continua |
| A raiz `conclu` produzir falso positivo numa fase futura | médio | baixa | As cinco canônicas têm precedência, e a suíte fixa as cinco grafias observadas mais um caso de digitação errada que deve continuar sendo anomalia |
| O cabeçalho e a seção de anomalias divergirem | alto | baixa | D-03: composição única, com suíte comparando contagem do cabeçalho e itens desenhados |
| A sinalização do RF-11 virar ruído em projeto com muitos campos | baixo | média | Só dispara com `files` ausente, e nomeia sem afirmar; é `Should`, e pode ser a última ação a entrar |
| O terceiro estado confundir quem lê o painel | médio | baixa | O texto diz o que houve, conclusão não declarada no campo canônico, e a anomalia correspondente nomeia o agente e o campo |
| Regressão na leitura de projeto canônico | alto | baixa | RF-09 do requirements, com a suíte de desempenho e as vinte suítes herdadas rodando sem reescrita |

## 10. Critério de pronto

- [ ] Todas as ações do `actions.md` marcadas `[X]`
- [ ] A fixtura do `med-reversa` lida por suíte: fase terminal sem anomalia, sete checkpoints em
      conclusão não declarada, cada um com a sua
- [ ] Um projeto de formato canônico lido com resultado idêntico ao anterior à feature
- [ ] As vinte suítes herdadas passando sem reescrita, e `src/heranca/` sem uma linha alterada
- [ ] `cross-check.md` (se executado) sem CRITICAL nem HIGH
- [ ] `regression-watch.md` gerado
- [ ] `/reversa-sync` rodado, porque o EC-02 muda e a extração precisa do adendo

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-20 | Versão inicial gerada por `/reversa-plan` | reversa |
