# Data Delta: herança e sincronia

> Identificador: `004-heranca-e-sincronia`
> Data: `2026-09-09`
> Base: `_reversa_sdd/sdd/heranca-e-sincronia.md#9-modelo-de-dados`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo

A seção 9 da spec do componente descreve duas estruturas persistidas, o manifesto e as adaptações,
e diz que ambas precisam ser legíveis por pessoa. Esta feature as materializa em YAML, acrescenta
uma terceira estrutura que a spec previa sem descrever, a configuração local das origens, e uma
quarta derivada, a constante da revisão que o build gera a partir do manifesto. O protocolo do canal
ganha um campo de texto. Nada existia antes, de modo que não há migração, e sim primeira escrita.

Todos os caminhos abaixo são relativos à raiz do repositório.

## 2. Estrutura nova, o manifesto da herança

Arquivo: `src/heranca/manifesto.yml`, versionado. 🟢

```yaml
versao: 1
origens:
  - nome: scrum-harness
    tipo: codigo
    endereco: https://github.com/iago-leal/scrum-harness
    revisao: 420305daa6cdd10858b720a34cb8db67d8e5c5e9
    dataDaRevisao: 2026-09-08
    dataDaCopia: 2026-09-09
    versaoDoReversaNaOrigem: 1.3.3
    chaveDoCaminhoLocal: scrum-harness
    prefixoNaOrigem: packages/
    sinaisDeDisparo:
      - anomalia de campo desconhecido no painel
      - versão nova do Reversa instalada
  - nome: vscode-kanban
    tipo: padrao
    endereco: https://github.com/iago-leal/vscode-kanban
    versaoObservada: 1.35.2
    dataDaObservacao: 2026-09-09
    chaveDoCaminhoLocal: vscode-kanban
    sinaisDeDisparo:
      - release nova da origem do kit
    nota: |
      Origem de padrão, não de arquivo. A lista de arquivos é vazia por definição, e não por
      pendência. O arquivo mais próximo dela é scripts/theme-tokens.js, reescrito a partir do
      podador do kit e por isso não conferível por resumo.
    arquivos: []
arquivos:
  - caminho: src/heranca/reversa-domain/src/state.ts
    origem: scrum-harness
    caminhoNaOrigem: packages/reversa-domain/src/state.ts
    carimbado: true
    resumo: sha256:<64 caracteres>
    dataDaCopia: 2026-09-09
    adaptacoes: []
  - caminho: src/heranca/reversa-domain/tests/fixtures/check-legacy-policy.mjs
    origem: scrum-harness
    caminhoNaOrigem: packages/reversa-domain/tests/fixtures/check-legacy-policy.mjs
    carimbado: false
    resumo: sha256:<64 caracteres>
    dataDaCopia: 2026-09-09
    adaptacoes: []
    paridadeExterna: .reversa/hooks/check-legacy-policy.mjs
```

| Campo | Tipo | Obrigatório | Observação |
|-------|------|-------------|------------|
| `versao` | inteiro | sim | Versão do formato do próprio manifesto, para que uma mudança futura de forma seja detectável |
| `origens[].nome` | texto | sim | Chave usada pelas entradas de arquivo e pelos blocos do relatório |
| `origens[].tipo` | `codigo` ou `padrao` | sim | Decide se a origem tem arquivos a conferir ou apenas versão a comparar (RN-10, D-11) |
| `origens[].revisao` | texto | apenas em `tipo: codigo` | Identificador de revisão do git na origem, e a fonte do que o painel mostra |
| `origens[].versaoObservada` | texto | apenas em `tipo: padrao` | Versão lida do manifesto de pacote da origem no dia da observação |
| `origens[].chaveDoCaminhoLocal` | texto | sim | Nome da chave a procurar em `heranca.origens.yml`; o caminho em si nunca entra aqui (RN-11) |
| `origens[].prefixoNaOrigem` | texto | não | Prefixo comum dos caminhos na origem, mantido para leitura, nunca para montar caminho |
| `arquivos[].caminho` | texto | sim | Caminho relativo à raiz deste repositório, com barras normais |
| `arquivos[].origem` | texto | sim | Precisa casar com o nome de uma origem declarada |
| `arquivos[].caminhoNaOrigem` | texto | sim | Caminho relativo à raiz da origem |
| `arquivos[].carimbado` | booleano | sim | Decide o recorte do resumo, conforme RN-03, e se o carimbo é conferido |
| `arquivos[].resumo` | texto | sim | `sha256:` mais 64 caracteres hexadecimais do conteúdo herdado |
| `arquivos[].dataDaCopia` | data | sim | Data da cópia daquele arquivo, que pode diferir da data da origem |
| `arquivos[].adaptacoes` | lista de texto | sim | Identificadores declarados em `adaptacoes.yml`; lista vazia é o caso comum |
| `arquivos[].paridadeExterna` | texto | não | Caminho neste repositório com o qual o arquivo precisa continuar idêntico; presente só no fixture do gancho |

**Regras que o leitor aplica.** 🟡

1. Nome de origem citado por arquivo que não conste de `origens` é manifesto inválido.
2. Identificador de adaptação citado por arquivo que não conste de `adaptacoes.yml` é manifesto
   inválido.
3. Caminho repetido em duas entradas é manifesto inválido.
4. Origem de `tipo: padrao` com `arquivos` não vazio é manifesto inválido, porque contradiz RN-10.
5. Resumo fora do formato declarado é manifesto inválido, e a mensagem nomeia a linha.

## 3. Estrutura nova, as adaptações declaradas

Arquivo: `src/heranca/adaptacoes.yml`, versionado. 🟢

```yaml
versao: 1
adaptacoes:
  - id: A1
    arquivo: src/heranca/reversa-probe/src/snapshot.ts
    motivo: |
      Na origem os pacotes se enxergam pelo nome do espaço de trabalho. Aqui não há espaço de
      trabalho, e o caminho relativo faz o mesmo serviço.
    original: |
      import { EMPTY_SNAPSHOT, StateContract, asRecord, asString, parseJsonSafe } from '@scrum-harness/reversa-domain'
      import type { ReversaSnapshot } from '@scrum-harness/reversa-domain'
    adaptado: |
      import { EMPTY_SNAPSHOT, StateContract, asRecord, asString, parseJsonSafe } from '../../reversa-domain/src/index.ts'
      import type { ReversaSnapshot } from '../../reversa-domain/src/index.ts'
```

| Campo | Tipo | Obrigatório | Observação |
|-------|------|-------------|------------|
| `id` | texto | sim | Identificador curto, o mesmo que o carimbo cita no campo `adaptações` |
| `arquivo` | texto | sim | Precisa constar de `manifesto.yml`, e a entrada de lá precisa citar este identificador |
| `motivo` | texto | sim | Prosa, para o leitor humano; o programa não a interpreta |
| `original` | bloco literal | sim | Trecho como ele aparece na origem, procurado por igualdade exata |
| `adaptado` | bloco literal | sim | Trecho que o substitui na cópia |

**Regras que a reaplicação aplica.** 🟡

1. O trecho original é procurado por igualdade exata no conteúdo lido da origem, e precisa ocorrer
   exatamente uma vez. Zero ocorrências ou mais de uma interrompem a ressincronização inteira,
   conforme RN-09.
2. O bloco literal preserva o fim de linha final, e a busca desconta essa diferença, para que
   escrever o trecho em YAML não exija cuidado tipográfico de quem o declara.
3. A3 é remoção, e por isso seu `adaptado` é vazio. Um `adaptado` vazio é apagamento declarado, não
   campo faltando.
4. A ordem de aplicação dentro de um mesmo arquivo é a ordem de declaração.

As três adaptações que migram são A1, A2 e A3, com os trechos que
`src/heranca/PROCEDENCIA.md#5-adaptacoes` já registra. 🟢

## 4. Estrutura nova, a configuração local das origens

Arquivos: `heranca.origens.yml`, ignorado pelo git, e `heranca.origens.exemplo.yml`, versionado. 🟢

```yaml
origens:
  scrum-harness: /workspaces/iagoleal/HARNESS/scrum-harness
  vscode-kanban: /workspaces/iagoleal/dev/vscode-kanban
```

| Regra | Comportamento |
|-------|---------------|
| Arquivo ausente | As duas origens são relatadas como indisponíveis, e a mensagem nomeia o arquivo, o exemplo ao lado e as chaves esperadas |
| Chave ausente para uma origem | Só aquela origem é relatada como indisponível |
| Caminho que não existe no disco | Origem indisponível, com o caminho declarado ecoado na mensagem (EC-01) |
| Caminho existente sem o que a origem promete | Origem relatada como indisponível pelo mesmo caminho de código, nomeando o subcaminho que faltou |

O arquivo nunca é escrito pelas ferramentas. Ele é do usuário, e a única coisa que esta feature faz
com ele é ler e, quando falta, dizer com precisão o que criar.

## 5. Estrutura derivada, a constante da revisão

Arquivo: `src/host/inheritance.ts`, gerado por `scripts/gerar-revisao-heranca.js`, versionado. 🟢

```ts
/** GERADO a partir de src/heranca/manifesto.yml. Não editar à mão. */
export const INHERITED_MODEL_REVISION = '420305daa6cdd10858b720a34cb8db67d8e5c5e9'
```

| Propriedade | Valor |
|-------------|-------|
| Fonte | O campo `revisao` da origem `scrum-harness` no manifesto |
| Quem escreve | O gerador, chamado pelo build e nunca pelo ressincronizador (D-14, RN-07) |
| Quem lê | `src/host/provider.ts`, e nada mais |
| Garantia | Uma suíte compara a constante com o manifesto e falha quando divergirem |
| Ausência | Revisão ausente ou vazia no manifesto gera constante de texto vazio, que o painel mostra como `não declarado` |

## 6. Delta no protocolo do canal

`SetProcessData` ganha um campo, por acréscimo. 🟢

| Campo | Tipo | Presença | Origem do valor |
|-------|------|----------|-----------------|
| `inheritedRevision` | texto | sempre, podendo ser vazio | A constante gerada, repassada pelo provedor sem transformação |

Detalhe do contrato em `_reversa_forward/004-heranca-e-sincronia/interfaces/protocolo-webview.md`.
Nenhum campo é renomeado ou removido, e `SetEntryData` fica intacto: nos estados sem processo o
cabeçalho já mostra `não declarado` em todos os itens.

## 7. Delta no vocabulário da webview

Não há estrutura nova guardada. O que entra é um valor derivado, calculado por função pura no
domínio e desenhado pelo cabeçalho. 🟡

| Valor | Onde nasce | Regra |
|-------|------------|-------|
| Revisão abreviada | Função pura em `src/webview/domain/`, ao lado dos demais rótulos | Sete caracteres iniciais quando a revisão tiver ao menos sete; o texto inteiro quando for menor; `não declarado` quando vier vazia |

A preferência de exibição guardada pela webview não muda, e o sexto item do cabeçalho não é
recolhível nem configurável.

## 8. Migrações necessárias

Nenhuma migração de dado. Há uma migração de fonte, que é o ponto da feature: o resumo, a revisão e
as adaptações deixam de existir apenas como prosa em `src/heranca/PROCEDENCIA.md` e passam a existir
como dado nos dois arquivos YAML. O texto continua, agora apontando para eles, conforme RF-17.

## 9. Impacto sobre a extração reversa

| Artefato | Como passa a ser lido |
|----------|------------------------|
| `_reversa_sdd/sdd/heranca-e-sincronia.md#9-modelo-de-dados` | As duas estruturas deixam de ser desenho e são arquivo; os nomes de campo desta feature são os nomes reais |
| `_reversa_sdd/sdd/heranca-e-sincronia.md#14-open-questions` | OQ-02 e OQ-03 estão fechadas pela sessão de esclarecimentos de 2026-09-09; OQ-01 já estava fechada de fato pelo carimbo, que usa a revisão do git |
| `_reversa_forward/002-ponte-e-host/interfaces/protocolo-webview.md` | A regra de acréscimo passa a ter seu primeiro exercício real |
| `src/heranca/PROCEDENCIA.md` | Deixa de ser fonte do dado e passa a ser o registro narrativo que aponta para o manifesto |
