# Procedência da camada herdada

Esta pasta não é código escrito aqui. É cópia de dois pacotes do `scrum-harness`, trazida para
dentro deste repositório para que a leitura do processo do Reversa funcione sem depender daquela
árvore. Este arquivo registra de onde a cópia veio, o que foi descartado e o que foi adaptado, de
modo que uma ressincronização futura possa reaplicar as mesmas decisões sem reabrir a investigação.

## 1. Origem

| Item | Valor |
|------|-------|
| Repositório | `scrum-harness` |
| Endereço | https://github.com/iago-leal/scrum-harness |
| Revisão | `420305daa6cdd10858b720a34cb8db67d8e5c5e9` |
| Data da revisão | 2026-09-08 |
| Versão do Reversa que a origem acompanhava | 1.3.3 |
| Data da cópia | 2026-09-09 |

Os pacotes copiados são `packages/reversa-domain` (a camada de julgamento, que interpreta os
artefatos do Reversa) e `packages/reversa-probe` (a sonda de disco, que só lê e nunca escreve).

## 2. Estrutura da cópia

A regra é o caminho espelhado: todo arquivo em `ORIGEM/packages/<pacote>/<resto>` chega em
`src/heranca/<pacote>/<resto>`, sem renomear pasta nem arquivo. Isso permite conferir a fidelidade
com uma substituição de prefixo, sem tabela de correspondência.

| Caminho aqui | Caminho na origem | Conteúdo |
|---|---|---|
| `reversa-domain/src/` | `packages/reversa-domain/src/` | 14 módulos de julgamento |
| `reversa-domain/tests/` | `packages/reversa-domain/tests/` | 14 suítes |
| `reversa-domain/tests/fixtures/` | `packages/reversa-domain/tests/fixtures/` | 3 fixtures, sem carimbo |
| `reversa-probe/src/` | `packages/reversa-probe/src/` | 3 módulos, a rota fora |
| `reversa-probe/tests/` | `packages/reversa-probe/tests/` | 3 suítes, a da rota fora |

A lista nominal dos arquivos copiados não entra aqui de propósito: ela é a própria listagem das
pastas, e duplicá-la só criaria uma segunda fonte para divergir da primeira.

## 3. Contrato do carimbo

Todo arquivo `.ts` desta pasta começa por um carimbo de sete linhas, e as sete linhas vêm antes de
qualquer conteúdo original. A primeira linha é fixa e começa por `/* HERDADO`: é essa marca, e não
a extensão nem o caminho, que o verificador previsto para a feature 004 usará para reconhecer um
arquivo herdado.

```
/* HERDADO: não editar sem declarar a adaptação em src/heranca/PROCEDENCIA.md
 * origem:      scrum-harness (https://github.com/iago-leal/scrum-harness)
 * caminho:     packages/reversa-domain/src/state.ts
 * revisão:     420305daa6cdd10858b720a34cb8db67d8e5c5e9 (2026-09-08)
 * copiado em:  2026-09-09
 * adaptações:  nenhuma
 */
```

O campo `caminho` traz o caminho na origem, e o campo `adaptações` traz `nenhuma` ou o identificador
da adaptação declarada na seção 5. Como o carimbo ocupa exatamente as linhas 1 a 7, a conferência
contra a origem se faz comparando o arquivo a partir da linha 8.

Trinta e quatro arquivos `.ts` receberam carimbo: 28 da camada de julgamento e 6 da sonda.

## 4. Descartes deliberados

A rota HTTP da sonda ficou de fora. Este projeto é uma extensão de editor, que fala com a sonda por
chamada de função no mesmo processo, e não por requisição; trazer a rota significaria carregar uma
superfície de rede que nada aqui usa, com o contrato de resposta que ela impõe.

| Arquivo descartado | Tamanho na origem | Motivo |
|---|---|---|
| `packages/reversa-probe/src/route.ts` | 88 linhas | Superfície HTTP sem uso numa extensão de editor |
| `packages/reversa-probe/tests/route.spec.ts` | 12 casos | Suíte do arquivo acima |

O descarte tem consequência no índice da sonda, registrada como adaptação A3.

## 5. Adaptações

Três, todas de resolução de importação ou de exportação. Nenhuma regra de negócio foi tocada.

### A1, importações de `reversa-probe/src/snapshot.ts`

Na origem os pacotes se enxergam pelo nome do espaço de trabalho. Aqui não há espaço de trabalho, e
o caminho relativo faz o mesmo serviço.

Original:

```ts
import { EMPTY_SNAPSHOT, StateContract, asRecord, asString, parseJsonSafe } from '@scrum-harness/reversa-domain'
import type { ReversaSnapshot } from '@scrum-harness/reversa-domain'
```

Adaptado:

```ts
import { EMPTY_SNAPSHOT, StateContract, asRecord, asString, parseJsonSafe } from '../../reversa-domain/src/index.ts'
import type { ReversaSnapshot } from '../../reversa-domain/src/index.ts'
```

### A2, importação de `reversa-probe/tests/snapshot.spec.ts`

Mesmo motivo de A1, na suíte.

Original:

```ts
import { readReversa } from '@scrum-harness/reversa-domain'
```

Adaptado:

```ts
import { readReversa } from '../../reversa-domain/src/index.ts'
```

### A3, exportações de `reversa-probe/src/index.ts`

Consequência do descarte da rota: um índice que reexporta um arquivo ausente não compila. Apenas as
duas linhas finais saíram, e nada entrou no lugar.

Removido:

```ts
export { answerReversa } from './route.ts'
export type { ReversaAnswer, ReversaAnswerBody, ReversaProcessWire } from './route.ts'
```

### O que deliberadamente não foi adaptado

As 21 linhas de comentário que mencionam o nome de pacote da origem, incluídos os cabeçalhos
`@module`, seguem intactas. São registro histórico, não vínculo de compilação, e reescrevê-las
criaria 21 adaptações a reaplicar em cada ressincronização, sem ganho algum.

## 6. Os três fixtures, sem carimbo

`reversa-domain/tests/fixtures/` traz `check-legacy-policy.mjs`, `reversa-config.real.json` e
`state.real.json`, todos cópia byte a byte e todos sem carimbo. Nos dois JSON o motivo é a
linguagem, que não admite comentário. No `.mjs` o motivo é mais forte: ele precisa continuar
idêntico ao gancho que o Reversa instala em `.reversa/hooks/check-legacy-policy.mjs`, porque a suíte
local `tests/paridade-gancho-instalado.spec.ts` compara os dois byte a byte e falha à menor
divergência. Carimbá-lo quebraria essa comparação no ato.

Na data da cópia os três eram idênticos à origem, e o `.mjs` era idêntico também ao gancho instalado
neste repositório.

## 7. O que fica para a feature 004

Esta é a primeira forma do regime de herança, e cobre só o registro. A feature 004 acrescenta a
verificação automática:

- **Manifesto com resumo criptográfico** de cada arquivo herdado, para detectar edição acidental sem
  depender de comparação com a origem.
- **Verificador** que lê o manifesto e o carimbo, e acusa arquivo herdado alterado, arquivo sem
  carimbo e carimbo inconsistente com o manifesto.
- **Ressincronizador** que traz uma revisão nova da origem e reaplica as adaptações declaradas na
  seção 5, apontando as que deixaram de casar.

Até lá, a conferência é manual, e o procedimento está no passo 8 do `onboarding.md` da feature 001.
