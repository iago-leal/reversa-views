# Contrato: consulta à origem do repositório

> Identificador da feature: `007-atualizacao-e-progresso`
> Tipo: HTTP, saída, leitura
> Consumidor: `src/host/net.ts`, único módulo autorizado a abrir conexão
> Intérprete: `src/host/update.ts`, função pura, sem rede

Este é o **primeiro contrato externo do produto**. Até a feature 006 a extensão não falava com
serviço algum, e o PRD declarava zero dependência em tempo de execução. A emenda registrada na seção
2 do `requirements.md` abre esta exceção, e apenas esta.

## 1. Requisição

```
GET https://api.github.com/repos/{dono}/{repositorio}/compare/{base}...{cabeca}
```

| Parte | Valor | Origem |
|---|---|---|
| `{dono}/{repositorio}` | `iago-leal/reversa-views` | Constante `ORIGIN_REPOSITORY` do carimbo da construção |
| `{base}` | O commit de que o pacote instalado foi construído | Constante `BUILT_FROM_COMMIT` |
| `{cabeca}` | O ramo padrão do repositório | Constante da construção, hoje `master` |

Cabeçalhos enviados:

| Cabeçalho | Valor | Por quê |
|---|---|---|
| `Accept` | `application/vnd.github+json` | Fixa a forma da resposta, que de outro modo depende de negociação |
| `User-Agent` | `reversa-views/<versão>` | Exigido pelo serviço; carrega a versão da extensão e nada mais |
| `If-None-Match` | Etiqueta da resposta anterior, quando houver | Opcional, avaliado na implementação: resposta sem novidade volta 304 e não consome cota |

**Nada mais é enviado.** Sem autenticação, sem corpo, sem cookie, sem identificador de máquina, sem
nome de workspace, sem qualquer dado sobre o que foi lido do disco. O cabeçalho de agente é o único
que carrega informação nossa, e o que ele carrega é o número que o painel já mostra na tela.

## 2. Resposta esperada

Corpo em JSON, do qual três campos são lidos e o resto é ignorado:

| Campo | Tipo | Uso |
|---|---|---|
| `status` | `'identical' \| 'ahead' \| 'behind' \| 'diverged'` | Escolhe a variante do desfecho |
| `ahead_by` | inteiro | Quantos commits a cabeça está à frente da base |
| `behind_by` | inteiro | Quantos commits a cabeça está atrás da base |

As distâncias são medidas **em relação à base**, confirmado na documentação oficial em 2026-09-09.
Com a base no commit de construção e a cabeça no ramo padrão, a tradução é esta:

| `status` | Desfecho | Campo lido |
|---|---|---|
| `identical` | `em-dia` | nenhum |
| `ahead` | `atrasada` | `ahead_by` vira `commits` |
| `behind` | `em-dia` | nenhum: a cabeça atrás da base significa construção à frente da origem, isto é, commits locais nunca enviados |
| `diverged` | `divergente` | `ahead_by` vira `commits` |

## 3. Erros e desfechos de falha

| Situação | Código | Desfecho | O que o painel diz |
|---|---|---|---|
| Commit de construção desconhecido pela origem | 404 | `commit-desconhecido` | Que a origem não conhece o commit desta construção |
| Cota de requisições anônimas esgotada | 403 ou 429, com cabeçalho de limite | `impossivel`, causa `limite-de-taxa` | Que a consulta não foi possível por limite do serviço |
| Sem novidade, com requisição condicional | 304 | Repete o desfecho anterior | O mesmo de antes |
| Falha de transporte, DNS, TLS ou recusa de conexão | nenhum | `impossivel`, causa `sem-rede` | Que não foi possível falar com a origem |
| Tempo limite estourado | nenhum | `impossivel`, causa `tempo-esgotado` | Que a origem não respondeu a tempo |
| Corpo ilegível, campos ausentes ou de tipo inesperado | 200 | `impossivel`, causa `resposta-inesperada` | Que a resposta não foi compreendida |
| Qualquer outro código | 5xx e demais | `impossivel`, causa `resposta-inesperada` | O mesmo |

Nenhuma dessas situações interrompe o painel: a leitura do processo já chegou e está desenhada
quando a consulta acontece.

## 4. Tempo limite, idempotência e repetição

| Propriedade | Valor | Justificativa |
|---|---|---|
| Tempo limite | 5 s, com destruição explícita da requisição | RF-11; o módulo nativo não impõe nenhum por conta própria |
| Idempotência | Total. É leitura, e repetir não muda nada na origem | Permite abortar sem consequência |
| Repetição automática | Nenhuma | RN-09 e o princípio de erro barulhento: falha uma vez, nomeia a causa, devolve o controle |
| Frequência | No máximo uma por leitura do processo | O gesto de reler é o que a repete; sem relógio próprio, não há tarefa de fundo a gerir |
| Tamanho de resposta aceito | Teto declarado, com a leitura abandonada acima dele | Mesmo hábito da camada de leitura, que abandona arquivo acima do teto |

## 5. O que este contrato não permite

- Não há requisição de escrita, em rota alguma. O módulo expõe leitura e nada mais.
- O endereço não vem de argumento, de variável de ambiente nem de arquivo do workspace: vem da
  constante embutida na construção. Um workspace hostil não redireciona a consulta.
- O módulo não segue redirecionamento para outro domínio.
- Sem origem conhecida na constante, isto é, repositório sem remoto ou com remoto de outro serviço,
  a consulta não acontece e o desfecho é `desligada`.

## 6. Como se testa sem rede

A suíte exercita o intérprete puro com respostas gravadas, uma por linha da tabela da seção 3, e a
porta de rede com um duplo. Nenhum teste abre conexão, pela mesma razão que nenhum teste abre
navegador: suíte que depende de rede falha por motivo alheio ao código e ensina a ignorar vermelho.
