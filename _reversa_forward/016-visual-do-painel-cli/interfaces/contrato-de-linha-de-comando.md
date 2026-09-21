# Contrato: linha de comando (delta da 016)

> Feature `016-visual-do-painel-cli`. Delta sobre
> `_reversa_forward/014-cli-do-processo/interfaces/contrato-de-linha-de-comando.md`, que continua
> valendo em tudo o que este arquivo não cita. Alterá-lo é alterar comportamento observável.

## 1. Argumento novo

| Argumento | Valor | Padrão | Efeito |
|---|---|---|---|
| `--tema=<fundo>` | `escuro` ou `claro` | conforme a seção 3 | Escolhe a paleta desta execução |

Valor não reconhecido, ou `--tema=` sem valor, é uso incorreto: a mensagem nomeia o valor recusado, vai
para o canal de erro, nada de leitura é impresso e o código é `2`. Os sete argumentos da 014 não mudam.
`--sem-cor` continua desligando **só a cor**: molduras e glifos permanecem.

## 2. Variáveis de ambiente

| Variável | Estatuto | Efeito |
|---|---|---|
| `REVERSA_VIEWS_TEMA` | nova | `escuro` ou `claro`. Valor não reconhecido é ignorado, com um aviso de uma linha no canal de erro, e a precedência segue |
| `COLORFGBG` | lida, nova | Último campo de 0 a 6 ou 8: fundo escuro. 7 ou de 9 a 15: fundo claro. Qualquer outra forma: ignorada, sem aviso |
| `COLORTERM` | lida, nova | `truecolor` ou `24bit` declaram cor de 24 bits |
| `TERM` | lida, nova | Contendo `256color`, declara 256 cores; `dumb` desliga a cor; o resto vale 16 cores |
| `LC_ALL`, `LC_CTYPE`, `LANG` | lidas, novas | A primeira declarada decide: contendo `UTF-8`, em qualquer caixa, glifos Unicode; do contrário, sete bits |
| `NO_COLOR` | inalterada | Declarada, desliga a cor, como `--sem-cor` |

Nenhuma delas é escrita, e nada é guardado entre execuções.

## 3. Precedência do fundo

1. `--tema=`
2. `REVERSA_VIEWS_TEMA`, quando válida
3. `COLORFGBG`, quando legível
4. Escuro

A ferramenta **não pergunta** ao terminal a cor do fundo: nenhum byte é escrito antes do primeiro
desenho para descobri-la.

## 4. Degrau de cor

| Condição, na ordem | Degrau |
|---|---|
| Saída que não é terminal, `--sem-cor` ou `NO_COLOR` | nenhuma |
| `COLORTERM` declara 24 bits | 24 bits |
| `TERM` contém `256color` | 256 |
| `TERM` é `dumb` | nenhuma |
| Qualquer outro caso | 16 |

Na dúvida, o degrau inferior. De um degrau para o outro some fidelidade de tom, e nenhuma informação.

## 5. O que cada destino recebe

| Destino | Cor | Glifos | Moldura | Linha de estado | Cursor |
|---|---|---|---|---|---|
| Interface viva, 60 colunas ou mais | conforme o degrau | sim | sim | sim | sim |
| Interface viva, menos de 60 colunas | conforme o degrau | sim | não | sim | sim |
| Passada diante de terminal | conforme o degrau | sim | não | não | não |
| Passada redirecionada | nenhuma | sim | não | não | não |
| `--dados` | não se aplica: JSON, idêntico byte a byte ao da 014 e da 015 | | | | |

## 6. Garantias do texto da passada

Substituem a leitura de identidade de bytes, que fica só para `--dados`:

- Nenhuma sequência de escape e nenhum caractere de moldura no texto redirecionado
- Nenhuma linha além de oitenta colunas quando o destino não declara largura
- Os mesmos fatos, na mesma ordem das onze seções, com a seção "Versões e construção" ao fim
- A mesma disposição da interface viva: dado secundário em linha própria
- Diante de terminal, o texto é o mesmo: retiradas as sequências de cor, é idêntico ao redirecionado

A **disposição** do texto não é contrato. Quem precisa de forma estável consome `--dados`.

## 7. Texto vindo do disco

Caractere de controle lido do projeto observado nunca chega ao terminal como controle: é desenhado como
texto visível. Vale para a interface viva e para a passada. Não vale para `--dados`, onde a serialização
JSON já o escapa.

## 8. Canais e códigos de saída

Inalterados. O aviso de `REVERSA_VIEWS_TEMA` inválida sai pelo canal de erro, como todo o resto que não
é leitura, e não muda o código de saída.

A raiz inexistente continua terminando com o código de uso incorreto, antes de existir quadro. O que
muda é o desenho da mensagem, no canal de erro: título na cor de falha, sem moldura, quando o canal é
terminal; o texto de hoje, sem sequência alguma, quando não é (RF-09, D-22).

## 9. O que este delta proíbe

- Guardar o tema em arquivo, em qualquer lugar
- Conversar com o terminal para descobrir capacidade ou fundo
- Receber tom de cor por argumento ou por variável: a paleta é declarada num lugar só, no código
