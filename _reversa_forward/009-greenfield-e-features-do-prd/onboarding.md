# Onboarding: greenfield e features do PRD

> Identificador: `009-greenfield-e-features-do-prd`
> Data: `2026-09-11`
> Roadmap: `_reversa_forward/009-greenfield-e-features-do-prd/roadmap.md`

Roteiro para quem vai ver a feature funcionar pela primeira vez, inclusive o mantenedor daqui a doze
meses. Cada passo diz o que rodar e o que deve aparecer. Nada aqui escreve no projeto: o que
escreve é o script de degradação, e só em pasta temporária do sistema.

## 1. Preparar

```sh
cd ~/dev/reversa-views
npm ci
npm test
```

A suíte inteira precisa estar verde antes de qualquer passo abaixo. Se `tests/webview-sections.spec.ts`
falhar dizendo que esperava nove nomes, a tela está atrás do plano; se disser onze, o plano está
atrás da tela.

## 2. Ver o que o painel vai ler

```sh
ls _reversa_sdd/newproject-brief.md _reversa_sdd/ideation.md _reversa_sdd/personas.md _reversa_sdd/prd.md
ls _reversa_sdd/sdd/
node -e "console.log(require('./.reversa/state.json').newproject_progress.stage)"
```

Os quatro artefatos existem, há cinco specs, e o `stage` é `done`. É o estado saudável: estágio
físico `especificado`, metadado dentro do conjunto aceito, cenário `greenfield`.

## 3. Abrir o painel

```sh
node scripts/preview.js
```

Abra o endereço que o script imprime. Na ordem, de cima para baixo, devem aparecer: a faixa de
bloqueio (vazia neste projeto, salvo dúvidas em aberto na feature ativa), a feature ativa, a
decomposição, o **Panorama do produto**, o histórico, os bugs, a extração, a **Origem do projeto**,
a política, as anomalias e a sonda.

No Panorama, confira:

- a linha "5 de 5 componentes planejados convergidos" com a barra cheia;
- os cinco componentes em ordem de nome, cada um com o nome da spec clicável e o adendo clicável;
- o bloco "Fora do plano" com `006-cartoes-e-cronologia`, `007-atualizacao-e-progresso`,
  `008-cronologia-do-ciclo-bugs` e `009-greenfield-e-features-do-prd`, esta com a marca de ativa;
- o bloco "Escopo declarado no PRD" recolhido; ao abri-lo, os itens da seção "Escopo (in)" do PRD
  agrupados pelos rótulos em negrito, com `prd.md` clicável.

A Origem vem recolhida, com o estágio no título. Ao abri-la: cenário greenfield, modo guiado, a
primeira frase da "Ideia original" do brief, as quatro etapas concluídas com os artefatos clicáveis,
o último checkpoint em horário de Brasília, e o lugar vazio do brainstorm, nomeado.

## 4. Conferir que a situação vem do histórico, e não da spec

```sh
grep -n '^Status' _reversa_sdd/sdd/*.md
```

As cinco specs dizem "rascunho", e o painel as mostra convergidas. É a prova de RN-04: o campo não é
lido. Se algum dia o painel mostrar uma spec como rascunho, alguém passou a ler o que não devia.

## 5. Conferir que o metadado não manda

```sh
node scripts/preview.js --workspace="$(node scripts/estragar-greenfield.js --caso=divergente)"
```

A cópia tem o `stage` trocado por `ideator` com os quatro artefatos presentes. O estágio no título
da Origem segue `especificado`, a seção de anomalias abre sozinha e lista
`estagio-greenfield-divergente` com os dois valores. Nenhuma faixa de bloqueio aparece por isso.

## 6. Ver a faixa de bloqueio da pipeline incompleta

```sh
node scripts/preview.js --workspace="$(node scripts/estragar-greenfield.js --caso=parcial)"
```

A cópia perdeu `prd.md` e `sdd/`. A faixa de bloqueio diz que a pipeline greenfield está em
`pesquisado`, nomeia o próximo agente, `drafter`, e o comando `/reversa-new`. O Panorama mostra o
vazio "sem specs"; a Origem mostra duas etapas concluídas e duas pendentes; a extração ganha a frase
de que o projeto é greenfield e nenhuma fase foi concluída.

## 7. Ver os três vazios

```sh
node scripts/preview.js --workspace="$(node scripts/estragar-greenfield.js --caso=sem-ancora)"
node scripts/preview.js --workspace="$(node scripts/estragar-greenfield.js --caso=sdd-vazio)"
```

No primeiro, sem artefato greenfield algum, a Origem diz que o projeto não nasceu pelo `/reversa-new`
e o Panorama diz que não há plano a mostrar; nada de anomalia. No segundo, a pasta `sdd/` existe e
está vazia: o Panorama diz que não há specs, todas as pastas do histórico aparecem como fora do
plano, e a faixa de bloqueio aponta `spec-sdd`. O terceiro vazio, leitura não realizada, não tem
caso no script porque é o host que o produz: a suíte `tests/host-protocol.spec.ts` o cobre.

## 8. Ver a degradação do escopo e o teto

```sh
node scripts/preview.js --workspace="$(node scripts/estragar-greenfield.js --caso=sem-escopo)"
node scripts/preview.js --workspace="$(node scripts/estragar-greenfield.js --caso=teto)"
```

No primeiro, o PRD perdeu a seção de escopo: anomalia `escopo-do-prd-nao-encontrado`, e o resto do
cartão intacto. No segundo, há mais de cinquenta specs: o Panorama declara "50 de N specs lidas" e
a barra mede contra as lidas.

## 9. Conferir que nada foi escrito

```sh
git status --short
```

Vazio. As cópias doentes ficaram em pasta temporária do sistema, e o preview não escreve.

## 10. Conferir as fronteiras

```sh
npx vitest run tests/host-boundaries.spec.ts tests/readonly-local.spec.ts tests/webview-boundaries.spec.ts
```

As três verdes provam que nenhum literal de `_reversa_sdd` entrou no host, que os módulos novos de
`src/probe` e `src/domain` não importam `node:` fora do único arquivo que pode, e que a tela não
importa valor do host.

## 11. Medir o pacote e o tempo

```sh
npm run build
npx vitest run tests/webview-build.spec.ts tests/desempenho-referencia.spec.ts
```

O pacote da tela abaixo de 409.600 bytes e a leitura abaixo de 200 ms. Anote o número do pacote no
adendo quando o `/reversa-sync` rodar, como as features anteriores fizeram.

## 12. Uma coincidência de nomes

O nome de seção `origem` e o campo `origem` de `ActiveDecomposition` são coisas distintas: o primeiro
é o cartão da Origem do projeto, o segundo diz de onde a decomposição foi lida. Vivem em módulos
diferentes e nunca se cruzam; fica dito para não custar dez minutos daqui a um ano.
