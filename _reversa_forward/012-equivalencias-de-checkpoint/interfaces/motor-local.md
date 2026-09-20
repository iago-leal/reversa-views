# Interface: motor de inferência local

> Identificador: `012-equivalencias-de-checkpoint`
> Data: `2026-09-20`
> Tipo: HTTP em `localhost`
> Consumido por: `scripts/aprender-equivalencias.js`, e por nada mais

## 1. Quem fala com isto, e quem nunca fala

Fala com isto **apenas** a ferramenta de aprendizado, que é um script de manutenção fora do build e
fora do pacote. Não falam, e não podem passar a falar:

- a extensão, em qualquer dos seus módulos de domínio, host ou tela;
- o promotor, que lê a proposta marcada e escreve o mapa sem consultar modelo algum;
- a suíte, que substitui o transporte por um duplo.

Essa separação é o que mantém verdadeira, ao pé da letra, a frase da seção 12 da spec da leitura:
nada é transmitido, armazenado fora da memória do processo, nem enviado a serviço algum. O motor é
um serviço, ainda que local; a extensão continua sem conhecê-lo.

## 2. Request

Duas passagens, e a ordem entre elas é o que separa uma proposta que se lê de uma que se descarta.
A medição da primeira rodada real, em 2026-09-20 sobre os 64 projetos, mostrou as duas falhas que
a ordem corrige:

| Como se pergunta | O que veio | O que está errado |
|---|---|---|
| Sempre **sem** campo em foco | 4 pares propostos | Perde 3 dos 7 vocabulários: o motor responde pelo campo mais evidente do checkpoint, e o resto cai como resposta sobre outra coisa |
| Sempre **com** campo em foco | 39 pares propostos | 32 deles são ruído: perguntado se `verde: 569` fala de estado, o motor concorda |
| Sem foco, depois com foco nos campos eleitos | 6 pares propostos | É o que está implementado |

Na **primeira passagem**, cada checkpoint distinto é perguntado uma vez, sem campo em foco: o motor
aponta qual dos campos fala de estado, e essa escolha é o filtro. Na **segunda**, o foco entra, mas
só sobre campos que a primeira já elegeu como campos de estado, o que recupera o segundo valor de um
mesmo campo, como `status: "success"` ao lado de `status: "concluido"`, sem reabrir a porta para os
campos de conteúdo. Agrupar por checkpoint na primeira passagem também encurtou a rodada real de
4 min 20 s para 1 min 13 s.

O endereço é o do motor no próprio computador, com o modelo declarado por argumento e um padrão
conhecido.

| Parâmetro | Valor | Razão |
|---|---|---|
| temperatura | `0` | A mesma entrada tem de produzir a mesma sugestão; proposta que muda a cada rodada não se revisa |
| semente | fixa | Mesma razão, e permite reproduzir uma proposta antiga |
| formato | JSON | A resposta é consumida por programa, e texto livre exigiria extração frágil |
| tempo-limite | 60 s por par | Medido em cerca de 3 s por par; sessenta é folga de vinte vezes, e ainda assim finito |

A carga da primeira passagem é o checkpoint **elidido**. A da segunda é
`{"campo_em_foco": "<nome>", "checkpoint": {...}}`, com o mesmo checkpoint elidido dentro: o
contexto continua indo junto, porque `status` ao lado de `modules_pending` diz mais do que `status`
sozinho. Em nenhuma das duas o checkpoint vai como está no disco:

| No disco | Enviado |
|---|---|
| `status: "concluido"` | `status: "concluido"` |
| `at: "2026-09-12T09:02:59"` | `at: "2026-09-12T09:02:59"` |
| `achados: ["6 abas (3 ocultas)...", ...]` | `achados: "<lista de 5>"` |
| `scratchpad: "/private/tmp/claude-501/..."` | `scratchpad: "<caminho>"` |
| `omissao_deliberada: "Aritmética do código de ativação..."` | `omissao_deliberada: "<texto de 132 caracteres>"` |

A regra: chaves preservadas sempre, escalares curtos preservados, e listas, textos longos e caminhos
de sistema substituídos por marcador de forma. O classificador precisa ver o nome do campo e o valor
que declara estado; não precisa ver, e não vê, o conteúdo do trabalho.

A elisão é função pura testada sobre os checkpoints reais medidos, e essa é a diferença entre
requisito de privacidade e intenção de privacidade.

## 3. Response

```json
{"campo": "status", "valor": "concluido", "leitura": "concluido", "razao": "campo de status"}
```

| Campo | Domínio |
|---|---|
| `campo` | nome de campo presente no checkpoint enviado, ou nulo |
| `valor` | o valor exato daquele campo, ou nulo |
| `leitura` | `concluido`, `falhou`, `em-andamento` ou `nao-e-sinal` |
| `razao` | texto curto, que vai para a proposta como "o motor disse" |

Toda resposta é **sugestão**, e nenhuma chega ao mapa sem aprovação. Resposta cujo `campo` não
existe no checkpoint enviado é descartada com aviso: o motor inventou, e inventar é motivo de
descarte, não de correção automática.

## 4. Erros

| Situação | Comportamento |
|---|---|
| Servidor fora do ar | O comando termina com a causa nomeada e não escreve proposta pela metade |
| Modelo inexistente no motor | Mesma coisa, nomeando o modelo pedido |
| Resposta que não é JSON válido | O par entra na lista dos não classificados, e a rodada segue |
| Resposta com `campo` ausente do checkpoint | Descartada, e o par entra na lista dos não classificados |
| Resposta sobre campo diferente do campo em foco | Descartada na segunda passagem: é resposta sobre outra coisa, e aproveitá-la escreveria no mapa um par que ninguém julgou |
| Tempo-limite estourado | O par entra na lista dos não classificados, e a rodada segue |

Não há retentativa automática. É decisão registrada no RNF de resiliência: numa ferramenta conduzida
por uma pessoa, repetir a rodada é mais barato e muito mais legível do que uma retentativa silenciosa
que esconde quantas vezes o motor falhou.

## 5. Idempotência

Do lado do motor não há efeito a repetir: a chamada é uma classificação, sem estado.

Do lado do aprendizado, a idempotência que importa é outra, e é conferível: rodar duas vezes seguidas
sem projeto novo produz proposta vazia na segunda, porque os pares já decididos são pulados pelo
RF-13. E qualquer número de rodadas deixa `src/domain/equivalencias.ts` idêntico byte a byte, porque
o aprendizado não escreve o mapa em rodada nenhuma.

## 6. Substituição na suíte

O transporte é injetável, e a suíte passa um duplo que devolve respostas fixas, inclusive as
malformadas e as que inventam campo. Nenhum teste desta feature exige motor no ar, e o critério de
pronto inclui rodar a suíte inteira com o motor desligado.

A ordem das duas passagens tem suíte própria, `tests/equivalencias-aprendizado.spec.ts`, com o
classificador inteiro substituído: um duplo que aponta `status` quando perguntado sem foco e
concorda com qualquer campo quando perguntado com foco reproduz exatamente o viés medido, e os
casos fixam que o campo de conteúdo não chega a virar item com caixa.
