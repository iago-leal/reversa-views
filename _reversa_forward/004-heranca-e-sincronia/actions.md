# Actions: herança e sincronia

> Identificador: `004-heranca-e-sincronia`
> Data: `2026-09-09`
> Roadmap: `_reversa_forward/004-heranca-e-sincronia/roadmap.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA (herdada da decisão do roadmap entre parênteses)

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 44 |
| Paralelizáveis (`[//]`) | 14 |
| Maior cadeia de dependência | 10 ações (T006 → T007 → T017 → T025 → T026 → T030 → T031 → T034 → T035 → T036) |

Convenções desta decomposição:

- **Identificadores fixos**, que o `onboarding.md` já usa e que não mudam sem que ele mude junto:
  os quatro scripts `check:heranca`, `check:heranca:local`, `sync:heranca` e `gen:heranca`; os
  arquivos `src/heranca/manifesto.yml`, `src/heranca/adaptacoes.yml`, `heranca.origens.yml`,
  `heranca.origens.exemplo.yml` e `src/host/inheritance.ts`.
- **Idioma:** identificadores e comentários de código em inglês nos módulos de `src/`, como as
  features anteriores fixaram. Os scripts de manutenção em `scripts/` e os dois arquivos YAML são a
  exceção deliberada: eles são lidos pelo mantenedor, não pela extensão, e usam português, como já
  fazem as suítes.
- **Testes antes do núcleo.** As dez suítes da fase 2 são escritas contra as formas do
  `data-delta.md` e falham até a fase 3 existir. Nenhuma ação da fase 3 começa sem a suíte
  correspondente escrita, porque os oito estados do relatório e as três recusas do ressincronizador
  são o produto desta feature, e não efeito colateral dela.
- **Nenhuma origem de verdade é escrita.** Toda suíte que precisa de origem monta uma árvore
  temporária pelo auxiliar de T006. Nenhuma ação lê, escreve ou depende de
  `/workspaces/iagoleal/HARNESS/scrum-harness` fora do passo de geração do manifesto inicial.
- **O verificador nunca escreve**, em caminho de execução algum, e o ressincronizador escreve apenas
  na pasta de herança, no manifesto e nas adaptações. As duas regras são RN-06 e RN-07, e são
  verificadas por suíte, não por revisão.

## Fase 1, Preparação

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Acrescentar `yaml` às dependências de desenvolvimento em versão exata, sem faixa, conforme a igualdade exata que a suíte do manifesto de pacote já exige (D-03) | - | `[//]` | `package.json` | 🟢 | `[X]` |
| T002 | Criar o exemplo versionado da configuração local, com as duas chaves nomeadas e um comentário dizendo o que copiar e para onde (D-09) | - | `[//]` | `heranca.origens.exemplo.yml` | 🟢 | `[X]` |
| T003 | Acrescentar `heranca.origens.yml` à lista de arquivos ignorados, junto de um comentário que o ligue ao exemplo | T002 | - | `.gitignore` | 🟢 | `[X]` |
| T004 | Migrar A1, A2 e A3 de `PROCEDENCIA.md` para o arquivo de adaptações, com identificador, arquivo, motivo e os dois trechos em bloco literal, e `adaptado` vazio em A3 por ser remoção (RF-02) | - | `[//]` | `src/heranca/adaptacoes.yml` | 🟢 | `[X]` |
| T005 | Criar o manifesto com o cabeçalho comentado e as duas entradas de origem, a do modelo com revisão e a do kit com a versão observada no disco, sem a lista de arquivos ainda (RN-10, D-11) | - | `[//]` | `src/heranca/manifesto.yml` | 🟢 | `[X]` |
| T006 | Escrever o auxiliar de fixtures que monta em pasta temporária uma origem falsa, uma cópia carimbada, um manifesto e um arquivo de adaptações, e limpa tudo ao final | - | `[//]` | `tests/helpers/heranca-fixtures.ts` | 🟢 | `[X]` |

## Fase 2, Testes

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T007 | Suíte da leitura do manifesto: forma válida aceita, e as cinco invalidezes recusadas com o defeito e a linha nomeados, sem relatório parcial (RF-12, RN-13) | T006 | - | `tests/heranca-manifesto.spec.ts` | 🟢 | `[X]` |
| T008 | Suíte do carimbo e do resumo: as sete linhas reconhecidas, campos extraídos, recorte da linha 8 nos carimbados e arquivo inteiro nos isentos, carimbo que discorda do manifesto relatado (RN-03, RN-04) | T006 | `[//]` | `tests/heranca-carimbo.spec.ts` | 🟢 | `[X]` |
| T009 | Suíte das adaptações: casamento exato, ocorrência única exigida, zero e duas ocorrências recusadas, `adaptado` vazio tratado como remoção, ordem de aplicação preservada | T006 | `[//]` | `tests/heranca-adaptacoes.spec.ts` | 🟢 | `[X]` |
| T010 | Suíte do julgamento local: alinhado, editado localmente, sem carimbo, carimbo inconsistente, não manifestado e ausente do disco, cada um nomeando arquivo e origem (RF-03, RF-06) | T006 | - | `tests/heranca-verificador-local.spec.ts` | 🟢 | `[X]` |
| T011 | Suíte do julgamento com origem: origem avançou com os arquivos nomeados, arquivo novo na origem sem cópia, origem indisponível concluindo as demais conferências, e adaptação que deixou de casar (RF-04, RF-05, RF-07, D-05) | T006 | - | `tests/heranca-verificador-origem.spec.ts` | 🟡 | `[X]` |
| T012 | Suíte do relatório: dois blocos nomeados, veredito por origem, veredito geral, e código de saída distinguindo o que impede de prosseguir do que apenas informa (RF-08) | T006 | `[//]` | `tests/heranca-relatorio.spec.ts` | 🟡 | `[X]` |
| T013 | Suíte do ressincronizador: plano completo aplicado, recusa por edição local, recusa por adaptação em conflito, recusa do fixture preso por paridade externa, e a prova de que nenhuma recusa escreveu byte algum (RF-10, RF-11, RN-08, RN-09) | T006 | - | `tests/heranca-ressincronizador.spec.ts` | 🟢 | `[X]` |
| T014 | Suíte da configuração local: arquivo ausente, chave ausente, caminho inexistente e caminho existente sem o conteúdo esperado, cada caso nomeando arquivo e chave a corrigir (RF-09, EC-01) | T006 | `[//]` | `tests/heranca-origens.spec.ts` | 🟢 | `[X]` |
| T015 | Suíte de coerência entre a constante gerada e o manifesto, que falha quando as duas revisões discordarem (RF-14, D-06) | T005 | `[//]` | `tests/heranca-revisao-gerada.spec.ts` | 🟢 | `[X]` |
| T016 | Suíte do ritual: o README nomeia os três sinais de disparo, os dois comandos e o limite conhecido do regime (RF-16, RF-18) | - | `[//]` | `tests/heranca-ritual.spec.ts` | 🟡 | `[X]` |

## Fase 3, Núcleo

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T017 | Escrever a leitura e a validação do manifesto e das adaptações, com as cinco regras de invalidez e mensagem que nomeia defeito e linha (D-03) | T007 | - | `scripts/heranca/manifesto.js` | 🟢 | `[X]` |
| T018 | Escrever a leitura do carimbo e o cálculo do resumo, com o recorte de RN-03 e a conferência dos campos contra a entrada do manifesto (D-04) | T008 | - | `scripts/heranca/carimbo.js` | 🟢 | `[X]` |
| T019 | Escrever a leitura e a aplicação das adaptações por busca exata do trecho original, com falha nomeada quando a ocorrência não for única (D-05, RN-09) | T009, T017 | - | `scripts/heranca/adaptacoes.js` | 🟢 | `[X]` |
| T020 | Escrever a resolução das origens: leitura da configuração local, conferência do caminho no disco, revisão corrente do modelo e versão corrente do kit, todas opcionais e nunca fatais (D-09, D-11, RN-05) | T014 | - | `scripts/heranca/origens.js` | 🟢 | `[X]` |
| T021 | Escrever o julgamento local como função pura sobre o manifesto e a árvore lida, devolvendo os seis estados que não dependem de origem (RN-06) | T010, T017, T018 | - | `scripts/heranca/verificar.js` | 🟢 | `[X]` |
| T022 | Acrescentar o julgamento com origem, aplicando as adaptações ao conteúdo lido antes de comparar, e produzindo origem avançou, novo na origem, origem indisponível e adaptação que não casa | T011, T019, T020, T021 | - | `scripts/heranca/verificar.js` | 🟡 | `[X]` |
| T023 | Escrever a formatação do relatório em blocos por origem, com veredito próprio e veredito geral, e a nota fixa do bloco do kit sobre o arquivo derivado sem conferência automática | T012, T022 | - | `scripts/heranca/relatorio.js` | 🟡 | `[X]` |
| T024 | Escrever a casca de linha de comando do verificador, com o modo local e o modo completo sobre o mesmo julgamento, e códigos de saída distintos para falha de conferência e para manifesto inválido (D-08) | T021, T023 | - | `scripts/verificar-heranca.js` | 🟢 | `[X]` |
| T025 | Escrever o inventário, que constrói entradas de manifesto a partir do disco com caminho, origem, caminho na origem, marca de carimbo, resumo e data, reaproveitado depois pelo ressincronizador | T017, T018 | - | `scripts/heranca/inventario.js` | 🟡 | `[X]` |
| T026 | Gerar e gravar as 37 entradas de arquivo no manifesto, marcar o fixture do gancho com a paridade externa, e rodar o modo local até o veredito sair alinhado (RF-01) | T004, T005, T024, T025 | - | `src/heranca/manifesto.yml` | 🟢 | `[X]` |
| T027 | Escrever o planejamento da ressincronização em memória, com cópia, adaptações reaplicadas, carimbos reescritos e as três recusas, sem tocar o disco (D-10, RN-08, RN-09) | T013, T019, T021 | - | `scripts/heranca/ressincronizar.js` | 🟢 | `[X]` |
| T028 | Acrescentar a escrita do plano aprovado, com atualização de carimbos e de manifesto, escrevendo apenas nas três áreas que RN-07 permite e sem criar commit | T027 | - | `scripts/heranca/ressincronizar.js` | 🟢 | `[X]` |
| T029 | Escrever a casca de linha de comando do ressincronizador, que imprime o plano antes de aplicar e o motivo da recusa quando houver | T023, T028 | - | `scripts/ressincronizar-heranca.js` | 🟢 | `[X]` |

## Fase 4, Integração

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T030 | Escrever o gerador da constante e gravar o módulo versionado com a revisão do modelo, marcado como gerado e proibido de edição à mão (D-06, D-14) | T015, T026 | - | `scripts/gerar-revisao-heranca.js` | 🟢 | `[X]` |
| T031 | Acrescentar `inheritedRevision` a `SetProcessData`, documentando no comentário que o campo é acréscimo e que `SetEntryData` fica intacto (D-07) | T030 | - | `src/host/protocol.ts` | 🟢 | `[X]` |
| T032 | Preencher o campo no envio de `setProcess` a partir da constante importada, sem transformação e sem conhecer caminho de origem (RF-14) | T031 | - | `src/host/provider.ts` | 🟢 | `[X]` |
| T033 | Atualizar as suítes do protocolo e do provedor para o campo novo, incluindo o caso de revisão vazia | T032 | - | `tests/host-provider.spec.ts` | 🟢 | `[X]` |
| T034 | Escrever a função pura que abrevia a revisão para sete caracteres, devolvendo o texto inteiro quando for menor e vazio quando não houver, com suíte própria | T031 | - | `src/webview/domain/labels.ts` | 🟢 | `[X]` |
| T035 | Acrescentar o sexto item ao cabeçalho, ao lado da versão do Reversa, usando a função de T034 e o texto de ausência que os demais itens já usam (RF-15) | T034 | - | `src/webview/ui/Header.tsx` | 🟢 | `[X]` |
| T036 | Acrescentar à suíte de marcação os dois casos do cabeçalho: revisão abreviada presente e `não declarado` quando ela faltar, sem afetar os outros cinco itens | T035 | - | `tests/webview-render.spec.tsx` | 🟢 | `[X]` |
| T037 | Declarar os quatro scripts novos e encadear no build a conferência local e a geração da constante, antes da compilação (RF-19, D-13) | T024, T029, T030 | - | `package.json` | 🟢 | `[X]` |
| T038 | Atualizar a suíte do manifesto de pacote para os dez scripts e para a dependência de YAML em igualdade exata | T037 | - | `tests/host-manifest.spec.ts` | 🟢 | `[X]` |

## Fase 5, Polimento

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T039 | Criar o README com o que o repositório é, como se constrói e a seção do ritual, nomeando os três sinais de disparo, os dois comandos e o que fazer quando o ressincronizador para (RF-16, D-12) | T029, T037 | - | `README.md` | 🟢 | `[X]` |
| T040 | Acrescentar ao README o limite conhecido do regime, citando a dependência transitiva como o caso que o resumo não pega e as suítes herdadas como a rede que resta (RF-18, EC-05) | T039 | - | `README.md` | 🟡 | `[X]` |
| T041 | Substituir a seção 8 de `PROCEDENCIA.md` pelo estado entregue, apontando o manifesto e as adaptações como fonte do dado e o README como lugar do ritual (RF-17) | T026, T039 | - | `src/heranca/PROCEDENCIA.md` | 🟢 | `[X]` |
| T042 | Escrever o cabeçalho comentado do manifesto, explicando o que ele é, quem o escreve e por que não se edita à mão a lista de resumos | T026 | `[//]` | `src/heranca/manifesto.yml` | 🟢 | `[X]` |
| T043 | Revisar as mensagens dos dois comandos para que toda saída nomeie arquivo, estado e ação seguinte, e distinga o que impede de prosseguir do que apenas informa | T024, T029 | `[//]` | `scripts/heranca/relatorio.js` | 🟡 | `[X]` |
| T044 | Medir o tempo do verificador completo com as duas origens presentes e registrar o número, conferindo o teto de 10 s do requisito não funcional | T024, T026 | `[//]` | `_reversa_forward/004-heranca-e-sincronia/progress.jsonl` | 🟡 | `[X]` |

## Notas de execução

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-09 | Versão inicial gerada por `/reversa-to-do` | reversa |
