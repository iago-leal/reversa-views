# Interface: canal do preview

> Identificador da feature: `005-empacotamento-e-verificacao`
> Data: `2026-09-09`
> Tipo: HTTP local, apenas na interface de retorno da máquina
> Consumidor único: o host fingido servido em `scripts/preview/cliente.js`

## 1. O que este contrato é, e o que ele não é

Este é o contrato entre o servidor do preview e o host fingido que roda no navegador. Ele existe
porque o painel, dentro do editor, conversa com um processo em Node que lê o disco, e fora do editor
esse processo precisa de um substituto. O que ele transporta são as mesmas mensagens de
`_reversa_forward/002-ponte-e-host/interfaces/protocolo-webview.md`, sem acréscimo, renomeação nem
remoção: o canal do painel continua sendo aquele, e este aqui é o carro que o leva.

Não é interface pública, não é serviço, não roda em produção e não sobrevive ao comando que o abriu.
Nenhuma parte da extensão instalada o conhece.

## 2. Superfície

| Método | Caminho | Para quê |
|---|---|---|
| GET | `/` | O documento do painel, montado pelas mesmas funções que o host usa |
| GET | `/main.js` | O pacote da webview, servido byte a byte da pasta de saída |
| GET | `/main.css` | A folha do painel, servida byte a byte da pasta de saída |
| GET | `/processo` | Uma leitura, devolvida como a sequência de mensagens que o host enviaria |
| POST | `/canal` | O que o painel manda para o host: abertura de arquivo e linhas de registro |

Qualquer outro caminho responde 404 com texto que nomeia os cinco acima. Qualquer outro método sobre
um caminho conhecido responde 405.

## 3. A página

`GET /` devolve `text/html; charset=utf-8`, montado por `buildDocument` sobre o corpo de
`panelBody`, com nonce novo a cada carregamento. Três diferenças em relação ao documento do editor,
todas declaradas na faixa que a página mostra:

1. A classe de tema é escrita no corpo pelo servidor, com o nome que o editor escreveria, a partir do
   argumento de tema.
2. A política de segurança permite conexão com a própria origem, porque sem isso não há canal. Todas
   as demais diretivas são idênticas às do editor, inclusive a que só aceita script portador do nonce
   da sessão.
3. Antes do pacote, a página carrega o host fingido, que precisa existir quando a interface do painel
   pedir a interface do editor durante a montagem.

## 4. A leitura

`GET /processo` devolve `application/json` com um objeto de um campo, `mensagens`, contendo em ordem
os envelopes que o host enviaria pelo canal. A ordem é a que `src/host/session.ts` produz, e não uma
segunda decisão do preview.

```
200 OK
{
  "mensagens": [
    { "command": "setEntry", "data": { "kind": "loading" } },
    { "command": "setProcess", "data": { "process": …, "probe": …, "readAt": "…",
      "entry": "installed", "root": "…", "ignoredRoots": [], "inheritedRevision": "…" } }
  ]
}
```

Regras de comportamento:

- **Estado forçado.** Com o argumento de estado, a resposta traz apenas o envelope correspondente,
  sem que disco algum seja lido.
- **Atraso.** O argumento de atraso é observado antes da resposta, e é o que torna visíveis os
  estados de carregamento e de releitura. Ele não altera a ordem das mensagens.
- **Releitura verdadeira.** Cada requisição lê o workspace de novo. Alterar um arquivo do Reversa e
  acionar a releitura no painel mostra o estado novo, como no editor.
- **Falha de leitura.** Exceção na camada de leitura vira o envelope de erro, exatamente como o host
  faz, e nunca 500. O painel tem tela para erro; o navegador não.
- **Sem cache.** A resposta declara que não deve ser guardada, porque uma leitura guardada é uma
  leitura mentirosa.

## 5. O retorno do painel

`POST /canal` recebe `application/json` com um envelope do painel e responde 204 sem corpo. Os cinco
comandos do protocolo são tratados assim:

| Comando | Efeito no preview |
|---|---|
| `onLoaded` | Não chega ao servidor: o host fingido responde a ele buscando a leitura |
| `reload` | Não chega ao servidor: o host fingido responde a ele buscando a leitura |
| `openFile` | Uma linha no terminal do preview, com o caminho pedido; nenhum editor é aberto |
| `log` | Uma linha no terminal do preview, com o prefixo do painel preservado |
| `dispatch` | Uma linha no terminal dizendo que o comando é reservado e não tem tratador, que é o que o host faz |

Envelope malformado, comando desconhecido e corpo que não é objeto produzem linha no terminal e
resposta 204, jamais erro de servidor: o roteador do host se comporta assim, e o preview existe para
parecer com ele.

## 6. Erros e recusas

| Situação | Resposta | Observação |
|---|---|---|
| Caminho desconhecido | 404 com texto | Nomeia os cinco caminhos válidos |
| Método não previsto | 405 com texto | Nomeia o método aceito naquele caminho |
| Requisição com origem declarada diferente da do preview | 403 com texto | RN-03; o preview é ferramenta local |
| Corpo acima de um limite pequeno em `/canal` | 413 com texto | O canal transporta caminhos e linhas de registro, nada maior |
| Pacote da webview ausente ao pedir `/main.js` | 500 com texto que manda rodar o build | Só ocorre se a saída for apagada com o preview aberto |

## 7. Idempotência, ordem e tempo

- `GET /` e os dois arquivos do pacote são idempotentes e sem efeito.
- `GET /processo` não tem efeito colateral algum, mas não é idempotente em resultado, e isso é
  deliberado: o disco pode ter mudado entre duas leituras, e é essa mudança que se quer ver.
- `POST /canal` tem como único efeito uma linha no terminal, e repetir a mesma mensagem produz outra
  linha, como produziria no registro da extensão.
- Não há tempo limite, retentativa nem correlação de mensagens. O canal do painel também não os tem,
  porque cada pedido desta versão tem uma resposta possível.

## 8. Endereço e escopo de escuta

O servidor escuta em `127.0.0.1` e na porta pedida, com valor padrão declarado no módulo. Não escuta
em interface externa, e a porta ocupada interrompe o comando com a sugestão do argumento de porta, em
vez de escolher outra sozinho: porta escolhida por conta própria é endereço que o usuário não sabe
onde foi parar.
