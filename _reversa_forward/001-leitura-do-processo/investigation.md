# Investigation: Leitura do processo do Reversa

> Identificador: `001-leitura-do-processo`
> Data: `2026-09-09`
> Roadmap: `_reversa_forward/001-leitura-do-processo/roadmap.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. O que foi investigado

A feature copia código existente, então a investigação concentrou-se em três perguntas: o que
exatamente a origem contém, o que ela exige para compilar e testar, e onde ela conflita com o kit
de extensão que as features seguintes vão herdar. Toda medição abaixo foi feita em 2026-09-09
sobre a árvore local, com os comandos registrados na seção 6.

## 2. A origem

**Localização e estado.** 🟢 `HARNESS/scrum-harness`, repositório git limpo na revisão
`420305daa6cdd10858b720a34cb8db67d8e5c5e9`, commit de 2026-09-08 21:31 (UTC-3), mensagem
"rel-29: o painel do REVERSA — ler o processo de fora, sem nunca tocá-lo". Remoto
`https://github.com/iago-leal/scrum-harness.git`. Nenhuma alteração pendente nos dois pacotes. O
Reversa instalado na origem é o 1.3.3, o mesmo deste projeto.

**Conteúdo a copiar.** 🟢 37 arquivos, descontados a rota e as saídas compiladas:

| Pacote | Fontes | Suítes | Fixtures |
|---|---|---|---|
| `reversa-domain` | 14 módulos, 1.674 linhas | 14 arquivos, 34 blocos | 3 arquivos |
| `reversa-probe` | 3 módulos (sem a rota), 255 linhas | 3 arquivos (sem a rota), 11 blocos | nenhum |

Casos de teste no total, sem a rota: 213. A suíte de rota tem 12 casos e o módulo, 88 linhas.

**Invariantes verificados.** 🟢 A camada de julgamento não importa sistema de arquivos: a única
ocorrência do termo em `src/` é um comentário, e `readonly.spec.ts` lê os próprios fontes para
garantir isso por expressão regular. A sonda importa `node:fs` num único módulo, `files.ts`, e usa
apenas as três funções de leitura. Nenhum fonte usa `import.meta`; só os testes usam, para
localizar fixtures e a própria pasta de fontes.

**Hermetismo das suítes.** 🟢 Todo fixture vive dentro de `tests/fixtures/` do próprio pacote. As
suítes da sonda criam workspaces em pasta temporária do sistema e os removem. Nenhuma suíte usa o
pacote `test-support` da origem, variáveis de ambiente ou mocks de módulo. A única dependência entre
os pacotes é a importação de `@scrum-harness/reversa-domain`, em três instruções: duas em
`snapshot.ts` e uma em `snapshot.spec.ts`. As demais 21 ocorrências do nome são comentários de
documentação, a maioria em cabeçalhos `@module`.

**Recursos de linguagem.** 🟢 Dois recursos posteriores a ES2019 nos fontes: `??=` em `table.ts`
e `replaceAll` em `policy.ts`, ambos ES2021. Nenhum uso de `.at()`, `findLast`, `Object.hasOwn`
ou `structuredClone`.

**Fixture do gancho.** 🟢 `tests/fixtures/check-legacy-policy.mjs` é byte a byte idêntico a
`.reversa/hooks/check-legacy-policy.mjs` deste repositório, confirmado por `cmp`. É a condição que
torna a decisão D-06 verdadeira no dia zero.

## 3. Ferramentas da origem e do kit

| Aspecto | Origem `scrum-harness` | Kit `vscode-kanban` | Escolha para este repositório |
|---|---|---|---|
| Sistema de módulos | ESM, `module: NodeNext`, `type: module` | CommonJS, `module: commonjs`, `main: ./out/extension` | CommonJS no host (D-02) |
| Alvo | ES2023 | ES2019 | ES2022 (D-02) |
| Importações relativas | Com extensão `.ts`, reescritas por `rewriteRelativeImportExtensions` | Sem extensão | Mantidas com `.ts`, reescritas na emissão (D-02) |
| `verbatimModuleSyntax` | Ligado | Desligado | Desligado, porque conflita com emissão CommonJS; os fontes já usam `import type` explícito, então nada se perde |
| Compilador | 5.9.3 instalado, faixa `^5.9.2` | 5.9.3 exato | 5.9.3 exato (D-04) |
| Executor de testes | vitest 3.2.7 instalado, faixa `^3.2.4`, sem arquivo de configuração | mocha 11.7.6 sobre a saída compilada, com c8 | vitest 3.2.7 exato, com arquivo de configuração explícito (D-03) |
| Tipos de Node | Não declarados diretamente | 20.19.9 | 20.19.9 (D-04) |
| Empacotador | esbuild 0.25.12 | esbuild 0.25.12 | Não entra nesta feature; a coincidência de versão facilita a feature 005 |
| Ambiente de desenvolvimento medido | Node 24.21.0, npm 11.19.0 | idem | Registrar no onboarding; o arquivo de trava fixa as dependências, não o Node |

**Registro npm em 2026-09-09.** 🟢 Últimas versões publicadas: vitest 5.0.0, typescript 7.0.2,
`@types/node` 26.5.0. Nenhuma delas foi validada contra o código herdado; as fixadas são as que a
origem tem instaladas e onde as suítes passam hoje. A rede está disponível no ambiente, então a
instalação inicial é possível daqui.

## 4. Alternativas avaliadas

**ESM em todo o repositório, como a origem.** 🟡 Eliminaria o risco da reescrita de extensão e
manteria `verbatimModuleSyntax`. Descartada porque o host de extensão do editor carrega CommonJS
como caminho estável, e o kit inteiro está nele. Fica como saída de emergência do risco 1 do
roadmap: se a emissão CommonJS falhar, a pasta de herança pode virar unidade de compilação ESM
separada, e o host a consome pela saída compilada.

**Executor do kit para tudo.** 🟢 Descartada. As 17 suítes herdadas usam a API do vitest e
`import.meta.url`, que não existe em CommonJS; migrá-las seria reescrever o contrato que a
vendorização quer preservar.

**Pasta de herança na raiz do repositório.** 🟢 Descartada. Obrigaria o `rootDir` do host a ser a
raiz, o que arrasta `tests/`, scripts e configuração para a saída compilada, ou exige duas
configurações de compilador já nesta feature.

**Paridade por matriz contra o gancho instalado.** 🟢 Descartada em favor da igualdade de bytes.
A matriz herdada cobre `globToRegex` e `isValidPattern`, mas a camada de julgamento transcreve
também a leitura da política (`policy.ts`, com suíte própria). Igualdade de bytes acusa qualquer
mudança do gancho, e o custo é um vermelho ocasional por mudança cosmética, aceito no roadmap.

**Versões mais recentes do registro.** 🟢 Descartada. O compilador 7.x e o executor 5.x são
majors que mudam contratos; adotá-los agora seria validar duas migrações de ferramenta ao mesmo
tempo que se valida a cópia. Ficam como candidatas para depois da feature 005, quando houver build
inteiro para regredir.

**Carimbo como comentário de linha única.** 🟡 Descartada. A spec 4 pede repositório, caminho,
revisão e data legíveis nas dez primeiras linhas; um bloco de sete linhas com rótulos alinhados é
mais legível e mais fácil de analisar por expressão regular no verificador futuro.

## 5. Padrões aplicáveis

- **Vendorização carimbada com adaptações declaradas.** É o regime que a spec 4 formaliza; esta
  feature entrega o carimbo, os descartes e as adaptações, e deixa manifesto com resumo
  criptográfico, verificador e ressincronizador para a feature 004. O formato do carimbo e o
  prefixo `/* HERDADO` são o contrato entre as duas features.
- **Leitura e julgamento separados, com prova estrutural.** Herdado da origem e verificado por
  suíte que lê os próprios fontes. O carimbo não pode conter a forma `from 'node:fs'`, e não
  contém.
- **Teste que se declara pulado em vez de passar em silêncio.** `it.skipIf` do executor, com a
  razão no nome do teste, para o caso do gancho instalado ausente.
- **Fixação exata de versões com arquivo de trava versionado.** Instalação por `npm ci`, nunca
  `npm install`, no onboarding.

## 6. Comandos de medição

Todos executados em 2026-09-09 a partir de `dev/reversa-views`, com `SH` apontando para
`HARNESS/scrum-harness/packages`:

```
git -C HARNESS/scrum-harness rev-parse HEAD
git -C HARNESS/scrum-harness status --porcelain packages/reversa-domain packages/reversa-probe
find $SH/reversa-domain/src -name '*.ts' | xargs wc -l
grep -rc "describe(" $SH/reversa-domain/tests/*.spec.ts $SH/reversa-probe/tests/*.spec.ts
grep -rhcE "^\s*(it|test)\(" $SH/reversa-domain/tests/*.spec.ts $SH/reversa-probe/tests/*.spec.ts
grep -rn "node:fs\|from 'fs'\|require('fs')" $SH/reversa-domain/src
grep -rn "import.meta" $SH/reversa-domain/src $SH/reversa-probe/src
grep -rn "@scrum-harness/" $SH/reversa-domain $SH/reversa-probe --include=*.ts
grep -rnoE "\.at\(|findLast|Object\.hasOwn|replaceAll|\?\?=" $SH/reversa-domain/src $SH/reversa-probe/src
cmp $SH/reversa-domain/tests/fixtures/check-legacy-policy.mjs .reversa/hooks/check-legacy-policy.mjs
node -e "console.log(require('HARNESS/scrum-harness/node_modules/vitest/package.json').version)"
curl -s https://registry.npmjs.org/vitest/latest
```

## 7. Fontes

- `_reversa_sdd/sdd/leitura-do-processo.md`, seções 3, 4, 6, 7, 11 e 15
- `_reversa_sdd/sdd/heranca-e-sincronia.md`, seções 6, 7, 9, 13 e 15
- `_reversa_sdd/sdd/empacotamento-e-verificacao.md`, seções 6, 10 e 15
- `_reversa_sdd/sdd/ponte-e-host.md`, seções 6, 9 e 10
- `_reversa_sdd/prd.md`, seções 5, 6, 7, 8 e 10
- `HARNESS/scrum-harness/package.json`, `tsconfig.base.json`, `packages/reversa-*/tsconfig.json`
- `dev/vscode-kanban/package.json`, `tsconfig.json`, `tsconfig.webview.json`, `.gitignore`
- Documentação do compilador sobre `rewriteRelativeImportExtensions`, introduzida na versão 5.7 🟡
