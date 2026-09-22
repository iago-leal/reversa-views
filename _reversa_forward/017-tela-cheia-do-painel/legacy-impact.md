# Impacto sobre o legado: `017-tela-cheia-do-painel`

> Data: `2026-09-21`
> Feature: `017-tela-cheia-do-painel`
> Cenário: **greenfield**. Feature greenfield, sem legado pré-existente. Âncora: `prd.md` + specs SDD.
> Política de edição no momento da execução: `allowLegacyEdits: true` com `allowedPaths` **vazio**,
> isto é, liberação **irrestrita** de toda a raiz do projeto. Nenhuma escrita foi recusada e nenhum
> arquivo pré-existente foi apagado.

Este projeto nasceu por `/reversa-new` e nunca passou por extração reversa: não há `architecture.md`
nem `domain.md`, e por isso não há regra 🟢 extraída de código a preservar ou a modificar. O mapeamento
abaixo aponta para as specs de `_reversa_sdd/sdd/` e para os adendos 014 e 016, que são a âncora real
da ferramenta de terminal: ela não tem spec própria, e são os adendos que a descrevem.

A entrega é de **mecânica de tela**, e o que a define é o que ela deixou parado: a passada, a saída de
dados, os códigos de saída, as frases, a ordem, as contagens, as cores e as molduras. O que muda é como
o quadro chega ao terminal (redesenho por posicionamento, sincronizado, sem apagar a tela), o que o
teclado sabe fazer (página e meia página) e como a rajada de redimensionamento é absorvida. Nenhum
módulo fora de `src/cli/` foi tocado, nenhuma bandeira entrou, e `src/cli/laco.ts` não mudou (D-12).

Resultado da execução: 24 ações de 24, nenhuma falha. Suíte inteira: 145 arquivos, 2660 testes
passando; `tsc` das três unidades e `check:webview` limpos.

## Arquivos afetados

Todos os arquivos de código já existiam e pertencem à 014 ou à 016, entregues e convergidas em adendo.
O tipo segue `componente-novo` por força do cenário greenfield; a coluna de justificativa diz o que
mudou. Nenhum arquivo novo foi criado fora das pastas do Reversa.

| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |
|---|---|---|---|---|
| `src/cli/terminal.ts` | `painel-do-processo` (terminal, adendos 014 e 016) | `componente-novo` | HIGH | `LIMPAR` (`CSI 2J` `CSI H`) **removida**; entram `SINCRONIZAR`, `DESSINCRONIZAR`, `CANTO`, `APAGAR_LINHA`, `APAGAR_ABAIXO`. `desenhar` passa a escrever, numa única chamada, a abertura da sincronização, o canto, cada linha apagada antes e separada por `\r\n`, o apagamento abaixo a partir da linha seguinte à última (omitido quando o corpo enche a janela), a linha de estado apagada antes na última linha, e o fechamento. `restaurar` fecha a sincronização antes do cursor e da tela. `aoRedimensionar` agrupa a rajada por giro com `setImmediate`, e o cancelamento limpa a pendência (RF-07 a RF-10, RN-02, D-01 a D-04) |
| `src/cli/navegacao.ts` | `painel-do-processo` (terminal) | `componente-novo` | MEDIUM | `ContextoDeNavegacao` ganha `linhas` **opcional**; entram `linhaDe`, `alvoDaPagina` (função pura da página, por linhas com o mapa e por posições sem ele), `paginar` (seleção e janela na mesma transição, presa às pontas) e `meiaJanela`; `navegar` ganha quatro `case` com efeito `nenhum` (RF-01, RF-02, RN-03, D-07, D-08) |
| `src/cli/teclas.ts` | `painel-do-processo` (terminal); contrato `interfaces/teclado.md` | `componente-novo` | MEDIUM | As sequências terminadas em til passam a ser lidas pelo número (`NUMERADAS`: 5 e 6; qualquer outro é nulo); `CONTROLES` ganha `0x15` e `0x04`; as terminadas em letra seguem pelo último byte. **Delta de contrato do teclado**, descrito em `interfaces/teclado.md` desta feature (D-05, D-06, RN-05) |
| `src/cli/quadro/index.ts` | `painel-do-processo` (terminal, adendo 016) | `componente-novo` | MEDIUM | `Montagem` ganha `posicoes` (mapa seção → linha do título e linha principal de cada item; `[]` para seção fechada; nulo com a ajuda visível); `linhasDaSecao` anota as linhas relativas, `montar` as torna absolutas com o mesmo deslocamento da seleção, e `contextoDeNavegacao()` devolve `linhas` da mesma montagem, omitindo o campo com a ajuda (D-07) |
| `src/cli/tipos.ts` | `painel-do-processo` (terminal); `painel-do-processo.md#9-modelo-de-dados` | `componente-novo` | LOW | `TECLAS` de quinze para dezenove nomes, por acréscimo depois de `fim`; `EFEITOS` não muda (D-05, `data-delta.md` seção 2) |
| `src/cli/quadro/ajuda.ts` | `painel-do-processo` (terminal) | `componente-novo` | LOW | `TABELA_DE_AJUDA` ganha `PgUp / PgDn` e `Ctrl+U / Ctrl+D` depois de `g / G`, sem `emSeteBits` (RF-06, D-09) |
| `amostras/painel/ajuda.txt` | `empacotamento-e-verificacao` (amostras da 016) | `componente-novo` | LOW | Regenerada por `npm run amostras:painel`: as duas linhas novas com a moldura íntegra, e a linha de estado da amostra de "1–17 de 17" para "1–19 de 19". Única amostra alterada; exceção nomeada na RN-01 e no RF-16 |
| `README.md` | `empacotamento-e-verificacao` | `componente-novo` | LOW | Uma frase na descrição da interface viva: página e meia página, e o redesenho que não deixa cópia no histórico do emulador (RF-06, RN-08) |
| `tests/cli-terminal.spec.ts` | `empacotamento-e-verificacao` | `componente-novo` | MEDIUM | **Mudança de disposição declarada** (D-10): o bloco "o desenho" reescrito para a sequência nova, restauração fechando a sincronização, rajada agrupada; a dupla de mentira guarda o ouvinte de `resize`. Nenhuma expectativa de fato afrouxada: retiradas as sequências, o texto é o de antes |
| `tests/cli-navegacao.spec.ts`, `tests/cli-teclas.spec.ts`, `tests/cli-quadro.spec.ts` | `empacotamento-e-verificacao` | `componente-novo` | MEDIUM | **Só acréscimo**, com uma exceção declarada: em `cli-teclas`, a sequência "desconhecida" do caso da D-15 passou de `Esc [ 5 ~` (agora página acima) a `Esc [ 2 ~`. Entram a página por posições e pelo mapa, o mapa de linhas com a invariante da seleção, e a tabela de ajuda conferida por suíte (T024) |

Artefatos do Reversa tocados fora do previsto pelo plano, todos dentro de `_reversa_forward/017-…/`:
`requirements.md` e `roadmap.md`, que citavam o marcador de dúvida entre crases e reprovavam a guarda
do bug 74UL; a citação foi reescrita em prosa, com linha no histórico do requirements.

## Diff conceitual por componente

**Terminal da interface viva.** Antes, cada redesenho apagava a tela inteira e a reescrevia, o que
deixava um quadro em branco entre um e outro; em rajada, era esse branco que o iTerm2 empurrava para o
histórico. Agora o redesenho é integral por posicionamento: vai ao canto, apaga cada linha antes de
escrevê-la (antes, e não depois, por causa da quebra pendente na última coluna), apaga o que sobra
abaixo do corpo a partir da linha seguinte à última, escreve a linha de estado na última linha, e
envolve tudo em atualização sincronizada, numa única escrita. A restauração passa a fechar a
sincronização antes de mostrar o cursor e deixar a tela alternativa, e continua idempotente. A rajada de
`resize` vira uma chamada por giro do laço de eventos, sem relógio. O laço não mudou: o redesenho após
`SIGCONT` e após o editor passa pelo mesmo `desenhar`, e é por isso que o RF-10 é atendido sem linha
alterada em `laco.ts`.

**Reconhecedor de teclas.** A tabela da 014 continua inteira. As sequências com til, que antes seriam
todas mapeadas pelo último byte (e portanto por nenhuma tecla), passam a ser lidas pelo número entre o
colchete e o til: `5` e `6` são página acima e abaixo; `1` a `4` (`Home`, `Insert`, `Delete`, `End`)
e qualquer outro número não são tecla. `Ctrl+U` e `Ctrl+D` entram como bytes de controle; em modo
bruto, `0x04` é um byte como outro.

**Máquina de navegação.** A página é medida em linhas e a seleção anda em posições; a máquina passa a
receber do compositor, opcionalmente, a linha em que cada posição mora, e decide o alvo por ela: a
primeira posição cuja linha alcança uma janela abaixo, ou a última cuja linha está uma janela acima, com
as pontas como limite. Sem o mapa, a página é `alturaVisivel` posições, e nenhuma chamada existente muda.
A janela anda junto, presa ao topo e ao fundo, na mesma transição, como `topo` e `fim` já faziam com o
deslocamento. Nenhum efeito novo: as quatro teclas emitem `nenhum`.

**Compositor.** A montagem que já anotava onde a seleção caiu passa a anotar, com a mesma conta, onde
o título e a linha principal de cada item de cada seção moram, inclusive na moldura do bloqueio (o
título é a borda). Seção fechada tem `itens: []`; com a ajuda visível não há posição e o campo é
omitido. A invariante, conferida por suíte, é que a linha da seleção corrente no mapa é sempre
`indiceDaSelecao()`.

**Vocabulário e ajuda.** Quatro nomes a mais em `TECLAS`, por acréscimo; duas linhas a mais na tabela
de ajuda, transcritas de `interfaces/teclado.md` desta feature, sem menção a mouse; a amostra da ajuda
regenerada. A coluna dos gestos não mudou de largura, porque `Ctrl+U / Ctrl+D` tem as mesmas quinze
colunas de `Tab / Shift+Tab`, e é por isso que a moldura ficou íntegra sem linha realinhada.

## Preservadas

Vazio: cenário greenfield, sem regra 🟢 extraída de código. As promessas que esta entrega reafirma e
que uma extração futura confirmaria estão nas "Observações" de `regression-watch.md`.

## Modificadas

Vazio: cenário greenfield, sem regra 🟢 extraída de código. O que mudou de comportamento está na tabela
acima e no diff conceitual: o redesenho sem apagamento de tela, a restauração que fecha a sincronização,
o agrupamento da rajada, as quatro teclas e o mapa de linhas do contexto.
