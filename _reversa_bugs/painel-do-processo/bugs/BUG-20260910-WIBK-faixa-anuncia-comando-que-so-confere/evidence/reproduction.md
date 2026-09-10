# Cápsula de reprodução

Gravada em 2026-09-10, sobre a função pura do domínio da tela, porque a instalação corrente já está em
dia (0.8.2, carimbada em `849fc5b`) e a faixa não aparece no editor neste momento. O defeito não está
no dado que chega do host: está na tradução do desfecho em texto, e essa tradução se exercita sem
editor, sem rede e sem clone.

## Ambiente

| Eixo | Valor |
|---|---|
| Sistema | Darwin 25.6.0 |
| Node | v24.13.0 |
| npm | 11.6.2 |
| Editor | 1.137.0 |
| Commit base (clone) | 849fc5b7e4e1a939a5720debdaa4fecf9e986012 |
| Ramo | master, em dia com a origem |
| Árvore | limpa |
| Extensão instalada | iagoleal-local.reversa-views@0.8.2, carimbada em `849fc5b` |

## Comando executado

```
node _reversa_bugs/painel-do-processo/bugs/BUG-20260910-WIBK-faixa-anuncia-comando-que-so-confere/fix/reproducao.mjs
```

Saída:

```
atrasada    texto:   A origem está 2 commits à frente desta construção.
            comando: npm run atualizar   DEFEITO: apenas confere
divergente  texto:   A origem está 2 commits à frente, e este clone tem commit próprio que ela não tem.
            comando: npm run atualizar   DEFEITO: apenas confere

O que o script imprime como "Para aplicar": npm run atualizar -- --aplicar
Comando esperado na faixa:                   npm run atualizar -- --aplicar
```

Código de saída: 1.

## A suíte fixa o valor errado

```
npx vitest run tests/webview-header.spec.tsx -t "nomeia o comando"
 ✓ tests/webview-header.spec.tsx (23 tests | 22 skipped)
```

O caso `atrasada diz quantos commits, e nomeia o comando que os aplica` passa hoje porque a asserção
exige `'npm run atualizar'`: o nome do caso pede o comando que aplica, a asserção exige o que confere.

## Datação

```
git log -S"UPDATE_COMMAND" -- src/webview/domain/labels.ts
8457e7f 2026-09-09 feat(007): atualização e progresso visível
git log -S"expect(rótulo.command).toBe('npm run atualizar')" -- tests/webview-header.spec.tsx
8457e7f 2026-09-09 feat(007): atualização e progresso visível
```

Constante e asserção nascem no mesmo commit. Não há commit bom anterior: o rótulo nasceu errado, e por
isso não cabe `git bisect`.

## Taxa e classificação

| Eixo | Valor |
|---|---|
| Tentativas | 1 pelo usuário (captura do relato), 1 pelo agente (função pura) |
| Falhas | 2 de 2 |
| Classificação | deterministic |

## O que a cápsula NÃO prova

Que o cabeçalho desenhado contém a linha errada. Isso a suíte já cobre por `renderToStaticMarkup` no
caso `o comando a copiar aparece quando há o que aplicar`, cuja asserção por substring passa tanto com
o comando que confere quanto com o que aplica, e é por isso que ela não acusou o defeito. A captura do
relato (`../../intake/relato-20260910-1240.md`) mostra a faixa real com a linha errada.
