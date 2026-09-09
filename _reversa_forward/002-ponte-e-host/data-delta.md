# Delta de dados: ponte e host da extensão

> Identificador: `002-ponte-e-host`
> Data: `2026-09-09`
> Base de comparação: `_reversa_sdd/sdd/ponte-e-host.md#9-modelo-de-dados` e o código entregue pela feature 001
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Nada é persistido

A feature não cria banco, arquivo de dados nem cache. 🟢 O invariante do produto, declarado em
`_reversa_sdd/prd.md#6-restricoes`, é que a extensão nunca escreve arquivo, e o host desta feature
o cumpre por construção: ele lê pela camada herdada, abre documento no editor e escreve no canal de
saída, e nenhuma dessas três operações toca disco para gravar.

Há um único armazenamento no sentido estrito, e ele não é do host: o estado que a própria webview
guarda no editor. A seção 4 descreve o que cabe ali e por que o processo não cabe.

Em consequência, **não há migração**, nem nesta entrega nem em nenhuma futura enquanto o
invariante valer.

## 2. Estruturas que a feature cria

Uma só, o protocolo do canal, que vive em memória e atravessa a fronteira entre o processo do host
e o do webview. Ela mora inteira em `src/host/protocol.ts`, e a razão de ser de um arquivo só está
em RF-17 e em RNF-04: um protocolo espalhado deixa de ser verificável.

### 2.1 O envelope

🟢 Herdado sem alteração da origem do kit, onde ele é literalmente um nome de comando e uma carga
facultativa, sem identificador de correlação e sem confirmação de recebimento.

```
Envelope {
  command: texto
  data?: qualquer
}
```

A decisão de não ter identificador de correlação está no log de decisões da spec e permanece.
Nesta versão cada pedido tem uma resposta possível, e o custo de correlacionar não compraria nada.
A seção 6 do arquivo do contrato registra o que mudaria se um dia houvesse duas.

### 2.2 O estado de entrada

🟡 Cinco valores nomeados, num tipo união único, conforme RF-15. Eles descrevem em que situação o
painel está antes de desenhar qualquer coisa, e é deles que a feature 003 deriva as telas.

| Valor | Quando vale | Mensagem que o carrega |
|-------|-------------|------------------------|
| `no-folder` | O editor foi aberto sem pasta alguma, e nenhuma leitura é tentada | `setEntry` |
| `loading` | A webview sinalizou pronto e a leitura está em curso | `setEntry` |
| `error` | A camada de leitura lançou, o host capturou e registrou a pilha | `setEntry`, com a mensagem |
| `no-reversa` | A leitura terminou e o processo veio marcado como não instalado | `setProcess` |
| `installed` | A leitura terminou com processo válido, degradado ou não | `setProcess` |

### 2.3 A carga de dados

🟡 Seis campos, dos quais três vêm de RF-13 e três de RF-03 e RF-04.

```
SetProcessData {
  process: ReversaProcess       // tipo herdado, sem transformação
  probe: ProbeReport            // workspace, featureDir, sessionDir, refusals, truncated
  readAt: texto                 // instante da leitura, em formato ordenável
  entry: 'installed' | 'no-reversa'
  root: texto                   // caminho absoluto da raiz observada
  ignoredRoots: lista de texto  // as demais raízes do workspace, se houver
}
```

Os dois primeiros tipos não são escritos aqui. 🟢 Eles vêm prontos de
`src/heranca/reversa-domain/src/index.ts` e de `src/heranca/reversa-probe/src/snapshot.ts`, e o host
os repassa sem tocar, o que é justamente o que RF-14 exige.

### 2.4 As demais cargas

```
SetEntryData {
  kind: 'no-folder' | 'loading' | 'error'
  message?: texto               // presente apenas em 'error'
  root?: texto                  // presente quando já há raiz escolhida
  ignoredRoots?: lista de texto
}

SetNoticeData {
  level: 'warning'
  message: texto                // nomeia o arquivo que não pôde ser aberto
}

OpenFileData { path: texto }    // relativo à raiz observada
LogData      { message: texto }
DispatchData { agent: texto }   // RESERVADO, sem tratador nesta versão
```

## 3. Delta sobre o que a spec declarava

Três diferenças em relação a `_reversa_sdd/sdd/ponte-e-host.md#9-modelo-de-dados`, todas de
acréscimo, nenhuma de remoção ou renomeação.

| # | Delta | Origem da exigência | Confidência |
|---|-------|---------------------|-------------|
| 1 | A mensagem de dados ganha três campos, o estado de entrada, a raiz observada e as raízes ignoradas. A spec os declarava apenas na mensagem de estado | RF-03, RF-04 e o cenário de workspace sem instalação, que pede processo e estado na mesma entrega | 🟡 |
| 2 | Um terceiro comando do host, o de aviso, passa a existir. A spec listava dois | EC-05 da spec, que exige aviso nomeando o arquivo, combinado com RN-09, que proíbe notificação do editor | 🟡 |
| 3 | Os cinco estados de entrada tornam-se um tipo do arquivo de protocolo. A spec os citava em comentário, e apenas três apareciam ali | RF-15, que exige os cinco no arquivo de tipos e alcançáveis por cenário de teste | 🟡 |

Nenhum delta afeta o consumidor previsto, porque ele ainda não existe: o painel é a feature 003, e
os três acréscimos entram antes de haver código dependente. Este é o momento mais barato de fazê-los,
e por isso são feitos agora.

## 4. O estado que a webview guarda no host

🟡 Uma estrutura, e ela pertence conceitualmente à feature 003, que desenha as seções. O host desta
feature apenas garante o que RN-06 exige, que é o processo nunca ir para lá.

```
ViewPreferences {
  collapsedSections: lista de nomes de seção
}
```

A razão da proibição está no log de decisões da spec e vale repetir, porque é ela que o coding
precisa lembrar: um retrato antigo pintado como se fosse atual contraria o propósito inteiro do
painel, e o custo de reler é menor que o de enganar. O critério verificável correspondente é que
nenhum módulo do host escreva no estado da webview, e a suíte do provedor o fixa.

## 5. O que sai do host para o disco

Nada. 🟢 A tabela existe para deixar a ausência explícita, e não para descrever conteúdo.

| Destino | Escrita | Observação |
|---------|---------|------------|
| Workspace do usuário | nenhuma | O host abre documento no editor, e quem eventualmente grava é o usuário, pelo próprio editor |
| Configuração do editor | nenhuma | Nenhuma preferência é escrita por esta feature |
| Estado da webview | apenas preferência de exibição, escrita pela webview | Descartado pelo editor quando a extensão é desinstalada |
| Canal de saída | texto de log, volátil | Não é arquivo; some quando a janela fecha |

## 6. Índices, chaves e volume

Não se aplica, por não haver armazenamento. 🟢 A única grandeza relevante é o tamanho da carga que
atravessa o canal, e ela não tem medida ainda: a feature 001 mediu a leitura do disco em 44 ms no
workspace de referência, com cinquenta adendos, e ninguém mediu a serialização da carga resultante.
O ponto está registrado como pendência de investigação, e a resposta provável, se ele incomodar, é
enviar os corpos dos adendos sob demanda, o que o protocolo comporta por acréscimo de um comando.
