# Onboarding: tela cheia do painel de linha de comando

> Identificador: `017-tela-cheia-do-painel`
> Data: `2026-09-21`
> Para quem vai testar a feature pela primeira vez, num terminal de verdade.

## 0. Antes de tudo

1. Na raiz do repositório, com o `node_modules` instalado, rode `npm test`, `npm run compile:cli` e
   `npm run check:webview`. Tudo precisa estar verde antes de qualquer passo abaixo.
2. Abra o **iTerm2** (3.7.2 é a versão em que o sintoma foi visto). Os passos 1 e 2 são nele; os
   demais podem ser repetidos em Terminal.app e no terminal integrado do VS Code.
3. Confira, em Preferences → Profiles → Terminal, no perfil da janela que vai usar, duas caixas: "Save
   lines to scrollback in alternate screen mode" e "Disable save/restore alternate screen". Anote o
   estado das duas antes de tocar em qualquer uma; o esperado é ambas desmarcadas.

## 1. Reproduzir o sintoma com a construção anterior

Este passo existe para que a correção seja medida contra o defeito, e não contra a memória dele.

1. Vá para o commit anterior à entrega desta feature (`git stash` se houver trabalho local; depois
   `git checkout <commit da 016>`), rode `npm run compile:cli` e `npm run painel`.
2. Com a interface viva aberta, role com o trackpad para baixo, num gesto contínuo, e depois para
   cima, além do topo do quadro.
3. Esperado (o defeito): cópias do quadro acumuladas acima, alcançáveis pela rolagem do emulador,
   sem fim aparente.
4. Registre o que viu e, se puder, uma captura de tela. Saia com `q`, volte ao commit da entrega e
   recompile.

## 2. O sintoma corrigido

1. `npm run painel`, no mesmo iTerm2, no mesmo perfil.
2. Repita o gesto do passo 1.2, com vigor, várias vezes.
3. Esperado: a seleção desce e sobe, a janela a acompanha, e rolar o emulador para cima não revela
   cópia alguma do quadro. A tela não fica em branco entre um quadro e outro.
4. Segure `↓` por alguns segundos e depois `↑`. Esperado: mesma coisa, sem cópias e sem
   tremulação.

## 3. Página e meia página

1. Abra todas as seções com `a`, para que o quadro fique mais alto que a janela; a linha de estado
   diz "linhas A–B de N" com `N` maior que a janela.
2. `PgDn`: a janela avança uma altura útil, e a seleção vai para a primeira linha navegável a uma
   janela de distância; a linha de estado muda a posição. Repita até o fim: o último `PgDn` não muda
   nada.
3. `PgUp`: simétrico, até o topo.
4. `Ctrl+D` e `Ctrl+U`: meia janela em cada sentido. Dois `Ctrl+D` deixam a seleção onde um `PgDn`
   deixaria quando a altura útil é par.
5. `?`: a ajuda lista `PgUp / PgDn` e `Ctrl+U / Ctrl+D`, e não menciona mouse. `?` de novo devolve o
   quadro onde estava.
6. Feche todas as seções com `z` e tecle `PgDn`: a seleção anda pelos títulos, sem erro.

## 4. Redimensionamento

1. Com a interface viva aberta e a seleção no meio do quadro, arraste a borda da janela do iTerm2
   para diminuir a altura, devagar e depois depressa.
2. Esperado: a seleção continua visível em todo instante; o bloco dela (a descrição mais a linha do
   caminho) fica inteiro enquanto couber, e a linha principal nunca sai da tela; nenhum resíduo de
   quadro anterior aparece abaixo do corpo; a linha de estado fica sempre na última linha.
3. Estreite a janela abaixo de 60 colunas: as molduras somem, e só elas. Alargue: voltam.

## 5. Os caminhos de saída

Cada um deve devolver o terminal inteiro: cursor visível, sem modo bruto, sem sincronização presa,
sem cópia de quadro no histórico.

1. `q`: o terminal volta ao que estava antes de `npm run painel`, com o prompt do shell. Nada do
   quadro fica visível.
2. `Ctrl+C`: idem.
3. `Ctrl+Z`, depois `fg`: o terminal é devolvido na suspensão; ao voltar, o quadro é redesenhado por
   inteiro, sem tela em branco prolongada e sem resíduo.
4. `Enter` sobre uma linha com artefato, com `VISUAL` ou `EDITOR` definidos: o editor abre, e ao
   sair dele o quadro volta inteiro.
5. Em cada caso, digite `echo ok` no shell depois: o eco aparece normal, sem caracteres perdidos.

## 6. O contrato de máquina

1. `npm run painel -- --passada > /tmp/passada-017.txt` e `npm run painel -- --dados > /tmp/dados-017.json`.
2. Compare com a mesma saída da construção anterior (passo 1.1): `diff` sem diferença nas duas.
3. `git status` limpo em `amostras/painel/`: a única amostra que a feature muda, `ajuda.txt`, foi
   regenerada e versionada na entrega (T020), e nada além dela difere da construção anterior.

## 7. Outros emuladores

Repita os passos 2, 3.2 e 5.1 no Terminal.app e no terminal integrado do VS Code. No Terminal.app,
a roda vira setas só se "Scroll alternate screen" estiver ligado em Preferences → Profiles →
Keyboard; sem isso, a roda não faz nada na tela alternativa, e é o esperado. Se tiver `tmux`,
repita o passo 2 dentro dele e anote a versão (`tmux -V`): abaixo de 3.7 pode haver tremulação
leve, sem cópia de quadro.

## 8. As promessas negativas

- Nenhuma bandeira nem variável de ambiente nova: `npm run painel -- --ajuda` mostra o mesmo texto
  de uso de antes.
- Nenhum rastro ao sair: depois de `q`, nada do quadro fica no terminal.
- Nenhum mouse: arrastar o mouse sobre o quadro seleciona texto do emulador, como em qualquer
  janela, sem tecla modificadora.
- Nenhuma escrita em disco: `git status` limpo depois de todos os passos.

## 9. O que registrar

Nas notas de execução do `actions.md`: o estado das duas caixas do passo 0.3, o resultado do passo 1
(o defeito reproduzido ou não, com a versão do iTerm2), o resultado do passo 2, e qualquer emulador
em que algum passo tenha falhado.

## 10. Desfazer

Nada a desfazer: a ferramenta não escreve em disco e não guarda estado. Se alguma caixa do passo 0.3
foi alterada durante a investigação, devolva-a ao estado anotado.
