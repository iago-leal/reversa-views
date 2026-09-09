# Onboarding: cartões e cronologia

> Identificador: `006-cartoes-e-cronologia`
> Data: `2026-09-09`
> Para quem vai ver a feature funcionando pela primeira vez, inclusive você mesmo daqui a meses

## 1. Preparar

```bash
cd /Users/iagoleal/dev/reversa-views
npm install
npm run build
```

O comando de construção compila o host, empacota a tela e, antes das duas coisas, confere a herança
e regenera a revisão do modelo herdado. Se ele falhar na conferência da herança, pare: algum arquivo
de `src/heranca/` foi alterado, e esta feature não deve alterar nenhum.

## 2. Conferir que a base está verde antes de olhar a tela

```bash
npm test
npm run typecheck
npm run check:webview
```

A suíte inteira precisa fechar sem falha e sem pulo. A verificação de tipos da tela é separada de
propósito: é ela que garante que a webview não alcança a interface do editor.

## 3. Ver a tela sem abrir o editor

O preview serve o pacote real da tela, sob o documento real, lendo este próprio repositório.

```bash
npm run preview
```

Abra o endereço que ele imprime. Para os estados que não acontecem sozinhos:

```bash
node ./scripts/preview.js --tema=escuro
node ./scripts/preview.js --estado=sem-reversa
node ./scripts/preview.js --atraso=1200
node ./scripts/preview.js --workspace=$(node ./scripts/estragar-workspace.js)
```

O último comando copia o workspace para uma pasta temporária, estraga a cópia e serve a partir dela,
o que produz a leitura degradada sem tocar no repositório de verdade.

## 4. Ver a extensão dentro do editor

Abra a pasta no editor e rode a configuração `Extensão: janela de desenvolvimento`, que constrói
antes de abrir. Na janela nova, abra a barra lateral do Reversa. O painel lê sozinho, sem comando.

## 5. Roteiro de verificação da feature

Cada item corresponde a um requisito do `requirements.md`. Faça na ordem: os primeiros preparam o
estado dos seguintes.

1. **Todos os cartões abertos (RF-01).** Abra um a um os cartões recolhidos. Ao abrir o último,
   nenhum outro pode fechar. Esse é exatamente o defeito que a feature corrige, então é o primeiro
   item a olhar.
2. **A escolha sobrevive (RF-01, RF-05).** Com tudo aberto, oculte a barra lateral, vá a outro lugar
   do editor e volte. Tudo continua aberto.
3. **Expandir tudo e recolher tudo (RF-02, RF-03).** As duas ações estão no cabeçalho. Recolha tudo:
   sobram os títulos. Confirme que a faixa de bloqueio humano, se houver alguma razão ativa,
   permanece visível mesmo com tudo recolhido (RN-03).
4. **Ações sem efeito (RF-04).** Com tudo expandido, a ação de expandir tudo aparece desabilitada;
   com tudo recolhido, a de recolher tudo.
5. **Decomposição da feature ativa (RF-06, RF-07, RF-11).** O cartão da decomposição abre expandido
   e mostra as ações abertas mais as cinco fechadas mais recentes, com a contagem total ao lado.
   A primeira ação aberta aparece destacada como próxima. Revele o resto e confira que a lista
   completa aparece na ordem do arquivo.
6. **Trilha (RF-08).** Cada ação com evento registrado mostra horário e arquivos tocados. Ação sem
   evento diz que não há registro, e não fica em branco.
7. **Histórico (RF-09).** O cartão do histórico abre recolhido, com a contagem no título. Abra: as
   pastas de feature aparecem da mais recente para a mais antiga. Neste repositório, hoje, a feature
   002 deve aparecer marcada como pausada, e não pode estar ausente.
8. **Abrir artefato (RF-10).** Clique no nome de um adendo. Ele abre no editor, sem roubar o foco.
9. **Resumo em documento não salvo (RF-12).** Acione a ação de resumo no cabeçalho. Um documento
   novo, sem nome de arquivo, abre com o resumo. Confirme que o editor o trata como não salvo, e
   que nada apareceu em disco.
10. **Cópia (RF-17).** Acione a ação de copiar e cole em qualquer lugar. O texto é o mesmo do
    documento do item anterior.
11. **Horário de Brasília (RF-15, RF-16).** O cabeçalho mostra o momento da leitura no formato
    `09/09/2026 17:43 (Brasília)`. Percorra o painel e confirme que nenhum instante ficou em tempo
    universal cru, inclusive nos checkpoints da descoberta. No preview, inspecione o elemento e
    confirme que o valor original está no atributo.
12. **Estados vazios e degradação (RF-13, RF-14).** Rode o preview sobre o workspace estragado e
    confira que a cronologia declara o que não pôde ler, nomeando o arquivo, em vez de mostrar
    lista vazia.

## 6. Verificar o que só se lê no código

```bash
npm test -- tests/host-boundaries.spec.ts tests/webview-boundaries.spec.ts
npm run check:heranca:local
```

A primeira linha confere as fronteiras: dependência do editor em dois arquivos, ponto único de
travessia do canal, ausência de escrita em qualquer forma, e ausência de caminho do Reversa dentro
do host. A segunda confere que nenhum arquivo herdado foi tocado.

## 7. Empacotar

```bash
npm run empacotar
```

Não empacote antes de ter feito o roteiro do item 5 com os olhos. O portão de saída deste projeto é
visual por decisão registrada na spec do painel, e suíte verde não substitui olhar a tela.
