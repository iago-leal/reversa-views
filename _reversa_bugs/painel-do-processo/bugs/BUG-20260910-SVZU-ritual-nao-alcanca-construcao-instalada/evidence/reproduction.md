# Cápsula de reprodução

Gravada em 2026-09-10, antes de qualquer mitigação, porque o estado observado se desfaz assim que a
construção nova for instalada.

## Ambiente

| Eixo | Valor |
|---|---|
| Sistema | Darwin 25.6.0 |
| Node | v24.13.0 |
| npm | 11.6.2 |
| Editor | 1.137.0 |
| Commit base (clone) | 3cec3734014ca10188308f343250501e055bac7e |
| Ramo | master |
| Árvore | limpa quanto ao código; sujeira apenas em `_reversa_bugs/` |
| Extensão instalada | iagoleal-local.reversa-views@0.7.5  |
| Carimbo da instalada | 9bd764815b3d227e4fee794871221917084de38a |
| Carimbo da árvore | 3cec3734014ca10188308f343250501e055bac7e |

## Comando executado

```
npm run atualizar
```

Saída:

```
Clone em 3cec373, ramo master.
Em dia com a origem: não há commit a trazer.
```

Código de saída: 0 (SAIDA_EM_DIA).

## Taxa e classificação

| Eixo | Valor |
|---|---|
| Tentativas | 2 pelo usuário, 1 pelo agente |
| Falhas | 3 de 3 |
| Classificação | deterministic |

O defeito não depende de tempo, de rede nem de ordem: enquanto a extensão instalada carimbar um
commit diferente do topo do clone e o clone estiver em dia, os dois atos do ritual devolvem "em dia"
e o painel segue anunciando atraso.

## O que a cápsula NÃO prova

Que `--aplicar` também não faz nada. Não foi executado nesta cápsula por escrever na árvore. A
inspeção do código mostra a guarda que devolve cedo, e o teste de reprodução do Gate 1 é quem fecha
essa perna com prova executável.
