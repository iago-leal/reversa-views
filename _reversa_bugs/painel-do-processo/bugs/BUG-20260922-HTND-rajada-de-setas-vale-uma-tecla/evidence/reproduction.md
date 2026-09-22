# Cápsula de reprodução

- **Commit base:** `015dbe2` (master), construção `out-cli/` de `npm run compile:cli`
- **Ambiente:** macOS 27.0, Node v24.13.0, pseudoterminal de 110 colunas por 60 linhas aberto por
  Python `pty.fork`; nenhum emulador de terminal envolvido
- **Classificação:** determinística; 4/4 na função pura, 2/2 no painel real
- **Exit code:** 0 em todas as execuções (o painel sai por `q` depois de cada medição)

## 1. Função pura

Comando: `reconhecerTecla` de `out-cli/cli/teclas.js`, chamado com blocos montados à mão.
Saída em `leitura-rajada-de-setas-2026-09-22.txt`: uma, duas, sete e quarenta setas num bloco
devolvem sempre uma só tecla `abaixo`; abaixo seguido de acima devolve `acima`; `jj` devolve nulo.

## 2. Painel real

Comando: `python3 evidence/rajada-no-pseudoterminal.py`, na raiz. Abre `node scripts/painel.js
--sem-conferir`, espera o primeiro quadro, dá dois `Tab` até o título "Decomposição da feature
ativa (24)", escreve a rajada numa única chamada a `write` e lê o último quadro.
Saída em `rajada-antes-2026-09-22.txt`:

| Rajada numa escrita | Quadros | Seleção final | Esperado |
|---|---|---|---|
| 5 setas abaixo | 1 | T023 (1 passo) | T019 (5 passos) |
| 40 setas abaixo | 1 | T023 (1 passo) | a ação de índice 40, ou a última |
| 3 abaixo e 1 acima | 1 | "Adendo", na seção anterior (1 passo acima) | T021 (2 passos abaixo) |
| `jjjjj` | 0 | nada muda | T019 |

## 3. Controle

Comando: `python3 evidence/trajeto-no-pseudoterminal.py "b'\x1b[B'"` (e o mesmo com `b'j'`), que
manda uma tecla por vez com meio segundo entre elas. A seleção anda uma ação por tecla, T023, T021,
T022, T020, T019, pelas duas teclas: a navegação está certa, e o defeito está só no agrupamento.

## Nota da sessão

Uma primeira versão do medidor, com intervalo de 0,3 s depois de cada `Tab`, mostrou a seleção
parada em T021 com teclas lentas. Era falha do medidor, e não do painel: o medidor de trajetória,
com leitura depois de cada tecla, desmentiu-a de forma estável. Não há segundo defeito.
