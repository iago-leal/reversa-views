# Legacy impact: leitura do processo do Reversa

> Identificador da feature: `001-leitura-do-processo`
> Data da execução: `2026-09-09`
> Gerado por: `/reversa-coding`

**Feature greenfield, sem legado pré-existente. Âncora: `prd.md` + specs SDD.**

Não houve extração `/reversa` sobre este repositório, porque não havia código a extrair. O impacto
abaixo é medido contra as specs em `_reversa_sdd/sdd/`, e não contra um `architecture.md`. Todo
componente é novo por definição, e a coluna de tipo reflete isso.

## Política de edição do legado no momento da execução

| Campo | Valor lido em `.reversa/reversa-config.json` |
|---|---|
| `allowLegacyEdits` | `true` |
| `allowedPaths` | vazio |
| Efeito | Liberação irrestrita: todo caminho do projeto estava gravável |

O `actions.md` previa, em T004, que a política estaria fechada e que a escrita no `.gitignore` seria
recusada. Na execução ela estava aberta, e a escrita ocorreu. Nenhum caminho foi recusado nesta
rodada.

## Arquivos afetados

| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |
|---|---|---|---|---|
| `src/heranca/reversa-domain/src/` | Camada de julgamento (`_reversa_sdd/sdd/leitura-do-processo.md#6`) | componente-novo | HIGH | 14 módulos que interpretam todo artefato do Reversa; tudo que o painel mostrar nas features 002 e 003 passa por aqui |
| `src/heranca/reversa-domain/tests/` | Camada de julgamento (`_reversa_sdd/sdd/heranca-e-sincronia.md#6`, RF-06) | componente-novo | MEDIUM | 14 suítes herdadas, 45 blocos e 213 casos; são a única prova de que a cópia continua fiel ao comportamento da origem |
| `src/heranca/reversa-domain/tests/fixtures/` | Paridade com o gancho (`_reversa_sdd/sdd/leitura-do-processo.md#6`, RF-01) | componente-novo | MEDIUM | 3 fixtures sem carimbo; o `.mjs` precisa seguir idêntico ao gancho instalado, ou a leitura da política passa a mentir |
| `src/heranca/reversa-probe/src/` | Sonda de disco (`_reversa_sdd/sdd/leitura-do-processo.md#6`) | componente-novo | HIGH | 3 módulos que tocam o disco; é a única superfície de leitura, e a rota HTTP foi descartada |
| `src/heranca/reversa-probe/tests/` | Sonda de disco (`_reversa_sdd/sdd/heranca-e-sincronia.md#6`, RF-06) | componente-novo | MEDIUM | 3 suítes herdadas, incluindo a que prova que a sonda não escreve |
| `src/heranca/PROCEDENCIA.md` | Regime de herança (`_reversa_sdd/sdd/heranca-e-sincronia.md#6`, RF-01, RF-04) | componente-novo | MEDIUM | Primeira forma do regime; sem ele o carimbo dos 34 arquivos aponta para lugar nenhum |
| `tests/paridade-gancho-instalado.spec.ts` | Verificação local (`_reversa_sdd/sdd/heranca-e-sincronia.md#6`, RF-03) | componente-novo | MEDIUM | Fecha a lacuna que a suíte herdada não cobre: se o gancho instalado mudar, o teste acusa |
| `tests/desempenho-referencia.spec.ts` | Verificação local (`_reversa_sdd/sdd/leitura-do-processo.md#7`) | componente-novo | MEDIUM | Guarda o teto de 200 ms, que separa um painel que acompanha o editor de um que o trava |
| `tsconfig.json` | Compilação do host (`_reversa_sdd/sdd/empacotamento-e-verificacao.md`) | componente-novo | MEDIUM | Fixa a emissão CommonJS, decisão que condiciona o host da feature 002 |
| `vitest.config.ts` | Verificação local (`_reversa_sdd/sdd/empacotamento-e-verificacao.md`) | componente-novo | LOW | Única configuração de executor do repositório |
| `package.json` | Compilação do host (`_reversa_sdd/sdd/empacotamento-e-verificacao.md`) | componente-novo | LOW | Três dependências de desenvolvimento em igualdade exata, nenhuma de produção |
| `package-lock.json` | Compilação do host (`_reversa_sdd/sdd/empacotamento-e-verificacao.md`) | componente-novo | LOW | Reprodutibilidade temporal da instalação |
| `.gitignore` | Higiene do repositório (`_reversa_sdd/sdd/empacotamento-e-verificacao.md`) | componente-novo | LOW | Único arquivo pré-existente tocado: quatro linhas acrescentadas ao fim, nenhuma linha anterior alterada |

Resumo: 13 entradas, todas de tipo `componente-novo`. Duas em HIGH, sete em MEDIUM, quatro em LOW.
Nenhuma em CRITICAL, o que é esperado numa feature que não tem legado a quebrar.

## Diff conceitual por componente

**Camada de julgamento.** O repositório passa a conter as regras que interpretam o Reversa: as cinco
fases da descoberta por precedência normativa, o estágio da feature ativa lido pelos artefatos
fisicamente presentes, a contagem de ações varrendo o arquivo inteiro, a política de edição do
legado, os adendos, a migração e a ideação. Nada disso foi escrito aqui, e nada foi alterado: os 28
arquivos são cópia byte a byte da origem a partir da linha 8. A camada não importa nenhum módulo de
sistema de arquivos, e a suíte `readonly` herdada prova isso a cada execução.

**Sonda de disco.** A leitura ganha sua única superfície de contato com o disco, restrita a leitura:
resolve a raiz, lê os arquivos de caminho fixo, resolve os dois ponteiros que o Reversa escreve,
recusa caminho que escape da raiz e relata o que recusou. A rota HTTP da origem ficou de fora, por
decisão declarada, e o índice perdeu as duas linhas que a reexportavam. Uma extensão de editor fala
com a sonda por chamada de função, não por requisição.

**Regime de herança.** Os 34 arquivos `.ts` passam a declarar, nas próprias sete primeiras linhas, de
onde vieram e sob que revisão. A primeira linha começa por `/* HERDADO`, e é essa marca que o
verificador da feature 004 usará. O `PROCEDENCIA.md` recolhe o que o carimbo não comporta: os
descartes e as três adaptações com trecho original e adaptado. Manifesto com resumo criptográfico,
verificador e ressincronizador continuam fora, como a spec prevê.

**Verificação local.** Duas suítes escritas aqui, e não herdadas. A de paridade compara o gancho
instalado com o fixture byte a byte, cobrindo a região que a matriz herdada não alcança. A de
desempenho constrói um workspace de referência sintético, com feature ativa de cinco arquivos e
cinquenta adendos, e exige leitura mais julgamento abaixo de 200 ms.

**Compilação e higiene.** O repositório ganha manifesto, arquivo de trava, configuração de compilador
e configuração de executor de testes, nada além. Sem manifesto de extensão, sem build, sem webview:
essas peças pertencem às features 002 e 005. O `.gitignore` foi estendido com quatro linhas ao fim,
e nenhuma linha anterior mudou.

## Preservadas

Vazia. Não há regras 🟢 extraídas de código pré-existente neste repositório, porque não houve
extração `/reversa`: a feature é greenfield.

## Modificadas

Vazia, pelo mesmo motivo. Nada foi alterado ou removido, porque nada existia.

## Observações

O que esta feature entrega herda o comportamento da origem, não o inventa. A garantia de que ele
continua valendo não é uma regra 🟢 de extração, e sim a suíte herdada, que roda pelo mesmo comando
de teste do repositório. Se uma extração `/reversa` futura for feita sobre este código, é ela que
converterá esse comportamento em regras vigiáveis.
