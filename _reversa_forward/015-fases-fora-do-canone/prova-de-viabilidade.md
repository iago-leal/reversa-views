# Prova de viabilidade do motor local para os nomes de etapa

> Feature: `015-fases-fora-do-canone`, RF-13
> Executada em 2026-09-21, nesta máquina, contra o motor local da 012 (`http://localhost:11434`),
> com temperatura zero, semente 7 e resposta em JSON. Antecede o `/reversa-plan`, por decisão da
> sessão de esclarecimento de 2026-09-21, pergunta 3.

## 1. O que se queria saber

Se o motor local consegue, sobre um nome gravado em `phase`, `completed` ou `pending`, dizer qual
das três coisas ele é: etapa legítima fora do cânone, a mesma etapa que outra já vista, ou valor que
não é fase. O vocabulário de três respostas era o ponto de partida do RF-13, e não o resultado.

## 2. Os casos

Oito nomes reais, que são todos os nomes de etapa medidos em `~/dev`, já sem o sufixo numérico
(RN-03): `reconciliacao`, `contrato-insumo`, `decisoes-autor`, `verificacao-regressao`,
`re-extracao`, `documentacao`, `regressao` e `verificacao-de-regressao`. Os vizinhos enviados são os
da lista real de cada projeto.

Seis negativos construídos, com forma de identificador, porque a prosa (RN-07) e o erro de grafia
(RN-12) nunca chegam ao motor: `claude-code`, `2026-09-20`, `true`, `v1.3.3`, `iago` e `state.json`
(este só a partir da rodada 3).

Para a comparação, nove pares: os três que o requirements supõe serem a mesma etapa (`regressao`,
`verificacao-regressao` e `verificacao-de-regressao`, dois a dois) e seis de trabalhos diferentes,
entre eles o par de palavras parecidas `re-extracao` e `regressao`.

## 3. Placar

| Rodada | Desenho | Modelo | Resultado | Tempo |
|---|---|---|---|---|
| 1 | uma pergunta, três respostas (`etapa-legitima`, `mesma-etapa`, `nao-e-fase`), com a lista das etapas já vistas | `qwen2.5:7b` | 6 de 14 | 62,2 s |
| 2 | uma pergunta, duas respostas (`etapa`, `nao-e-fase`), sem orientação para a dúvida | `qwen2.5:7b` | 10 de 14 | 36,0 s |
| 3A | pergunta de natureza, duas respostas, com "na dúvida, etapa" e a lista fechada do que não é fase | `qwen2.5:7b` | **14 de 14** | 35,5 s |
| 3B | pergunta de comparação, par a par, `mesma` ou `diferentes` | `qwen2.5:7b` | 7 de 9 | 26,0 s |
| 3A | idem | `gemma4:latest` | 13 de 14 | 60,4 s |
| 3B | idem | `gemma4:latest` | 7 de 9 | 34,8 s |

## 4. O que os erros ensinam

**A pergunta única de três respostas não é viável.** Na rodada 1 o motor acertou os cinco negativos
e só um dos nove positivos. Com a lista das etapas já vistas na mensagem, ele passou a responder
`nao-e-fase` para quase todo nome que não estivesse na lista, e em `re-extracao` respondeu
`mesma-etapa` apontando para o próprio nome. São dois julgamentos de natureza diferente, o que o
valor é e com quem ele se parece, e o modelo de 7 B não os separa dentro de uma resposta só. É o
mesmo gênero de achado da 012, em que o vocabulário errado, e não o modelo, produzia o erro.

**A pergunta de natureza funciona quando a classe negativa é fechada.** A rodada 2 errou quatro
positivos porque o nome sozinho não prova que é etapa. A rodada 3A inverte o ônus: `nao-e-fase` só
para data, versão, booleano, arquivo, ferramenta ou pessoa, e `etapa` para todo o resto. Acertou os
catorze. O `gemma4` errou `iago`, e é mais lento; o modelo da 012 continua o melhor.

**A comparação erra para o lado seguro.** Os dois modelos cometeram os mesmos dois erros: não
juntaram `regressao` com `verificacao-regressao` nem com `verificacao-de-regressao`, com a razão de
que um nome é mais genérico que o outro. É leitura defensável, e o próprio requirements só diz que
as três grafias "parecem" uma etapa. O que importa é o sentido do erro: nos seis pares de trabalhos
diferentes não houve nenhum falso `mesma`, nem no par de palavras parecidas. Como a segunda rodada
de esclarecimento fixou que cada nome aprovado é registro independente e que o agrupamento é só
apresentação da proposta (RN-02), um agrupamento perdido custa uma caixa a mais para marcar, e um
agrupamento falso, que seria o erro caro, não apareceu.

## 5. O desenho que a prova sustenta

Duas perguntas, cada uma com duas respostas, em vez de uma pergunta com três:

1. **Natureza**, uma vez por nome candidato: `etapa` ou `nao-e-fase`. Resposta sobre outro nome é
   descartada, como na 012.
2. **Comparação**, uma vez por par de nomes julgados `etapa` (entre si e contra as etapas já
   aprovadas no mapa): `mesma` ou `diferentes`. Resposta que não repita os dois nomes é descartada.
   O grupo da proposta é o fecho dos pares `mesma`.

Custo medido: cerca de 2,5 s por pergunta de natureza e 2,9 s por par. Com os oito nomes de hoje,
são 8 perguntas e 28 pares, perto de 100 s no total, dentro da ordem de grandeza da 012.

Os enunciados que produziram o placar da rodada 3, para o plano partir deles:

```text
[natureza]
Você examina um valor encontrado numa lista de fases de um arquivo .reversa/state.json.
As fases canônicas são: reconhecimento, escavacao, interpretacao, geracao, revisao. Projetos também
gravam ali etapas de trabalho fora do cânone, com nomes livres em português (um substantivo de ação
ou de entrega, às vezes composto com hífen).
A mensagem traz {"nome_em_foco": "<valor>", "vizinhos": [...]}.
Responda "nao-e-fase" SOMENTE se o valor for claramente de outra natureza: data, número de versão,
booleano, nome de arquivo, nome de ferramenta ou de produto, nome de pessoa.
Em todos os outros casos, responda "etapa". Na dúvida, "etapa".
Responda SOMENTE com JSON: {"nome": "<nome em foco>", "leitura": "etapa"|"nao-e-fase", "razao": "<max 12 palavras>"}

[comparação]
Você compara dois nomes de etapa de trabalho gravados por projetos diferentes, em português.
A mensagem traz {"a": "<nome>", "b": "<nome>"}.
Responda "mesma" SOMENTE se os dois nomes designam o mesmo trabalho com grafias diferentes (um
abrevia o outro, ou só muda uma preposição). Trabalhos diferentes são "diferentes", mesmo que as
palavras se pareçam.
Responda SOMENTE com JSON: {"a": "<a>", "b": "<b>", "leitura": "mesma"|"diferentes", "razao": "<max 12 palavras>"}
```

## 6. O que a prova não prova

- Mede catorze nomes e nove pares, num modelo, numa máquina. Não estabelece taxa de acerto sobre a
  cauda, e o desenho não depende disso: a aprovação humana existe porque a resposta é sugestão.
- **A razão do `qwen2.5:7b` na pergunta de natureza não presta.** O veredito veio certo nos catorze
  casos, mas em sete dos oito positivos a justificativa foi "dentro do cânone" ou "fase canônica",
  que é falsa. O RF-14 manda a proposta mostrar a razão do motor; o plano precisa decidir se mostra
  essa razão, se a omite na pergunta de natureza ou se a troca pela evidência medida. Na comparação
  as razões são legíveis ("menor grafia", "trabalhos distintos").
- A pergunta de natureza, com a classe negativa fechada e "na dúvida, etapa", faz pouco mais do que
  um filtro determinístico de datas, versões e booleanos faria. O que o motor acrescenta de próprio
  é reconhecer nome de pessoa, de ferramenta e de arquivo, e a comparação entre grafias.
- O número de pares cresce com o quadrado dos nomes. Com oito, são 28; com trinta, 435, perto de
  vinte minutos. O plano deve prever o corte, e o mais simples é comparar só pares que partilhem ao
  menos uma palavra, o que teria preservado todos os acertos e todos os erros desta prova.
