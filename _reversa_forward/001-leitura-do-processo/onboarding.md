# Onboarding: Leitura do processo do Reversa

> Identificador: `001-leitura-do-processo`
> Data: `2026-09-09`
> Roadmap: `_reversa_forward/001-leitura-do-processo/roadmap.md`
> Para quem: o mantenedor que vai verificar a feature pela primeira vez, ou que retorna meses depois

## 1. Pré-requisitos

- Node 20 ou mais recente e npm. O ambiente onde a feature foi planejada tem Node 24.21.0 e
  npm 11.19.0; o arquivo de trava fixa as dependências, não a versão do Node.
- Este repositório clonado. A árvore de origem `HARNESS/scrum-harness` **não** é necessária para
  nenhum passo abaixo; se estiver presente, o passo 8 a usa para uma conferência extra.

## 2. Instalar as dependências pelo arquivo de trava

```
cd dev/reversa-views
npm ci
```

Use `npm ci`, e não `npm install`: o primeiro obedece ao `package-lock.json` e falha se ele estiver
desatualizado, o segundo o reescreve em silêncio. Três dependências de desenvolvimento devem ser
instaladas, nas versões exatas 5.9.3 (compilador), 3.2.7 (executor de testes) e 20.19.9 (tipos de
Node).

## 3. Rodar a suíte completa

```
npm test
```

Resultado esperado:

| Item | Valor |
|---|---|
| Arquivos de teste herdados | 17 |
| Arquivos de teste locais | 2 |
| Blocos de suíte herdados | 45 |
| Casos herdados | 213 |
| Falhas | 0 |
| Pulados | 0 neste repositório |

Se o teste `paridade-gancho-instalado` aparecer como pulado, o arquivo
`.reversa/hooks/check-legacy-policy.mjs` não foi encontrado; neste repositório ele existe e viaja
no clone, então um pulo aqui indica clone incompleto. Se ele falhar, o gancho instalado difere do
fixture herdado: a mensagem nomeia os dois caminhos, e a resposta certa é inspecionar o diff e,
se o Reversa foi atualizado, seguir o ritual de ressincronização quando a feature 004 o entregar.

Se o teste `desempenho-referencia` falhar, a leitura do workspace de referência passou de 200 ms.
Repita uma vez com a máquina ociosa antes de concluir qualquer coisa; oscilação persistente é o
sinal que a spec prevê para reabrir a discussão de leitura parcial.

## 4. Verificar a compilação do host

```
npm run typecheck
npm run compile
node -e "const s = require('./out/heranca/reversa-probe/src/index.js'); const r = s.readReversaSnapshot(process.cwd()); console.log(r.report)"
```

O primeiro comando verifica tipos sem emitir. O segundo emite CommonJS em `out/`. O terceiro carrega
a sonda compilada e lê este próprio repositório; a saída deve mostrar `workspace` com o caminho
atual, `featureDir` apontando para `_reversa_forward/001-leitura-do-processo`, e as listas
`refusals` e `truncated` vazias.

Para ver o julgamento sobre o retrato:

```
node -e "const s = require('./out/heranca/reversa-probe/src/index.js'); const d = require('./out/heranca/reversa-domain/src/index.js'); const p = d.readReversa(s.readReversaSnapshot(process.cwd()).snapshot); console.log(p.installed, p.discovery.phases, p.forward.stage, p.anomalies)"
```

Esperado: `true`, as cinco fases, o estágio físico da feature ativa e uma lista de anomalias vazia.

## 5. Conferir as invariantes por busca textual

```
grep -rnE "^\s*(import|export) .*['\"]@scrum-harness/" src/heranca/ ; echo "esperado: nada acima"
find src/heranca -name "route.*" ; echo "esperado: nada acima"
grep -rL "^/\* HERDADO" src/heranca --include=*.ts ; echo "esperado: nada acima"
grep -rn "from 'node:fs'" src/heranca/reversa-domain/src ; echo "esperado: nada acima"
```

Cada comando deve imprimir apenas a linha de "esperado". A terceira busca lista arquivos `.ts` sem
carimbo; os três fixtures em `tests/fixtures/` ficam fora dela por não serem `.ts`.

## 6. Ler a procedência

Abra `src/heranca/PROCEDENCIA.md`. Ele deve responder, sem que você precise abrir a origem:

- de que repositório e revisão a cópia veio, e em que data;
- que versão do Reversa a origem acompanhava (1.3.3);
- o que foi deliberadamente descartado (a rota e sua suíte) e por quê;
- que adaptações foram feitas, com trecho original e trecho adaptado.

Abra também qualquer arquivo em `src/heranca/**/src/`: as sete primeiras linhas são o carimbo, com
os mesmos dados.

## 7. Commit inicial

O repositório não tem commit algum. O critério de clone limpo só é verificável depois do primeiro
commit, e o ciclo forward não comita por conta própria. Quando os passos 3 a 6 estiverem verdes:

```
git add -A
git status
```

Confira que `out/` e `node_modules/` **não** aparecem na lista (o `.gitignore` os exclui) e que
`.reversa/` **aparece** (ele é versionado de propósito, porque o gancho instalado é parte do
contrato de teste). Então faça o commit com a mensagem que preferir.

## 8. Conferência extra, só com a origem presente

Se `HARNESS/scrum-harness` estiver na máquina, cada arquivo herdado sem adaptação deve ser idêntico
à origem a partir da linha 8, ou seja, depois do carimbo:

```
for f in $(find src/heranca -name "*.ts" -path "*/src/*"); do
  o="../../HARNESS/scrum-harness/packages/${f#src/heranca/}"
  diff <(tail -n +8 "$f") "$o" > /dev/null || echo "difere: $f"
done
```

Devem diferir apenas `reversa-probe/src/snapshot.ts` e `reversa-probe/src/index.ts`, as duas
adaptações declaradas. A feature 004 substitui esse laço por um verificador com manifesto.

## 9. O que esta feature não entrega

Nenhum painel, nenhum comando no editor, nenhum VSIX. A camada só é observável pelos comandos
acima. A primeira tela chega com as features 002 e 003; o build e o preview, com a 005.
