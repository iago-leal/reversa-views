# Onboarding: conferir o botão do prompt de correção

> Identificador: `013-botao-do-prompt`
> Data: `2026-09-20`

Passo a passo para quem vai exercitar a feature pela primeira vez e conferir, com os próprios olhos,
cada promessa que o `requirements.md` faz. A ordem não é arbitrária: os três primeiros passos
estabelecem a linha de base e mostram o defeito antes de qualquer botão, e os últimos conferem as
promessas negativas, que são as que ninguém vê funcionando.

## 0. Antes de tudo

```bash
cd ~/dev/reversa-views
npm install
npm run build
```

Nada aqui precisa de rede, de motor local nem de chave de serviço, e essa é a primeira diferença em
relação ao onboarding da 012. Se algum passo pedir qualquer uma dessas coisas, o passo está errado.

## 1. A linha de base

```bash
npm test
```

A suíte inteira precisa passar antes de qualquer conferência manual. Anote a contagem de casos: ela
serve para comparar com a do fim, depois das suítes novas.

## 2. Ver o defeito antes do botão

Os três casos moram em três projetos distintos, e o painel observa uma raiz por leitura. Abra o
primeiro deles:

```bash
node ./scripts/preview.js --workspace=$HOME/dev/ps-iagerasmlk
```

Na seção Descoberta, o checkpoint `scout` aparece em conclusão não declarada, e a tela **não** diz qual
campo causou o desvio. Esse é o problema que a feature resolve, e é bom vê-lo antes de ver a solução:
o campo é `timestamp`, e sem a forma elidida ele não chega ao painel por via alguma.

Repita com os outros dois, para reconhecer as três variedades:

```bash
node ./scripts/preview.js --workspace=$HOME/dev/transc_audio_mlx   # modules_pending vazio
node ./scripts/preview.js --workspace="$HOME/dev/TECH+"            # contadores de progresso
```

## 3. O botão, no caso mais simples

Com o preview aberto em `ps-iagerasmlk`, clique em **copiar o prompt de correção**, no cabeçalho, ao
lado dos dois botões do resumo. Confira, na ordem:

1. O cabeçalho confirma a cópia em uma linha, e a linha diz que foi o **prompt** que foi copiado, não o
   resumo. Clique depois em copiar o resumo e confira que a confirmação troca de texto: é a decisão
   D-06 do roadmap, e um booleano só teria dito a frase errada.
2. Cole o texto num editor. Ele nomeia a raiz observada, declara que `completed_at` e `files` são o par
   que declara conclusão, traz um bloco com `scout` e, dentro dele, `timestamp` com o valor do disco e
   `files` como marcador de forma, dizendo que são três e não quais.
3. Os quatro pedidos aparecem numerados, na ordem do contrato, e o quarto termina proibindo aplicar a
   correção sem revisão.
4. As quatro proibições fecham o texto.

Abra também como documento, pelo segundo destino, e confira que o texto é o mesmo. Se os dois
diferirem, o determinismo foi quebrado, e é defeito de cabeça e não de detalhe.

## 4. O caso que não tem campo fora do esquema

```bash
node ./scripts/preview.js --workspace=$HOME/dev/transc_audio_mlx
```

Copie o prompt e confira que o bloco do `archaeologist` diz o que precisa dizer sem ter campo desviante
a apontar: `modules_pending` está presente e vazio, e é isso que o texto precisa deixar claro, porque
ausência de pendência não é afirmação de fim. É o caso mais sutil dos três e o melhor teste do texto.

## 5. O caso que talvez não seja agente

```bash
node ./scripts/preview.js --workspace="$HOME/dev/TECH+"
```

O bloco do `redator_progress` traz `items_done` e `items_total`, e por isso permite ao harness a
pergunta que vem antes da correção: isto é checkpoint de agente ou registro de progresso? Confira que os
contadores estão no texto. Sem eles, a pergunta não se sustenta, e era por eles que o campo novo existe.

## 6. Onde o botão **não** deve aparecer aceso

Três conferências, e todas de coisa que não acontece.

```bash
node ./scripts/preview.js --workspace=$HOME/dev/reversa-views
```

Neste repositório, cujos checkpoints não estão na situação que produz prompt, o botão precisa estar
desabilitado, e a razão precisa estar legível em texto, não apenas no aspecto do botão.

Depois, um projeto cujo desvio já foi decidido por gente:

```bash
node ./scripts/preview.js --workspace=$HOME/dev/med-reversa
```

Os checkpoints reconhecidos por par aprovado não geram prompt, e as chaves aprovadas como registro que
não é agente também não. Se algum deles aparecer no texto, a feature está desfazendo a decisão da 012.

## 7. O comando de manutenção, para os três de uma vez

```bash
npm run prompt:harness -- --raiz=~/dev
cat propostas/prompt-harness.md
git status
```

Confira quatro coisas: o arquivo tem os três blocos, cada um nomeando o seu projeto e o seu agente; o
texto de cada bloco é idêntico ao que o painel produziu nos passos 3 a 5; nenhum `state.json` aparece
como modificado no `git status`; e a execução não fez chamada de rede alguma.

Rode duas vezes seguidas e compare as saídas com `diff`: precisam ser idênticas, porque a ordem da
varredura é estável e nada consulta o relógio.

## 8. As promessas negativas

```bash
# a suíte inteira, com a paridade do texto entre as novas
npm test

# a camada de leitura continua sem função capaz de escrever, criar, remover ou executar
npx vitest run tests/readonly-local.spec.ts src/heranca/reversa-domain/tests/readonly.spec.ts

# a webview não importa valor do host nem módulo de plataforma
npx vitest run tests/webview-boundaries.spec.ts

# a elisão do pacote e a do script não divergiram
npx vitest run tests/limites.spec.ts
```

E uma conferência que se faz lendo, não rodando: abra `scripts/prompt-harness.js` e confirme que os
`require` do topo não trazem cliente de motor algum. A separação entre pedir e classificar é
verificável por inspeção, e é assim que a 012 a deixou.

## 9. Desfazer

Nada a desfazer no disco de outros projetos, porque nada foi escrito nele. O único arquivo criado é
`propostas/prompt-harness.md`, e ele é reescrito a cada execução:

```bash
git checkout -- propostas/ 2>/dev/null || rm -f propostas/prompt-harness.md
```

## 10. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-20 | Versão inicial gerada por `/reversa-plan` | reversa |
