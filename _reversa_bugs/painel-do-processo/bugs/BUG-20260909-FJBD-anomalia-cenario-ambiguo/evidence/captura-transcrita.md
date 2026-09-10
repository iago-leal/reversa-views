# Captura de tela enviada pelo usuário (transcrição)

A imagem chegou anexada à mensagem do chat e não pôde ser gravada como arquivo a partir da
conversa; o que segue é a transcrição fiel do que ela mostra. Painel da extensão, tema escuro,
cortado no topo (a primeira linha aparece pela metade).

```
Reversa: 1.3.3                       (linha parcialmente cortada no topo)
Modelo herdado: 420305d
Raiz observada: /Users/iagoleal/dev/reversa-views
Lido em: 09/09/2026 19:36 (Brasília)

[faixa âmbar] Leitura degradada: 1 anomalias, 0 recusas, 0 truncamentos.

[Reler o processo] [Expandir tudo] [Recolher tudo] [Resumir em documento] [Copiar o resumo]
[verde] Resumo copiado para a área de transferência.

Ciclo forward
Decomposição da feature ativa  44          (cartão com borda âmbar, em foco)
44 de 44 ações fechadas.

T001 fechada
Acrescentar o campo `declared` a `DisplayPreferences` e a `EMPTY_PREFERENCES`, com a prosa
que diz por que a lista vazia deixou de bastar (D-01, RF-05)
Fase 1, Preparação
09/09/2026 18:42 (Brasília)
src/webview/domain/types.ts

T002 fechada
Levar os nomes de seção de seis para oito, inserindo `decomposition` e `history` logo após
`forward`, derivar dali a lista dos sete recolhíveis, que é o conjunto sem `blocking`, e
acrescentar `history` ao padrão inicial de recolhimento (D-04, D-05, RF-18)
Fase 1, Preparação
09/09/2026 18:42 (Brasília)
src/webview/domain/types.ts

T003 fechada
Declarar num módulo local o vocabulário e as formas da decomposição e do histórico, conforme
as seções 4.1 e 4.2 do `data-delta.md`, incluindo os dois eixos separados de situação e marca
(D-07, D-19)
Fase 1, Preparação
09/09/2026 18:42 (Brasília)
src/domain/types.ts

T004 fechada
Declarar num módulo próprio os dois limites novos do tempo de execução, cinquenta pastas de
feature por leitura e ...                    (corta na borda inferior)
```

## O que a captura evidencia

1. Entre "Modelo herdado" e "Raiz observada" não há os itens "Extensão" e "Construída de", que
   a feature 007 acrescentou ao cabeçalho (RF-17). Abaixo da linha de integridade não há a linha
   do desfecho da consulta à origem (RF-10). O painel capturado é anterior à feature 007.
2. A leitura foi feita às 19:36, com a feature 006 ativa (44 ações, T001 de 18:42 é da 006), e já
   contava uma anomalia. A anomalia se repete hoje com a 007 ativa, pelo mesmo motivo.
3. "1 anomalias": a frase do cabeçalho não flexiona o número. Observação do registrador, não
   relatada pelo usuário; anotada em Agent Notes do bug da anomalia.
