# Interface: motor de inferência local, passagem das fases

> Identificador: `015-fases-fora-do-canone`
> Data: `2026-09-21`
> Tipo: HTTP em `localhost`
> Consumido por: `scripts/aprender-equivalencias.js`, e por nada mais
> Estende: `_reversa_forward/012-equivalencias-de-checkpoint/interfaces/motor-local.md`

## 1. O que muda

O contrato da 012 continua valendo inteiro para os checkpoints. Esta feature acrescenta duas
perguntas, feitas depois das de checkpoint, pelo mesmo arquivo `scripts/equivalencias/motor.js`, com
o mesmo endereço, o mesmo modelo padrão (`qwen2.5:7b`), a mesma semente, temperatura zero, resposta
em JSON e o mesmo tempo-limite de 60 s por pergunta.

Quem fala e quem nunca fala com o motor não muda: só o aprendizado fala. A promoção, a contagem, a
extensão e a suíte não falam.

## 2. O que chega ao motor, e o que nunca chega

Antes de qualquer pergunta, o aprendizado retira, nesta ordem:

1. o valor sem forma de identificador: com espaço, ou com mais de 40 caracteres (RN-07);
2. o nome que a forma ou o mapa já decidem: canônico, de encerramento, de ciclo ou etapa aprovada;
3. o erro de grafia: distância de edição até 2 de uma fase canônica, medida sobre o nome inteiro e
   sobre cada base possível sem o sufixo numérico (RN-12).

Do `state.json` alheio saem somente o nome candidato, já sem o sufixo numérico (D-04), e os nomes
vizinhos da mesma lista, **depois do filtro 1**. Sem esse filtro nos vizinhos, a prosa do
`DelphiSga` sairia como contexto de um nome legítimo. Nenhuma chave de topo, nenhum checkpoint e
nenhum caminho de projeto acompanham a pergunta.

## 3. Request

### 3.1 Natureza, uma vez por nome candidato distinto

```json
{"nome_em_foco": "reconciliacao", "vizinhos": ["reconhecimento", "escavacao", "reconciliacao"]}
```

O enunciado de sistema é o da rodada 3A de `prova-de-viabilidade.md`, seção 5, sem alteração. O que
o faz funcionar é a classe negativa fechada e a frase "na dúvida, etapa"; a prova mostrou que sem
ela o motor erra quatro dos oito nomes reais.

Os vizinhos são os da primeira lista em que o nome foi visto, no primeiro projeto em ordem
alfabética, para que a mesma raiz produza a mesma pergunta.

### 3.2 Comparação, uma vez por par elegível

```json
{"a": "regressao", "b": "verificacao-regressao"}
```

Par elegível: dois nomes julgados `etapa` em 3.1, ou um deles e uma etapa já aprovada, que partilhem
ao menos uma palavra. Palavras são os segmentos entre `-` e `_`, em minúsculas, descontados `de`,
`da`, `do`, `e`, `em`. O par é ordenado alfabeticamente, e cada par é perguntado uma vez.

O enunciado é o da rodada 3B da prova, sem alteração.

## 4. Response

```json
{"nome": "reconciliacao", "leitura": "etapa", "razao": "..."}
{"a": "regressao", "b": "verificacao-regressao", "leitura": "diferentes", "razao": "..."}
```

| Pergunta | Aceita quando | Efeito na proposta |
|---|---|---|
| natureza | `nome` é igual ao perguntado e `leitura` é `etapa` ou `nao-e-fase` | `etapa`: o nome entra na seção de fases com caixa. `nao-e-fase`: sai da seção e vai à lista do que o motor recusou, sem caixa |
| comparação | `a` e `b` repetem o par e `leitura` é `mesma` ou `diferentes` | `mesma`: os dois nomes ficam no mesmo grupo. `diferentes`: nada |

Resposta que não passe na condição é **descartada**, e nunca corrigida: o nome entra na lista dos
não classificados, e o par simplesmente não agrupa. O grupo é o fecho dos pares `mesma`.

A `razao` da natureza é lida e **não é mostrada** (D-17): a prova mediu razão falsa em sete dos oito
positivos, com o veredito certo. A da comparação é mostrada sob o grupo.

Nome descartado ou sem resposta na natureza entra na seção de fases **com caixa**, marcado como não
classificado. A pessoa decide sem a sugestão, o que é pior que decidir com ela e melhor que o nome
sumir.

## 5. Erros

Os quatro desfechos da 012, sem alteração de regra:

| Desfecho | O que acontece |
|---|---|
| Conexão recusada, em qualquer pergunta de qualquer passagem | A rodada termina, **nada é escrito**, a causa é nomeada (RF-17). Vale também quando a passagem dos checkpoints já tinha terminado bem: proposta pela metade não existe |
| Tempo-limite estourado | A pergunta vira não classificada, e a rodada segue |
| Corpo que não é JSON | Idem |
| JSON válido sobre outro nome ou outro par | Idem |

## 6. Idempotência e custo

Mesma raiz e mesmo mapa produzem as mesmas perguntas, na mesma ordem, e com semente fixa a mesma
proposta. Custo medido na prova: cerca de 2,5 s por natureza e 2,9 s por par. Com os oito nomes de
hoje e o corte por palavra comum, são 8 perguntas e 3 pares, perto de 30 s.

## 7. Substituição na suíte

O transporte continua injetável. O duplo responde por tabela, com a chave sendo o conteúdo da
mensagem, e cobre: cada uma das quatro leituras, resposta sobre outro nome, resposta sobre outro
par, corpo inválido, estouro de tempo e conexão recusada na segunda pergunta de natureza.
