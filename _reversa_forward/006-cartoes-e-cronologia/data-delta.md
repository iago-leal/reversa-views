# Delta de dados: cartões e cronologia

> Identificador: `006-cartoes-e-cronologia`
> Data: `2026-09-09`
> Base: `_reversa_sdd/sdd/painel-do-processo.md#9-modelo-de-dados` e `_reversa_sdd/sdd/ponte-e-host.md#9-modelo-de-dados`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. O que muda, em uma frase

Uma estrutura persistida ganha um campo, o payload que atravessa a ponte ganha dois ramos, e nascem
dois vocabulários fechados. Nada é renomeado, nada é removido, e nenhuma migração é necessária.

## 2. Preferência de exibição, a única estrutura persistida

🟢 Hoje, conforme a seção 9 da spec do painel e `src/webview/domain/types.ts`:

```
PreferenciasDeExibicao {
  collapsedSections: lista de nomes de seção
}
```

🟢 Depois:

```
PreferenciasDeExibicao {
  declared: booleano          // campo novo: houve escolha do usuário
  collapsedSections: lista de nomes de seção
}
```

### Regra de leitura, que continua total

| O que está gravado | Como passa a ser lido | Confidência |
|---|---|---|
| Nada, ou valor que não é objeto | Sem escolha declarada, lista vazia. O padrão inicial vale | 🟢 |
| `{ collapsedSections: [...] }` com lista não vazia, sem `declared` | Escolha declarada. Preserva a preferência de quem já usa o painel | 🟢 |
| `{ collapsedSections: [] }` sem `declared` | Sem escolha declarada. É indistinguível do estado nunca gravado, e essa é justamente a ambiguidade que o campo novo encerra daqui para frente | 🟢 |
| `{ declared: true, collapsedSections: [] }` | Escolha declarada de não recolher nada. É o estado de tudo aberto, hoje irrepresentável | 🟢 |
| `declared` com tipo errado | Tratado como ausente, sem anomalia e sem aviso na tela | 🟢 |
| Nome de seção que esta versão não conhece | Descartado em silêncio na tela e registrado no log, como já acontece | 🟢 |

🟢 Nenhuma migração é escrita. O estado antigo é lido como acima, e o novo formato só é gravado
quando o usuário mexe em algum cartão. Um painel de versão anterior que leia o estado novo ignora
`declared` e enxerga a lista, que continua no mesmo lugar e com o mesmo nome.

## 3. Vocabulário das seções

🟢 Hoje são seis nomes, e a ordem do array é a ordem da tela:

```
blocking, forward, discovery, policy, anomalies, probe
```

🟢 Depois são oito, com os dois novos inseridos logo após o ciclo forward:

```
blocking, forward, decomposition, history, discovery, policy, anomalies, probe
```

🟢 Deriva-se dali uma lista nova, a dos cartões recolhíveis, que é o mesmo conjunto sem `blocking`,
porque a faixa de bloqueio ocupa um nome de seção para efeito de isolamento de falha mas não é
cartão. É essa lista que as ações de expandir tudo e recolher tudo percorrem.

🟢 O conjunto de diagnóstico não muda: continua `policy`, `anomalies`, `probe`.

🟡 O padrão inicial de recolhimento passa de três nomes para quatro, acrescentando `history`, e
mantém a exceção que abre `anomalies` quando a leitura degradou.

## 4. Payload do processo, no fio entre host e webview

🟢 `SetProcessData` ganha dois campos, ambos por acréscimo:

```
SetProcessData {
  ...campos de hoje, intocados...
  decomposition: DecomposicaoDaFeatureAtiva
  history: HistoricoDoProjeto
}
```

🟢 Detalhe dos comandos e do protocolo em `interfaces/protocolo-webview.md`.

### 4.1 Decomposição da feature ativa

```
DecomposicaoDaFeatureAtiva {
  lida: booleano                 // falso quando não há feature ativa ou o arquivo não foi lido
  origem: 'tabela' | 'varredura' | 'ausente'
  acoes: lista de AcaoDoPlano
  divergencia: nulo ou { contadas: número, listadas: número }
}

AcaoDoPlano {
  id: texto                      // o identificador como está escrito, por exemplo T012
  descricao: texto
  fase: texto ou nulo            // o título de segundo nível sob o qual a linha estava
  emenda: booleano               // veio da seção de emendas
  fechada: booleano              // lido do marcador da própria linha
  arquivoAlvo: texto ou nulo
}
```

🟢 `origem` declara como a lista foi obtida: pela tabela com cabeçalho reconhecido, pela varredura
linha a linha quando o cabeçalho não casou, ou ausente quando não há o que ler. A tela usa esse campo
para dizer que a decomposição veio por caminho degradado, em vez de fingir leitura limpa.

🟢 `divergencia` é preenchida apenas quando a contagem herdada e o comprimento da lista discordam. A
contagem herdada continua sendo a autoridade sobre quantas ações existem, e a divergência é anomalia
a mostrar, não número a escolher.

### 4.2 Histórico do projeto

```
HistoricoDoProjeto {
  entradas: lista de FeatureNoHistorico
  truncado: booleano             // verdadeiro acima do teto de cinquenta pastas
  total: número                  // quantas pastas existem, mesmo se nem todas foram lidas
}

FeatureNoHistorico {
  pasta: texto                   // caminho relativo à raiz observada, para abrir no editor
  id: texto ou nulo              // o prefixo, quando a pasta segue o padrão do framework
  nomeCurto: texto ou nulo
  situacao: SituacaoDaFeature
  marca: MarcaDaFeature
  acoes: { total, fechadas, abertas, emendas }
  adendo: texto ou nulo          // caminho do adendo vigente, quando há
  resumo: texto ou nulo          // uma linha, derivada conforme a seção 5
  ultimoEvento: texto ou nulo    // instante absoluto do evento mais recente da trilha
}
```

🟢 `SituacaoDaFeature` é vocabulário fechado, derivado dos artefatos da pasta:

| Valor | Quando |
|---|---|
| `convergida` | Todas as ações fechadas e adendo vigente presente |
| `entregue-sem-adendo` | Todas as ações fechadas, sem adendo ou com adendo superado |
| `em-aberto` | Ao menos uma ação aberta, inclusive emenda aberta |
| `sem-acoes` | Pasta sem `actions.md`, ou com o arquivo sem nenhuma linha de ação |

🟢 `MarcaDaFeature` é outro vocabulário, propositalmente separado do primeiro, e vem do ponteiro que
o Reversa mantém, não dos artefatos:

| Valor | Quando |
|---|---|
| `ativa` | A pasta é a feature ativa declarada |
| `pausada` | A pasta consta da fila de features pausadas |
| `nenhuma` | Nem uma coisa nem outra |

🟢 Dois eixos, e não um só, porque uma feature pausada pode estar em qualquer situação, e fundir os
dois obrigaria a escolher qual verdade contar. Também evita criar segunda autoridade sobre o estágio:
o estágio da feature ativa continua vindo do contrato herdado, e `situacao` é grandeza distinta, com
nomes distintos, aplicada a todas as pastas.

## 5. Derivações novas, e de onde cada uma sai

| Derivação | Fonte | Regra | Confidência |
|---|---|---|---|
| Contagem de ações de cada pasta | `actions.md` da pasta | O contrato herdado `scanActions`, o mesmo que já conta a da feature ativa | 🟢 |
| Situação da feature | contagem mais adendo | Tabela da seção 4.2 | 🟢 |
| Marca da feature | `.reversa/active-requirements.json` | Campo de feature ativa e fila de pausadas, ambos já lidos pelo contrato herdado | 🟢 |
| Adendo vigente | pasta de adendos da extração | Nome que começa pelo identificador da feature, descartando o que traz a linha de superação, como o contrato herdado já faz | 🟢 |
| Resumo de uma linha | adendo, senão `requirements.md` da pasta | Primeira linha de conteúdo da seção de resumo do adendo; na falta dele, a primeira frase do resumo executivo do `requirements.md`; na falta das duas, nulo, e a tela mostra o nome curto | 🟡 |
| Instante do último evento | `progress.jsonl` da pasta | O maior instante presente na trilha, preservado em forma absoluta e convertido só na tela | 🟢 |
| Recência de uma ação fechada | trilha da feature ativa | Último evento daquela ação; sem evento, a posição no arquivo | 🟡 |

## 6. O que não muda

- 🟢 O processo tipado que o contrato herdado devolve continua com os mesmos oito eixos e os mesmos
  campos. Nada é acrescentado a ele, e por isso nenhum arquivo de `src/heranca/` muda.
- 🟢 O relatório da sonda herdada mantém a forma de hoje. O truncamento por número de pastas é
  relatado no ramo novo do histórico, e não misturado ao relatório existente.
- 🟢 Nenhum dado de processo passa a ser gravado no estado da webview, que continua guardando apenas
  a preferência de exibição.

## 7. Migrações necessárias

🟢 Nenhuma. A única estrutura persistida é lida de forma total, o payload é reconstruído a cada
leitura, e nada em disco pertence à extensão.
