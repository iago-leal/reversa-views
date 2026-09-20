# Onboarding: conferir as equivalências de checkpoint

> Identificador: `012-equivalencias-de-checkpoint`
> Data: `2026-09-20`

Passo a passo para quem vai exercitar a feature pela primeira vez, do zero, e conferir com os
próprios olhos cada promessa que o `requirements.md` faz. Os tempos são os medidos nesta máquina em
2026-09-20 e servem de referência, não de garantia.

## 0. Antes de tudo: o que precisa estar no lugar

```bash
cd ~/dev/reversa-views
npm install
npm run build
```

Para os passos 3 e 4, e **somente** para eles, o motor local precisa estar no ar:

```bash
ollama list                                   # os modelos instalados
curl -s http://localhost:11434/api/tags       # o servidor respondendo
```

Se o motor não estiver disponível, pule para o passo 6: tudo o que a extensão faz é conferível sem
ele, e essa é uma das promessas a conferir.

## 1. A linha de base, antes de qualquer aprovação

```bash
npm test
```

Com o mapa vazio, a suíte inteira passa, inclusive as suítes da feature 011 sem uma linha reescrita.
É o RF-15, e é o ponto de controle que separa mudança de estrutura de mudança de comportamento.

## 2. Ver o problema com os próprios olhos

```bash
node ./scripts/preview.js --workspace=$HOME/dev/med-reversa
```

Abra o endereço impresso e olhe a seção Descoberta. Antes de qualquer aprovação, os sete checkpoints
aparecem em conclusão não declarada, e o cabeçalho acusa sete anomalias. É o estado que a feature
011 produz, e é o ponto de partida.

## 3. Aprender

```bash
npm run aprender:equivalencias -- --raiz=$HOME/dev
```

Cerca de 3 s por par inédito. A primeira rodada sobre `~/dev` tem sete pares e três entradas que não
parecem agentes, portanto algo em torno de meio minuto.

Ao fim, o comando imprime onde escreveu a proposta e o que não conseguiu classificar. Confira agora
a promessa mais importante desta etapa:

```bash
git status --short src/domain/equivalencias.ts
```

A resposta tem de ser vazia. O aprendizado **não** escreve no mapa, e é isso que separa esta feature
de um reconhecimento automático.

## 4. Aprovar

Abra a proposta no editor. Cada item traz o par, o que o motor disse e os projetos onde ele foi
visto. Marque as caixas do que você aprova, e deixe desmarcado o que não convence.

Sugestão para esta primeira passada: aprove `status: "concluido"`, `done: true` e `concluido_em`,
que são inequívocos, e **pense duas vezes** em `status: "success"`, que diz sucesso sem dizer de
quê. Deixá-lo desmarcado é uma resposta legítima, e o projeto `scrapping` continuará acusando
conclusão não declarada até que você decida o contrário.

## 5. Promover

```bash
npm run promover:equivalencias
git diff src/domain/equivalencias.ts
```

O diff mostra exatamente o que você marcou, com a data de hoje e a evidência. Nada além disso entra.
Se algum par já estivesse no mapa com leitura diferente, o comando teria recusado, nomeando o
conflito, em vez de sobrescrever.

## 6. Conferir o efeito

```bash
npm run build
node ./scripts/preview.js --workspace=$HOME/dev/med-reversa
```

Na seção Descoberta, os seis checkpoints com `status: "concluido"` agora aparecem concluídos, e cada
um diz de onde veio o reconhecimento: o campo, o valor e o fato de estarem fora do esquema. Nenhum
deles mostra instante, porque `at` registra quando algo aconteceu e não declara fim de trabalho.

A anomalia que sobra é a do `plano_aprovado`, e ela deve sobrar: enquanto ele não for aprovado como
registro que não é agente, o painel continua cobrando dele uma conclusão que ele nunca declarou.

## 7. Conferir a quarta situação

```bash
node ./scripts/estragar-descoberta.js --caso=falha
```

O auxiliar copia um workspace para pasta temporária do sistema, reescreve só o `state.json` da cópia
e imprime o caminho. Aponte o preview para ele e confira que o checkpoint aparece como falho, em
texto próprio, e não como concluído nem como não declarado. Nenhum arquivo do seu projeto é tocado
em momento algum.

## 8. Conferir as promessas negativas

São as que mais importam, porque são as que ninguém lembra de testar.

```bash
# a suíte passa com o motor desligado
pkill ollama || true
npm test

# a extensão não fala com rede nem escreve nem executa
grep -rn "child_process\|fetch(\|http\." src/domain src/host src/webview | grep -v "\.spec\."

# o mapa viaja no pacote, e nada mais entrou junto
npm run empacotar
npx vsce ls 2>/dev/null | grep equivalencias
```

A suíte tem de passar inteira com o motor fora do ar. A busca não deve achar cliente de rede,
execução de processo nem escrita nas três pastas da extensão. E `out/domain/equivalencias.js` tem de
aparecer na listagem do pacote, sem nenhum caminho novo fora do previsto por
`scripts/conteudo-esperado.js`.

## 9. Desfazer, se quiser voltar ao início

```bash
git checkout src/domain/equivalencias.ts
npm run build
```

O mapa volta ao que era, e com ele o comportamento. Nenhum `state.json` de projeto algum foi tocado
em passo nenhum deste roteiro, e é por isso que desfazer é só isto.
