# Medidas da feature 012

Data: 2026-09-20. Máquina: Darwin 27.0.0, medição com a suíte em paralelo.

## Pacote da tela contra a guarda de 60 %

| Medida | Bytes | Leitura |
|---|---|---|
| Pacote da tela (`main.js` + `main.css`) | 215 258 | 210,2 KiB |
| Teto declarado em `scripts/limites.js` | 409 600 | 400,0 KiB |
| Guarda de 60 % do teto | 245 760 | 240,0 KiB |
| Ocupação | | **52,6 % do teto** |
| Folga até a guarda | 30 502 | 29,8 KiB |

A feature 012 acrescenta à tela a linha de procedência do checkpoint e o bloco
das entradas não-agente. O mapa não pesa na tela: ele vive na camada de domínio
do host, e a webview recebe o eixo já julgado.

Pacote da extensão no mesmo empacotamento: 242 987 B (237,3 KiB) contra o teto
de 2 097 152 B, versão 0.11.0, com `extension/out/domain/equivalencias.js`
dentro, conferido por `tests/vsix-conteudo.spec.ts`.

## Leitura contra o teto de 200 ms

Bloco novo em `tests/desempenho-referencia.spec.ts`, pior caso deliberado: 50
pares no mapa e 50 checkpoints no estado, com metade deles casando apenas no
ÚLTIMO par (paga a busca inteira para casar) e a outra metade não casando com
nenhum (paga a busca inteira para não casar).

| Medida | Tempo | Teto |
|---|---|---|
| Consulta ao mapa e julgamento dos checkpoints | **0,14 ms** | 200 ms |
| Vínculo e conferências da 010, na mesma rodada | 49,0 ms | 200 ms |

A ordem de grandeza era esperada: a busca é linear sobre uma lista pequena, em
memória, sem tocar o disco. Os sete vocabulários medidos nos 64 projetos estão
muito abaixo dos 50 pares simulados, e o custo real será menor ainda.

## O que estas medidas NÃO cobrem

O tempo do aprendizado, que é de outra ordem, não entra em teto algum: ele roda
fora do `npm run build`, pela mão de uma pessoa, e jamais no caminho da leitura.
As rodadas reais sobre os 64 projetos de `~/dev`, todas em 2026-09-20 com
`qwen2.5:7b`:

| Como se perguntou | Tempo | Pares propostos |
|---|---|---|
| Uma pergunta por par, sem campo em foco | 4 min 20 s | 4, perdendo 3 dos 7 vocabulários |
| Uma pergunta por par, com campo em foco | 4 min 32 s | 39, dos quais 32 eram ruído |
| Duas passagens, agrupando por checkpoint | **1 min 13 s** | **6**, sem ruído aparente |

A terceira é a implementada. O ganho de tempo vem de agrupar: os pares de um
mesmo checkpoint passaram a custar uma pergunta, e não uma cada.
