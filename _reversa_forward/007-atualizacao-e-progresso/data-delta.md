# Delta de dados: verificação de atualização e progresso visível

> Identificador: `007-atualizacao-e-progresso`
> Data: `2026-09-09`
> Roadmap: `_reversa_forward/007-atualizacao-e-progresso/roadmap.md`

## 1. O que muda, em uma frase

Entram três formas novas em memória, o desfecho da consulta à origem, o carimbo da construção e a
contagem que a barra desenha; nenhuma delas é persistida pela extensão, e a única coisa que passa a
ser guardada fora do processo é uma chave de configuração, guardada pelo editor.

## 2. O carimbo da construção

Constantes geradas, no mesmo regime de `src/host/inheritance.ts`: escritas por script antes da
compilação, entram no pacote como valor literal, e o painel as declara sem abrir arquivo em tempo de
execução.

| Campo | Tipo | Origem | Exemplo |
|---|---|---|---|
| `EXTENSION_VERSION` | `string` | Derivada pelo `scripts/versao.js` | `0.6.1` |
| `BUILT_FROM_COMMIT` | `string` | `git rev-parse HEAD` no momento da construção | `a23711daa6cd…` |
| `ORIGIN_REPOSITORY` | `string \| null` | `git remote get-url origin`, normalizado para `dono/repositorio` | `iago-leal/reversa-views` |

Três observações de forma. A primeira é que o commit viaja INTEIRO e é o painel que o encurta, pela
mesma regra que já encurta a revisão do modelo em `src/webview/domain/labels.ts`: encurtar na origem
destruiria o valor consultável que RF-17 pede no atributo. A segunda é que a origem é `null` quando o
repositório não tem remoto, ou tem um que não é do serviço conhecido, e esse `null` é o que
desliga a consulta na raiz, antes de qualquer requisição. A terceira é que nenhuma das três é lida de
`package.json` em tempo de execução: o manifesto não viaja dentro do pacote da tela e não deve virar
dependência de leitura do host.

### Regra da derivação da versão

```
maiorFeature   = maior NNN entre os arquivos de _reversa_sdd/addenda/NNN-*.md
commitDoAdendo = primeiro commit que ACRESCENTOU aquele arquivo
patch          = quantidade de commits de commitDoAdendo até HEAD
versao         = 0.<maiorFeature>.<patch>
```

Sem clone git, sem adendo algum ou sem histórico, a derivação devolve `0.0.0` e quem a chamou imprime
a causa. O primeiro número permanece `0` até decisão explícita do mantenedor, que é o único ato
humano que sobra e que ninguém precisa praticar hoje.

## 3. O desfecho da consulta à origem

Forma nova, nunca persistida, viva apenas enquanto o painel está aberto. É união discriminada porque
os desfechos não compartilham campos: um traz distância, outro traz causa, e os demais não trazem
nada. Campo opcional em forma única seria convite a desenhar "0 commits atrás" quando a consulta nem
aconteceu.

| Variante | Campos | Quando ocorre | O que o painel diz |
|---|---|---|---|
| `desligada` | nenhum | Chave de configuração em falso, ou repositório sem origem conhecida | Que a conferência está desligada |
| `consultando` | nenhum | Entre o envio do processo e a resposta | Nada além do estado de espera do cabeçalho |
| `em-dia` | nenhum | Comparação `identical`, ou `behind` do lado da cabeça | Que a extensão está em dia |
| `atrasada` | `commits: number` | Comparação `ahead`, com a distância medida a partir da base | Quantos commits novos há, e o comando que os aplica |
| `divergente` | `commits: number` | Comparação `diverged` | Que há novidade e que o clone também tem commits próprios |
| `commit-desconhecido` | nenhum | Resposta 404 à comparação | Que a origem não conhece o commit desta construção |
| `impossivel` | `causa: 'sem-rede' \| 'limite-de-taxa' \| 'resposta-inesperada' \| 'tempo-esgotado'` | Falha de transporte, recusa por cota, corpo ilegível ou estouro do tempo limite | Que a consulta não foi possível, nomeando a causa |

O par `atrasada` e `divergente` existe separado de propósito: são dois fatos distintos e o segundo
pede cautela do mantenedor, porque aplicar a atualização sobre commits locais é justamente o que o
atualizador recusa em RF-05.

## 4. O acréscimo ao canal

O protocolo cresce por acréscimo, como manda `_reversa_sdd/sdd/ponte-e-host.md#9-modelo-de-dados`:
nada é renomeado, nada é removido, nada muda de ordem.

| Antes | Depois |
|---|---|
| `HOST_COMMANDS = ['setProcess', 'setEntry', 'setNotice']` | `HOST_COMMANDS = ['setProcess', 'setEntry', 'setNotice', 'setUpdate']` |
| `HostMessage` com três variantes | Uma quarta variante, `{ command: 'setUpdate'; data: UpdateStatus }` |
| `SetProcessData` com dez campos | Inalterado |

`SetProcessData` NÃO ganha campo, e essa é a decisão D-02 vista do lado dos dados: a consulta é
assíncrona, e um campo dentro do payload da leitura ou atrasaria o painel ou viajaria vazio.

O detalhe do envelope está em `interfaces/delta-do-canal.md`; o da requisição, em
`interfaces/consulta-a-origem.md`.

## 5. O estado da tela

`EffectiveEntry`, a forma que `src/webview/domain/entry.ts` produz, ganha um campo:

| Campo | Tipo | Regra |
|---|---|---|
| `update` | `UpdateStatus` | Começa em `desligada`; `setUpdate` o substitui; uma releitura o leva de volta a `consultando`, preservando o anterior na tela até a resposta chegar |

A regra de releitura segue RN-08 do painel, a mesma que mantém o conteúdo na tela enquanto se relê:
apagar o desfecho anterior no instante da releitura faria a linha piscar sem informar.

## 6. A contagem que a barra desenha

Forma de apresentação, não de domínio. Vive nas propriedades do componente e em nenhum lugar mais.

| Campo | Tipo | Regra |
|---|---|---|
| `feitos` | `number` | Nunca negativo; acima de `total`, é limitado a `total` para desenho, e a divergência já tem aviso próprio |
| `total` | `number` | Zero significa não desenhar barra alguma |
| `rotulo` | `string` | Texto equivalente, que repete em palavras a contagem escrita ao lado |

De onde sai o par de cada cartão:

| Cartão | `feitos` | `total` |
|---|---|---|
| Decomposição da feature ativa | `process.forward.actions.fechadas` | `process.forward.actions.total` |
| Ciclo forward | os mesmos dois campos | os mesmos dois campos |
| Histórico das entregas | entradas com situação `convergida` | `history.total`, declarado, e não o comprimento da lista exibida |

O denominador do histórico merece atenção: o corte por volume limita as entradas exibidas, e usar o
comprimento da lista faria a barra encher sozinha num projeto grande. RN-08 fixa que o total
declarado é a autoridade.

## 7. A chave de configuração

Primeira configuração contribuída por esta extensão. É guardada pelo editor, não por nós, e não
viaja no canal: o host a lê e a traduz em desfecho `desligada`.

| Chave | Tipo | Padrão | Escopo |
|---|---|---|---|
| `reversaViews.conferirAtualizacao` | booleana | verdadeiro | usuário e workspace, como o editor faz por padrão |

## 8. A versão do manifesto muda de regime

Não é migração de dado, mas é mudança de quem escreve um campo, e por isso está aqui.

| Antes | Depois |
|---|---|
| `version` de `package.json` escrito à mão, congelado em `0.0.1` | Escrito pela construção em torno do empacotamento, a partir da derivação, e restaurado ao valor versionado em seguida |

O valor que fica versionado no repositório passa a ser irrelevante, e é por isso que ele deve ser
deixado como está em vez de zerado: mexer nele seria sugerir que alguém ainda o lê.

## 9. O que não muda

- `ReversaProcess`, `ProbeReport` e tudo o que a camada de leitura vendorizada produz.
- `ActiveDecomposition`, `PlanAction`, `ProjectHistory` e as formas da feature 006. A ordem de
  exibição muda; a forma dos dados, não.
- `DisplayPreferences` e a preferência guardada no estado do painel, que continua sendo a única
  estrutura que a extensão persiste.
- O documento e a política de conteúdo do painel, que seguem sem permissão de conexão de saída.

## 10. Migrações necessárias

Nenhuma. Nada do que a feature acrescenta é lido de estado anterior, e a única estrutura persistida
pela extensão continua sendo a preferência de exibição, intocada. Um painel construído antes desta
feature, recebendo um host novo, simplesmente ignora o comando que não conhece, que é a garantia que
o crescimento por acréscimo dá.
