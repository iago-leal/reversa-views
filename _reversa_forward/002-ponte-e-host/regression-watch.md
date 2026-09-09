# Regression watch: ponte e host da extensão

> Identificador da feature: `002-ponte-e-host`
> Data da criação: `2026-09-09`
> Gerado por: `/reversa-coding`

**Feature greenfield.** Não houve extração `/reversa` sobre este repositório, e sem extração não há
regras 🟢 a vigiar: o watch principal nasce vazio por definição, e não por omissão. É o mesmo estado
em que a feature 001 deixou o dela.

O que esta entrega implementa ganha peso de regressão quando uma extração futura sobre este código o
confirmar como 🟢. Até lá, os requisitos funcionais ficam na seção "Observações", como registro do
que essa extração precisará reencontrar.

Os identificadores continuam a numeração da feature 001, que usou `W001` a `W018`. Esta feature usa
`W019` em diante, e nenhum identificador antigo foi reciclado nem reescrito.

## Watch

| ID | Origem (arquivo, seção) | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|----|-------------------------|-----------------------------|---------------------|-------------------|
| | | | | |

Vazio. Nenhuma regra 🟢 foi alterada ou removida, porque nenhuma existia.

## Histórico de re-extrações

| Data | Extração | Itens conferidos | Itens violados |
|------|----------|------------------|----------------|
| | | | |

Vazio. Será preenchido pelo agente reverso quando `/reversa` rodar sobre este repositório.

## Arquivadas

| ID | Motivo do arquivamento | Data |
|----|------------------------|------|
| | | |

Vazio.

## Observações

Sem peso de regressão. São os requisitos que esta entrega implementa e o que uma extração futura
precisaria reencontrar para confirmá-los. Os identificadores são estáveis e serão reciclados quando
algum destes virar item de watch.

| ID | RF | O que a entrega implementou | Onde vive |
|----|----|-----------------------------|-----------|
| W019 | RF-01 | Um contêiner na barra de atividades com uma visão de webview dentro, alcançável sem comando de paleta | `package.json`, `media/reversa.svg`, `src/host/provider.ts` |
| W020 | RF-02 | Um único evento de ativação, o da visão, sem coringa nem evento de inicialização | `package.json` |
| W021 | RF-03 | A raiz observada sai das pastas do workspace e viaja à webview com o caminho absoluto | `src/host/root.ts`, `src/host/adapters.ts` |
| W022 | RF-04 | Havendo várias raízes, observa-se a primeira instalada e as demais são declaradas ignoradas | `src/host/root.ts` |
| W023 | RF-05 | Nenhuma mensagem de dados sai antes de a webview sinalizar que carregou | `src/host/bridge.ts` |
| W024 | RF-06 | Um ouvinte único, e comando não reconhecido vira linha de log sem efeito colateral | `src/host/router.ts`, `src/host/bridge.ts` |
| W025 | RF-07 | A releitura pelo botão e pela paleta é literalmente a mesma função do provedor | `src/host/provider.ts`, `src/extension.ts` |
| W026 | RF-08 | A abertura contém o caminho na raiz observada por `resolveInside`, e a recusa precede a chamada ao editor | `src/host/open-file.ts` |
| W027 | RF-09 | Política sem avaliação dinâmica, sem coringa, script apenas por nonce e recurso local só da pasta de saída | `src/host/document.ts`, `src/host/provider.ts` |
| W028 | RF-10 | O contexto da webview é retido quando ela se oculta, e voltar não repete a leitura | `src/extension.ts`, `src/host/bridge.ts` |
| W029 | RF-11 | Um canal de saída com nome próprio, alimentado também pelo comando de log da webview | `src/extension.ts`, `src/host/adapters.ts`, `src/host/router.ts` |
| W030 | RF-12 | O comando de despacho existe declarado como reservado, e recebê-lo produz rejeição registrada | `src/host/protocol.ts`, `src/host/router.ts` |
| W031 | RF-13 | A carga leva processo, relatório da sonda e momento da leitura, além da raiz e das ignoradas | `src/host/protocol.ts`, `src/host/reading.ts` |
| W032 | RF-14 | A camada de leitura entra por chamada de função, e nenhum módulo do host traz caminho do Reversa nem cálculo de estágio | `src/host/reading.ts`, `tests/host-boundaries.spec.ts` |
| W033 | RF-15 | Os cinco estados de entrada num tipo união único, cada um alcançável por cenário de teste | `src/host/protocol.ts` |
| W034 | RF-16 | Exceção da leitura é capturada, tem a pilha no log e vira estado de erro com a mensagem | `src/host/reading.ts` |
| W035 | RF-17 | A chamada de envio e o registro de ouvinte aparecem uma vez cada, ambos na ponte | `src/host/bridge.ts` |
| W036 | RF-18 | O manifesto ganhou só o mínimo de extensão, sem empacotador, script de empacotamento nem lista de exclusão | `package.json` |
| W037 | RF-19 | Um documento provisório que sinaliza pronto, imprime o que chega e oferece os dois botões | `src/host/provisional.ts` |
| W038 | RF-20 | Todo módulo do host recebe por parâmetro a fatia da interface do editor que usa, e o executor segue sem apelido de módulo | `src/host/ports.ts`, `vitest.config.ts` |
| W039 | RN-01 | Nenhum módulo do host abre arquivo para escrita, em circunstância alguma | `src/host/`, `tests/host-boundaries.spec.ts` |
| W040 | RN-06 | O provedor nunca escreve no estado da webview, para que a tela não pinte retrato antigo | `src/host/provider.ts` |
| W041 | RN-09 | Nenhuma notificação, nenhum diálogo e nenhuma mudança de foco; a única saída fora da webview é o canal de log | `src/host/adapters.ts` |

Três observações sobre o que uma extração futura vai encontrar e precisa ler com cuidado.

A primeira é que a porta de mensagens tem, de propósito, a forma estrutural do objeto de webview do
editor. Isso não é acoplamento por descuido: é o que dispensa adaptador para ela e mantém a única
chamada de envio dentro da ponte, como RF-17 exige. Uma extração que classifique isso como
dependência indevida estará lendo a consequência sem a causa.

A segunda é que `src/host/provisional.ts` é descartável por contrato. A feature 003 o substitui
inteiro, e o cabeçalho do arquivo diz isso. Ele é o único módulo do host que contém caminho de
arquivo do Reversa, e a suíte de fronteiras o exclui por escrito dessa verificação.

A terceira é que W037 e a metade visual de W019 e W020 ainda não têm prova: a ação T031 não pôde
rodar neste ambiente, sem interface gráfica, e os passos 6 a 11 do `onboarding.md` seguem pendentes.

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-09 | Versão inicial gerada por `/reversa-coding` | reversa |
