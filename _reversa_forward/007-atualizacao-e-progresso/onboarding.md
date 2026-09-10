# Onboarding: verificação de atualização e progresso visível

> Identificador: `007-atualizacao-e-progresso`
> Data: `2026-09-09`
> Roadmap: `_reversa_forward/007-atualizacao-e-progresso/roadmap.md`

Passo a passo para quem vai conferir esta feature pela primeira vez, sem conhecer o código. Cada
passo diz o comando, o que deve aparecer e o que significa não aparecer. Rode na raiz do
repositório.

## 1. Preparar

```bash
npm install
npm run build
npm test
```

A construção confere a herança, gera as constantes, compila o host e empacota a tela. A suíte não
abre navegador nem rede: se algum caso falhar por tempo esgotado de requisição, a feature quebrou a
regra de não usar rede em teste, e isso é defeito a reportar antes de continuar.

## 2. Ver a versão nascer sozinha

```bash
node scripts/versao.js
```

Deve imprimir um número de três partes, hoje `0.6.1`, e a linha que explica de onde ele saiu: o
maior número de feature com adendo e a contagem de commits desde o commit daquele adendo.

Confira a olho que o número bate com o repositório:

```bash
ls _reversa_sdd/addenda/          # o maior NNN é o segundo número da versão
git log --oneline | head -5       # os commits depois do adendo são o terceiro
```

Depois confirme que o manifesto **não** ficou sujo:

```bash
git status --short package.json
```

Nada deve aparecer. A versão é escrita apenas em torno do empacotamento e restaurada em seguida: se
`package.json` aparecer modificado aqui, a restauração falhou e é defeito.

## 3. Empacotar e ver o nome do pacote

```bash
npm run empacotar
```

A última linha traz o comando de instalação, e o nome do arquivo deve carregar a versão derivada,
não o `0.0.1` congelado de antes. Confira de novo que o manifesto voltou ao que era:

```bash
git status --short package.json
```

## 4. Ver a tela sem abrir o editor

O preview serve o pacote real da tela sob o documento real, com um host fingido. Os desfechos da
consulta à origem não acontecem por acaso, e por isso cada um tem argumento próprio:

| O que conferir | Comando |
|---|---|
| Em dia | `npm run preview -- --atualizacao=em-dia` |
| Atrasada | `npm run preview -- --atualizacao=atrasada` |
| Divergente | `npm run preview -- --atualizacao=divergente` |
| Commit desconhecido | `npm run preview -- --atualizacao=commit-desconhecido` |
| Consulta impossível | `npm run preview -- --atualizacao=impossivel` |
| Conferência desligada | `npm run preview -- --atualizacao=desligada` |
| Consultando, sem resposta | `npm run preview -- --atualizacao=consultando` |

Em cada um, olhe o cabeçalho: ele deve trazer a versão da extensão, o commit de construção em forma
curta e uma linha que declara o desfecho. Nenhum desfecho pode produzir linha vazia, e nenhum pode
dizer "em dia" quando a consulta não aconteceu.

Repita os sete nos quatro temas, que é o que o portão visual exige:

```bash
npm run preview -- --atualizacao=atrasada --tema=claro
npm run preview -- --atualizacao=atrasada --tema=escuro
npm run preview -- --atualizacao=atrasada --tema=claro-alto-contraste
npm run preview -- --atualizacao=atrasada --tema=escuro-alto-contraste
```

## 5. Conferir as três barras

Ainda no preview, com o workspace real:

```bash
npm run preview
```

| Cartão | O que olhar |
|---|---|
| Decomposição da feature ativa | A barra ao lado do texto que conta as ações fechadas, cheia quando todas estão fechadas |
| Ciclo forward | A mesma razão, concordando com os pares "ações fechadas" e "ações abertas" |
| Histórico das entregas | Features convergidas sobre o total declarado, e não sobre as entradas exibidas |

Três conferências que só o olho faz. A primeira é o contraste do preenchimento contra o trilho nos
quatro temas, sobretudo nos dois de alto contraste. A segunda é a barra numa barra lateral estreita,
de trezentos pixels: ela não pode empurrar o texto para fora nem quebrar em duas linhas. A terceira
é o estado de borda: num projeto sem feature ativa, nenhuma barra deve ser desenhada, e a frase que
já existia continua sendo a única resposta da seção.

Para o estado degradado, que é onde a divergência entre contagem e lista aparece:

```bash
node scripts/preview.js --workspace="$(node scripts/estragar-workspace.js)"
```

O aviso de divergência tem de continuar visível ao lado da barra, e a barra tem de seguir a contagem
declarada, não o comprimento da lista.

## 6. Conferir a ordem da decomposição

No mesmo preview, abra o cartão da decomposição e leia a lista de cima para baixo:

1. As ações abertas vêm primeiro, na ordem do plano, e a primeira delas traz a marca de próxima a
   executar.
2. Depois vêm as fechadas, da mais recente para a mais antiga.
3. As que não têm instante registrado ficam ao fim do bloco, e cada uma declara que o momento não
   foi registrado.
4. Acione "Ver as outras N" e confira que as linhas que já estavam à vista mantêm entre si a mesma
   ordem, e que as reveladas entram nos lugares que a recência lhes dá.

O defeito que esta feature corrige aparece se a lista começar em `T001` numa feature já concluída.

## 7. Ver dentro do editor

```bash
npm run empacotar
code --install-extension reversa-views-<versão>.vsix
```

Abra o painel pela paleta, em "Reversa: Abrir o painel do processo". Aqui há três coisas que o
preview declara não simular e que só o editor mostra:

1. A consulta de verdade à origem, com rede de verdade. Com o clone em dia, o cabeçalho deve dizer
   que está em dia; envie um commit e reabra o painel para ver o aviso mudar.
2. A chave de configuração. Abra as configurações, procure `reversaViews.conferirAtualizacao`,
   desligue-a e releia o processo: o cabeçalho tem de declarar que a conferência está desligada, e
   nenhuma requisição pode partir.
3. O canal de saída, onde toda falha da consulta deixa linha com origem, ato e razão.

Para ver o comportamento sem rede, desligue a rede da máquina e acione "Reler o processo": o painel
inteiro tem de aparecer no prazo normal, e a linha do desfecho tem de nomear a causa.

## 8. Exercitar o atualizador sem arriscar o clone

Não teste o atualizador no clone em que você trabalha. Faça uma cópia descartável:

```bash
cd /tmp
git clone https://github.com/iago-leal/reversa-views.git teste-atualizador
cd teste-atualizador
git reset --hard HEAD~2        # finge um clone atrasado em dois commits
npm install
```

Agora percorra os quatro caminhos:

| Caminho | Comando | O que deve acontecer |
|---|---|---|
| Conferir, atrasado | `npm run atualizar` | Diz que há dois commits novos e não altera arquivo algum |
| Conferir, árvore intocada | `git status` | Exatamente a mesma saída de antes do comando anterior |
| Aplicar | `npm run atualizar -- --aplicar` | Incorpora, constrói, roda a suíte, empacota e imprime o comando de instalação |
| Recusar árvore suja | `echo x >> README.md` e `npm run atualizar -- --aplicar` | Para antes de tocar em qualquer coisa, nomeia o arquivo e sai com código de recusa |

E o caminho sem rede, que é o que mais importa para quem trabalha em contêiner:

```bash
git remote remove origin
npm run atualizar
```

Deve terminar em menos de dez segundos nomeando a ausência do remoto, com código de saída próprio.
Terminar em sucesso aqui seria o pior defeito possível da feature: dizer que está em dia sem ter
perguntado a ninguém.

Ao fim, apague a cópia:

```bash
cd /tmp && rm -rf teste-atualizador
```

## 9. Conferir o que só se lê no código

Três invariantes que a suíte guarda e que vale conferir com os próprios olhos na primeira vez:

```bash
grep -rn "node:https\|node:http" src/          # só src/host/net.ts pode aparecer
grep -rn "connect-src" src/host/document.ts    # a política do painel segue sem conexão de saída
grep -rn "https\?://" src/webview/             # nada de rede dentro do pacote da tela
```

E o teto do pacote, impresso pela própria construção:

```bash
npm run build      # imprime o tamanho da tela ao lado do teto
npm run empacotar  # imprime o tamanho do pacote ao lado do teto
```

## 10. Atualizar o registro do portão visual

O README fixa que o portão vale por versão, e não uma vez só. Conferidos os estados novos nos quatro
temas, atualize a data e a tabela da seção "O portão visual", acrescentando os desfechos da consulta
e as três barras à lista do que foi visto.
