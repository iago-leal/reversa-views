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

Dezesseis. Sete (A1 a A3, A7, A9, A12 e A14) são de resolução de importação ou de exportação. Nove
(A4 a A6, A8, A10, A11, A13, A15 e A16) tocam uma regra de leitura, ou a suíte que a fixa, e são a
exceção registrada: nasceram de defeito encontrado no uso, `BUG-20260909-FJBD`,
`BUG-20260912-PIPE`, `BUG-20260914-DTLI` e `BUG-20260914-5UH7`, e o caminho para aposentá-las é o
mesmo, levar a mudança à origem e ressincronizar.

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

### A4, a regra de cenário ambíguo em `reversa-domain/src/impact.ts`

A origem registra a anomalia `cenario-ambiguo` quando a nota de impacto declara greenfield e usa
tipo diferente de `componente-novo`. Neste projeto, toda feature greenfield posterior à primeira
modifica arquivos que as anteriores criaram, e as notas das features 006 e 007 distinguem criado de
modificado de propósito. A distinção é mais verdadeira que a regra, e a anomalia virava dúvida
permanente no cabeçalho do painel (`BUG-20260909-FJBD`). O bloco condicional saiu; o vocabulário de
anomalias ficou intacto, para que a ressincronização não dependa de `anomaly.ts`.

Original:

```ts
    // The note is authoritative, but a shape that contradicts it is worth saying.
    if (cenario === 'greenfield' && files.some(file => file.tipo !== 'componente-novo')) {
      log.add(FILE, 'cenario-ambiguo', 'nota de greenfield com impacto que não é componente-novo')
    }
```

Adaptado:

```ts
    // A4 (BUG-20260909-FJBD): the note is authoritative, and a shape with other
    // impact types does not contradict it. In this project a greenfield feature
    // after the first one modifies files the earlier ones created, and a note
    // that tells created from modified is more truthful, not ambiguous.
```

### A5, o caso correspondente em `reversa-domain/tests/impact.spec.ts`

Consequência de A4: o caso que fixava a anomalia passa a fixar a aceitação. Só a asserção final e o
nome do caso mudam.

### A6, a barra vertical escapada em `reversa-domain/src/table.ts`

A barra vertical dentro de uma célula se escreve escapada. É assim que o markdown diz "aqui vai uma
barra literal", e é a única forma de a linha sobreviver a qualquer renderizador, o preview do editor
incluído. O divisor da origem parte em toda barra: a linha ganha colunas que não existem, as
verdadeiras saem da posição e a leitura a descarta sem dizer nada. O efeito apareceu no
`erp-mineracao`, onde o Reversa escreve mensagem de erro e linha de log com campos separados por
barra: 63 ações sumiram da decomposição das oito features, e 11 justificativas da tabela de impacto
chegaram cortadas na primeira barra. Nenhum arquivo estava errado; o leitor é que não reconhecia a
notação (`BUG-20260912-PIPE`).

O divisor passa a honrar o escape e a devolver cada célula desescapada, porque o painel mostra o
texto que a célula quer dizer, e não a notação que o carregou. Passa também a ser exportado: a
decomposição de `actions.md` lia linha por conta própria, e duas cópias da mesma regra são
exatamente a divergência que o cabeçalho deste módulo diz existir para evitar.

O trecho original e o adaptado estão em `adaptacoes.yml`, literais.

### A7, a exportação correspondente em `reversa-domain/src/index.ts`

Consequência de A6: o divisor exportado chega ao domínio próprio pelo índice do pacote, e não por
importação que fure a fachada. Uma linha, um nome a mais.

### Onde a regressão de A6 foi fixada, e por quê

Em `tests/leitura-tabela-barra-escapada.spec.ts`, suíte local, e não na herdada
`reversa-domain/tests/table.spec.ts`. A suíte herdada é código sob o mesmo regime dos módulos: um
caso acrescentado ali seria mais uma adaptação a reaplicar em cada ressincronização, e o defeito foi
descoberto pelo uso deste projeto, não pela origem. A5 mostra quando o caminho é o outro: lá a
suíte herdada fixava o comportamento que A4 mudou, e deixá-la intacta faria a suíte reprovar o
código. Aqui nada do que a origem fixa deixou de valer, e as 1527 asserções da árvore continuam
verdes sem tocar em caso algum.

### A8 a A13, a notação markdown do próprio Reversa em `table.ts`, `impact.ts` e `watch.ts`

O `/reversa-coding` grafa a taxonomia de impacto entre crases, como o próprio `SKILL.md` a grafa, e
às vezes escreve a severidade em negrito. O leitor da origem compara a célula crua com o
vocabulário, e `` `componente-novo` `` não é `componente-novo`: no `afla`, as 207 linhas das doze
features com tabela reconhecida viravam anomalia, com a contagem canônica zerada em todas. O
cabeçalho que anota uma coluna, `Componente (`architecture.md`)`, recusava a tabela inteira das
features 003 e 004; o que escreve um artigo a mais, `Regra esperada após a mudança`, recusava 12 dos
14 vigias. Nenhum arquivo estava errado (`BUG-20260914-DTLI`).

A regra nasce uma vez, em `table.ts` (A8), que existe justamente para que os leitores não divirjam.
`canonicalOf` retira só as marcas que envolvem o valor inteiro, crases e negrito, e devolve o membro
do vocabulário ou nada; `matchesHeader` aceita, por coluna, a anotação final entre parênteses na
célula encontrada e o artigo definido isolado, e nunca encurta o nome esperado. Não há caixa, nem
semelhança, nem valor mais próximo: o que está fora do vocabulário continua anomalia, com o texto
como está no arquivo, que é o que a spec manda preservar.

Os leitores passam a usá-la: A9 e A12 importam, A10 lê tipo e severidade, A13 o tipo de
verificação, e A11 troca a segunda comparação de cabeçalho de `impact.ts`, que tinha divisor próprio
e nem honrava o escape de A6, pela regra única. O índice do pacote não muda, porque nada fora da
camada herdada usa as funções novas. Os trechos original e adaptado estão em `adaptacoes.yml`,
literais.

### Onde a regressão de A8 a A13 foi fixada

Em `tests/leitura-notacao-markdown.spec.ts`, suíte local, pelo motivo registrado para A6. Metade dos
casos fixa o limite, e não o reconhecimento: valor fora do vocabulário, marca parcial, caixa
trocada, tabela alheia e cabeçalho esperado encurtado continuam recusados.

### A14 a A16, o vigia onde o agente o escreve, em `reversa-domain/src/watch.ts`

O leitor da origem procura a tabela ativa do `regression-watch.md` só no preâmbulo, antes do
primeiro título, e reconhece `Observações` e `Arquivadas` pelo nome exato. O `/reversa-coding`
prescreve "cabeçalho, tabela, histórico, arquivadas" e não proíbe título sobre a tabela; no `afla`
ela mora sempre sob título próprio (`Itens de vigia`, `Itens ativos`, `Watch items`), e doze das
catorze seções de observações se chamam `Observações, sem peso de regressão`. Nas catorze features
a leitura devolvia tudo vazio, contra 226 linhas `W###`, e sem anomalia alguma
(`BUG-20260914-5UH7`).

A15 reconhece a seção pelo começo do título, e trata como vigia ativo toda seção que não é de
observações, de arquivadas ou de histórico, o preâmbulo incluído. O que não pode ser lido passa a
ser dito, com o código `tabela-nao-reconhecida`, que já existia no vocabulário: a tabela de
observações ou de arquivadas cujas colunas não são as do vigia, e o arquivo sem tabela de vigia
alguma. As tabelas de colunas próprias são sinalizadas e não lidas, porque ler tabela arbitrária
pela coluna `ID` seria desenho novo sem consumidor que o peça (NG-01). Tabelas em torno do vigia
ativo, como a grade de metadados sob o título, não são assunto do leitor.

A16 pula a linha só de travessões, que é como o agente escreve o vigia vazio dentro da tabela
obrigatória; lida como item, ela virava um W sem ID. A14 é a importação correspondente.

### Onde a regressão de A14 a A16 foi fixada

Em `tests/leitura-vigia-secoes.spec.ts`, suíte local, pelo motivo registrado para A6. A suíte
herdada de `watch.ts` continua verde sem tocar em caso algum.

### O que deliberadamente não foi adaptado

As 21 linhas de comentário que mencionam o nome de pacote da origem, incluídos os cabeçalhos
`@module`, seguem intactas. São registro histórico, não vínculo de compilação, e reescrevê-las
criaria 21 adaptações a reaplicar em cada ressincronização, sem ganho algum.

### Pendências de origem

Nem toda regra que este projeto corrige vira adaptação. A feature 011 encontrou dois defeitos na
camada herdada e resolveu os dois **fora** dela, na camada local, porque o que ambos pedem é decidir
o que a tela mostra, e isso pertence ao painel pelo NG-03 de
`_reversa_sdd/sdd/leitura-do-processo.md#4-non-goals`. Nenhuma adaptação nasceu daí, nenhum carimbo
mudou, e o total declarado na abertura desta seção continua dezesseis.

O que fica devendo é a origem. Quem mais herda do `scrum-harness` continua vendo os dois defeitos, e
levá-los para lá é o mesmo caminho de aposentadoria que esta seção declara para as nove adaptações
de regra. Enquanto isso não acontece, a divergência fica escrita aqui.

| Achado na origem | Onde | Como foi resolvido aqui | O que falta |
|---|---|---|---|
| A fase de encerramento vira anomalia: `derivePhases` conhece as cinco fases canônicas e registra `fase-desconhecida` sobre qualquer outro valor de `phase`, inclusive os que o próprio REVERSA escreve ao fechar a extração, medidos em dezessete projetos de sessenta e quatro e sob cinco grafias em 2026-09-20 | `reversa-domain/src/state.ts`, `derivePhases` | `src/domain/discovery-state.ts` reconhece o encerramento pela forma e devolve a identidade da anomalia; `src/webview/domain/anomalies-view.ts` a desconta da lista que a tela desenha | Levar o reconhecimento ao `scrum-harness` e ressincronizar |
| O checkpoint sem `completed_at` é dado como em curso: `readCheckpoints` deriva `inProgress` da ausência do campo, e afirma trabalho em andamento sobre checkpoint que declarou a conclusão sob nome que o esquema não tem, vinte e seis registros de duzentos e vinte e nove | `reversa-domain/src/state.ts`, `readCheckpoints` | `src/domain/discovery-state.ts` distingue três situações, e a terceira não afirma nem que terminou nem que corre | Levar o terceiro estado ao `scrum-harness` e ressincronizar |

O que está acima é pendência, e não adaptação. Não há trecho original nem trecho adaptado, nada
entra em `adaptacoes.yml` e nada aqui o ressincronizador reaplica; a suíte
`tests/heranca-adaptacoes.spec.ts` fixa as duas coisas, para que a leitura desta subseção não
escorregue para a das que a cercam.

## 6. Os três fixtures, sem carimbo

`reversa-domain/tests/fixtures/` traz `check-legacy-policy.mjs`, `reversa-config.real.json` e
`state.real.json`, todos cópia byte a byte e todos sem carimbo. Nos dois JSON o motivo é a
linguagem, que não admite comentário. No `.mjs` o motivo é mais forte: ele precisa continuar
idêntico ao gancho que o Reversa instala em `.reversa/hooks/check-legacy-policy.mjs`, porque a suíte
local `tests/paridade-gancho-instalado.spec.ts` compara os dois byte a byte e falha à menor
divergência. Carimbá-lo quebraria essa comparação no ato.

Na data da cópia os três eram idênticos à origem, e o `.mjs` era idêntico também ao gancho instalado
neste repositório.

## 7. O kit de extensão, segunda origem: padrão adotado, código nenhum

A feature 003 trouxe uma segunda origem, `vscode-kanban`, e ela é de natureza diferente da primeira.
Da camada de leitura veio **código**, vendorizado, carimbado e sujeito ao regime das seções acima.
Do kit de extensão veio **padrão**: o desenho de cinco decisões que já haviam sido resolvidas lá, e
que teria sido tolice resolver de novo pior. Nenhum arquivo foi copiado.

Os cinco padrões adotados:

1. **A ponte como caminho único.** Um módulo, e um só, toma a interface do host e registra o ouvinte
   de mensagem. Todo o resto da webview recebe funções.
2. **A preferência como função total.** O estado guardado da webview sobrevive à versão que o
   escreveu, e por isso a leitura dele nunca lança: ausência, tipo errado e nome que não existe mais
   viram preferência vazia.
3. **O tema pela classe do corpo do documento.** O editor escreve a classe, o painel a lê e traduz
   em atributos, e a troca repinta sem releitura.
4. **A ausência de falha silenciosa.** Comando que não se entende produz linha de log nomeando o
   comando; seção que quebra declara a falha no lugar dela; leitura que degradou diz que degradou.
5. **A poda de tokens por fecho transitivo, com guarda.** O fecho parte do que a folha nomeia, e um
   fecho vazio interrompe a construção em vez de servir um painel sem cor.

Porque nada foi copiado, o carimbo de sete linhas e a entrada de manifesto das seções 3 e 4 **não se
aplicam** a esta origem: não há arquivo herdado a conferir, e um verificador que a procurasse não
acharia nada. O que existe é dívida de desenho, e ela está declarada onde nasce.

O arquivo mais próximo da origem é `scripts/theme-tokens.js`: o algoritmo do fecho e a guarda do
fecho vazio vieram do podador do kit, reescritos para este projeto. O cabeçalho dele é o lugar onde
essa proximidade está registrada, e é lá que a conferência começa se um dia a origem mudar.

## 8. O regime verificável, entregue pela feature 004

O que esta nota registra em prosa, a feature 004 passou a registrar em dado conferível. A divisão é
esta: aqui vive o **porquê** de cada escolha, e lá vive o **que**, na forma que uma ferramenta lê.

- **`src/heranca/manifesto.yml`** é a fonte do dado de procedência: as duas origens, a revisão de
  cada uma, e o resumo criptográfico do conteúdo dos 37 arquivos herdados. A lista de arquivos é
  escrita por ferramenta, e não à mão.
- **`src/heranca/adaptacoes.yml`** é a fonte das adaptações. As três descritas na seção 5 estão lá
  com o trecho original e o adaptado literais, e é assim que o ressincronizador as reaplica sobre
  uma revisão nova sem ninguém precisar refazê-las.
- **O ritual** está no `README.md`, na seção da herança: os três sinais que disparam a conferência,
  os comandos `npm run check:heranca` e `npm run sync:heranca`, e o que fazer quando o
  ressincronizador para.

O resumo cobre o conteúdo herdado, isto é, o arquivo a partir da linha 8 nos que têm carimbo e o
arquivo inteiro nos três fixtures da seção 6. Trocar o carimbo, portanto, não conta como edição:
carimbo é metadado, e ressincronizar o reescreve por definição.

O limite continua o mesmo, e o `README.md` o declara: resumo igual não é comportamento igual. A
dependência transitiva é o caso que ele não pega, e as suítes herdadas são a rede que resta.
