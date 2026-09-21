# Onboarding: conferir as fases fora do cânone, o ciclo e o encerramento não declarado

> Identificador: `015-fases-fora-do-canone`
> Data: `2026-09-21`

Passo a passo para quem vai exercitar a feature pela primeira vez e conferir cada promessa do
`requirements.md`. Os projetos citados são os medidos em `~/dev` em 2026-09-21; se algum tiver sido
corrigido na fonte desde então, o caso correspondente do `estragar:descoberta` o substitui.

## 0. Antes de tudo

```bash
cd ~/dev/reversa-views
npm install
npm run build
npm run compile:cli
```

O motor local só é necessário no passo 5:

```bash
curl -s http://localhost:11434/api/tags       # o servidor respondendo, com o qwen2.5:7b na lista
```

Sem ele, pule o passo 5. Tudo o que a extensão faz é conferível sem motor.

## 1. A linha de base

```bash
npm test
```

A suíte inteira passa, e as suítes das features 011, 012 e 014 não tiveram linha reescrita. Confira
pelo histórico:

```bash
git log --stat --oneline -- tests/domain-discovery-state.spec.ts tests/equivalencias-*.spec.ts tests/cli-*.spec.ts
```

Nenhum commit da 015 deve alterar casos existentes; só acrescentar.

## 2. A contagem, antes de qualquer aprovação

```bash
npm run contar:anomalias -- $HOME/dev
git status --short
```

A tabela lista cada código com ocorrências e projetos, e marca `fase-desconhecida` e
`checkpoint-sem-conclusao-declarada` como ao alcance do mapa. O `git status` sai vazio. Guarde o
número de `fase-desconhecida` e o de `fase-atual-ja-concluida`: eles caem nos passos seguintes.

## 3. O que a forma resolve sozinha

```bash
npm run painel -- --workspace=$HOME/dev/afla --passada
```

Sem aprovar nada, confira:

- a frase do ciclo nomeia o terceiro ciclo, com Reconhecimento concluída e as outras quatro
  pendentes;
- nenhuma `fase-desconhecida` sobre `reconhecimento-c2` a `revisao-c3`;
- as cinco etapas (`reconciliacao`, `contrato-insumo`, `decisoes-autor`, `verificacao-regressao` e
  `verificacao-regressao-c3`) **continuam** anomalia, porque ninguém as aprovou;
- a anomalia `encerramento-com-pendencia` aparece uma vez, nomeando `concluido-c3` e as quatro fases
  de ciclo pendentes.

O mesmo na tela:

```bash
node ./scripts/preview.js --workspace=$HOME/dev/afla
```

## 4. O encerramento sem declaração

Escolha um dos onze projetos com `phase: "revisao"`, cinco fases concluídas e `pending` vazio:

```bash
npm run painel -- --workspace=$HOME/dev/<um-dos-onze> --passada
npm run painel -- --workspace=$HOME/dev/capacities --passada
```

No primeiro, a extração lê como encerrada sem declaração, em frase própria, e a
`fase-atual-ja-concluida` não aparece. No `capacities`, que tem `pending` povoado, a anomalia
continua.

## 5. Aprender

```bash
npm run aprender:equivalencias -- --raiz=$HOME/dev
git status --short src/domain/equivalencias.ts
```

Cerca de meio minuto para a passagem das fases. A proposta em `propostas/equivalencias.md` ganha a
seção de fases. Confira nela:

- os oito nomes de etapa, cada um com caixa desmarcada e a evidência: projetos, lista e vizinhos;
- `re-extracao` como **um** candidato, com `re-extracao-003`, `-004` e `-005` na evidência;
- nenhuma fase de ciclo, nenhum dos 20 valores em prosa do `DelphiSga`;
- a razão do motor só nos grupos, nunca ao lado de um nome isolado;
- uma lista de erros de grafia, à parte e sem caixa, se a raiz tiver algum.

O `git status` do mapa sai vazio: aprender não aprova. Ao fim, o comando imprime a mesma tabela do
passo 2.

Para conferir a recusa com o motor fora do ar, pare o serviço e rode de novo: nada é escrito, e a
causa é nomeada.

## 6. Aprovar e promover

Marque na proposta as quatro etapas do `afla` e `documentacao`. Deixe `regressao` desmarcada.

```bash
npm run promover:equivalencias
git diff src/domain/equivalencias.ts
```

O diff traz a lista `etapas` com cinco registros independentes, cada um com data e evidência, e os
`pares` e `naoAgentes` que já existiam **intactos**. A tabela impressa ao fim já reflete o mapa novo.

```bash
npm run build && npm run compile:cli
```

## 7. Conferir o efeito

```bash
npm run painel -- --workspace=$HOME/dev/afla --passada
npm run painel -- --workspace=$HOME/dev/modelo-empresa --passada
npm run painel -- --workspace=$HOME/dev/aps-inteligente --passada
```

- `afla`: nenhuma `fase-desconhecida`; a linha das etapas traz os cinco nomes, com situação e menção
  ao mapa; a `encerramento-com-pendencia` agora nomeia cinco pendentes, porque
  `verificacao-regressao-c3` passou a ser reconhecida.
- `modelo-empresa`: encerrada sem declaração, sem `fase-atual-ja-concluida`.
- `aps-inteligente`: `regressao` continua anomalia, porque não foi marcada. O agrupamento da
  proposta não aprova ninguém por tabela.

Se aprovar `re-extracao` numa segunda rodada, o `tcr-ana-luisa` passa a nomear `re-extracao-005`
como etapa em curso, sem fase atual entre as cinco e **sem** declarar ciclo.

## 8. Os estados doentes no preview

```bash
node ./scripts/preview.js --workspace=$(node ./scripts/estragar-descoberta.js --caso=ciclo-com-etapa)
node ./scripts/preview.js --workspace=$(node ./scripts/estragar-descoberta.js --caso=encerramento-com-pendencia)
node ./scripts/preview.js --workspace=$(node ./scripts/estragar-descoberta.js --caso=encerrada-sem-declaracao)
```

Cada um escreve numa cópia temporária, fora do repositório.

## 9. As promessas negativas

```bash
git status --short                                   # nada além do mapa, depois do passo 6
git diff --stat -- src/heranca/                      # só PROCEDENCIA.md
grep -rn "fetch(" src scripts --include=*.js --include=*.ts | grep -v node_modules
```

O último comando acha `fetch` em `scripts/equivalencias/motor.js` e em nenhum outro lugar. Nenhum
`state.json` de projeto algum mudou:

```bash
cd ~/dev/afla && git status --short .reversa/state.json
```

## 10. Desfazer

```bash
git checkout -- src/domain/equivalencias.ts
rm -f propostas/equivalencias.md
npm run build && npm run compile:cli
```

O mapa volta ao que era, e a leitura de todo projeto sem fase de ciclo volta a ser a da 014.
