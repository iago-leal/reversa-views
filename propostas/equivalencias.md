# Proposta de equivalências

Cada item abaixo é uma **sugestão** do motor local, e nenhuma vale coisa alguma até você marcá-la.
Marque a caixa do que aprovar, deixe desmarcado o que não convencer, e rode a promoção.
Anote ao lado do item o que quiser: a promoção lê apenas as caixas e os blocos.

## Pares novos

- [ ] `done: "true"` → **concluído**
      _o motor disse:_ campo booleano de conclusão
      _visto em:_ capacities
      ```equivalencia
      {"campo":"done","valor":"true","leitura":"concluido"}
      ```

- [ ] `last_completed_at: "2026-04-28t20:10:00z"` → **concluído**
      _o motor disse:_ registra instante da conclusão
      _visto em:_ TECH+
      ```equivalencia
      {"campo":"last_completed_at","valor":"2026-04-28t20:10:00z","leitura":"concluido"}
      ```

- [ ] `status: "completed"` → **concluído**
      _o motor disse:_ campo de situação com valor de conclusão
      _visto em:_ comentarios-concursos
      ```equivalencia
      {"campo":"status","valor":"completed","leitura":"concluido"}
      ```

- [ ] `status: "completo"` → **concluído**
      _o motor disse:_ status de conclusão
      _visto em:_ medicina-leal-app
      ```equivalencia
      {"campo":"status","valor":"completo","leitura":"concluido"}
      ```

- [ ] `status: "concluido"` → **concluído**
      _o motor disse:_ campo de situação
      _visto em:_ afla, med-reversa
      ```equivalencia
      {"campo":"status","valor":"concluido","leitura":"concluido"}
      ```

- [ ] `status: "success"` → **concluído**
      _o motor disse:_ status de sucesso
      _visto em:_ scrapping
      ```equivalencia
      {"campo":"status","valor":"success","leitura":"concluido"}
      ```

## Entradas a decidir: agente ou registro

Toda entrada sem conclusão declarada aparece aqui, INCLUSIVE as que são agentes de verdade.
O motor não opina sobre isto: ele lê campos, e saber quem é agente é conhecimento seu.
Marque apenas o que NÃO for agente; a entrada marcada sai da contagem de checkpoints e
deixa de ser cobrada por conclusão. Um agente marcado aqui some da conferência, então
deixe desmarcado tudo o que tiver a menor dúvida.

- [ ] `archaeologist` → aprovar como **registro que não é agente**
      _campos da entrada:_ done, modules_analyzed, artifacts
      _visto em:_ capacities, comentarios-concursos, med-reversa, medicina-leal-app
      ```nao-agente
      {"chave":"archaeologist"}
      ```

- [ ] `archaeologist_c3` → aprovar como **registro que não é agente**
      _campos da entrada:_ ciclo, commit_base, modules_analyzed, modules_pending, files, findings, status, concluido_em, novos, para_o_revisor
      _visto em:_ afla
      ```nao-agente
      {"chave":"archaeologist_c3"}
      ```

- [ ] `architect` → aprovar como **registro que não é agente**
      _campos da entrada:_ done, artifacts
      _visto em:_ capacities, med-reversa
      ```nao-agente
      {"chave":"architect"}
      ```

- [ ] `architect_c3` → aprovar como **registro que não é agente**
      _campos da entrada:_ status, artefatos, achados, erd
      _visto em:_ afla
      ```nao-agente
      {"chave":"architect_c3"}
      ```

- [ ] `decisoes_autor` → aprovar como **registro que não é agente**
      _campos da entrada:_ data, origem, perguntas_respondidas, adrs_criados, deriva_corrigida, mudancas_de_escopo, requisitos_novos, lacunas, tarefas_desimpedidas, escopo_nao_incorporado
      _visto em:_ afla
      ```nao-agente
      {"chave":"decisoes_autor"}
      ```

- [ ] `detective` → aprovar como **registro que não é agente**
      _campos da entrada:_ done, artifacts, state_machines, rbac
      _visto em:_ capacities, med-reversa
      ```nao-agente
      {"chave":"detective"}
      ```

- [ ] `detective_c3` → aprovar como **registro que não é agente**
      _campos da entrada:_ status, artefatos, achados, adrs_novos
      _visto em:_ afla
      ```nao-agente
      {"chave":"detective_c3"}
      ```

- [ ] `plano_aprovado` → aprovar como **registro que não é agente**
      _campos da entrada:_ at, escopo, adaptacao, fases
      _visto em:_ med-reversa
      ```nao-agente
      {"chave":"plano_aprovado"}
      ```

- [ ] `redator_progress` → aprovar como **registro que não é agente**
      _campos da entrada:_ items_total, items_done, items_pending, items_completed, last_completed_at
      _visto em:_ TECH+
      ```nao-agente
      {"chave":"redator_progress"}
      ```

- [ ] `regression_check_c3` → aprovar como **registro que não é agente**
      _campos da entrada:_ status, data, features, itens, verdes, amarelos, vermelhos, vermelho_unico
      _visto em:_ afla
      ```nao-agente
      {"chave":"regression_check_c3"}
      ```

- [ ] `reversa-archaeologist` → aprovar como **registro que não é agente**
      _campos da entrada:_ status, date, modules_analyzed, artifacts
      _visto em:_ scrapping
      ```nao-agente
      {"chave":"reversa-archaeologist"}
      ```

- [ ] `reversa-scout` → aprovar como **registro que não é agente**
      _campos da entrada:_ status, date, artifacts
      _visto em:_ scrapping
      ```nao-agente
      {"chave":"reversa-scout"}
      ```

- [ ] `reviewer` → aprovar como **registro que não é agente**
      _campos da entrada:_ at, status, specs_revisadas, afirmacoes_classificadas, revisao_cruzada, reclassificacoes, correcao_factual, achados_novos, perguntas, confianca_geral, verde, amarelo, vermelho, artefatos
      _visto em:_ med-reversa
      ```nao-agente
      {"chave":"reviewer"}
      ```

- [ ] `reviewer_c3` → aprovar como **registro que não é agente**
      _campos da entrada:_ status, data, commit_base, resumo
      _visto em:_ afla
      ```nao-agente
      {"chave":"reviewer_c3"}
      ```

- [ ] `scout` → aprovar como **registro que não é agente**
      _campos da entrada:_ done, artifacts, modules
      _visto em:_ capacities, med-reversa, ps-iagerasmlk
      ```nao-agente
      {"chave":"scout"}
      ```

- [ ] `writer` → aprovar como **registro que não é agente**
      _campos da entrada:_ at, status, units, arquivos_canonicos, lista_units, globais, openapi, nota, cobertura_vba
      _visto em:_ med-reversa
      ```nao-agente
      {"chave":"writer"}
      ```

- [ ] `writer_c3` → aprovar como **registro que não é agente**
      _campos da entrada:_ status, novos, reconciliados, g34
      _visto em:_ afla
      ```nao-agente
      {"chave":"writer_c3"}
      ```

## Não classificados nesta rodada

Sem caixa, porque não há o que aprovar: o motor não respondeu sobre eles. Rodar de novo basta.

- `adaptacao: "legado e planilha excel+vba, nao codigo-fonte; fase 2 reescrita por aba/modulo"` — o motor não apontou este campo como campo de estado
- `adrs: "8"` — o motor não apontou este campo como campo de estado
- `afirmacoes_classificadas: "733"` — o motor não apontou este campo como campo de estado
- `amarelo: "93"` — o motor não apontou este campo como campo de estado
- `amarelos: "29"` — o motor não apontou este campo como campo de estado
- `arquivos_canonicos: "33"` — o motor não apontou este campo como campo de estado
- `at: "2026-09-12t08:57:19"` — o motor não apontou este campo como campo de estado
- `at: "2026-09-12t09:02:59"` — o motor não apontou este campo como campo de estado
- `at: "2026-09-12t09:16:38"` — o motor não apontou este campo como campo de estado
- `at: "2026-09-12t09:20:35"` — o motor não apontou este campo como campo de estado
- `at: "2026-09-12t09:23:32"` — o motor não apontou este campo como campo de estado
- `at: "2026-09-12t09:37:23"` — o motor não apontou este campo como campo de estado
- `at: "2026-09-12t09:52:54"` — o motor não apontou este campo como campo de estado
- `ciclo: "3"` — o motor não apontou este campo como campo de estado
- `cobertura_vba: "96%"` — o motor não apontou este campo como campo de estado
- `commit_base: "211e061"` — o motor não apontou este campo como campo de estado
- `concluido_em: "2026-09-17"` — o motor não apontou este campo como campo de estado
- `confianca_geral: "84%"` — o motor não apontou este campo como campo de estado
- `contradicoes_catalogadas: "10"` — o motor não apontou este campo como campo de estado
- `correcao_factual: "limite sem ativacao: quatro linhas, nao cinco — 13 edicoes em 9 arquivos"` — o motor não apontou este campo como campo de estado
- `data: "2026-08-13"` — o motor não apontou este campo como campo de estado
- `data: "2026-09-17"` — o motor não apontou este campo como campo de estado
- `date: "2026-05-15"` — o motor não apontou este campo como campo de estado
- `dividas_priorizadas: "11"` — o motor não apontou este campo como campo de estado
- `entidades_modeladas: "8"` — o motor não apontou este campo como campo de estado
- `erd: "ja reconciliado em 17/09, confere"` — o motor não apontou este campo como campo de estado
- `escopo_nao_incorporado: "dominio anm (processos, prazos, tah) e dashboard existente em tmp/dashboard/ — vistos no board da equipe e no painel opedm, ainda ausentes de _reversa_sdd/. incorporar e decisao de escopo, nao reconciliacao"` — o motor não apontou este campo como campo de estado
- `escopo: "tres fontes: super planner .xlsm (principal), (1) por diff, numbers como fonte irma"` — o motor não apontou este campo como campo de estado
- `fases: "plano completo, incluindo revisao"` — o motor não apontou este campo como campo de estado
- `features: "13"` — o motor não apontou este campo como campo de estado
- `g34: "fecha do lado documental"` — o motor não apontou este campo como campo de estado
- `integracoes_externas: "0"` — o motor não apontou este campo como campo de estado
- `items_done: "3"` — o motor não apontou este campo como campo de estado
- `items_total: "6"` — o motor não apontou este campo como campo de estado
- `itens: "111"` — o motor não apontou este campo como campo de estado
- `maquinas_de_estado: "4"` — o motor não apontou este campo como campo de estado
- `nota: "fabricacao-do-produto adicionada alem das 10 features do scout, conforme p-06 de questions.md"` — o motor não apontou este campo como campo de estado
- `nota: "sem historico git no legado; arqueologia feita por metadados de documento e por codigo morto."` — o motor não apontou este campo como campo de estado
- `omissao_deliberada: "aritmetica do codigo de ativacao e senha de protecao das abas nao transcritas (evitar keygen de produto de terceiro). origem apontada em módulo1:ativar:210-232."` — o motor não apontou este campo como campo de estado
- `openapi: "nao aplicavel: o sistema nao expoe nem consome contrato de rede"` — o motor não apontou este campo como campo de estado
- `origem: "respostas l-13/l-14, decisao nova sobre formatos, e auditoria de deriva das specs"` — o motor não apontou este campo como campo de estado
- `rbac: "false"` — o motor não apontou este campo como campo de estado
- `reextraction: "true"` — o motor não apontou este campo como campo de estado
- `regras_de_dominio: "11"` — o motor não apontou este campo como campo de estado
- `resumo: "gaps recontada (16 abertas, g-37 nova, g-32 corrigida, g-34 fechada documentalmente), confidence-report com a coluna de 17/09 (2.088 casos, 0 falhas), vigencia com 55 vivos e 23 adrs"` — o motor não apontou este campo como campo de estado
- `revisao_cruzada: "nao — plugin codex ausente nesta sessao; doc_level=completo torna opcional"` — o motor não apontou este campo como campo de estado
- `scratchpad: "/private/tmp/claude-501/-users-iagoleal-dev-med-reversa/82b0abc3-3736-4617-9015-da5d23fdb538/scratchpad"` — o motor não apontou este campo como campo de estado
- `specs_revisadas: "62"` — o motor não apontou este campo como campo de estado
- `state_machines: "false"` — o motor não apontou este campo como campo de estado
- `strategy: "delta-dirigida sobre git diff 631d9ff2..head; artefatos de 08-05 atualizados em vez de reescritos"` — o motor não apontou este campo como campo de estado
- `timestamp: "2026-05-03t12:10:19z"` — o motor não apontou este campo como campo de estado
- `units: "11"` — o motor não apontou este campo como campo de estado
- `updated_at: "2026-08-20t15:00:00z"` — o motor não apontou este campo como campo de estado
- `verde: "569"` — o motor não apontou este campo como campo de estado
- `verdes: "81"` — o motor não apontou este campo como campo de estado
- `vermelho_unico: "008/w013 - conferencia em navegador de celular nunca registrada, pendente desde 14/09"` — o motor não apontou este campo como campo de estado
- `vermelho: "71"` — o motor não apontou este campo como campo de estado
- `vermelhos: "1"` — o motor não apontou este campo como campo de estado
