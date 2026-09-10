# Contrato: canal de mensagens entre a webview e o host

> Identificador: `008-cronologia-do-ciclo-bugs`
> Data: `2026-09-10`
> Tipo: mensagem entre processos, mediada pelo editor
> Contrato anterior: `_reversa_forward/002-ponte-e-host/interfaces/protocolo-webview.md`, emendado por `_reversa_forward/004-heranca-e-sincronia/interfaces/protocolo-webview.md`, por `_reversa_forward/006-cartoes-e-cronologia/interfaces/protocolo-webview.md` e por `_reversa_forward/007-atualizacao-e-progresso/interfaces/delta-do-canal.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. O que este documento é

🟢 O delta desta feature sobre o contrato que a feature 002 fixou. Transporte, envelope e ausência de
correlação continuam como estão. A regra do contrato também continua a mesma, e é o que autoriza
tudo o que segue: **acrescentar é permitido, renomear e remover não são**.

🟢 Há duas declarações do mesmo contrato, uma de cada lado da fronteira de compilação, e mantê-las em
sincronia é obrigação presa por teste desde a feature 003. O acréscimo abaixo vale para as duas.

## 2. Campo novo em `setProcess`

🟢 O comando continua com o mesmo nome, a mesma direção e a mesma semântica: substitui inteiramente o
payload anterior e não espera resposta. Ganha um campo.

| Campo | Forma | Significado | Confidência |
|---|---|---|---|
| `bugs` | objeto | O registro de bugs do projeto, agrupado por contexto, com contagens, inconsistências e anomalias. Forma completa em `data-delta.md`, seção 4.3 | 🟢 |

🟢 Uma tela construída antes desta feature ignora o campo e desenha o que sempre desenhou. Um host
anterior a esta feature não o envia, e a tela nova precisa tratar a ausência como leitura não
realizada, e não como registro vazio: "não há bugs" e "não li os bugs" são afirmações diferentes, e
só uma delas é defeito. É a mesma distinção que `decomposition` e `history` impuseram na feature 006.

🟢 `setEntry`, `setNotice` e `setUpdate` ficam intocados, inclusive nos casos de erro e de pasta
ausente.

## 3. O que não muda

🟢 Nenhum comando novo, em direção alguma. A lista de comandos do host continua com quatro nomes, e a
da tela com sete, o reservado de despacho entre eles, ainda sem tratador.

🟢 A abertura do `bug.md` usa `openFile`, com o mesmo formato de sempre: caminho relativo à raiz
observada, resolvido do lado do host. RF-09 é reuso do que existe, e nenhum componente do bloco fala
com o editor por outra via.

## 4. O que viaja, e o que não viaja

🟢 Bug com `visibility: restricted` **não atravessa o canal**. O filtro acontece na camada de
leitura, antes de o payload ser montado, e o que viaja é apenas a contagem dos omitidos. A regra vem
do requisito não funcional de privacidade: o que não vai a view também não vai a harness externo, e
filtrar do lado da tela deixaria título e identificador atravessarem.

🟢 As anomalias do registro viajam dentro de `bugs`, e não misturadas às do processo. A tela junta as
duas listas para desenhar; o payload as mantém separadas, porque têm origens diferentes e vocabulários
diferentes.

## 5. Compatibilidade

| Combinação | Efeito | Confidência |
|---|---|---|
| Host novo, tela nova | O bloco desenha o registro | 🟢 |
| Host novo, tela antiga | O campo é ignorado; nada quebra | 🟢 |
| Host antigo, tela nova | O campo chega ausente; o bloco declara que a cronologia dos bugs não foi lida por esta leitura | 🟢 |

🟢 A terceira combinação é real, e não hipotética: o bug número 2 deste projeto nasceu exatamente de
uma instalação anterior ao que o repositório já tinha. É por isso que a ausência precisa ter frase
própria, e não pode parecer registro vazio.
