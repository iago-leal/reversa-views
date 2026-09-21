# Onboarding: visual do painel de linha de comando

> Feature: `016-visual-do-painel-cli`
> Para quem vai ver a feature funcionando pela primeira vez. Tudo roda da raiz deste repositório, num
> terminal de verdade: suíte alguma substitui os passos 2 a 9.

## 0. Antes de tudo

```sh
npm install
npm test -- cli-            # as suítes do terminal, inclusive as seis novas
npm run painel -- --ajuda   # deve listar --tema= e REVERSA_VIEWS_TEMA
```

Confira o ponto de partida do seu terminal:

```sh
echo "$COLORTERM | $TERM | $COLORFGBG | $LANG"
```

No terminal de trabalho medido no estudo, a resposta é `truecolor | xterm-256color | 15;0 | pt_BR.UTF-8`.

## 1. A linha de base que não pode mudar

Antes de olhar a aparência, prove que o contrato de máquina ficou onde estava. Num clone no commit
anterior à feature, gere `npm run painel -- --dados --sem-conferir > /tmp/antes.json`; aqui, gere
`/tmp/depois.json` do mesmo modo. Os campos `lidoEm` diferem por serem instantes; todo o resto deve ser
idêntico:

```sh
diff <(sed 's/"lidoEm":"[^"]*"//' /tmp/antes.json) <(sed 's/"lidoEm":"[^"]*"//' /tmp/depois.json)
```

## 2. A interface viva, em 24 bits

```sh
npm run painel
```

Procure, nesta ordem:

1. O cabeçalho numa moldura de cantos arredondados, com "Reversa" na borda superior, no tom terracota, e
   dentro dela quatro fatos: projeto, raiz observada, instante e integridade
2. A situação de entrada, "Processo lido", em moldura própria
3. A faixa de bloqueio: em moldura na cor de atenção, com `!` no título, quando algo aguarda decisão; do
   contrário, a frase "Nada aguarda decisão humana", sem moldura
4. Cada título de seção com `▾` ou `▸`, e a contagem ao lado, atenuada
5. Na decomposição, `✓` verde, `→` na cor de atenção e `·` atenuado; sob cada ação, o caminho e o
   instante em linha própria, atrás de `⎿`
6. Na última linha da janela, a linha de estado: o glifo da observação, a procedência da leitura, as
   teclas e "linhas A–B de N"

Pressione `G`. A linha de estado não sai do lugar, passa a mostrar `↑`, e a última seção do quadro é
"Versões e construção", com as versões, o carimbo, a revisão do modelo herdado e a conferência de atualização.
Pressione `g`, depois `Tab` doze vezes: a seleção passa pelas onze seções, pela de versões, e volta.

## 3. A seleção, a rolagem e a linha de estado

1. Desça com `j` até uma ação da decomposição: só ela traz `❯`
2. Continue até o último item visível: a janela rola o bastante para mostrar também o caminho dele
3. Pressione `←` sobre um título: o glifo vira `▸`; `→` devolve `▾`
4. Pressione `z`, depois `a`: tudo fecha, tudo abre, e a faixa de bloqueio não fecha nunca
5. Pressione `?`: a ajuda aparece em moldura, com as teclas no acento; `?` de novo devolve o quadro
6. Redimensione a janela durante a rolagem: a linha de estado continua na última linha

## 4. Os quatro caminhos de saída, com a linha de estado

`q`, `Ctrl+C`, `Ctrl+Z` seguido de `fg`, e `Enter` sobre uma ação para abrir o editor e voltar. Em cada
um, o terminal volta íntegro, e na retomada a linha de estado é redesenhada no lugar. O recado do editor,
quando há, aparece **acima** dela.

## 5. Sem cor

```sh
NO_COLOR=1 npm run painel
npm run painel -- --sem-cor
```

Molduras e glifos permanecem. O item selecionado continua sendo o único com `❯`, a moldura do bloqueio
distingue-se da do cabeçalho pelo título e pelo `!`.

## 6. Os degraus de cor

```sh
COLORTERM= TERM=xterm-256color npm run painel   # 256 cores
COLORTERM= TERM=xterm npm run painel            # 16 cores
COLORTERM= TERM=dumb npm run painel -- --passada   # nenhuma
```

Em nenhum deles aparece cor trocada, nem sequência impressa como texto. Lado a lado com o passo 2, o que
muda é o tom.

## 7. O fundo

```sh
npm run painel -- --tema=claro
REVERSA_VIEWS_TEMA=claro npm run painel
REVERSA_VIEWS_TEMA=claro npm run painel -- --tema=escuro   # vence a bandeira
COLORFGBG='0;15' npm run painel                            # vale a paleta clara
REVERSA_VIEWS_TEMA=roxo npm run painel                     # abre, e avisa no canal de erro ao sair
npm run painel -- --tema=roxo; echo $?                     # recusa, nomeia "roxo", código 2
```

Para julgar a paleta clara de verdade, troque o perfil do terminal para um de fundo branco. O nome
"Reversa" e o título selecionado saem num terracota mais escuro que o das marcas: é a D-04 do roadmap,
confirmada na segunda rodada de esclarecimento.

## 8. Janela estreita e localidade

Estreite a janela para menos de 60 colunas: as molduras somem, e só elas. Os quatro fatos do núcleo
continuam lá, e nenhuma linha estoura.

```sh
LC_ALL=C npm run painel
```

Molduras em `+`, `-` e `|`; seções com `[-]` e `[+]`; seleção com `>`. Limite conhecido: a prosa em
português continua acentuada, porque o RF-14 alcança glifos e molduras, e não o texto.

## 9. A passada

```sh
npm run painel -- --passada              # com cor, sem moldura, sem linha de estado
npm run painel -- --passada > /tmp/p.txt
npm run painel -- --passada --sem-cor > /tmp/q.txt
LC_ALL=C grep -c $'\033' /tmp/p.txt      # 0
grep -c '[╭╮╰╯│]' /tmp/p.txt             # 0
awk 'length > 80' /tmp/p.txt | wc -l     # 0, contando caracteres em localidade UTF-8
```

`/tmp/p.txt` tem o caminho e o instante de cada ação em linha própria, e termina com a seção
"Versões e construção", que traz também a frase "esta é a primeira leitura desta sessão".

## 10. Texto hostil

Numa cópia descartável do projeto, ponha uma sequência de limpar a tela na descrição de uma ação:

```sh
rsync -a --exclude node_modules --exclude .git ./ /tmp/hostil/
A=$(ls -d /tmp/hostil/_reversa_forward/016-*/)actions.md
printf -- '- [ ] T999 hostil \033[2J\033[H fim\n' >> "$A"
npm run painel -- --workspace=/tmp/hostil
```

A tela não é limpa, e a ação `T999` mostra `␛[2J␛[H` como texto. Apague `/tmp/hostil` ao fim.

## 11. As amostras

```sh
npm run amostras:painel
git status --short amostras/
```

Sem mudança de paleta, nada aparece como modificado. Para ver uma amostra, `cat amostras/painel/<nome>`
num terminal do degrau correspondente. Troque um tom em `src/cli/paleta.ts`, rode de novo, e a diferença
aparece no `git diff`; desfaça a troca.

## 12. As promessas negativas

```sh
npm test -- cli-boundaries cli-paridade
git diff --stat HEAD -- tests/cli-paridade.spec.tsx     # vazio
git diff HEAD -- package.json | grep -A3 '"dependencies"'   # nada novo
```

E, com o pacote construído por `npm run empacotar`, `tests/vsix-conteudo.spec.ts` continua recusando
`src/cli/`, `out-cli/` e, agora, `amostras/`.

A guarda da RN-07 mora em `cli-boundaries`, e convém vê-la reprovar uma vez. Acrescente a um fonte de
`src/cli/`, num comentário, um dos nomes de `NOMES_VIGIADOS`, rode `npm test -- cli-boundaries`, veja a
reprovação nomear o arquivo, e desfaça. Os nomes vigiados aparecem só na suíte, e em nenhum fonte.

A raiz inexistente, por fim, que não chega à interface viva:

```sh
npm run painel -- --workspace=/caminho/que/nao/existe; echo $?    # título na cor de falha, sem moldura, código 2
npm run painel -- --workspace=/caminho/que/nao/existe 2> /tmp/e.txt; LC_ALL=C grep -c $'\033' /tmp/e.txt   # 0
```

## 13. Desfazer

A feature não grava nada fora do repositório e não deixa estado. Desfazer é reverter o commit.
