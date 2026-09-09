# Contrato: canal de mensagens entre a webview e o host

> Identificador: `002-ponte-e-host`
> Data: `2026-09-09`
> Tipo: mensagem entre processos, mediada pelo editor
> Lados: host desta feature (002) e painel da feature 003
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Por que este contrato tem arquivo próprio

Não há HTTP, fila nem chamada remota nesta feature, e a seção 10 da spec registra dependência de
rede como nenhuma. 🟢 Ainda assim o canal é um contrato externo no sentido que importa: ele
atravessa uma fronteira de processo que nenhum dos dois lados controla, e os dois lados são escritos
por features diferentes, de modo que uma mudança aqui quebra código que já não é desta entrega.

## 2. Transporte e forma

🟢 O editor administra o canal. O host envia por uma chamada de envio sobre o objeto de webview, e a
webview envia por uma chamada de envio sobre a interface que o host lhe entrega, tomada uma única
vez por painel. Em cada lado há um só lugar que chama essas interfaces, conforme RF-17.

O envelope é o da origem do kit, e é o mesmo nas duas direções:

```
{ command: texto, data?: qualquer }
```

Não há identificador de correlação, não há confirmação e não há número de sequência. 🟢 Decisão do
log da spec, mantida: cada pedido desta versão tem uma resposta possível, e correlacionar custaria
complexidade sem comprar nada.

## 3. Comandos do host para a webview

| Comando | Carga | Quando é enviado | Idempotente |
|---------|-------|------------------|-------------|
| `setProcess` | `process`, `probe`, `readAt`, `entry`, `root`, `ignoredRoots` | Depois de cada leitura bem-sucedida, seja a inicial, seja uma releitura | sim, substitui inteiramente o anterior |
| `setEntry` | `kind`, `message?`, `root?`, `ignoredRoots?` | Quando não há processo a mostrar: sem pasta, leitura em curso, ou falha capturada | sim |
| `setNotice` | `level`, `message` | Quando um pedido da webview falhou de modo que ela precisa saber, hoje só a abertura de arquivo ausente | não, cada aviso é um evento |

Nenhum desses comandos espera resposta. 🟡 A webview redesenha e não confirma.

## 4. Comandos da webview para o host

| Comando | Carga | O que o host faz | Resposta | Idempotente |
|---------|-------|------------------|----------|-------------|
| `onLoaded` | nenhuma | Resolve a raiz, lê e envia a carga | `setEntry` de carregando, depois `setProcess` ou `setEntry` de erro | não, cada chegada dispara uma leitura |
| `reload` | nenhuma | Lê de novo e envia a carga | igual ao anterior | não, pelo mesmo motivo |
| `openFile` | `path`, relativo à raiz observada | Contém o caminho e abre o documento no editor | nenhuma em caso de sucesso; `setNotice` em caso de falha | sim, abrir duas vezes o mesmo arquivo tem o mesmo efeito |
| `log` | `message` | Escreve a linha no canal de saída, prefixada com a origem | nenhuma | não |
| `dispatch` | `agent` | **Reservado.** Registra rejeição nomeando o comando como reservado e nada mais | nenhuma | n/a |

## 5. Ordem obrigatória

🟡 Uma só regra, e ela é RN-03: nenhuma mensagem de dados sai antes de `onLoaded` chegar. O host não
tem como saber que o documento carregou senão por essa mensagem, e enviar antes é perder a carga em
silêncio.

A consequência prática, registrada em EC-07 da spec, é que receber `onLoaded` duas vezes produz duas
leituras e duas cargas. Isso é comportamento correto, e não defeito: uma webview descartada e
recriada pelo editor precisa ser preenchida de novo, e nada do host depende de instância anterior.

## 6. Erros

| Situação | Quem detecta | O que acontece | Onde fica o registro |
|----------|--------------|----------------|----------------------|
| Comando sem nome reconhecido | host | Rejeição, nenhum efeito colateral | canal de saída, com o nome recebido |
| Carga malformada para comando conhecido | host | Rejeição, nenhum efeito colateral | canal de saída, com o comando e o campo faltante |
| Caminho de abertura que escapa da raiz | host | Recusa **antes** de qualquer chamada ao editor | canal de saída, com o caminho e o motivo |
| Arquivo apontado não existe mais | host | Captura, `setNotice` nomeando o arquivo | canal de saída e a webview |
| Camada de leitura lança | host | Captura, `setEntry` de erro com a mensagem | canal de saída, com a pilha |
| Envio a webview oculta | host | Não envia, marca releitura pendente e executa ao voltar a visibilidade | canal de saída, com o motivo da postergação |
| Envio que o editor não confirma | host | Registra a não confirmação, sem repetir | canal de saída |
| Mensagem que o tratador da webview não entende | webview | Ignora, registra pelo comando de log | canal de saída, via `log` |

🟢 Nenhum erro chega ao usuário por notificação, diálogo ou mudança de foco. RN-09 é categórica, e a
única exceção é o canal de saída, que só quem procura vê.

## 7. Tempo

| Aspecto | Valor | Origem |
|---------|-------|--------|
| Prazo entre `onLoaded` e a chegada da carga | abaixo de 1 s, incluída a leitura do disco | RNF-01 da spec |
| Tempo limite de pedido | nenhum | Não há requisição remota; a leitura é síncrona e local |
| Nova tentativa automática | nenhuma | Falha vira estado nomeado, e quem tenta de novo é o usuário pelo botão ou pela paleta |
| Folga medida | a leitura da feature 001 custou 44 ms no workspace de referência, com cinquenta adendos | `_reversa_sdd/addenda/001-leitura-do-processo.md` |

🟡 A ausência de tempo limite é decisão, não esquecimento: um limite sobre operação síncrona e local
só serviria para transformar lentidão em falha, e o host não tem como cancelar leitura já em curso.

## 8. Segurança

- 🟢 A webview só consegue pedir o que o protocolo nomeia. Tudo o mais é rejeitado com registro.
- 🟢 O caminho de abertura é contido pela função `resolveInside`, herdada da sonda, que recusa
  caminho absoluto, caminho com unidade de disco e qualquer resolução que escape da raiz.
- 🟡 A contenção é lexical, sem resolução de vínculo simbólico. Um vínculo dentro da raiz que aponte
  para fora dela é aceito. A consequência foi declarada e aceita na origem pelo mesmo motivo que vale
  aqui: o host apenas lê e abre documento, nunca escreve.
- 🟢 O documento é servido com política que não admite avaliação dinâmica de código, não declara
  origem coringa e admite script apenas por nonce da sessão.
- 🟢 O processo atravessa o canal dentro do editor e não sai da máquina.

## 9. Compatibilidade e evolução

🟡 O protocolo **não** nasce congelado, ao contrário do da origem, e a razão é que ele ainda não tem
consumidor externo: o único lado que o consome é a feature 003, que ainda será escrita. A partir da
primeira versão instalada, a regra passa a ser a mesma da origem, que é acrescentar sem renomear nem
remover.

Duas evoluções já são previsíveis e o desenho as comporta por acréscimo:

1. **Despacho de agentes**, previsto na seção 10 do PRD. O comando já existe reservado, e implementá-lo
   é escrever o tratador, não mudar o canal.
2. **Corpos de adendo sob demanda**, se a carga se mostrar pesada. Um comando novo de pedido e outro
   de entrega bastam, sem tocar no que já existe.

Se algum dia um pedido passar a ter mais de uma resposta possível, aí sim o envelope precisará de
identificador de correlação, e a mudança será de forma, não de acréscimo. O lugar de reabrir essa
decisão é o log de decisões da spec do componente.
