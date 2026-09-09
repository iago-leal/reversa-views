# Contrato: canal de mensagens entre a webview e o host, delta da feature 004

> Identificador: `004-heranca-e-sincronia`
> Data: `2026-09-09`
> Tipo: mensagem entre processos, mediada pelo editor
> Contrato base: `_reversa_forward/002-ponte-e-host/interfaces/protocolo-webview.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Por que há um arquivo aqui

O contrato do canal foi escrito inteiro pela feature 002 e ganhou seu consumidor na feature 003.
Desde então vale a regra da seção 9 daquele arquivo: acrescentar sem renomear nem remover. Esta
feature é o primeiro exercício real dessa regra, e o que segue descreve apenas o que muda. Tudo o
que não estiver aqui continua valendo como está lá. 🟢

## 2. O que muda

Um campo, numa carga, numa direção. 🟢

| Comando | Direção | Mudança |
|---------|---------|---------|
| `setProcess` | host para webview | A carga `SetProcessData` ganha o campo `inheritedRevision` |

Nenhum comando novo, nenhum comando removido, nenhuma carga renomeada, nenhuma mudança de ordem.
`setEntry`, `setNotice` e os cinco comandos da webview ficam intactos.

## 3. O campo

| Propriedade | Valor |
|-------------|-------|
| Nome | `inheritedRevision` |
| Tipo | texto |
| Presença | sempre, em toda carga de `setProcess` |
| Valor vazio | permitido, e significa revisão não declarada |
| Origem do valor | a constante de `src/host/inheritance.ts`, gerada a partir de `src/heranca/manifesto.yml` |
| Transformação no host | nenhuma; o host repassa o texto como o recebeu |
| Transformação na webview | abreviação para sete caracteres, por função pura do domínio, apenas para desenho |

O valor é o identificador de revisão do git da origem do modelo, com 40 caracteres hexadecimais na
forma completa. 🟢 A webview nunca recebe caminho de origem, nem data, nem nome de repositório: o
painel mostra a revisão porque ela identifica o que foi copiado, e não porque ele saiba onde a
origem mora.

## 4. Por que não viaja em `setEntry`

🟡 Os três estados que viajam sem processo, `no-folder`, `loading` e `error`, não desenham item de
cabeçalho com valor: o cabeçalho já mostra `não declarado` em todos eles. Acrescentar o campo
naquela carga duplicaria o dado sem cenário que o exija, e cada duplicação no protocolo é uma
divergência futura à espera de acontecer.

## 5. Erros

Nenhuma situação de erro nova. 🟢 O campo não pode faltar, porque a constante existe sempre, ainda
que vazia, e a webview trata texto vazio pelo mesmo caminho que trata todo item ausente do
cabeçalho, que é mostrar `não declarado`.

Uma consequência vale registro: se a constante ficar defasada em relação ao manifesto, o painel
mostrará uma revisão errada sem qualquer sinal no canal. O canal não é o lugar de detectar isso, e
por isso a detecção vive na suíte que compara a constante com o manifesto e no passo do build que a
regenera.

## 6. Tempo e idempotência

Sem mudança. 🟢 `setProcess` continua idempotente, substituindo inteiramente a carga anterior, e o
campo novo viaja com ela. Não há prazo, tentativa nem confirmação a acrescentar, porque o valor é
constante da compilação e não custa leitura alguma no caminho da mensagem.

## 7. Compatibilidade

🟢 A mudança é aditiva e os dois lados são compilados juntos, de modo que o campo aparece nos dois
ao mesmo tempo. Uma webview antiga que recebesse a carga nova simplesmente ignoraria o campo, e um
host antigo com painel novo faria o painel mostrar `não declarado`, que é o comportamento correto
para revisão que não chegou. Nenhum dos dois casos ocorre neste repositório, onde host e painel
viajam no mesmo pacote.
