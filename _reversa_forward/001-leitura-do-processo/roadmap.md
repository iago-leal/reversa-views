# Roadmap: Leitura do processo do Reversa

> Identificador: `001-leitura-do-processo`
> Data: `2026-09-09`
> Requirements: `_reversa_forward/001-leitura-do-processo/requirements.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

A feature é uma cópia disciplinada, não uma implementação. Os dois pacotes de origem, a camada de
julgamento e a sonda de disco, entram neste repositório em `src/heranca/`, com a estrutura interna
de cada um preservada (fontes, testes e fixtures), para que todo caminho da cópia corresponda um a
um ao caminho da origem. Quatro adaptações, todas declaradas, tornam a cópia autônoma: o remapeio
das três importações que cruzavam a fronteira dos pacotes, a remoção das duas exportações da rota
no índice da sonda, o descarte do módulo de rota com sua suíte, e o carimbo de procedência no topo
de cada arquivo de código. O repositório ganha o mínimo de infraestrutura que a cópia exige para
compilar e testar sozinha: manifesto de pacote com versões exatas, uma configuração de compilador
para o host em CommonJS, uma configuração do executor de testes, e dois testes locais, um que acusa
divergência entre o gancho instalado e o fixture da paridade, outro que mede a leitura no workspace
de referência. Nada além disso: build, empacotamento e preview pertencem à feature 005.

## 2. Princípios aplicados

`.reversa/principles.md` não existe neste projeto, de modo que não há princípio formal a verificar.
Os princípios operacionais do mantenedor, registrados no `CLAUDE.md` global, foram aplicados como
filtro de decisão e constam na tabela abaixo para rastreabilidade.

| Princípio | Como a feature se relaciona | Status |
|-----------|------------------------------|--------|
| Estabilidade acima de novidade | Versões fixadas nas que a origem já provou, e não nas mais recentes do registro | respeita |
| Documentação para quem retorna após meses | Carimbo em cada arquivo, arquivo de procedência e onboarding executável | respeita |
| Erros barulhentos | Divergência do gancho instalado falha o teste; teste pulado declara-se pulado | respeita |
| Setup reproduzível | Arquivo de trava versionado; clone limpo compila e testa sem a origem presente | respeita |
| Proporcionalidade: categoria Aplicação | Camadas e contratos explícitos herdados; sem infraestrutura além da que a cópia exige | respeita |

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|----|---------|----------------|--------------------------|-------------|
| D-01 | A cópia mora em `src/heranca/reversa-domain/` e `src/heranca/reversa-probe/`, cada uma com `src/`, `tests/` e, no domínio, `tests/fixtures/`, espelhando `packages/<nome>/` da origem | Caminho da cópia igual ao da origem menos o prefixo, o que torna o manifesto e o ressincronizador da feature 004 triviais; os testes herdados resolvem `../src` e `./fixtures` sem alteração | Pacotes npm em workspace (exige ferramenta de monorepo que o kit não usa); pasta `heranca/` na raiz (obriga `rootDir` do host a subir para a raiz) | 🟢 |
| D-02 | O host compila para CommonJS, alvo e biblioteca ES2022, `strict` ligado, com `rewriteRelativeImportExtensions` para aceitar as importações com extensão `.ts` da origem | O host de extensão do editor carrega CommonJS, e o kit `vscode-kanban` compila assim; os fontes herdados não usam `import.meta` e marcam `import type` explicitamente, logo compilam sob CommonJS sem edição; ES2022 cobre `??=` e `replaceAll`, os únicos recursos pós-ES2019 encontrados, e é suportado pelo Node embarcado no editor mínimo do kit | Repositório inteiro em ESM como a origem (suporte a ESM no host do editor não é o caminho estável); reescrever as importações sem extensão (edita 37 arquivos e conflita com a ressincronização) | 🟡 |
| D-03 | Um único executor de testes para o repositório, o mesmo da origem, fixado na versão exata que ela tem instalada; o executor do kit não é herdado | As suítes herdadas são escritas para ele e usam `import.meta.url`, que só existe em ESM; a spec 5 exige um comando que rode tudo; dois executores dobrariam a configuração para um mantenedor só | Executor do kit para tudo (exigiria reescrever 17 arquivos de teste herdados); dois executores lado a lado | 🟢 |
| D-04 | Versões fixadas com igualdade exata: compilador 5.9.3, executor 3.2.7, tipos de Node 20.19.9 | As duas primeiras são as instaladas na origem, onde as suítes passam hoje; a terceira é a do kit; o registro npm já oferece majors mais novos dos dois primeiros, que ninguém validou contra este código | Faixas com acento circunflexo (permitem drift silencioso na próxima instalação); versões mais recentes do registro | 🟢 |
| D-05 | Carimbo de procedência prefixado em cada arquivo `.ts` copiado, no formato fixo abaixo, com a primeira linha começando por `/* HERDADO`; os três fixtures ficam sem carimbo e são listados apenas no arquivo de procedência | O carimbo só é barato na cópia inicial; a primeira linha fixa é o contrato que o verificador da feature 004 usará para reconhecer arquivo herdado; o fixture do gancho precisa continuar cópia byte a byte, e JSON não admite comentário | Carimbar os fixtures (quebra RF-17); adiar o carimbo para a feature 004 (reconstruir procedência de memória) | 🟢 |
| D-06 | O teste local de paridade com o gancho instalado compara `.reversa/hooks/check-legacy-policy.mjs` byte a byte com o fixture da suíte herdada, falha com mensagem que nomeia os dois caminhos e o que fazer, e declara-se pulado quando o gancho instalado não existe | Igualdade de bytes acusa qualquer mudança do gancho, inclusive fora das duas funções que a matriz herdada cobre, e a camada de julgamento transcreve mais do que essas duas funções; hoje os dois arquivos são idênticos, verificado por comparação | Repetir a matriz da suíte herdada contra o gancho instalado (tolera mudança cosmética, mas ignora mudança fora das duas funções) | 🟢 |
| D-07 | O teste local de desempenho constrói o workspace de referência em pasta temporária, com uma feature ativa de cinco arquivos, cinquenta adendos e cada arquivo próximo de 64 KB, mede leitura mais julgamento e exige menos de 200 ms | É a definição fechada na sessão de esclarecimentos; material sintético torna o limite verificável em qualquer máquina; a leitura é síncrona e sem cache, então uma medição fria basta | Medir num workspace real (nenhum tem ciclo forward executado) | 🟢 |
| D-08 | O arquivo de procedência `src/heranca/PROCEDENCIA.md` registra repositório e endereço da origem, revisão `420305daa6cdd10858b720a34cb8db67d8e5c5e9` de 2026-09-08, versão 1.3.3 do Reversa que a origem acompanhava, data da cópia, a lista de descartes deliberados e a lista de adaptações com trecho original e adaptado | É o mínimo que a ressincronização precisa reaplicar; a lista de copiados fica de fora, por ser a própria listagem da pasta | Registrar só no cabeçalho dos arquivos (o descarte não tem arquivo onde morar) | 🟢 |
| D-09 | O índice da sonda perde as duas linhas que exportavam a rota; nada mais muda nele | A rota é descartada, e um índice que a exporta não compila; a adaptação é declarada e reaplicável | Manter `route.ts` como código morto para não tocar no índice | 🟢 |
| D-10 | As 21 menções ao nome de pacote da origem em comentários de documentação são preservadas | São registro histórico, não vínculo de compilação; editá-las criaria 21 adaptações a reaplicar sem ganho; o critério de RF-14 restringe-se a instruções de importação e exportação | Reescrever os cabeçalhos `@module` | 🟢 |
| D-11 | O repositório recebe apenas o que a cópia exige: `package.json`, arquivo de trava, `tsconfig.json`, `vitest.config.ts`, `.gitignore` estendido e `tests/` local. Sem manifesto de extensão, sem build, sem webview | Cada peça a mais é decisão da feature 002 ou 005; a spec 5 diz que o build entra antes de qualquer componente ser escrito, e esta feature escreve nada, só copia | Montar o esqueleto completo da extensão agora | 🟡 |

Formato do carimbo (D-05), sete linhas, dentro do teto de dez da spec 4:

```
/* HERDADO: não editar sem declarar a adaptação em src/heranca/PROCEDENCIA.md
 * origem:      scrum-harness (https://github.com/iago-leal/scrum-harness)
 * caminho:     packages/reversa-domain/src/state.ts
 * revisão:     420305daa6cdd10858b720a34cb8db67d8e5c5e9 (2026-09-08)
 * copiado em:  2026-09-09
 * adaptações:  nenhuma
 */
```

## 4. Premissas

Nenhuma. O `requirements.md` chegou ao plano com zero marcadores `[DÚVIDA]`, depois da sessão de
esclarecimentos de 2026-09-09.

| Premissa | Origem (`requirements.md` seção) | Risco se errada |
|----------|----------------------------------|-----------------|
| n/a | n/a | n/a |

## 5. Delta arquitetural

Não há `_reversa_sdd/architecture.md`: o projeto é novo. O delta é medido contra o estado atual do
repositório, que não tem código, e contra os componentes descritos nas specs SDD.

| Componente | Arquivo de origem no legado | Tipo de mudança | Resumo |
|------------|------------------------------|-----------------|--------|
| Camada de julgamento (`src/heranca/reversa-domain/`) | `_reversa_sdd/sdd/leitura-do-processo.md#6` | componente-novo | 14 módulos e 14 suítes copiados de `packages/reversa-domain`, com carimbo, sem edição de regra |
| Sonda de disco (`src/heranca/reversa-probe/`) | `_reversa_sdd/sdd/leitura-do-processo.md#6` | componente-novo | 3 módulos e 3 suítes copiados de `packages/reversa-probe`; rota descartada; importações remapeadas |
| Procedência (`src/heranca/PROCEDENCIA.md`) | `_reversa_sdd/sdd/heranca-e-sincronia.md#6` (RF-01, RF-04) | componente-novo | Primeira forma do regime de herança: carimbos e registro de descartes e adaptações; manifesto com resumo criptográfico, verificador e ressincronizador ficam para a feature 004 |
| Testes locais (`tests/`) | `requirements.md#5` (RF-17) e `#6` (desempenho) | componente-novo | Paridade byte a byte com o gancho instalado; leitura no workspace de referência abaixo de 200 ms |
| Infraestrutura mínima do repositório | `_reversa_sdd/sdd/empacotamento-e-verificacao.md#6` (RF-09, parcial) | componente-novo | Manifesto de pacote, trava, configuração do compilador do host e do executor de testes; o comando de teste único nasce aqui e a feature 005 o estende |

Arquivos que a mudança cria, em rascunho para o `legacy-impact.md` do coding: os 37 arquivos
copiados sob `src/heranca/`, mais `src/heranca/PROCEDENCIA.md`, `package.json`, `package-lock.json`,
`tsconfig.json`, `vitest.config.ts`, `tests/paridade-gancho-instalado.spec.ts` e
`tests/desempenho-referencia.spec.ts`. Um único arquivo pré-existente é alterado, `.gitignore`, que
ganha `out/`, `node_modules/`, `coverage/` e `*.vsix`, na mesma forma do kit. Essa alteração está
fora das pastas próprias do Reversa e, portanto, depende de `.reversa/reversa-config.json` liberar
a escrita no legado; o coding deve verificar a política antes de tocá-lo e, se recusada, deixar a
edição para o usuário com o trecho pronto.

## 6. Delta no modelo de dados

- Resumo das mudanças: nada é persistido. As três estruturas em memória da camada, o retrato bruto
  que a sonda monta, o processo tipado que o julgamento devolve e o relatório da sonda, chegam
  prontas da origem e correspondem ao modelo conceitual da spec com nomes diferentes. O único tipo
  que sai é o de transporte da rota, descartado junto com ela.
- Detalhe completo em: `_reversa_forward/001-leitura-do-processo/data-delta.md`

## 7. Delta de contratos externos

Nenhum. A camada expõe uma API em processo, consumida pelo host na feature 002; não há HTTP, fila
ou RPC. O diretório `interfaces/` não é criado.

| Contrato | Tipo | Arquivo de detalhe |
|----------|------|--------------------|
| n/a | n/a | n/a |

## 8. Plano de migração

n/a. Não há dado a migrar nem instalação anterior a substituir.

## 9. Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| A opção de reescrita de extensão do compilador não se comportar como esperado sob CommonJS, e a saída compilada não carregar em Node | alto | baixa | Primeira ação do coding depois da cópia: compilar e carregar o índice da sonda em Node com `require`, antes de qualquer outra coisa; se falhar, a alternativa é a configuração ESM da origem para a pasta de herança, como unidade separada |
| O carimbo no topo dos arquivos disparar a suíte que lê os próprios fontes em busca de importação de sistema de arquivos | médio | baixa | O carimbo não contém a forma `from 'node:fs'` nem `require('fs')`; a suíte passa a ser a prova, e roda na mesma execução |
| Igualdade de bytes com o gancho instalado acusar mudança cosmética como divergência | baixo | média | Aceito e documentado: a resposta a qualquer vermelho é inspecionar o diff do gancho, e a mensagem do teste diz isso |
| O teste de 200 ms oscilar em máquina lenta ou sob carga | médio | média | Aquecer com uma leitura descartada, medir uma vez, e exigir 200 ms; sem integração contínua, a única máquina é a do mantenedor; se oscilar, a spec prevê medir antes de decidir por leitura parcial |
| A escolha do executor de testes divergir do kit quando a herança da feature 004 e 005 chegar | médio | média | Decisão D-03 registrada agora; o kit entrega padrão, não binário, e seus testes de unidade não são herdados |
| O repositório não ter commit inicial, o que impede verificar o critério de clone limpo | médio | alta | O coding não comita; o onboarding pede ao usuário o commit inicial depois da verificação, e o critério de clone limpo fica condicionado a ele |
| A política de escrita no legado recusar a edição do `.gitignore` | baixo | média | O coding lê a política antes; recusada, entrega o trecho ao usuário e registra a pendência no progresso |

## 10. Critério de pronto

- [ ] Todas as ações do `actions.md` marcadas `[X]`
- [ ] `cross-check.md` (se executado) sem CRITICAL nem HIGH
- [ ] `regression-watch.md` gerado
- [ ] Re-extração reversa executada e sem regressão vermelha (recomendado, não obrigatório)
- [ ] `npm test` executa 17 arquivos herdados e 2 locais, todos verdes, com a verificação do gancho instalado executada e não pulada neste repositório
- [ ] `npm run typecheck` passa sob a configuração CommonJS do host
- [ ] A saída compilada do índice da sonda carrega em Node e lê este próprio repositório, devolvendo processo instalado e sem anomalia
- [ ] Busca por `@scrum-harness/` restrita a instruções de importação e exportação em `src/heranca/` retorna zero ocorrências
- [ ] Nenhum `route.ts` nem `route.spec.ts` em `src/heranca/`, e nenhuma referência a eles
- [ ] Todo arquivo `.ts` em `src/heranca/` começa por `/* HERDADO`; os três fixtures são idênticos aos da origem
- [ ] `src/heranca/PROCEDENCIA.md` existe com origem, revisão, versão do Reversa, data, descartes e adaptações
- [ ] Fixture do gancho idêntico a `.reversa/hooks/check-legacy-policy.mjs`, verificado pelo teste local

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-09 | Versão inicial gerada por `/reversa-plan` | reversa |
