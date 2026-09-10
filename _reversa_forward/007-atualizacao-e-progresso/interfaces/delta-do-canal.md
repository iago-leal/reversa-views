# Contrato: acréscimo de `setUpdate` ao canal entre host e painel

> Identificador da feature: `007-atualizacao-e-progresso`
> Tipo: mensagem, host para painel
> Contrato de origem: `_reversa_forward/002-ponte-e-host/interfaces/protocolo-webview.md`
> Declaração em código: `src/host/protocol.ts`

Este arquivo descreve **apenas o delta**. Tudo o que o contrato de 002 fixa continua valendo: mesmo
envelope, mesma ausência de identificador de correlação, mesma regra de crescimento por acréscimo.

## 1. O que entra

Um quarto comando de host, acrescentado ao FIM da lista, pela mesma disciplina com que a feature 006
acrescentou dois comandos de painel depois do comando reservado.

```ts
export type HostMessage =
  | { command: 'setProcess'; data: SetProcessData }
  | { command: 'setEntry'; data: SetEntryData }
  | { command: 'setNotice'; data: SetNoticeData }
  | { command: 'setUpdate'; data: UpdateStatus }   // acréscimo da feature 007

export const HOST_COMMANDS = ['setProcess', 'setEntry', 'setNotice', 'setUpdate'] as const
```

A forma de `UpdateStatus` está na seção 3 do `data-delta.md`, com as sete variantes e seus campos.

## 2. O que NÃO entra

- Nenhum comando novo do painel para o host. O painel não pede a consulta: quem a dispara é o host,
  depois de enviar o processo. Reler o processo é o gesto que a repete, e o comando `reload` já
  existe.
- Nenhum campo novo em `SetProcessData`, `SetEntryData` ou `SetNoticeData`.
- Nenhuma renomeação, remoção ou troca de ordem. O comando reservado `dispatch` segue reservado, no
  mesmo lugar.

## 3. Ordem e momento

Numa leitura bem-sucedida, a sequência passa a ser esta:

```
1. setEntry   { kind: 'loading' }        ← antes de tocar o disco
2. setProcess { … }                       ← a leitura, completa
3. setUpdate  { estado: 'consultando' }   ← imediatamente após o envio do processo
4. setUpdate  { … }                       ← quando a origem responder, ou o tempo estourar
```

Os passos 3 e 4 são **independentes** dos anteriores e podem não acontecer: com a conferência
desligada, o passo 3 traz `desligada` e não há passo 4. Nas sequências que terminam em
`setEntry { kind: 'no-folder' | 'error' }` não há consulta alguma, porque não há leitura a
acompanhar.

`sessionMessages`, a função pura de `src/host/session.ts` que hoje devolve a sequência inteira,
continua devolvendo os passos 1 e 2. Os passos 3 e 4 nascem no provedor, que é quem tem relógio e
pode esperar, e é também por isso que o preview precisa de um argumento próprio para alcançá-los.

## 4. Compatibilidade nas duas direções

| Situação | Comportamento |
|---|---|
| Painel novo, host antigo | Nenhum `setUpdate` chega; o desfecho permanece no valor inicial e o cabeçalho não mostra a linha |
| Painel antigo, host novo | O envelope desconhecido é descartado pelo painel, que já ignora comando que não conhece |
| Painel novo, host novo, editor sem rede | Chega `consultando` e depois `impossivel`, com causa |

As duas primeiras linhas não são hipóteses de laboratório: o pacote da tela e o do host viajam
juntos, mas a construção de um pode ficar para trás durante o desenvolvimento, e o contrato de 002
já escolhia degradar em silêncio nesse caso.

## 5. Como se testa

Pelo mesmo caminho das mensagens que já existem: a suíte da ponte verifica que o envelope sai com o
nome certo, a do roteador que envelope desconhecido não derruba nada, e a do painel que cada
variante produz a linha esperada no cabeçalho. Nenhuma delas precisa de editor nem de rede.
