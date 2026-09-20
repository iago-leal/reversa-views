# Onboarding: estado terminal da extração e conclusão dos checkpoints

> Identificador: `011-estado-terminal-e-checkpoints`
> Data: `2026-09-20`
> Roadmap: `_reversa_forward/011-estado-terminal-e-checkpoints/roadmap.md`

Este é o roteiro de quem vai conferir a feature com as próprias mãos. Ele parte do pressuposto de
que nada do que se lê aqui escreve em projeto alheio: o preview não escreve em lugar nenhum, e os
auxiliares `estragar:*` copiam para pasta temporária do sistema antes de mexer em qualquer coisa.

## 1. Preparar

```bash
cd ~/dev/reversa-views
npm run build
npm test
```

O `build` roda a conferência da herança antes de compilar, e é ela que deve falhar se alguma linha
de `src/heranca/` tiver sido tocada. Nesta feature, não deve ter sido: a conferência passar é parte
do critério de pronto.

## 2. O caso real, que é o motivo da feature

O `med-reversa` é uma extração terminada, e é onde os dois defeitos aparecem juntos.

```bash
npm run preview -- --workspace=/Users/iagoleal/dev/med-reversa
```

**Antes da feature**, na construção 0.10.1, o painel mostra uma anomalia
`.reversa/state.json · fase-desconhecida · "concluido"` e sete checkpoints com a palavra
"em andamento", numa extração encerrada.

**Depois da feature**, o mesmo comando deve mostrar:

1. A seção Descoberta abrindo com a frase de encerramento, e o valor bruto `concluido` ao lado.
2. As cinco fases como concluídas, na ordem do framework, sem sexta fase inventada.
3. Os sete checkpoints com o terceiro estado, dizendo que a conclusão não foi declarada no campo
   canônico, e nenhum deles exibindo instante como se fosse de conclusão.
4. A seção de anomalias com sete itens, um por checkpoint, nomeando o agente e o campo ausente, e
   **sem** a anomalia de fase.
5. O cabeçalho declarando a leitura degradada por causa das sete, e a contagem batendo com o que a
   seção desenha.

O ponto 5 é o que mais vale conferir com atenção: cabeçalho e seção discordarem é o defeito que a
composição única existe para impedir.

## 3. Este repositório não muda

```bash
npm run preview
```

O `reversa-views` tem `phase` nulo e nenhum checkpoint, e por isso é o melhor controle que existe:
o painel deve sair idêntico ao de antes da feature, sem frase de encerramento e sem estado novo em
lugar nenhum. Vale repetir com um projeto de formato canônico, por exemplo `~/dev/preceptor-ia`,
que tem `phase` em `revisao` e checkpoints com `completed_at`: ali a única diferença aceitável é
nenhuma.

## 4. Os casos que nenhum projeto saudável produz

Quatro estados precisam ser vistos, e três deles não existem em disco por aí. O auxiliar desta
feature copia um workspace para pasta temporária e reescreve o `.reversa/state.json` da cópia:

```bash
npm run preview -- --workspace=$(npm run --silent estragar:descoberta -- --caso=fase-estranha)
npm run preview -- --workspace=$(npm run --silent estragar:descoberta -- --caso=parcial)
npm run preview -- --workspace=$(npm run --silent estragar:descoberta -- --caso=terminal-e-estranha)
npm run preview -- --workspace=$(npm run --silent estragar:descoberta -- --caso=saidas-nao-canonicas)
```

| Caso | O que deve aparecer |
|---|---|
| `fase-estranha` | Fase que não é canônica nem de encerramento: as cinco fases desenhadas, nenhuma frase de encerramento, e a anomalia `fase-desconhecida` **continuando** na tela |
| `parcial` | Checkpoint sem `completed_at` e com `modules_pending`: a palavra "em andamento", como sempre, e **nenhuma** anomalia por isso |
| `terminal-e-estranha` | Fase terminal e, ao mesmo tempo, um nome estranho em `completed`: a frase de encerramento aparece, e sobra exatamente uma anomalia de fase, a do nome estranho |
| `saidas-nao-canonicas` | Checkpoint sem `files` e com campos de lista de textos: o painel nomeia os campos sem chamá-los de saídas, e a lista de arquivos continua vazia |

O caso `terminal-e-estranha` é o mais importante dos quatro, porque é ele que prova que a absorção
casa a tripla inteira e não só o código da anomalia.

## 5. Refazer a medição que sustentou as decisões

O roadmap e a investigação apoiam-se numa medição dos projetos com Reversa instalado em `~/dev`. Ela
é leitura pura, e pode ser refeita a qualquer momento:

```bash
cd ~/dev && python3 - <<'PY'
import json, glob
PH = {'reconhecimento','escavacao','interpretacao','geracao','revisao'}
fora, com_campo, sem_campo = 0, 0, 0
for f in glob.glob('*/.reversa/state.json'):
    try: d = json.load(open(f, encoding='utf-8'))
    except Exception: continue
    nomes = [n for n in (d.get('completed') or []) + (d.get('pending') or []) if n not in PH]
    ph = d.get('phase')
    if ph is not None and ph not in PH: nomes.append(ph)
    if nomes: fora += 1
    for v in (d.get('checkpoints') or {}).values():
        if isinstance(v, dict):
            if 'completed_at' in v: com_campo += 1
            else: sem_campo += 1
print(f'projetos com fase fora do canonico: {fora}')
print(f'checkpoints com completed_at: {com_campo}; sem: {sem_campo}')
PY
```

Em 2026-09-20 o resultado foi: 19 projetos com fase fora do canônico, 203 checkpoints com
`completed_at` e 26 sem. Se os números mudarem muito numa releitura futura, a premissa da feature
mudou junto, e vale reabrir a decisão de vocabulário.

## 6. Tela nova contra host antigo

O campo do eixo é opcional, e a webview precisa continuar desenhando sem ele. A suíte cobre o caso,
e a conferência manual é a de sempre: instalar a construção nova e abrir um workspace, depois
remover o campo da carga num teste de mesa. Se o painel voltar ao desenho anterior sem quebrar,
está correto.

## 7. Instalar a construção no editor

```bash
npm run empacotar
npm run atualizar -- --aplicar
```

Depois, recarregar a janela do VSCode e abrir o painel na barra lateral. A faixa de procedência no
cabeçalho deve anunciar a versão nova.

## 8. Resumo consultável

| Quero ver | Comando |
|---|---|
| O caso real completo | `npm run preview -- --workspace=/Users/iagoleal/dev/med-reversa` |
| Que nada regrediu | `npm run preview` e `npm run preview -- --workspace=/Users/iagoleal/dev/preceptor-ia` |
| Os quatro casos sintéticos | `npm run --silent estragar:descoberta -- --caso=<nome>` |
| A herança intocada | `npm run check:heranca:local` |
| Tudo verde | `npm test` |

## 9. Registro de conferências

Uma linha por conferência, preenchida à mão por quem conferiu. As entradas em branco são o que o
painel mostra como pendente, desde a feature 010.

| # | Conferência | Como | Resultado | Data |
|---|-------------|------|-----------|------|
| 1 | O `med-reversa` sai com a frase de encerramento e sem anomalia de fase | seção 2 | | |
| 2 | Os sete checkpoints saem em conclusão não declarada, com sete anomalias | seção 2 | | |
| 3 | Cabeçalho e seção de anomalias concordam na contagem | seção 2 | | |
| 4 | Este repositório sai idêntico ao de antes | seção 3 | | |
| 5 | Um projeto canônico sai idêntico ao de antes | seção 3 | | |
| 6 | Fase estranha continua virando anomalia | seção 4 | | |
| 7 | Checkpoint parcial continua em andamento, sem anomalia | seção 4 | | |
| 8 | Fase terminal com nome estranho deixa exatamente uma anomalia | seção 4 | | |
| 9 | Campos de lista são nomeados sem virarem saídas | seção 4 | | |
| 10 | A herança não foi tocada | seção 8 | | |
| 11 | A construção instalada mostra o comportamento novo | seção 7 | | |
