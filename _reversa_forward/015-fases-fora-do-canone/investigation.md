# Investigação: fases fora do cânone, ciclo e encerramento não declarado

> Feature: `015-fases-fora-do-canone`
> Data: `2026-09-21`

## 1. O que foi medido, e como

Os 64 projetos com `.reversa/state.json` em `~/dev`, lidos em 2026-09-21 por script de leitura, sem
escrever em nenhum. Só `phase`, `completed` e `pending` foram olhados.

| Achado | Projetos | Exemplos |
|---|---|---|
| Fase de ciclo, fase canônica com sufixo numérico | 1 | `afla`: seis em `completed` (`reconhecimento-c2` a `revisao-c2`, mais `reconhecimento-c3`) e quatro em `pending` (`escavacao-c3` a `revisao-c3`) |
| Etapa fora do cânone em `completed` ou `pending` | 5 | `afla` (`reconciliacao`, `contrato-insumo`, `decisoes-autor`, `verificacao-regressao`, `verificacao-regressao-c3`), `tcr-ana-luisa` (`re-extracao-003` a `-005`), `aps-inteligente` (`regressao`), `comentarios-concursos` (`verificacao-de-regressao`), `modelo-empresa` (`documentacao`) |
| Etapa fora do cânone no `phase` corrente | 2 | `tcr-ana-luisa` (`re-extracao-005`, com `geracao` e `revisao` pendentes) e `modelo-empresa` (`documentacao`, já em `completed`, `pending` vazio) |
| Prosa no lugar de fase | 1 | `DelphiSga`: 20 valores em `pending`, o menor com 116 caracteres, todos com espaço |
| Encerramento declarado, família `conclu` | 17 | cinco grafias, já reconhecidas pela 011 |
| Encerramento declarado com nome reconhecível em `pending` | 1 | `afla`: `concluido-c3` com quatro fases do ciclo 3 e uma etapa pendentes |
| Encerramento sem declaração, `phase` canônico | 11 | `phase: "revisao"`, cinco fases concluídas, `pending` vazio |
| Separador do sufixo nas listas de fases | | só o hífen. O sublinhado aparece nos checkpoints do `afla` (`scout_c2`) e na família do encerramento (`revisao_concluida`) |

A contagem por código da raiz inteira, feita à mão no mesmo dia, deu ao menos 184 anomalias
exibidas, das quais 43 `fase-desconhecida` em 6 projetos e 14 `fase-atual-ja-concluida` em 14. Ela
subestima as anomalias de linha longa, e é uma das razões do RF-16.

## 2. Onde o ruído nasce

`derivePhases`, em `src/heranca/reversa-domain/src/state.ts`, registra `fase-desconhecida` sobre
cada nome de `completed`, `pending` e `phase` que não seja um dos cinco, e
`fase-atual-ja-concluida` sempre que o `phase` está em `completed`. As duas regras são fiéis ao
`state-schema.md` do Reversa, que só conhece as cinco fases e não documenta ciclo, etapa nem
encerramento. A camada herdada está certa diante da norma que tem; é a norma que não acompanha o
que o pipeline grava.

O painel, por sua vez, só desconta o que `absorver` reconhece, e `absorver` só olha o valor de
`phase` de uma extração encerrada. Tudo o que está em `completed` e `pending` passa direto.

## 3. Alternativas avaliadas

| Alternativa | Por que não |
|---|---|
| **Lista literal de nomes aceitos** no código | A objeção da 011 continua válida: estaria desatualizada no quarto ciclo do `afla` e na `re-extracao-006` |
| **Tudo pelo mapa**, inclusive `escavacao-c2` | Recusada na primeira rodada, pergunta 1. O nome contém uma fase canônica inteira e o inteiro cresce sozinho: pedir aprovação a cada ciclo seria transformar fato sistemático em rito |
| **Tudo pela forma**, inclusive etapa | Não há forma que separe `reconciliacao` de `escavacão`. O que distingue etapa legítima de erro é decisão, e a 012 já fixou quem decide |
| **Ler `cycle` e `cycle_N`** para o número do ciclo | Recusada na primeira rodada, pergunta 5: onze projetos re-extraíram, só o `afla` usa essas chaves, e os outros dez usam nove grafias. Além disso, os blocos descrevem o projeto em prosa, e lê-los abriria uma questão de privacidade que o sufixo não abre |
| **Adaptar a camada herdada** para não registrar a anomalia | Contraria a regra da herança e o NG-05 por outro caminho: a lista bruta deixaria de relatar o disco. O desconto na composição já resolve o que a tela mostra |
| **Uma pergunta só ao motor, com três respostas** | Reprovada na prova de viabilidade, 6 de 14. Ver seção 4 |
| **Filtro determinístico no lugar da pergunta de natureza** | A prova registra que a pergunta, como ficou, faz pouco mais que isso. Ficou o motor porque ele reconhece nome de pessoa, de ferramenta e de arquivo, que regra nenhuma pega, e porque a decisão da primeira rodada, pergunta 3, foi tê-lo como Must. Se um dia a pergunta for trocada por filtro, a interface da proposta não muda |
| **Relação de sinônimo no mapa** | Recusada na segunda rodada, pergunta 1: a tela mostra o nome bruto, e a relação não teria efeito observável |
| **Contagem como subcomando do painel** | Recusada na segunda rodada, pergunta 8, em favor de script à parte. A lógica fica em `src/cli/` de todo modo, porque precisa da mesma leitura |

## 4. Prova de viabilidade do motor local

Inteira em `prova-de-viabilidade.md`. O que o plano tira dela:

- o desenho de duas perguntas com duas respostas (D-15), com os enunciados da rodada 3;
- a razão do motor fora da proposta na pergunta de natureza (D-17);
- o corte dos pares por palavra comum (D-16), que preserva o placar;
- o `qwen2.5:7b` mantido como modelo padrão, depois de o `gemma4` errar um negativo e levar o dobro
  do tempo.

## 5. Padrões aplicáveis

**Forma para o sistemático, decisão para o desvio.** É o critério da 011, aplicado três vezes aqui:
o sufixo de ciclo e o encerramento sem declaração vão pela forma; a etapa vai pela aprovação; o erro
de grafia e a prosa não são aprendidos.

**Base conhecida antes do sufixo.** Extrair a base de um nome desconhecido é ambíguo; reconhecer um
sufixo depois de uma base conhecida não é. A leitura só faz o segundo (D-03), e o primeiro fica na
coleta, onde um erro cai diante de uma pessoa (D-04).

**Descontar na composição, nunca na fonte.** A lista herdada cruza o canal inteira, e o eixo entrega
a identidade do que reconheceu. Foi a escolha da 011, e é o que faz o host anterior degradar para o
comportamento anterior sem uma linha de código de compatibilidade.

**Duplicar com paridade presa por suíte.** Os scripts de manutenção são CommonJS e não importam a
fonte. O precedente é `elidir.js` com `elisao-paridade.spec.ts`, e o classificador segue o mesmo
corte (D-19).

**Uma leitura só para contar.** O erro do "25 para 3" foi contar dentro de um eixo. A contagem nova
passa pela leitura e pela composição do próprio painel (D-20), de modo que não há segundo critério
que possa divergir do que a tela mostra.

## 6. Fontes

- `_reversa_forward/015-fases-fora-do-canone/requirements.md`, com as duas sessões de esclarecimento
  de 2026-09-21, e `prova-de-viabilidade.md`.
- `_reversa_sdd/addenda/011-estado-terminal-e-checkpoints.md`,
  `012-equivalencias-de-checkpoint.md` e `014-cli-do-processo.md`.
- `_reversa_sdd/sdd/leitura-do-processo.md`, `ponte-e-host.md`, `painel-do-processo.md` e
  `heranca-e-sincronia.md`.
- Código lido para o plano: `src/domain/discovery-state.ts`, `src/domain/equivalencias.ts`,
  `src/domain/types.ts`, `src/host/reading.ts`, `src/host/protocol.ts`,
  `src/webview/domain/anomalies-view.ts`, `src/webview/ui/DiscoverySection.tsx`,
  `src/cli/quadro/secoes.ts` e `diagnostico.ts`, `src/heranca/reversa-domain/src/state.ts`,
  `scripts/equivalencias/motor.js` e `gerar-mapa.js`, `scripts/promover-equivalencias.js`,
  `scripts/painel.js` e `scripts/estragar-descoberta.js`.
- Medição dos 64 projetos e prova de viabilidade, ambas executadas em 2026-09-21 nesta máquina. Não
  há fonte externa: o Reversa não documenta ciclo, etapa nem encerramento.
